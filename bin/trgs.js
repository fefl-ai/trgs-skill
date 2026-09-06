#!/usr/bin/env node

/**
 * TRGS Unified CLI
 * 教学资源生成系统统一命令行入口
 */

const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const http = require('http');
const net = require('net');
const { createZipArchive, executeBuild, planBuildTasks, validateBlueprintSchema, renderPortalHtml, runBatchQA, MODEL_ROUTING_PROFILES } = require('../scripts/trgs-build.js');
const { runQACheck } = require('../scripts/qa-checker.js');

function openInBrowser(filePath) {
  const absPath = path.resolve(filePath);
  const plat = process.platform;
  let cmd = '';
  if (plat === 'darwin') {
    cmd = `open "${absPath}"`;
  } else if (plat === 'win32') {
    cmd = `start "" "${absPath}"`;
  } else {
    cmd = `xdg-open "${absPath}"`;
  }
  exec(cmd, (err) => {
    if (err) {
      console.warn(`[WARN] 无法自动唤起浏览器: ${err.message}`);
      console.log(`[INFO] 您可以在浏览器中手动打开: ${absPath}`);
    } else {
      console.log(`[OK] 已在系统默认浏览器中打开: ${absPath}`);
    }
  });
}


function findAvailablePort(startPort) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(findAvailablePort(startPort + 1));
      } else {
        reject(err);
      }
    });
  });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.zip': 'application/zip',
  '.txt': 'text/plain; charset=utf-8'
};

function startStaticServer(dirPath, port = 3000, shouldOpen = true) {
  const absDir = path.resolve(dirPath);
  findAvailablePort(port).then((actualPort) => {
    const server = http.createServer((req, res) => {
      let reqPath = decodeURI(req.url.split('?')[0]);
      if (reqPath === '/' || reqPath === '') {
        reqPath = '/index.html';
      }
      const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
      let fullPath = path.join(absDir, safePath);

      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
        fullPath = path.join(fullPath, 'index.html');
      }

      if (!fs.existsSync(fullPath)) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`404 Not Found: ${reqPath}`);
        return;
      }

      const ext = path.extname(fullPath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      try {
        const data = fs.readFileSync(fullPath);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`500 Internal Error: ${e.message}`);
      }
    });

    server.listen(actualPort, () => {
      const url = `http://localhost:${actualPort}`;
      console.log(`
🚀 TRGS 本地静态服务器已启动!`);
      console.log(`📂 服务根目录: ${absDir}`);
      console.log(`🔗 访问地址:   ${url}`);
      console.log(`按 Ctrl+C 停止服务
`);

      if (shouldOpen) {
        openInBrowser(url);
      }
    });
  }).catch((err) => {
    console.error(`[ERROR] 启动服务器失败: ${err.message}`);
    process.exit(1);
  });
}

function printHelp() {
  console.log(`
TRGS (Teaching Resource Generation System) CLI v1.0.0

用法:
  trgs <command> [options]

命令:
  build <blueprint.json>     执行或编排完整教学资源构建流程 (含大纲校验、任务分发、缓存及QA)
  plan <blueprint.json>      生成并预览构建任务图与异构模型分配表 (等同于 build --dry-run)
  portal <blueprint.json>    仅根据 Blueprint 和现有 HTML 资源自动装配生成聚合门户 index.html
  serve [dir]                启动轻量本地 HTTP 静态服务器并一键在浏览器中查看 (支持端口自动探活)
  pack [dir]                 将指定目录的一整套教学课件打包为标准无损离线 ZIP 归档
  preview <dir-or-html>      一键在默认浏览器中打开聚合门户或指定 HTML 教学课件 (别名: open)
  qa <target-file-or-dir>    对生成的 HTML 资源执行自动化技术规范质检 (Layer 1)
  clean-cache <dir>          清除指定输出目录下的 .trgs-cache.json 缓存

选项:
  -o, --output-dir <dir>     指定构建产物输出目录 (默认: <blueprint同级目录>/dist)
  -p, --port <number>        指定本地服务器端口 (默认: 3000，占用自动顺延)
  --open                     操作完成后立即在默认浏览器中自动打开查看
  --incremental              开启内容寻址增量构建 (仅构建 hash 变更的资源)
  --dry-run                  试运行，仅打印调度任务矩阵与模型路由表，不生成文件
  --model-profile <profile>  指定异构模型路由策略: balanced | cost-effective | premium (默认: balanced)
  --skip-qa                  跳过构建完成后的自动 QA 质量校验
  --force                    忽略 Schema 校验非致命警告强制继续
  -h, --help                 显示帮助信息
  -v, --version              显示版本号

示例:
  trgs plan skill/examples/cs-networking/blueprint.json
  trgs build skill/examples/cs-networking/blueprint.json --open
  trgs preview test-output/data-structures/
  trgs build skill/examples/cs-networking/blueprint.json --incremental
  trgs build my-course/blueprint.json --model-profile=cost-effective
  trgs qa test-output/data-structures/slides.html --type=ppt
  trgs qa test-output/data-structures/
`);
}

