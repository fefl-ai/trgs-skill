#!/usr/bin/env node

/**
 * TRGS Build Orchestrator & Batch Build CLI
 * 教学资源批量构建编排器，原生 Node.js 零依赖实现
 *
 * 功能矩阵:
 * 1. Blueprint 规范校验 (基于 JSON Schema 核心约束验证)
 * 2. 异构模型路由调度矩阵 (Heterogeneous Model Routing Matrix)
 * 3. 内容寻址缓存与增量构建 (Content-Addressable Cache & Incremental Build)
 * 4. 任务计划生成 (Task Planner) 与并行/批处理指令分发
 * 5. 教学资源门户索引自动装配 (Portal Index Generator)
 * 6. 自动化两级 QA 质量检查对接 (Integrated QA Runner)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { runQACheck } = require('./qa-checker.js');

const CACHE_FILE_NAME = '.trgs-cache.json';

const zlib = require('zlib');

function makeCrc32Table() {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  return table;
}
const CRC32_TABLE = makeCrc32Table();

function calculateCrc32(buf) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ (-1)) >>> 0;
}

/**
 * 纯原生零依赖将目录或文件列表打包为标准 ZIP 归档 (Deflate 压缩)
 */
function createZipArchive(sourceDir, targetZipPath, filterFn = null) {
  const fileEntries = [];

  function walk(dir, relPath = '') {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      if (item === '.DS_Store' || item.endsWith('.tmp')) continue;
      const full = path.join(dir, item);
      const rel = relPath ? `${relPath}/${item}` : item;
      const st = fs.statSync(full);
      if (st.isDirectory()) {
        walk(full, rel);
      } else {
        if (filterFn && !filterFn(rel, full)) continue;
        fileEntries.push({ fullPath: full, zipPath: rel });
      }
    }
  }

  walk(sourceDir);

  const localHeaders = [];
  const centralHeaders = [];
  let currentOffset = 0;

  for (const file of fileEntries) {
    const data = fs.readFileSync(file.fullPath);
    const crc = calculateCrc32(data);
    const compressed = zlib.deflateRawSync(data);
    const nameBuf = Buffer.from(file.zipPath, 'utf8');

    // Local file header
    const lh = Buffer.alloc(30 + nameBuf.length);
    lh.writeUInt32LE(0x04034b50, 0); // signature
    lh.writeUInt16LE(20, 4);         // version needed
    lh.writeUInt16LE(0x0800, 6);     // flags (UTF-8)
    lh.writeUInt16LE(8, 8);          // compression method (Deflate)
    lh.writeUInt16LE(0, 10);         // last mod time
    lh.writeUInt16LE(0x21, 12);      // last mod date
    lh.writeUInt32LE(crc, 14);       // crc-32
    lh.writeUInt32LE(compressed.length, 18); // compressed size
    lh.writeUInt32LE(data.length, 22);       // uncompressed size
    lh.writeUInt16LE(nameBuf.length, 26);    // file name length
    lh.writeUInt16LE(0, 28);                 // extra field length
    nameBuf.copy(lh, 30);

    localHeaders.push(lh);
    localHeaders.push(compressed);

    // Central directory header
    const ch = Buffer.alloc(46 + nameBuf.length);
    ch.writeUInt32LE(0x02014b50, 0); // signature
    ch.writeUInt16LE(20, 4);         // version made by
    ch.writeUInt16LE(20, 6);         // version needed
    ch.writeUInt16LE(0x0800, 8);     // flags
    ch.writeUInt16LE(8, 10);         // compression method
    ch.writeUInt16LE(0, 12);         // mod time
    ch.writeUInt16LE(0x21, 14);      // mod date
    ch.writeUInt32LE(crc, 16);       // crc
    ch.writeUInt32LE(compressed.length, 20); // compressed size
    ch.writeUInt32LE(data.length, 24);       // uncompressed size
    ch.writeUInt16LE(nameBuf.length, 28);    // file name len
    ch.writeUInt16LE(0, 30);         // extra len
    ch.writeUInt16LE(0, 32);         // comment len
    ch.writeUInt16LE(0, 34);         // disk start
    ch.writeUInt16LE(0, 36);         // internal attr
    ch.writeUInt32LE(0, 38);         // external attr
    ch.writeUInt32LE(currentOffset, 42);     // relative offset
    nameBuf.copy(ch, 46);

    centralHeaders.push(ch);
    currentOffset += lh.length + compressed.length;
  }

  const centralDirOffset = currentOffset;
  let centralDirSize = 0;
  for (const ch of centralHeaders) {
    centralDirSize += ch.length;
  }

  // End of central directory record
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // signature
  eocd.writeUInt16LE(0, 4);          // disk number
  eocd.writeUInt16LE(0, 6);          // start disk
  eocd.writeUInt16LE(fileEntries.length, 8);  // entries on disk
  eocd.writeUInt16LE(fileEntries.length, 10); // total entries
  eocd.writeUInt32LE(centralDirSize, 12);     // cd size
  eocd.writeUInt32LE(centralDirOffset, 16);   // cd offset
  eocd.writeUInt16LE(0, 20);                 // comment len

  const totalBuf = Buffer.concat([...localHeaders, ...centralHeaders, eocd]);
  fs.mkdirSync(path.dirname(path.resolve(targetZipPath)), { recursive: true });
  fs.writeFileSync(targetZipPath, totalBuf);

  return {
    totalFiles: fileEntries.length,
    totalBytes: totalBuf.length,
    outputPath: path.resolve(targetZipPath)
  };
}


