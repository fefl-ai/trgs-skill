<div align="center">

# 🎓 TRGS — Teaching Resource Generation Skill

**下一代 AI 驱动的端到端教学资源生成 Skill**

*将冗长复杂的教学大纲，一键转化为美观、高互动、零依赖的 Web 课件与互动教学网页*

[特性](#-核心特性) • [架构](#-系统架构) • [视觉主题](#-内置视觉主题) • [自动化工具](#-自动化校验工具) • [快速开始](#-快速开始) • [输出示例](#-输出样例展示) • [设计规范](#-设计规范与约束)

---

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Agent](https://img.shields.io/badge/Agent-TRAE%20%7C%20Cursor%20%7C%20OpenClaw-8A2BE2.svg)
![Output](https://img.shields.io/badge/Output-Single--file%20HTML5-success.svg)
![Tooling](https://img.shields.io/badge/Node.js%20Tooling-Zero%20Dependency-brightgreen.svg)

</div>

---

## 📖 简介

**TRGS (Teaching Resource Generation Skill)** 是一个高度结构化的 AI Agent 扩展能力库（Skill），专为 LLM / AI Coding Assistant（如 TRAE, Cursor, OpenClaw, Gemini Agent 等）设计。

不同于普通的 PPT 文本生成器，TRGS 基于**教学法理论（Pedagogical Framework）**与**两阶段分离架构**，先通过策略引擎决策“怎么教”，再将大纲精确编译为**单文件、双击即用、零外部依赖**的 HTML5 响应式 PPT 和真正可交互的教学小网页。

---

## ✨ 核心特性

- 🎯 **Blueprint-First 架构与极简大纲智能扩写**
  - 单一数据源原则。大纲首先被解析并编译为符合 JSON Schema 规范的 `blueprint.json`。内置 **Syllabus Enrichment Mode**，即使输入仅为一句话（如“生成 Python 面向对象课件”），也能智能推断并自动扩写为标准的 90 分钟教学蓝图。
- 💡 **Strategy-Engine 决策驱动**
  - 在生成前，AI 策略引擎先根据知识点的**认知层级（Bloom 认知分类）**与**抽象程度**，智能决定最佳呈现形式（如控制台模拟器、流程步进、参数调优、对比卡片等）。
- 🎨 **Multi-Theme 多主题视觉系统与通用 UI 组件库**
  - 内置 `ocean` (通用海蓝)、`dark` (极客暗黑)、`academic` (学术典雅)、`botanical` (清新自然) 4 套现代设计主题，且模板内置分步节点 (`.step-flow`) 与左右对比栏 (`.compare-split`)。
- 🏛️ **Course Portal 课程导航大厅**
  - 提供 `portal-base.html` 模板，自动将一次批量生成的所有章节 PPT (`slides.html`) 与交互网页 (`interactive-*.html`) 汇聚在优雅的 `index.html` Portal 导航主页中。
- 🛠️ **自动化 QA 校验与外科手术式自修复 (Self-Repair Engine)**
  - 提供零依赖 Node.js 校验脚本 `scripts/qa-checker.js` 执行硬性代码检测。若未通过 QA 检查，自动调起 `self-repair.md` 进行带错局部精准修正。

---

## 🏛 系统架构

TRGS 的端到端流水线包含 6 个标准阶段：

```
                    ┌────────────────────────┐
                    │    教学大纲 / 课程需求   │
                    └───────────┬────────────┘
                                │
                                ▼
                    ┌────────────────────────┐
                    │   Blueprint Builder    │  ◄── 支持极简大纲智能扩写 (Enrichment Mode)
                    └───────────┬────────────┘
                                │
                                ▼
                     Teaching Blueprint JSON
                                │
                                ▼
                    ┌────────────────────────┐
                    │    Strategy Engine     │  ◄── 匹配教学法与决策最佳形式
                    └───────────┬────────────┘
                                │
                 ┌──────────────┴──────────────┐
                 ▼                             ▼
    ┌────────────────────────┐   ┌────────────────────────┐
    │     PPT Generator      │   │ Interactive Generator  │  ◄── 并行生成单文件 HTML
    └────────────┬───────────┘   └─────────────┬──────────┘
                 │                             │
                 └──────────────┬──────────────┘
                                │
                                ▼
                    ┌────────────────────────┐
                    │    Quality Checker     │  ◄── 支持 node scripts/qa-checker.js
                    └───────────┬────────────┘
                                │
                     ┌──────────┴──────────┐
                FAIL │                     │ PASS
                     ▼                     ▼
          ┌────────────────────┐   ┌─────────────────────────┐
          │ Self-Repair Engine │   │  交付文件 + Portal 主页 │
          │ (self-repair.md)   │   │      (index.html)       │
          └────────────────────┘   └─────────────────────────┘
```

---

## 🎨 内置视觉主题

TRGS 针对不同学科和场景设计了 4 套现代风格的 CSS Token 主题系统：

| 主题标识 | 名称 | 设计风格与特点 | 推荐适用学科 |
| :--- | :--- | :--- | :--- |
| `ocean` | **通用海蓝** *(默认)* | 经典深蓝与暖橙渐变，高视觉对比与现代感 | 计算机网络、通识课程、科技讲座 |
| `dark` | **极客暗黑** | 深灰背景配以霓虹青与亮金，符合现代 IDE 审美 | 软件开发、算法数据结构、操作系统 |
| `academic` | **学术典雅** | 暖象牙白背景配以藏青与深红，沉稳大气 | 论文汇报、高等数学、大学物理、人文历史 |
| `botanical` | **清新自然** | 森林绿与鼠尾草绿，舒缓优雅 | 生物学、环境科学、地理与自然科学 |

在生成的 HTML 根节点通过 `<html data-theme="dark">` 即可无缝切换主题。

---

## 🛠 自动化校验工具

项目内置零依赖原生 Node.js 代码校验脚本 `scripts/qa-checker.js`，可独立在终端中运行，自动对生成的 HTML 进行 AST 语法检查、违禁 API 检测与文件体积核查：

```bash
# 校验交互组件 HTML
node scripts/qa-checker.js test-output/chapter-01/interactive-tcp-handshake.html

# 校验 Web PPT HTML
node scripts/qa-checker.js test-output/chapter-01/slides.html --type=ppt
```

**JSON QA Report 输出示例：**
```json
{
  "resourceId": "interactive-tcp-handshake",
  "result": "PASS",
  "layer": "technical",
  "fileSizeKB": "33.27KB",
  "checks": [
    { "id": "T1", "name": "DOCTYPE 声明", "passed": true, "detail": "存在 <!DOCTYPE html>" },
    { "id": "T4", "name": "无外部资源引用", "passed": true, "detail": "无外部 HTTP/HTTPS 资源引用" },
    { "id": "T5", "name": "无禁止 API", "passed": true, "detail": "未检测到违禁 API" },
    { "id": "T7", "name": "JS 语法正确", "passed": true, "detail": "所有内联 JavaScript 语法解析成功" }
  ]
}
```

---

## 📁 项目目录结构

```
trgs-skill/
├── scripts/
│   └── qa-checker.js            # 🛠️ 零依赖原生 Node.js 技术 QA 校验脚本
├── skill/                      # 🧠 Agent Skill 实施主目录
│   ├── SKILL.md                # Skill 主入口规则与触发词定义
│   ├── workflow.md             # 端到端 Agent 工作流编排指南
│   ├── schemas/
│   │   └── blueprint-schema.json # Blueprint 数据结构 JSON Schema (支持 theme)
│   ├── prompts/                # 🤖 6 大核心 Prompt 引擎
│   │   ├── blueprint-builder.md     # 1. 大纲 → 结构化蓝图 (含智能扩写)
│   │   ├── strategy-engine.md       # 2. 知识点 → 教学形式策略
│   │   ├── ppt-generator.md         # 3. 蓝图 → Web PPT 生成
│   │   ├── interactive-generator.md # 4. 蓝图 → 可交互网页生成
│   │   ├── quality-checker.md       # 5. 三层 QA 质量检验
│   │   └── self-repair.md           # 6. 带错局部自修复 Engine Prompt
│   ├── templates/              # 🎨 核心 HTML 骨架模板
│   │   ├── ppt-base.html            # PPT 基础模板 (含全屏/翻页/多主题)
│   │   ├── interactive-base.html    # 交互组件模板 (含控制面板/UI 组件)
│   │   └── portal-base.html         # 课程导航大厅 Portal 模板
│   ├── rules/
│   │   └── generation-rules.md      # 技术约束、复杂度上限与降级规则
│   └── examples/               # 📚 官方范例
│       ├── cs-networking/           # 示例 1: 计算机网络 (包含标准 blueprint.json)
│       ├── data-structures/         # 示例 2: 数据结构
│       └── frontend-dev/            # 示例 3: 前端开发
├── spec/                       # 📋 详细系统设计规范文档 (00-05)
└── README.md                   # 📖 本说明文档
```

---

## 🚀 快速开始

### 1. 安装与引入

#### 方式 A：在 Agent 环境中直接引入文件夹
将 `skill/` 目录拷贝到你的 AI Agent 插件或 Skill 路径中（如 `.gemini/skills/` 或 Agent 配置目录）：

```bash
git clone https://github.com/fefl-ai/trgs-skill.git
```

---

### 2. 触发关键词

在兼容的 AI Agent（TRAE / Cursor / OpenClaw / Gemini Agent 等）对话框中输入以下关键词即可自动触发 Skill：

- *"根据这份教学大纲生成 PPT 课件"*
- *"帮我制作一个关于 TCP 三次握手的交互式教学网页"*
- *"生成第三章的教学资源与备课教案"*

---

### 3. Prompt 调用示例

**示例 Prompt：**
> “请读取下面的《计算机网络》第三章大纲，选择 `dark` 暗黑主题，生成完整的 Web PPT 和一个 TCP 三次握手的交互演示网页：”
> ```markdown
> 第三章 传输层协议
> 3.1 传输层服务与协议概述
> 3.2 端口与套接字概念
> 3.3 TCP 三次握手与连接建立过程（重点、难点）
> ```

---

## 📊 输出样例展示

TRGS 生成的交付产物可以直接双击运行：

1. **课程 Portal 大厅 (`index.html`)**
   - 包含课程元数据与完整章节目录，一键跳转各章节 PPT 与交互演练。
2. **Web PPT (`slides.html`)**
   - 16:9 响应式比例，支持 `←` `→` 键翻页、`F` 全屏切换、数字跳转及打印模式。
3. **交互式演示网页 (`interactive-*.html`)**
   - 带有控制面板、分步动画演算、参数调节滑块与重置路径，帮助学生在实操中化解难点。

---

## ⚙️ 设计规范与约束

所有由 TRGS 生成的资源必须严格遵守 [generation-rules.md](file:///Users/fengliang/code/trgs-skill/skill/rules/generation-rules.md)：

- ❌ **禁止**：使用任何外部 CDN/网络图片、`eval()`、`localStorage`、`fetch()` 网络请求及外部前端框架（React/Vue/jQuery 等）。
- ✅ **允许**：使用 Canvas 2D API、SVG 矢量渲染、CSS Animation/Flexbox/Grid、`requestAnimationFrame`。
- 📦 **体积要求**：PPT 文件 < 500KB，Interactive 组件 < 200KB。

---

## 📄 开源协议

本项目基于 [MIT License](./LICENSE) 开源许可。欢迎提交 Issue 与 Pull Request 共同丰富教学组件与 Prompt 策略！

<div align="center">

**Made with ❤️ for Modern Educators & AI Agents**

</div>
