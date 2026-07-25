#!/usr/bin/env node

/**
 * TRGS Automated Quality Checker Script (Layer 1 - Technical QA)
 * 零依赖代码校验脚本，基于原生 Node.js (fs, path, vm)
 *
 * 用法:
 *   node scripts/qa-checker.js <file-path> [--type=ppt|interactive]
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

function runQACheck(filePath, resourceType = 'interactive') {
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(JSON.stringify({ error: `File not found: ${absolutePath}` }, null, 2));
    process.exit(1);
  }

  const content = fs.readFileSync(absolutePath, 'utf-8');
  const stats = fs.statSync(absolutePath);
  const fileSizeKB = (stats.size / 1024).toFixed(2);

  const checks = [];
  const warnings = [];

  // T1: DOCTYPE 声明
  const hasDoctype = /<!DOCTYPE\s+html>/i.test(content);
  checks.push({
    id: 'T1',
    name: 'DOCTYPE 声明',
    passed: hasDoctype,
    detail: hasDoctype ? '存在 <!DOCTYPE html>' : '缺失 <!DOCTYPE html> 声明'
  });

  // T2: 必要标签完整性
  const hasHtml = /<html[^>]*>/i.test(content) && /<\/html>/i.test(content);
  const hasHead = /<head[^>]*>/i.test(content) && /<\/head>/i.test(content);
  const hasBody = /<body[^>]*>/i.test(content) && /<\/body>/i.test(content);
  const hasCharset = /meta\s+charset=/i.test(content);
  const t2Passed = hasHtml && hasHead && hasBody && hasCharset;
  checks.push({
    id: 'T2',
    name: '必要标签完整',
    passed: t2Passed,
    detail: t2Passed ? 'html, head, body, meta charset 均完整' : '缺失关键 HTML 骨架标签或 charset 设置'
  });

  // T4: 无外部资源引用 (CDN / 外部图片)
  const externalMatches = content.match(/(src|href)\s*=\s*["'](http:\/\/|https:\/\/|\/\/)[^"']+["']/gi) || [];
  const t4Passed = externalMatches.length === 0;
  checks.push({
    id: 'T4',
    name: '无外部资源引用',
    passed: t4Passed,
    detail: t4Passed ? '无外部 HTTP/HTTPS 资源引用' : `检测到 ${externalMatches.length} 处外部资源: ${externalMatches.slice(0, 3).join(', ')}`
  });

  // T5: 无禁止 API (alert, fetch, XMLHttpRequest, localStorage, eval)
  const forbiddenAPIs = [
    { name: 'alert()', regex: /\balert\s*\(/ },
    { name: 'confirm()', regex: /\bconfirm\s*\(/ },
    { name: 'prompt()', regex: /\bprompt\s*\(/ },
    { name: 'fetch()', regex: /\bfetch\s*\(/ },
    { name: 'XMLHttpRequest', regex: /\bXMLHttpRequest\b/ },
    { name: 'localStorage', regex: /\blocalStorage\b/ },
    { name: 'sessionStorage', regex: /\bsessionStorage\b/ },
    { name: 'eval()', regex: /\beval\s*\(/ }
  ];

  const foundForbidden = [];
  forbiddenAPIs.forEach(api => {
    if (api.regex.test(content)) {
      foundForbidden.push(api.name);
    }
  });

  const t5Passed = foundForbidden.length === 0;
  checks.push({
    id: 'T5',
    name: '无禁止 API',
    passed: t5Passed,
    detail: t5Passed ? '未检测到违禁 API' : `使用了违禁 API: ${foundForbidden.join(', ')}`
  });

  // T7: JS 语法检查 (使用 Node.js vm)
  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let scriptMatch;
  let jsSyntaxPassed = true;
  let jsSyntaxErrorDetail = '所有内联 JavaScript 语法解析成功';

  while ((scriptMatch = scriptRegex.exec(content)) !== null) {
    const scriptCode = scriptMatch[1];
    if (!scriptCode.trim()) continue;

    try {
      new vm.Script(scriptCode);
    } catch (err) {
      jsSyntaxPassed = false;
      jsSyntaxErrorDetail = `JavaScript 语法错误: ${err.message}`;
      break;
    }
  }

  checks.push({
    id: 'T7',
    name: 'JS 语法正确',
    passed: jsSyntaxPassed,
    detail: jsSyntaxErrorDetail
  });

  // T14: 文件大小限制 (PPT < 500KB, Interactive < 200KB)
  const maxSizeKB = resourceType === 'ppt' ? 500 : 200;
  const t14Passed = parseFloat(fileSizeKB) <= maxSizeKB;
  if (!t14Passed) {
    warnings.push({
      id: 'T14',
      name: '文件大小超限',
      detail: `当前文件体积为 ${fileSizeKB}KB，超过了 ${resourceType} 资源的限制上限 (${maxSizeKB}KB)`
    });
  } else {
    checks.push({
      id: 'T14',
      name: '文件大小合规',
      passed: true,
      detail: `文件大小为 ${fileSizeKB}KB (上限 ${maxSizeKB}KB)`
    });
  }

  const isLayer1Passed = checks.every(c => c.passed);

  const report = {
    resourceId: path.basename(filePath, path.extname(filePath)),
    timestamp: new Date().toISOString(),
    result: isLayer1Passed ? 'PASS' : 'FAIL',
    layer: 'technical',
    fileSizeKB: `${fileSizeKB}KB`,
    checks: checks,
    warnings: warnings,
    failReason: isLayer1Passed ? null : checks.filter(c => !c.passed).map(c => `[${c.id}] ${c.name}: ${c.detail}`).join('; ')
  };

  return report;
}

// CLI 执行逻辑
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('Usage: node scripts/qa-checker.js <file-path> [--type=ppt|interactive]');
    process.exit(0);
  }

  const filePath = args[0];
  let type = 'interactive';
  args.forEach(arg => {
    if (arg.startsWith('--type=')) {
      type = arg.split('=')[1];
    }
  });

  const report = runQACheck(filePath, type);
  console.log(JSON.stringify(report, null, 2));

  if (report.result === 'FAIL') {
    process.exit(1);
  }
}

module.exports = { runQACheck };