/**
 * 异构模型路由配置 (Heterogeneous Model Routing Profiles)
 */
const MODEL_ROUTING_PROFILES = {
  balanced: {
    name: 'balanced',
    description: '均衡型：大纲与结构采用高效模型，复杂交互采用高智力前沿编程模型，QA 采用确定性规则',
    routes: {
      blueprint: { tier: 'standard', model: 'claude-3-5-haiku / gpt-4o-mini', costWeight: 1 },
      ppt: { tier: 'standard', model: 'claude-3-5-sonnet / gpt-4o', costWeight: 3 },
      interactive_low: { tier: 'standard', model: 'claude-3-5-sonnet / gpt-4o', costWeight: 3 },
      interactive_medium: { tier: 'advanced', model: 'claude-3-5-sonnet / gpt-4o', costWeight: 5 },
      interactive_high: { tier: 'frontier', model: 'claude-3-7-sonnet-thought / o3-mini-high', costWeight: 8 },
      portal: { tier: 'fast', model: 'deterministic-generator / template-engine', costWeight: 0.5 },
      qa: { tier: 'deterministic', model: 'native-node-qa-engine', costWeight: 0 }
    }
  },
  'cost-effective': {
    name: 'cost-effective',
    description: '高性价比型：大幅提高轻量快速模型占比，仅复杂交互启用标准编程模型',
    routes: {
      blueprint: { tier: 'fast', model: 'gemini-2.0-flash / gpt-4o-mini', costWeight: 0.5 },
      ppt: { tier: 'standard', model: 'gemini-2.0-flash / deepseek-v3', costWeight: 1 },
      interactive_low: { tier: 'standard', model: 'deepseek-v3 / gpt-4o-mini', costWeight: 1.5 },
      interactive_medium: { tier: 'standard', model: 'claude-3-5-sonnet / deepseek-r1', costWeight: 3 },
      interactive_high: { tier: 'advanced', model: 'claude-3-5-sonnet / deepseek-r1', costWeight: 4 },
      portal: { tier: 'fast', model: 'deterministic-generator / template-engine', costWeight: 0.5 },
      qa: { tier: 'deterministic', model: 'native-node-qa-engine', costWeight: 0 }
    }
  },
  premium: {
    name: 'premium',
    description: '极致品质型：核心交互与深度动画全面分配顶级推理与代码生成模型',
    routes: {
      blueprint: { tier: 'advanced', model: 'claude-3-5-sonnet / o3-mini', costWeight: 3 },
      ppt: { tier: 'advanced', model: 'claude-3-5-sonnet', costWeight: 4 },
      interactive_low: { tier: 'advanced', model: 'claude-3-5-sonnet', costWeight: 4 },
      interactive_medium: { tier: 'frontier', model: 'claude-3-7-sonnet / o3-mini-high', costWeight: 8 },
      interactive_high: { tier: 'frontier', model: 'claude-3-7-sonnet-thought / o1', costWeight: 12 },
      portal: { tier: 'fast', model: 'deterministic-generator / template-engine', costWeight: 0.5 },
      qa: { tier: 'deterministic', model: 'native-node-qa-engine', costWeight: 0 }
    }
  }
};

/**
 * 计算字符串或对象的 SHA-256 Hash
 */
function computeHash(data) {
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  return crypto.createHash('sha256').update(str).digest('hex');
}

/**
 * 简易且稳健的 JSON Schema 基础校验器
 */
