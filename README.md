<div align="center">

# 🚀 Interactive Deck Engine (TRGS)

### 下一代智能交互课件与高沉浸教学演练引擎

**告别枯燥翻页 PPT！一键将教学大纲转化为「可玩、可调、可探究」的离线全栈交互课件**

[![SkillHub](https://img.shields.io/badge/SkillHub-获取最新技能包-ff6b6b?style=for-the-badge&logo=rocket)](https://skillhub.cn/skills/user_f823e2d9/interactive-deck-engine)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Zero Dependency](https://img.shields.io/badge/Runtime-Zero%20Dependency-emerald?style=for-the-badge)](package.json)
[![Agent Ready](https://img.shields.io/badge/Agent-TRAE%20%7C%20Cursor%20%7C%20OpenClaw%20%7C%20Codex-8A2BE2?style=for-the-badge)](#)

<br />

[🎯 核心亮点](#-为什么需要-interactive-deck-engine) •
[🧩 四大工业级积木](#-4-大内置工业级交互状态机积木-interactive-blocks) •
[⚡ 快速体验](#-极速上手指南) •
[🛠️ 构建与质检](#-构建工具与质量门禁) •
[🌐 访问技能市场](https://skillhub.cn/skills/user_f823e2d9/interactive-deck-engine)

</div>

---

> 💡 **技能市场现已上架**：你可以在 SkillHub 市场一键安装使用本技能！<br>
> 🔗 **官方安装入口**：[https://skillhub.cn/skills/user_f823e2d9/interactive-deck-engine](https://skillhub.cn/skills/user_f823e2d9/interactive-deck-engine)

---

## 🌟 为什么需要 Interactive Deck Engine？

市面上传统的 AI 生成 PPT 工具，往往停留在**“帮你在卡片里塞字和换背景”**，学生仍然只是走马观花。

**Interactive Deck Engine (TRGS)** 彻底颠覆这一现状：
1. **从“文字阅读”跨越到“动手探索”**：基于布鲁姆认知分级（Bloom\x27s Taxonomy），将抽象难点直接编译为动态仿真沙盒、时序演进器或磁吸连线试验台。
2. **工业级状态机积木（Interactive Blocks）**：杜绝 AI 从零手写 Canvas/JS 时的漂移失控与内存泄漏，将动作演进带入单文件原生前端。
3. **单文件·零构建·断网秒开**：交付的是完整的单文件 HTML5，无需安装几十个 npm 依赖，无需启动复杂后端，U 盘、机房、手机浏览器双击即用！

---

## 🧩 4 大内置工业级交互状态机积木 (Interactive Blocks)

借鉴成熟动作引擎哲学，本引擎在 `skill/templates/interactive-blocks/` 封装了 4 套标准化防御性状态机，赋能 Agent 极速生成工业级教学体验：

| 积木架构 (Block Archetype) | 核心驱动特性 | 典型教学场景 |
| :--- | :--- | :--- |
| ⏱️ **Timeline & Action Runner**<br>`timeline-runner.html` | • 离散时序状态机 + 自动连续播放 / 暂停 / 单步前进<br>• ResizeObserver 高 DPI Canvas 自适应防模糊<br>• 报文/数据帧实时探针卡片 | 网络三次握手/四次挥手、算法单步执行、业务流转、生化演变 |
| 🎛️ **Parameter Sandbox Engine**<br>`parameter-sandbox.html` | • 双向绑定滑块（带防抖与归一化）<br>• 响应式重绘总线 (Reactive Draw Bus)<br>• 实时遥测读数 (Telemetry) 监控 | 物理抛体/碰撞规律、三角波/傅里叶调制、TCP 滑动窗口与拥塞控制、经济供需曲线 |
| 🧲 **Drag & Snap Matcher**<br>`drag-snap-matcher.html` | • 逆矩阵坐标反查（彻底消除屏幕缩放鼠标漂移）<br>• 槽位重力磁吸判定场 (Snap Radius)<br>• 实时装配正确性判分与复位反馈 | 报文首部拼装、拓扑网络组网、电路逻辑门搭建、化学分子组装 |
| 🕸️ **Graph & State Inspector**<br>`graph-state-inspector.html` | • 拓扑图谱脉冲高亮与激活状态流转<br>• 节点悬停/点击下钻深度检查<br>• 状态转移事件触发器 (State Triggers) 与死锁防御 | TCP 有限状态机(FSM)转移、路由算法、树/图遍历、微服务拓扑 |

---

## ✨ 核心特性

* **🎯 Blueprint-First 蓝图严密性**：大纲先被解析为标准 JSON Schema 蓝图。支持 **Syllabus Enrichment Mode**，即使输入只有一句话（“教我量子力学”），也能智能推演出完整的教学难点与策略。
* **💡 教学策略引擎 (Strategy Engine)**：根据知识点的深度（记忆、理解、应用、分析、评估、创造），自动匹配讲义表达还是交互式组件。
* **🎨 4 套大师级预设视觉主题**：内置 `ocean`（通用科技蓝）、`dark`（极客深黑）、`academic`（典雅学术）、`botanical`（清新自然），适配多学科场景。
* **🏛️ 聚合学习门户 (Course Portal)**：一键将所有章节课件 (`slides.html`) 与多个实验 (`interactive-*.html`) 汇聚在唯美沉浸的 `index.html` Portal 大厅中。
* **🛡️ 质量门禁与自愈回环 (QA & Self-Repair)**：提供零依赖 Node.js 校验脚本 `scripts/qa-checker.js`。如代码有隐蔽语法或排版错误，自动调起局部自愈修正。

---

## ⚡ 极速上手指南

### 方式一：在 Agent 平台直接安装（推荐）

访问 **[SkillHub 技能主页](https://skillhub.cn/skills/user_f823e2d9/interactive-deck-engine)**，一键同步到你的 AI 助手（TRAE、Cursor、OpenClaw、Codex 等），直接在对话框发起生成：

```text
"@Interactive-Deck-Engine 请为我制作一堂关于《计算机网络 TCP 协议》的高互动公开课，要求包含三次握手时序演练"
```

### 方式二：本地极速构建运行

本项目内置全套零外部 npm 依赖的 Node.js 编排工具，下载即可运行：

```bash
# 1. 查看或制定构建计划 (Dry-Run)
node bin/trgs.js plan skill/examples/cs-networking/blueprint.json

# 2. 本地启动服务并实时预览
node bin/trgs.js preview skill/examples/cs-networking/blueprint.json

# 3. 一键执行硬性质量门禁检测
npm run qa:all
```

---

## 🛠️ 构建工具与质量门禁

TRGS 内置完善的纯原生工具链，不需安装庞杂的构建套件即可保障产物高可用：

```bash
# 校验单个生成的交互网页是否符合技术约束与安全规范
node scripts/qa-checker.js benchmark-comparison/after/interactive-res-3-2-interactive.html --type=interactive

# 一键打包整个发布版本 Skill 压缩包
npm run pack:skill
```

---

## 📂 仓库目录全景

```text
trgs-skill/
├── skill/                         # 核心 Agent 技能包
│   ├── SKILL.md                   # 技能主入口与路由状态机
│   ├── templates/                 # 模板骨架库
│   │   ├── ppt-base.html          # 响应式课件基础模板
│   │   ├── portal-base.html       # 课程导航大厅模板
│   │   └── interactive-blocks/    # 4 大工业级状态机积木
│   │       ├── timeline-runner.html
│   │       ├── parameter-sandbox.html
│   │       ├── drag-snap-matcher.html
│   │       └── graph-state-inspector.html
│   ├── prompts/                   # 教学策略引擎与代码生成 Prompts
│   └── schemas/                   # Blueprint 严格规范 JSON Schema
├── scripts/                       # 自动化构建与代码质检管线 (Zero-dependency)
│   ├── qa-checker.js              # 质量门禁静态与安全检测
│   └── trgs-build.js              # 任务流水线构建执行器
└── benchmark-comparison/          # 演进前后质感对比基准样本
    ├── before/                    # 演进前自由生成形态
    └── after/                     # 演进后状态机积木形态
```

---

## 🤝 贡献与生态

欢迎提交 Issue 与 Pull Request！如果你沉淀了针对特定学科（如微积分、天体物理、乐理）的优秀状态机积木，欢迎向我们贡献。

* **技能主页**: [https://skillhub.cn/skills/user_f823e2d9/interactive-deck-engine](https://skillhub.cn/skills/user_f823e2d9/interactive-deck-engine)
* **开源许可**: [MIT License](LICENSE)
