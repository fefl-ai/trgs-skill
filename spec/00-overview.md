# TRGS — Teaching Resource Generation Skill

## 总体架构概览

### 一句话定义

TRGS 是一个 AI Skill，输入教学大纲，输出网页版 PPT + 交互式教学网页。

### 核心流程

```
教学大纲 (1份或多份)
       ↓
┌─────────────────────────────────────────┐
│         Blueprint Builder               │
│  (解析 → 分析 → 策略决策 → 资源规划)      │
└─────────────────────────────────────────┘
       ↓
Teaching Blueprint (JSON)
       ↓
┌──────────────┬──────────────────┐
│              │                  │
↓              ↓                  ↓
PPT Gen    Interactive Gen    (未来扩展)
│              │
↓              ↓
┌─────────────────────────────────────────┐
│         Quality Checker                 │
│  (Technical → Functional → Pedagogical) │
└─────────────────────────────────────────┘
       ↓
交付：HTML PPT + Interactive HTML
```

### 三大设计原则

1. **Blueprint First**：所有生成器只读取 Blueprint，不直接读取原始大纲
2. **Teaching Strategy Engine**：AI 先决定"怎么教"，再决定"生成什么"
3. **Resource Based**：统一抽象为 Teaching Resources，新增资源只需新增 Generator

### V1 范围

| 包含 | 不包含（未来扩展） |
|------|-------------------|
| Teaching Blueprint Schema | Quiz Generator |
| Teaching Strategy Engine | Homework Generator |
| Web PPT Generator | Teacher Notes Generator |
| Interactive Generator | Animation Generator |
| Quality Checker | 板书 Generator |
| | 多语言支持 |
| | TTS / 语音 |

### SPEC 文档索引

| 编号 | 文档 | 职责 |
|------|------|------|
| ① | [01-blueprint-schema.md](./01-blueprint-schema.md) | 定义唯一数据源的结构 |
| ② | [02-strategy-engine.md](./02-strategy-engine.md) | 定义教学形式决策框架 |
| ③ | [03-ppt-generator.md](./03-ppt-generator.md) | 定义 HTML PPT 的生成规范 |
| ④ | [04-interactive-generator.md](./04-interactive-generator.md) | 定义交互网页的生成机制 |
| ⑤ | [05-quality-checker.md](./05-quality-checker.md) | 定义生成后的质量保障 |

### 技术形态

TRGS 是一个 **Skill**，不是一个 Web 应用。

- 不需要部署服务器
- 不需要数据库
- 不需要前端框架
- 交付物是 Prompt + Workflow + Schema + Rules + Examples
- 运行在 AI Agent 环境中（如 TRAE Skill / OpenClaw）

### 与 OpenMAIC 的关系

学习其能力，不复制其代码：

| 学习 | 不复制 |
|------|--------|
| 两阶段分离（规划 vs 生成） | LangGraph 编排 |
| 类型驱动的场景分发 | 多 Agent 实时协同 |
| 沙箱自修复循环 | TTS / 白板 / 语音 |
| 教学法理论对齐 | 具体 Prompt 文本 |
| 结构化输出约束 | 代码实现 |

### 下一步

SPEC 设计完成后，进入 Skill 实现阶段：
1. 编写 Blueprint Builder Prompt
2. 编写 Strategy Engine Prompt
3. 编写 PPT Generator Prompt + Template
4. 编写 Interactive Generator Prompt + Template
5. 编写 Quality Checker Prompt + Rules
6. 编写 Workflow 编排（Skill 主流程）
7. 准备 Examples（至少 3 个不同学科的完整示例）