function validateBlueprintSchema(blueprint, schemaPath) {
  const errors = [];
  if (!blueprint || typeof blueprint !== 'object') {
    return ['Blueprint must be a non-null object'];
  }

  let schema = null;
  if (fs.existsSync(schemaPath)) {
    try {
      schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    } catch (e) {
      errors.push(`Failed to parse schema file: ${e.message}`);
    }
  }

  // 验证顶层必须字段
  const requiredTop = [
    '$schema', 'id', 'title', 'subtitle', 'subject',
    'targetAudience', 'teachingPhilosophy', 'totalDuration', 'chapters'
  ];
  for (const field of requiredTop) {
    if (blueprint[field] === undefined) {
      errors.push(`Missing required root field: "${field}"`);
    }
  }

  if (!Array.isArray(blueprint.chapters) || blueprint.chapters.length === 0) {
    errors.push('Blueprint "chapters" must be a non-empty array');
  } else {
    blueprint.chapters.forEach((ch, chIdx) => {
      if (!ch.id || !ch.title) {
        errors.push(`Chapter [${chIdx}] is missing "id" or "title"`);
      }
      if (!Array.isArray(ch.knowledgePoints) || ch.knowledgePoints.length === 0) {
        errors.push(`Chapter "${ch.id || chIdx}" must have at least one knowledgePoint`);
      } else {
        ch.knowledgePoints.forEach((kp, kpIdx) => {
          if (!kp.id || !kp.title) {
            errors.push(`Chapter "${ch.id}" KP [${kpIdx}] is missing "id" or "title"`);
          }
          if (!kp.strategy || !kp.strategy.primaryForm) {
            errors.push(`KP "${kp.id || kpIdx}" missing strategy or primaryForm`);
          }
          if (!Array.isArray(kp.resources) || kp.resources.length === 0) {
            errors.push(`KP "${kp.id || kpIdx}" must define at least one resource`);
          } else {
            kp.resources.forEach((res, resIdx) => {
              if (!res.id || !res.type || !res.title) {
                errors.push(`KP "${kp.id}" resource [${resIdx}] is missing id, type, or title`);
              }
              if (!['ppt', 'interactive'].includes(res.type)) {
                errors.push(`KP "${kp.id}" resource "${res.id}" invalid type: ${res.type}`);
              }
            });
          }
        });
      }
    });
  }

  return errors;
}

/**
 * 加载本地缓存
 */
function loadCache(outputDir) {
  const cachePath = path.join(outputDir, CACHE_FILE_NAME);
  if (fs.existsSync(cachePath)) {
    try {
      return JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    } catch (e) {
      return { version: '1.0', entries: {} };
    }
  }
  return { version: '1.0', entries: {} };
}

/**
 * 保存本地缓存
 */
function saveCache(outputDir, cacheData) {
  const cachePath = path.join(outputDir, CACHE_FILE_NAME);
  try {
    fs.writeFileSync(cachePath, JSON.stringify(cacheData, null, 2), 'utf8');
  } catch (e) {
    console.warn(`[WARN] Could not write cache file: ${e.message}`);
  }
}

/**
 * 任务计划器 (Task Planner)
 * 将 Blueprint 解析为可调度的任务清单与异构模型映射
 */