const args = process.argv.slice(2);

if (args.length === 0 || args.includes('-h') || args.includes('--help') || args.includes('help')) {
  printHelp();
  process.exit(0);
}

if (args.includes('-v') || args.includes('--version')) {
  const pkg = require('../package.json');
  console.log(`trgs v${pkg.version}`);
  process.exit(0);
}

const command = args[0];
const remainingArgs = args.slice(1);

// 解析通用 options
const options = {
  outputDir: null,
  incremental: false,
  dryRun: false,
  modelProfile: 'balanced',
  skipQa: false,
  force: false,
  open: false,
  port: 3000,
  zipOutput: null,
  type: 'interactive'
};

let targetArg = null;

for (let i = 0; i < remainingArgs.length; i++) {
  const arg = remainingArgs[i];
  if (arg === '-o' || arg === '--output-dir') {
    options.outputDir = remainingArgs[++i];
  } else if (arg.startsWith('--output-dir=')) {
    options.outputDir = arg.split('=')[1];
  } else if (arg === '--incremental') {
    options.incremental = true;
  } else if (arg === '--dry-run') {
    options.dryRun = true;
  } else if (arg === '--open') {
    options.open = true;
  } else if (arg === '--skip-qa') {
    options.skipQa = true;
  } else if (arg === '--force') {
    options.force = true;
  } else if (arg === '--model-profile') {
    options.modelProfile = remainingArgs[++i];
  } else if (arg.startsWith('--model-profile=')) {
    options.modelProfile = arg.split('=')[1];
  } else if (arg === '-p' || arg === '--port') {
    options.port = parseInt(remainingArgs[++i], 10) || 3000;
  } else if (arg.startsWith('--port=')) {
    options.port = parseInt(arg.split('=')[1], 10) || 3000;
  } else if (arg.startsWith('--type=')) {
    options.type = arg.split('=')[1];
  } else if (!arg.startsWith('-') && !targetArg) {
    targetArg = arg;
  }
}

