# 规范 06: 构建编排器与自动化 CLI 规范

## 1. 概述

随着课程规模从单一章节扩展至整门课程或大型专题，手工触发各个资源的生成与校验极易带来不一致性与高昂的 API/Token 成本。
**TRGS Build Orchestrator (构建编排器)** 提供了统一的命令行工具链 (`trgs` / `trgs-build`)，负责教学资源生成生命周期的全自动化管控：
- **大纲校验 (Blueprint Schema Validation)**：构建前强制检验，避免下游任务在错误结构上浪费调用。
- **任务规划 (Task Planner)**：自动解构章节、PPT 与交互组件，生成依赖图与构建任务清单。
- **异构模型路由适配 (Heterogeneous Model Routing)**：根据任务复杂度（结构提炼、幻灯片编排、深度Canvas代码、质检规则）分派至不同梯队的模型，实现最佳性价比与卓越交付品质。
- **内容寻址缓存与增量构建 (Incremental Build)**：基于 SHA-256 细粒度计算知识点、设计规范与主题 Hash，精准跳过未变更资源。
- **聚合门户自动装配 (Portal Assembler)**：一键渲染课程全资源导航首页 `index.html`。
- **自动化质检闭环 (Integrated QA Verification)**：构建产物直接对接确定性两级质检引擎，保障交付物可用性。

---

## 2. CLI 架构与命令参考

TRGS CLI 原生由 Node.js 实现，零外部 npm 依赖，开箱即用。

### 2.1 核心命令

```bash
# 查看帮助与版本
trgs --help
trgs --version

# 1. 任务规划预览 (Dry-Run 模式，不生成文件)
trgs plan <path/to/blueprint.json> [--model-profile=balanced|cost-effective|premium]

# 2. 完整构建 (支持指定输出目录、增量缓存与自动 QA)
trgs build <path/to/blueprint.json> [-o dist] [--incremental]

# 3. 独立装配门户首页
trgs portal <path/to/blueprint.json> [-o dist]

# 4. 一键在默认浏览器中预览课件或聚合门户
trgs preview <dist-dir-or-html>

# 5. 批量或单文件自动化质检
trgs qa <path/to/dist-or-file.html> [--type=ppt|interactive]

# 6. 清除增量缓存
trgs clean-cache [dist-dir]
```

### 2.2 CLI 选项参数 (Options)

| 参数项 | 缩写 | 默认值 | 作用说明 |
|---|---|---|---|
| `--output-dir` | `-o` | `<blueprint同级>/dist` | 构建产物输出目录 |
| `--open` | 无 | `false` | 构建完成后自动调用系统默认浏览器打开聚合门户 |
| `--incremental` | 无 | `false` | 启用 SHA-256 内容寻址缓存，未变更模块自动跳过 |
| `--dry-run` | 无 | `false` | 仅输出构建任务清单与模型分配表，不写入文件 |
| `--model-profile` | 无 | `balanced` | 模型路由策略：`balanced` \| `cost-effective` \| `premium` |
| `--skip-qa` | 无 | `false` | 跳过产物生成后的自动 QA 校验 |
| `--force` | 无 | `false` | Blueprint Schema 校验出现警告时强制执行 |

---

## 3. 异构模型路由适配 (Heterogeneous Model Routing)

在全流程资源生成中，不同生成阶段的认知与逻辑复杂度差异巨大：

```
[原始输入] 
   │
   ▼
[阶段一: Blueprint 生成与修剪] ──► 快速结构化大模型 (Fast/Standard Tier: Gemini 2.0 Flash / Haiku)
   │
   ▼
[阶段二: 教学策略与PPT生成]    ──► 标准代码与教学大模型 (Standard Tier: Sonnet / GPT-4o)
   │
   ▼
[阶段三: 交互演示引擎生成]
   ├─ Low (简易状态机/动画)     ──► Standard Tier (Sonnet / GPT-4o)
   ├─ Medium (算法图谱/时序)    ──► Advanced Tier (Sonnet / DeepSeek-R1)
   └─ High (物理引擎/复杂Canvas) ──► Frontier Tier (Claude 3.7 Sonnet Thought / o3-mini-high)
   │
   ▼
[阶段四: Portal 门户首页装配]  ──► 确定性生成引擎 / 模板引擎 (Deterministic Generator, 零Token消耗)
   │
   ▼
[阶段五: 技术与教学质检]       ──► 本地静态 AST / DOM 校验器 (Native QA Engine, 零Token消耗)
```

### 3.1 预设 Profile 矩阵

1. **`balanced` (默认推荐)**：
   - Blueprint: `claude-3-5-haiku` / `gpt-4o-mini`
   - PPT 幻灯片: `claude-3-5-sonnet` / `gpt-4o`
   - Interactive (High): `claude-3-7-sonnet-thought` / `o3-mini-high`
   - Portal & QA: 确定性本地引擎 (0 Token)
2. **`cost-effective` (高性价比)**：
   - 整体优先采用 `gemini-2.0-flash` / `deepseek-v3`，仅高难交互选用 `deepseek-r1` 或 `sonnet`。
3. **`premium` (极致品质)**：
   - 中高复杂度交互与复杂教学组件全量路由至前沿深度思考推理模型。

---

## 4. 内容寻址缓存与增量构建 (Incremental Build)

在大型课件迭代中，修改章节或单知识点不应重新生成整套课件。

### 4.1 哈希指纹算法

编排器对每个资源任务独立计算 SHA-256 签名：
- **PPT 任务**：`Hash(chapterId + chapterTitle + theme + resources[kpId, spec, keyPoints...])`
- **Interactive 任务**：`Hash(kpId + kpTitle + strategy + spec + theme)`
- **Portal 任务**：`Hash(blueprint.title + theme + subject)`

### 4.2 缓存持久化

缓存元数据存储于输出目录下的 `.trgs-cache.json`：
```json
{
  "version": "1.0",
  "entries": {
    "task-ppt-ch-01": {
      "hash": "2cdf09d6380b41eadcedf9567bb1e24fcfee4d7e9398110da6ab57e97c0ebda8",
      "file": "slides.html",
      "updatedAt": "2026-09-06T05:50:25.052Z"
    },
    "task-interactive-res-tcp-handshake": {
      "hash": "8f3b2a...",
      "file": "interactive-tcp-handshake.html",
      "updatedAt": "2026-09-06T05:50:25.052Z"
    }
  }
}
```
当传入 `--incremental` 标志时，若哈希匹配且目标文件存在，编排器直接标记 `[CACHED]` 跳过该任务。

---

## 5. 质量校验集成

构建完成后，编排器默认触发 `Layer 1 确定性技术质检`，校验标准遵循 [规范 05: 质量检查器规范](./05-quality-checker.md)：
1. 单文件自包含性（无外部 CDN 依赖、内联 CSS/JS）
2. 文件体积合规性（< 200KB 门禁）
3. 视口响应式元标签（`viewport`）
4. 资源控制挂钩与关键交互元素可用性

若质检未通过，命令行输出明确失败原因与警告项，保障教学交付物的稳定性。