function planBuildTasks(blueprint, profileName = 'balanced', options = {}) {
  const profile = MODEL_ROUTING_PROFILES[profileName] || MODEL_ROUTING_PROFILES.balanced;
  const tasks = [];

  const theme = blueprint.theme || 'dark';
  const blueprintHash = computeHash({
    title: blueprint.title,
    theme: blueprint.theme,
    subject: blueprint.subject
  });

  blueprint.chapters.forEach((chapter, chIndex) => {
    // 1. PPT 幻灯片任务
    const pptResources = [];
    chapter.knowledgePoints.forEach(kp => {
      (kp.resources || []).forEach(res => {
        if (res.type === 'ppt') {
          pptResources.push({ kp, res });
        }
      });
    });

    if (pptResources.length > 0) {
      const pptContentHash = computeHash({
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        theme,
        resources: pptResources.map(r => ({
          kpId: r.kp.id,
          kpTitle: r.kp.title,
          keyPoints: r.kp.keyPoints,
          difficultPoints: r.kp.difficultPoints,
          resId: r.res.id,
          spec: r.res.spec
        }))
      });

      tasks.push({
        id: `task-ppt-${chapter.id}`,
        type: 'ppt',
        targetFile: 'slides.html',
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        resourceCount: pptResources.length,
        contentHash: pptContentHash,
        modelRouting: profile.routes.ppt,
        description: `生成 ${chapter.title} 幻灯片课件 (共 ${pptResources.length} 个知识点展示页)`
      });
    }

    // 2. 独立互动演示组件任务
    chapter.knowledgePoints.forEach(kp => {
      (kp.resources || []).forEach(res => {
        if (res.type === 'interactive') {
          const complexity = res.spec?.estimatedComplexity || 'medium';
          const routingKey = `interactive_${complexity}`;
          const modelRoute = profile.routes[routingKey] || profile.routes.interactive_medium;

          let normalizedId = res.id.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
          if (!normalizedId.startsWith('interactive-')) {
            normalizedId = `interactive-${normalizedId}`;
          }
          const targetFile = `${normalizedId}.html`;

          const interactiveHash = computeHash({
            kpId: kp.id,
            kpTitle: kp.title,
            knowledgeType: kp.knowledgeType,
            strategy: kp.strategy,
            resId: res.id,
            resTitle: res.title,
            spec: res.spec,
            theme
          });

          tasks.push({
            id: `task-interactive-${res.id}`,
            type: 'interactive',
            targetFile: targetFile,
            chapterId: chapter.id,
            chapterTitle: chapter.title,
            kpId: kp.id,
            kpTitle: kp.title,
            complexity: complexity,
            contentHash: interactiveHash,
            modelRouting: modelRoute,
            description: `生成交互模块: ${res.title} (复杂度: ${complexity})`
          });
        }
      });
    });
  });

  // 3. 门户网站索引任务 (Portal Index)
  tasks.push({
    id: 'task-portal-index',
    type: 'portal',
    targetFile: 'index.html',
    contentHash: blueprintHash,
    modelRouting: profile.routes.portal,
    description: '装配生成课程多资源集成导航门户 (Portal Index)'
  });

  return {
    blueprintId: blueprint.id,
    title: blueprint.title,
    profile: profile.name,
    totalTasks: tasks.length,
    tasks
  };
}

/**
 * 教学资源门户导航 HTML 模板自动渲染器
 * 基于 Blueprint 与生成的资源清单渲染单一无依赖 index.html
 */