switch (command) {
  case 'build': {
    if (!targetArg) {
      console.error('[ERROR] Missing blueprint file path. Usage: trgs build <blueprint.json> [options]');
      process.exit(1);
    }
    executeBuild(targetArg, options);
    if (options.open) {
      const outDir = path.resolve(options.outputDir || path.join(path.dirname(path.resolve(targetArg)), 'dist'));
      const portalPath = path.join(outDir, 'index.html');
      if (fs.existsSync(portalPath)) {
        openInBrowser(portalPath);
      }
    }
    break;
  }

  case 'plan': {
    if (!targetArg) {
      console.error('[ERROR] Missing blueprint file path. Usage: trgs plan <blueprint.json>');
      process.exit(1);
    }
    options.dryRun = true;
    executeBuild(targetArg, options);
    break;
  }

  case 'portal': {
    if (!targetArg) {
      console.error('[ERROR] Missing blueprint file path. Usage: trgs portal <blueprint.json> [-o <dir>]');
      process.exit(1);
    }
    const absBpPath = path.resolve(targetArg);
    if (!fs.existsSync(absBpPath)) {
      console.error(`[ERROR] File not found: ${absBpPath}`);
      process.exit(1);
    }
    const blueprint = JSON.parse(fs.readFileSync(absBpPath, 'utf8'));
    const outDir = path.resolve(options.outputDir || path.dirname(absBpPath));
    const html = renderPortalHtml(blueprint);
    const targetPath = path.join(outDir, 'index.html');
    fs.writeFileSync(targetPath, html, 'utf8');
    console.log(`[OK] Portal index.html generated at: ${targetPath}`);
    break;
  }

  case 'qa': {
    if (!targetArg) {
      console.error('[ERROR] Missing target file or directory. Usage: trgs qa <file-or-dir> [--type=ppt|interactive]');
      process.exit(1);
    }
    const absTarget = path.resolve(targetArg);
    if (!fs.existsSync(absTarget)) {
      console.error(`[ERROR] Target not found: ${absTarget}`);
      process.exit(1);
    }

    const stat = fs.statSync(absTarget);
    if (stat.isDirectory()) {
      const summary = runBatchQA(absTarget);
      console.log(`\n=== Batch QA Verification: ${absTarget} ===`);
      console.log(`Total HTML files: ${summary.total}`);
      summary.reports.forEach(r => {
        const mark = r.result === 'PASS' ? '✓' : '✗';
        console.log(`${mark} [${r.result}] ${r.resourceId}.html (${r.fileSizeKB})`);
        if (r.result === 'FAIL') {
          console.log(`    Failures: ${r.failReason}`);
        }
        if (r.warnings.length > 0) {
          r.warnings.forEach(w => console.log(`    Warning: ${w.detail}`));
        }
      });
      if (!summary.allPassed) {
        process.exit(1);
      }
    } else {
      const report = runQACheck(absTarget, options.type);
      console.log(JSON.stringify(report, null, 2));
      if (report.result === 'FAIL') {
        process.exit(1);
      }
    }
    break;
  }

  case 'serve': {
    const targetDir = targetArg ? path.resolve(targetArg) : path.resolve('.');
    if (!fs.existsSync(targetDir)) {
      console.error(`[ERROR] 目录不存在: ${targetDir}`);
      process.exit(1);
    }
    const stat = fs.statSync(targetDir);
    const dir = stat.isDirectory() ? targetDir : path.dirname(targetDir);
    startStaticServer(dir, options.port, options.open !== false);
    break;
  }

  case 'pack': {
    const targetDir = targetArg ? path.resolve(targetArg) : path.resolve('.');
    if (!fs.existsSync(targetDir)) {
      console.error(`[ERROR] 目标目录不存在: ${targetDir}`);
      process.exit(1);
    }
    const stat = fs.statSync(targetDir);
    const dir = stat.isDirectory() ? targetDir : path.dirname(targetDir);
    const zipName = options.outputDir
      ? path.resolve(options.outputDir)
      : path.join(dir, `${path.basename(dir)}-courseware.zip`);

    console.log(`[PACKING] 正在打包教学课件套件...`);
    console.log(`源目录:   ${dir}`);
    console.log(`输出目标: ${zipName}`);

    const res = createZipArchive(dir, zipName, (relPath) => {
      return !relPath.endsWith('.zip') && !relPath.endsWith('.tmp');
    });

    const sizeKB = (res.totalBytes / 1024).toFixed(2);
    console.log(`
[OK] 打包完成!`);
    console.log(`总收录文件: ${res.totalFiles} 个`);
    console.log(`ZIP 归档体积: ${sizeKB} KB`);
    console.log(`归档绝对路径: ${res.outputPath}`);
    break;
  }

  case 'preview':
  case 'open': {
    const target = targetArg || '.';
    const absTarget = path.resolve(target);
    if (!fs.existsSync(absTarget)) {
      console.error(`[ERROR] 目标路径不存在: ${absTarget}`);
      process.exit(1);
    }

    const stat = fs.statSync(absTarget);
    let fileToOpen = absTarget;
    if (stat.isDirectory()) {
      const indexFile = path.join(absTarget, 'index.html');
      const slidesFile = path.join(absTarget, 'slides.html');
      if (fs.existsSync(indexFile)) {
        fileToOpen = indexFile;
      } else if (fs.existsSync(slidesFile)) {
        fileToOpen = slidesFile;
      } else {
        console.error(`[ERROR] 在目录中未找到 index.html 或 slides.html: ${absTarget}`);
        process.exit(1);
      }
    }
    openInBrowser(fileToOpen);
    break;
  }

  case 'clean-cache': {
    const targetDir = path.resolve(targetArg || '.');
    const cacheFile = path.join(targetDir, '.trgs-cache.json');
    if (fs.existsSync(cacheFile)) {
      fs.unlinkSync(cacheFile);
      console.log(`[OK] Deleted cache file: ${cacheFile}`);
    } else {
      console.log(`[INFO] No cache file found at: ${cacheFile}`);
    }
    break;
  }

  default:
    console.error(`[ERROR] Unknown command: ${command}`);
    printHelp();
    process.exit(1);
}
