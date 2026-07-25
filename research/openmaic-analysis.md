# OpenMAIC 核心能力研究笔记

## 项目概况

- 全称：Open Multi-Agent Interactive Classroom
- 来源：清华大学 MAIC 实验室
- 仓库：github.com/THU-MAIC/OpenMAIC
- 论文：《From MOOC to MAIC》(JCST)
- 技术栈：Next.js 16 + TypeScript + LangGraph + Zustand + Tailwind CSS
- 许可：MIT (2026-06 从 AGPL-3.0 转换)

## 核心架构：两阶段生成流 (Two-Stage Generation Flow)

### Stage 1: Outline Generation（战略规划）

职责：将模糊输入转化为结构化教学大纲

流程：
1. 输入解析与 RAG 增强（多模态内容提取）
2. 教学法对齐（Bloom's Taxonomy / UDL）
3. 结构化 Outline 输出（JSON 数组）

输出：Scene Item 列表，每项包含明确类型：
- slides：概念讲解课件
- quiz：随堂测验
- interactive：HTML 动态仿真实验
- pbl：项目制交互任务

关键设计：
- 使用 Pydantic 严格定义输出结构
- 强制模型输出结构化 Scene 列表
- 引入教育学理论指导（布鲁姆认知层次、ZPD 最近发展区）

### Stage 2: Scenes Expansion（战术展开）

职责：根据 Scene 类型分发给专用 Agent 组并发生成

核心思想："分而治之，类型驱动"

每个 Scene Item 演变为独立子图或并行分支。

## 四种场景类型的生成机制

### A. Slides 场景
- 协同 Agent：AI 讲师 + 白板视觉 Agent
- 生成资产：语音旁白文本、白板绘制路径（SVG）、激光笔/高亮动画时间轴
- 技术：Token 级个性化控制，适配 TTS 引擎

### B. Quiz 场景
- 协同 Agent：命题专家 + 评卷器
- 生成资产：单选/多选/简答 JSON + AI 判分规则 + 反馈话术

### C. Interactive 场景（核心亮点）
- 协同 Agent：GenUI 开发者 Agent + 前端沙箱校验 Agent
- 生成资产：纯前端 HTML/CSS/JS 仿真交互组件（无外部依赖）
- 自修复机制：沙箱校验 Agent 捕捉 Error → 作为 Feedback 喂回开发者 Agent → LangGraph 内部局部循环自愈（Self-Correction Loop）→ 直到编译通过

### D. PBL 场景
- 协同 Agent：项目导师 + AI 虚拟同学
- 生成资产：多角色辩论、情境对话脚本、结构化任务书

## 技术优势

1. 规避长文本"记忆漂移"：第一阶段解耦为原子化场景包，第二阶段并行独立处理
2. 断点续传：LangGraph Checkpointer 支持失败恢复
3. 人机协同：大纲生成后可暂停，等待人类教师修改确认

## 项目结构（关键目录）

```
lib/
├── generation/      # 两阶段课程生成 Pipeline
├── orchestration/   # LangGraph 多智能体编排
├── playback/        # 播放状态机
├── action/          # 动作执行引擎（28+ 动作类型）
├── ai/              # LLM Provider 抽象
├── store/           # Zustand 状态存储
└── types/           # TypeScript 类型定义

components/
├── slide-renderer/  # Canvas 幻灯片渲染器
├── scene-renderers/ # 测验、互动、PBL 渲染器
└── whiteboard/      # SVG 白板绘图

skills/openmaic/     # OpenClaw 技能配置
packages/            # 工作区包（pptxgenjs、mathml2omml）
```

## 对我们 TRGS Skill 的启示

### 要学习的能力：
1. 两阶段分离思想（规划 vs 生成）→ 我们的 Blueprint First
2. 类型驱动的场景分发 → 我们的 Teaching Strategy Engine
3. Interactive 的自修复循环 → 我们的 Quality Checker
4. 教学法理论对齐 → 我们的 Blueprint 中的教学目标层

### 我们不复制的：
1. 不用 LangGraph（我们是 Skill，不是独立服务）
2. 不用多 Agent 实时协同（我们是单次生成流）
3. 不做 TTS/语音/白板动画（V1 不需要）
4. 不做 PBL/Quiz（V1 只做 PPT + Interactive）
5. 不复制其 Prompt 和代码结构

### 我们的差异化：
1. Blueprint 作为唯一数据源（OpenMAIC 的 Outline 只是中间产物）
2. Strategy Engine 显式决策（OpenMAIC 隐式在 Prompt 中）
3. Resource Based 可扩展架构（OpenMAIC 是固定四种场景）
4. 纯 Skill 形态，无需部署服务