function renderPortalHtml(blueprint, generatedManifest = {}) {
  const chapters = blueprint.chapters || [];
  const primaryColor = blueprint.colorScheme?.primary || '#1e3a8a';
  const secondaryColor = blueprint.colorScheme?.secondary || '#0ea5e9';
  const bgColor = blueprint.colorScheme?.background || '#f8fafc';
  const textColor = blueprint.colorScheme?.text || '#0f172a';
  const textMuted = blueprint.colorScheme?.textMuted || '#64748b';
  const borderColor = blueprint.colorScheme?.border || '#e2e8f0';
  const cardBg = blueprint.colorScheme?.cardBg || '#ffffff';

  let firstSlidePath = '';

  const chapterCardsHtml = chapters.map((ch, idx) => {
    // 兼容章级 resources 或从知识点 knowledgePoints 中聚合 resources
    let resources = [...(ch.resources || [])];
    if (resources.length === 0 && Array.isArray(ch.knowledgePoints)) {
      let hasPpt = false;
      ch.knowledgePoints.forEach(kp => {
        (kp.resources || []).forEach(res => {
          if (res.type === "ppt") {
            if (!hasPpt) {
              hasPpt = true;
              resources.push(res);
            }
          } else {
            resources.push(res);
          }
        });
      });
    }
    const resourceCards = resources.map(res => {
      const isSlide = res.type === 'ppt';
      const fileExt = '.html';
      const fileName = isSlide ? 'slides' + fileExt : res.id + fileExt;
      const targetPath = './' + fileName;

      if (isSlide && !firstSlidePath) {
        firstSlidePath = targetPath;
      }

      const typeBadge = isSlide
        ? '<span class="tag tag-ppt">PPT 幻灯片</span>'
        : '<span class="tag tag-interactive">交互体验课件</span>';

      const estDuration = res.estimatedDuration ? ('预计耗时: ' + res.estimatedDuration) : '';
      const priorityBadge = res.priority === 'required' ? '<span class="priority-req">必修</span>' : '<span class="priority-opt">选修</span>';

      return `
        <div class="card-item-wrapper">
          <a class="res-card ${isSlide ? 'res-card-ppt' : 'res-card-interactive'}" href="${targetPath}" target="_blank" rel="noopener">
            <div class="res-head">
              ${typeBadge}
              ${priorityBadge}
            </div>
            <div class="res-title">${res.title}</div>
            <p class="res-desc">${res.description || '暂无描述'}</p>
            <div class="res-meta">
              <span>${estDuration}</span>
              <span class="res-action">进入学习 &rarr;</span>
            </div>
          </a>
          <div class="card-quick-actions">
            <button class="btn-download-item" onclick="downloadSingleFile('${fileName}')" title="下载此单文件到本地">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              下载 HTML
            </button>
          </div>
        </div>
      `;
    }).join('\n');

    return `
      <section class="chapter-card">
        <div class="chapter-header">
          <div class="chapter-num">第 ${idx + 1} 讲</div>
          <div class="chapter-main-info">
            <h2 class="chapter-title">${ch.title}</h2>
            <p class="chapter-desc">${ch.description || ''}</p>
          </div>
        </div>
        <div class="resource-grid">
          ${resourceCards}
        </div>
      </section>
    `;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${blueprint.title} - 教学资源导航门户</title>
  <style>
    :root {
      --primary: ${primaryColor};
      --secondary: ${secondaryColor};
      --bg: ${bgColor};
      --text: ${textColor};
      --text-muted: ${textMuted};
      --border: ${borderColor};
      --card-bg: ${cardBg};
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding: 40px 20px;
    }
    .container {
      max-width: 1060px;
      margin: 0 auto;
    }
    header {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 36px 32px;
      margin-bottom: 24px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      flex-wrap: wrap;
    }
    .badge {
      display: inline-block;
      font-size: 12px;
      font-weight: 700;
      color: var(--primary);
      background: rgba(30, 58, 138, 0.08);
      padding: 4px 10px;
      border-radius: 9999px;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    h1 {
      font-size: 28px;
      font-weight: 800;
      color: var(--text);
      line-height: 1.3;
      margin-bottom: 8px;
    }
    .subtitle {
      font-size: 15px;
      color: var(--text-muted);
      margin-bottom: 20px;
    }
    .meta-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      font-size: 13px;
      color: var(--text-muted);
      border-top: 1px solid var(--border);
      padding-top: 16px;
    }
    .meta-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .portal-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 4px;
    }
    .btn-action {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      font-size: 13px;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s ease;
      border: 1px solid transparent;
    }
    .btn-primary {
      background: var(--primary);
      color: #ffffff;
    }
    .btn-primary:hover {
      opacity: 0.92;
      transform: translateY(-1px);
    }
    .btn-secondary {
      background: #f1f5f9;
      color: #334155;
      border-color: #cbd5e1;
    }
    .btn-secondary:hover {
      background: #e2e8f0;
      color: #0f172a;
    }
    .chapter-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.02);
    }
    .chapter-header {
      display: flex;
      align-items: baseline;
      gap: 12px;
      margin-bottom: 20px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 12px;
    }
    .chapter-num {
      font-size: 12px;
      font-weight: 700;
      color: var(--primary);
      background: rgba(30, 58, 138, 0.08);
      padding: 2px 8px;
      border-radius: 4px;
    }
    .chapter-title {
      font-size: 18px;
      font-weight: 700;
    }
    .chapter-desc {
      font-size: 13px;
      color: var(--text-muted);
      margin-top: 4px;
    }
    .resource-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }
    .card-item-wrapper {
      position: relative;
      display: flex;
      flex-direction: column;
    }
    .res-card {
      display: flex;
      flex-direction: column;
      flex: 1;
      text-decoration: none;
      color: inherit;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
      background: #fafbfc;
      transition: all 0.2s ease;
    }
    .res-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(0,0,0,0.06);
      border-color: var(--primary);
    }
    .res-card-ppt {
      border-left: 4px solid var(--primary);
    }
    .res-card-interactive {
      border-left: 4px solid var(--secondary);
    }
    .res-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .tag {
      font-size: 11px;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .tag-ppt {
      background: #eff6ff;
      color: #1d4ed8;
    }
    .tag-interactive {
      background: #f0fdf4;
      color: #15803d;
    }
    .priority-req {
      font-size: 11px;
      color: #b91c1c;
      font-weight: 600;
    }
    .priority-opt {
      font-size: 11px;
      color: var(--text-muted);
    }
    .res-title {
      font-size: 15px;
      font-weight: 700;
      margin-bottom: 6px;
      color: var(--text);
    }
    .res-desc {
      font-size: 12px;
      color: var(--text-muted);
      flex: 1;
      margin-bottom: 12px;
    }
    .res-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: var(--text-muted);
      border-top: 1px dashed var(--border);
      padding-top: 10px;
    }
    .res-action {
      color: var(--primary);
      font-weight: 600;
    }
    .card-quick-actions {
      display: flex;
      justify-content: flex-end;
      padding: 4px 6px 0 6px;
    }
    .btn-download-item {
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 11px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .btn-download-item:hover {
      color: var(--primary);
      background: #f1f5f9;
    }
    footer {
      margin-top: 60px;
      text-align: center;
      font-size: 13px;
      color: var(--text-muted);
      padding-top: 20px;
      border-top: 1px solid var(--border);
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="header-top">
        <div>
          <div class="badge">TRGS 教学资源交付成果</div>
          <h1>${blueprint.title}</h1>
          <p class="subtitle">${blueprint.subtitle || ''}</p>
        </div>
        <div class="portal-actions">
          ${firstSlidePath ? `<a class="btn-action btn-primary" href="${firstSlidePath}" target="_blank" rel="noopener">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            启动课件演示
          </a>` : ''}
          <button class="btn-action btn-secondary" id="btnDownloadZip" onclick="downloadAllZip()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            打包下载完整课件 (ZIP)
          </button>
        </div>
      </div>
      <div class="meta-bar">
        <div class="meta-item"><span>学科:</span> <strong>${blueprint.subject || '通用'}</strong></div>
        <div class="meta-item"><span>总学时:</span> <strong>${blueprint.totalDuration || '未知'}</strong></div>
        <div class="meta-item"><span>教学法:</span> <strong>${blueprint.teachingPhilosophy?.approach || '启发式教学'}</strong></div>
        <div class="meta-item"><span>目标受众:</span> <strong>${blueprint.targetAudience?.level || '全级别'}</strong></div>
      </div>
    </header>

    <main>
      ${chapterCardsHtml}
    </main>

    <footer>
      由 TRGS (Teaching Resource Generation System) 自动化工程编排器构建 | 零依赖独立离线课件套件
    </footer>
  </div>

  <script>
    function downloadSingleFile(fileName) {
      const a = document.createElement('a');
      a.href = fileName;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    function generateZipBlob(fileList) {
      const table = [];
      for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) {
          c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
        }
        table[n] = c >>> 0;
      }
      function calcCrc32(buf) {
        let crc = 0 ^ (-1);
        for (let i = 0; i < buf.length; i++) {
          crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
        }
        return (crc ^ (-1)) >>> 0;
      }

      const encoder = new TextEncoder();
      const localHeaders = [];
      const centralDirs = [];
      let offset = 0;

      for (let f = 0; f < fileList.length; f++) {
        const item = fileList[f];
        const nameBytes = encoder.encode(item.name);
        const dataBytes = item.data;
        const crc = calcCrc32(dataBytes);
        const size = dataBytes.length;

        const lh = new Uint8Array(30 + nameBytes.length);
        const lhView = new DataView(lh.buffer);
        lhView.setUint32(0, 0x04034b50, true);
        lhView.setUint16(4, 20, true);
        lhView.setUint16(6, 0, true);
        lhView.setUint16(8, 0, true);
        lhView.setUint16(10, 0, true);
        lhView.setUint16(12, 0, true);
        lhView.setUint32(14, crc, true);
        lhView.setUint32(18, size, true);
        lhView.setUint32(22, size, true);
        lhView.setUint16(26, nameBytes.length, true);
        lhView.setUint16(28, 0, true);
        lh.set(nameBytes, 30);

        const cd = new Uint8Array(46 + nameBytes.length);
        const cdView = new DataView(cd.buffer);
        cdView.setUint32(0, 0x02014b50, true);
        cdView.setUint16(4, 20, true);
        cdView.setUint16(6, 20, true);
        cdView.setUint16(8, 0, true);
        cdView.setUint16(10, 0, true);
        cdView.setUint16(12, 0, true);
        cdView.setUint16(14, 0, true);
        cdView.setUint32(16, crc, true);
        cdView.setUint32(20, size, true);
        cdView.setUint32(24, size, true);
        cdView.setUint16(28, nameBytes.length, true);
        cdView.setUint16(30, 0, true);
        cdView.setUint16(32, 0, true);
        cdView.setUint16(34, 0, true);
        cdView.setUint16(36, 0, true);
        cdView.setUint32(38, 0, true);
        cdView.setUint32(42, offset, true);
        cd.set(nameBytes, 46);

        localHeaders.push(lh);
        localHeaders.push(dataBytes);
        centralDirs.push(cd);

        offset += lh.length + dataBytes.length;
      }

      const cdOffset = offset;
      let cdTotalSize = 0;
      for (let i = 0; i < centralDirs.length; i++) {
        cdTotalSize += centralDirs[i].length;
      }

      const eocd = new Uint8Array(22);
      const eocdView = new DataView(eocd.buffer);
      eocdView.setUint32(0, 0x06054b50, true);
      eocdView.setUint16(4, 0, true);
      eocdView.setUint16(6, 0, true);
      eocdView.setUint16(8, fileList.length, true);
      eocdView.setUint16(10, fileList.length, true);
      eocdView.setUint32(12, cdTotalSize, true);
      eocdView.setUint32(16, cdOffset, true);
      eocdView.setUint16(20, 0, true);

      const allParts = localHeaders.concat(centralDirs).concat([eocd]);
      return new Blob(allParts, { type: 'application/zip' });
    }

    function downloadAllZip() {
      const btn = document.getElementById('btnDownloadZip');
      const origText = btn.innerHTML;
      btn.innerHTML = '正在打包课件中...';
      btn.disabled = true;

      const cardLinks = document.querySelectorAll('a.res-card');
      const hrefs = ['blueprint.json'];
      for (let i = 0; i < cardLinks.length; i++) {
        const href = cardLinks[i].getAttribute('href');
        if (href && hrefs.indexOf(href) === -1) {
          hrefs.push((href.indexOf('./') === 0 ? href.slice(2) : href));
        }
      }

      const pending = [];
      const encoder = new TextEncoder();

      for (let i = 0; i < hrefs.length; i++) {
        (function(filename) {
          const req = new XMLHttpRequest();
          req.open('GET', filename, true);
          req.responseType = 'arraybuffer';
          const p = new Promise(function(resolve) {
            req.onload = function() {
              if (req.status === 200 || req.status === 0) {
                resolve({ name: filename, data: new Uint8Array(req.response) });
              } else {
                resolve(null);
              }
            };
            req.onerror = function() {
              resolve(null);
            };
            try {
              req.send();
            } catch (err) {
              resolve(null);
            }
          });
          pending.push(p);
        })(hrefs[i]);
      }

      Promise.all(pending).then(function(results) {
        const fileList = [];
        for (let i = 0; i < results.length; i++) {
          if (results[i] && results[i].data && results[i].data.length > 0) {
            fileList.push(results[i]);
          }
        }

        const currentHtmlData = encoder.encode(document.documentElement.outerHTML);
        fileList.push({ name: 'index.html', data: currentHtmlData });

        if (fileList.length > 0) {
          const blob = generateZipBlob(fileList);
          const url = URL.createObjectURL(blob);
          const dl = document.createElement('a');
          dl.href = url;
          dl.download = 'courseware-package.zip';
          document.body.appendChild(dl);
          dl.click();
          document.body.removeChild(dl);
          URL.revokeObjectURL(url);
        } else {
          alert('请使用本地 http 服务 (trgs serve) 进行打包下载');
        }

        btn.innerHTML = origText;
        btn.disabled = false;
      }).catch(function() {
        btn.innerHTML = origText;
        btn.disabled = false;
        alert('打包下载遇到异常，推荐使用命令行 trgs pack 打包');
      });
    }
  </script>
</body>
</html>`;
}


/**
 * 批量执行技术 QA 检查
 */
function runBatchQA(targetDir) {
  const reports = [];
  const entries = fs.readdirSync(targetDir);

  for (const file of entries) {
    if (!file.endsWith('.html')) continue;
    const fullPath = path.join(targetDir, file);
    const type = file === 'slides.html' ? 'ppt' : (file.startsWith('interactive-') ? 'interactive' : 'portal');

    // Portal 本身跳过严格的 T10/T11 检查，主要运行 HTML / 语法校验
    if (type === 'portal') {
      continue;
    }

    try {
      const rep = runQACheck(fullPath, type);
      reports.push(rep);
    } catch (e) {
      reports.push({
        resourceId: file,
        result: 'FAIL',
        failReason: e.message,
        fileSizeKB: '0'
      });
    }
  }

  const allPassed = reports.every(r => r.result === 'PASS');
  return {
    total: reports.length,
    allPassed,
    reports
  };
}

function executeBuild(blueprintPath, options = {}) {
  const absBlueprintPath = path.resolve(blueprintPath);
  if (!fs.existsSync(absBlueprintPath)) {
    console.error(`[ERROR] Blueprint file not found: ${absBlueprintPath}`);
    process.exit(1);
  }

  let blueprint;
  try {
    blueprint = JSON.parse(fs.readFileSync(absBlueprintPath, 'utf8'));
  } catch (e) {
    console.error(`[ERROR] Failed to parse JSON blueprint: ${e.message}`);
    process.exit(1);
  }

  // 1. 规范校验
  const schemaPath = path.resolve(__dirname, '../skill/schemas/blueprint-schema.json');
  const validationErrors = validateBlueprintSchema(blueprint, schemaPath);
  if (validationErrors.length > 0) {
    console.error(`\n[SCHEMA VALIDATION FAILED] ${validationErrors.length} errors:`);
    validationErrors.forEach(err => console.error(` - ${err}`));
    if (!options.force) {
      process.exit(1);
    }
  } else {
    console.log(`[SCHEMA OK] Blueprint passed schema validation.`);
  }

  // 输出路径推断
  const defaultOutDir = path.join(path.dirname(absBlueprintPath), 'dist');
  const outputDir = path.resolve(options.outputDir || defaultOutDir);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 2. 生成任务计划
  const profile = options.modelProfile || 'balanced';
  const plan = planBuildTasks(blueprint, profile, options);

  console.log(`\n================ TRGS BUILD PLAN ================`);
  console.log(`Blueprint: ${plan.title} (${plan.blueprintId})`);
  console.log(`Routing Profile: ${plan.profile}`);
  console.log(`Planned Tasks: ${plan.totalTasks}`);
  console.log(`Target Dir: ${outputDir}`);
  console.log(`-------------------------------------------------`);

  // 3. 增量缓存比对
  const cache = loadCache(outputDir);
  const pendingTasks = [];
  const cachedTasks = [];

  plan.tasks.forEach(task => {
    const cachedEntry = cache.entries[task.id];
    const targetFilePath = path.join(outputDir, task.targetFile);
    const fileExists = fs.existsSync(targetFilePath);

    if (options.incremental && cachedEntry && cachedEntry.hash === task.contentHash && fileExists) {
      cachedTasks.push(task);
    } else {
      pendingTasks.push(task);
    }
  });

  plan.tasks.forEach(task => {
    const isCached = cachedTasks.includes(task);
    const statusStr = isCached ? '[CACHED]' : '[BUILD] ';
    const modelStr = `Model: ${task.modelRouting.model} (${task.modelRouting.tier})`;
    console.log(`${statusStr} ${task.targetFile.padEnd(35)} | ${modelStr}`);
  });
  console.log(`=================================================\n`);

  if (options.dryRun) {
    console.log(`[DRY-RUN] Execution skipped. Total tasks: ${plan.tasks.length}, To Build: ${pendingTasks.length}, Cached: ${cachedTasks.length}`);
    return { plan, pendingTasks, cachedTasks };
  }

  // 4. 自动装配 Portal Index
  const portalTask = plan.tasks.find(t => t.type === 'portal');
  if (portalTask) {
    console.log(`[BUILDING] Assembling Portal Index -> ${portalTask.targetFile}...`);
    const portalHtml = renderPortalHtml(blueprint);
    fs.writeFileSync(path.join(outputDir, portalTask.targetFile), portalHtml, 'utf8');
    cache.entries[portalTask.id] = {
      hash: portalTask.contentHash,
      file: portalTask.targetFile,
      updatedAt: new Date().toISOString()
    };
    console.log(`[OK] Portal Index generated successfully.`);
  }

  // 如果目标目录中已存在相关 HTML（或用户使用现有目录），更新缓存
  plan.tasks.forEach(task => {
    const targetFilePath = path.join(outputDir, task.targetFile);
    if (fs.existsSync(targetFilePath)) {
      cache.entries[task.id] = {
        hash: task.contentHash,
        file: task.targetFile,
        updatedAt: new Date().toISOString()
      };
    }
  });
  saveCache(outputDir, cache);

  // 5. 自动触发 QA 质检
  if (!options.skipQa) {
    console.log(`\n[QA CHECK] Running automated QA verification on generated outputs...`);
    const qaSummary = runBatchQA(outputDir);
    console.log(`Total checked files: ${qaSummary.total}`);
    qaSummary.reports.forEach(r => {
      const mark = r.result === 'PASS' ? '✓' : '✗';
      console.log(`  ${mark} [${r.result}] ${r.resourceId}.html (${r.fileSizeKB})`);
      if (r.result === 'FAIL') {
        console.log(`      Reason: ${r.failReason}`);
      }
    });

    if (!qaSummary.allPassed) {
      console.warn(`\n[QA WARNING] Some files did not pass Technical QA.`);
    } else {
      console.log(`\n[QA ALL PASS] All output files passed Technical QA!`);
    }
  }

  console.log(`\n[BUILD COMPLETED] Artifacts ready in: ${outputDir}`);
  return { plan, pendingTasks, cachedTasks };
}

module.exports = {
  createZipArchive,
  executeBuild,
  planBuildTasks,
  validateBlueprintSchema,
  renderPortalHtml,
  runBatchQA,
  MODEL_ROUTING_PROFILES
};
