# SPEC ② Teaching Strategy Engine

## 定位

Teaching Strategy Engine 是 TRGS 的"教学大脑"。

它的唯一职责是：**给定一个知识点，决定它最适合什么教学形式。**

```
KnowledgePoint
       ↓
[Teaching Strategy Engine]
       ↓
strategy: {
  primaryForm: "animation",
  reasoning: "...",
  alternativeForms: ["diagram", "simulator"]
}
```

这不是一个规则引擎（if-else），而是一个**由 AI 执行的决策过程**，但决策的框架和约束由本 SPEC 定义。

## 核心问题

同一个课程中，不同知识点需要完全不同的教学方式：

| 知识点 | 最佳形式 | 原因 |
|--------|----------|------|
| TCP 三次握手 | 时序动画 | 双方交互、有严格时序 |
| 快速排序 | 可拖动动画 | 需要看元素移动过程 |
| React Fiber | 树状可视化 | 核心是树结构和遍历 |
| HTTP 状态码 | 对比表格 | 分类记忆型知识 |
| 设计模式 | 代码演示 | 需要看代码结构 |
| 地球公转 | 3D 模型 | 三维空间运动 |
| 排序算法对比 | 参数模拟器 | 需要调参观察差异 |
| 历史事件 | 时间轴 | 线性时间序列 |

## 决策输入

Strategy Engine 接收以下信息作为决策依据：

```typescript
interface StrategyInput {
  title: string;
  description: string;
  knowledgeType: KnowledgeType;
  cognitiveLevel: CognitiveLevel;
  keyPoints: string[];
  difficultPoints: string[];
  teachingObjectives: string[];
  context?: {
    subject: string;
    targetAudience: string;
    precedingPoints: string[];
  };
}

type KnowledgeType =
  | "concept"
  | "process"
  | "principle"
  | "procedure"
  | "relationship"
  | "fact";

type CognitiveLevel =
  | "remember"
  | "understand"
  | "apply"
  | "analyze"
  | "evaluate"
  | "create";
```

## 决策输出

```typescript
interface StrategyOutput {
  primaryForm: ResourceForm;
  reasoning: string;
  alternativeForms: ResourceForm[];
  interactionPattern: InteractionPattern;
  complexityEstimate: "low" | "medium" | "high";
}

type ResourceForm =
  | "slide"
  | "diagram"
  | "timeline"
  | "animation"
  | "flowchart"
  | "simulator"
  | "canvas-demo"
  | "svg-visualization"
  | "3d-model"
  | "code-playground"
  | "comparison-table"
  | "mind-map";

type InteractionPattern =
  | "passive"
  | "step-through"
  | "drag-and-drop"
  | "parameter-control"
  | "free-explore"
  | "quiz-embedded";
```

## 决策框架：三维评估模型

Strategy Engine 从三个维度评估每个 ResourceForm 的适配度：

### 维度 1：知识特征匹配（Knowledge-Form Fit）

| KnowledgeType | 高适配 Form | 低适配 Form |
|---------------|-------------|-------------|
| concept | diagram, mind-map, svg-visualization | timeline, simulator |
| process | animation, flowchart, timeline | comparison-table |
| principle | simulator, canvas-demo, animation | mind-map |
| procedure | flowchart, step-through animation, code-playground | 3d-model |
| relationship | diagram, svg-visualization, mind-map | timeline |
| fact | comparison-table, slide, timeline | simulator, canvas-demo |

### 维度 2：认知层次匹配（Cognitive-Form Fit）

| CognitiveLevel | 推荐 Form | 推荐 InteractionPattern |
|----------------|-----------|------------------------|
| remember | slide, comparison-table, mind-map | passive |
| understand | diagram, animation, timeline | step-through |
| apply | simulator, code-playground, canvas-demo | parameter-control |
| analyze | simulator, svg-visualization | free-explore |
| evaluate | comparison-table + simulator | parameter-control |
| create | code-playground, canvas-demo | free-explore |

### 维度 3：教学难点驱动（Difficulty-Driven Override）

当 difficultPoints 包含以下特征时，触发形式升级：

| 难点特征 | 升级方向 |
|----------|----------|
| "时序"、"先后"、"步骤" | → animation / timeline |
| "空间"、"三维"、"结构" | → 3d-model / svg-visualization |
| "参数"、"变量"、"影响" | → simulator |
| "对比"、"区别"、"选择" | → comparison-table |
| "抽象"、"不可见" | → animation / canvas-demo |
| "操作"、"实现"、"编码" | → code-playground |

## 决策流程

```
1. 解析 KnowledgePoint 的 knowledgeType 和 cognitiveLevel
2. 查询 Knowledge-Form Fit 表 → 得到候选集 A
3. 查询 Cognitive-Form Fit 表 → 得到候选集 B
4. 取 A ∩ B 作为强候选集
5. 扫描 difficultPoints 关键词 → 触发 Override 规则
6. 评估每个候选的 complexityEstimate
7. 选择 primaryForm（最高适配 + 合理复杂度）
8. 生成 reasoning（解释为什么选这个）
9. 列出 alternativeForms（次优选择）
10. 确定 interactionPattern
```

## 决策约束

1. **复杂度预算**：单节课中 high complexity 的 interactive 不超过 2 个
2. **形式多样性**：连续 3 个知识点不应使用相同 primaryForm
3. **渐进原则**：同一章节内，形式复杂度应随 cognitiveLevel 递增
4. **降级兜底**：如果最佳形式超出复杂度预算，降级到 alternativeForms 中的下一个

## 完整决策示例

### 示例 1：快速排序

输入：
```json
{
  "title": "快速排序",
  "knowledgeType": "procedure",
  "cognitiveLevel": "apply",
  "keyPoints": ["分区操作", "递归结构", "基准选择"],
  "difficultPoints": ["分区过程中指针移动的时序", "最坏情况的触发条件"]
}
```

决策过程：
- Knowledge-Form Fit (procedure) → flowchart, animation, code-playground
- Cognitive-Form Fit (apply) → simulator, code-playground, canvas-demo
- 交集 → code-playground
- Override: "时序" → animation 升级
- 最终：primaryForm = "animation"（可拖动的分区动画）

输出：
```json
{
  "primaryForm": "animation",
  "reasoning": "快速排序的核心难点在于分区过程中元素的移动时序，学生需要看到指针如何移动、元素如何交换。可拖动的动画让学生能逐步观察分区过程，比静态流程图更能建立直觉。",
  "alternativeForms": ["simulator", "code-playground"],
  "interactionPattern": "drag-and-drop",
  "complexityEstimate": "medium"
}
```

### 示例 2：HTTP 状态码分类

输入：
```json
{
  "title": "HTTP 状态码",
  "knowledgeType": "fact",
  "cognitiveLevel": "remember",
  "keyPoints": ["五大类状态码", "常见状态码含义"],
  "difficultPoints": ["301 vs 302 的区别", "401 vs 403 的区别"]
}
```

决策过程：
- Knowledge-Form Fit (fact) → comparison-table, slide, timeline
- Cognitive-Form Fit (remember) → slide, comparison-table, mind-map
- 交集 → comparison-table, slide
- Override: "对比"、"区别" → comparison-table 强化
- 最终：primaryForm = "comparison-table"

输出：
```json
{
  "primaryForm": "comparison-table",
  "reasoning": "HTTP 状态码是分类记忆型知识，核心难点在于相似状态码的区分（301/302、401/403）。对比表格能让学生一目了然地看到差异，比纯文字 Slide 更高效。",
  "alternativeForms": ["slide", "mind-map"],
  "interactionPattern": "passive",
  "complexityEstimate": "low"
}
```

### 示例 3：React Fiber 架构

输入：
```json
{
  "title": "React Fiber 架构",
  "knowledgeType": "concept",
  "cognitiveLevel": "understand",
  "keyPoints": ["Fiber 节点结构", "链表遍历", "时间切片"],
  "difficultPoints": ["为什么用链表替代递归", "可中断渲染的实现原理"]
}
```

决策过程：
- Knowledge-Form Fit (concept) → diagram, mind-map, svg-visualization
- Cognitive-Form Fit (understand) → diagram, animation, timeline
- 交集 → diagram
- Override: "结构" → svg-visualization 升级
- 最终：primaryForm = "svg-visualization"（可交互的树状结构图）

输出：
```json
{
  "primaryForm": "svg-visualization",
  "reasoning": "Fiber 的核心是树状数据结构和链表遍历，学生需要看到节点之间的 child/sibling/return 指针关系。可交互的 SVG 树状图让学生能点击节点查看指针指向，比静态图更直观。",
  "alternativeForms": ["animation", "diagram"],
  "interactionPattern": "free-explore",
  "complexityEstimate": "high"
}
```

## 与 Blueprint 的集成

Strategy Engine 在 Blueprint Builder 的第 3 步被调用：

```
Blueprint Builder:
  1. 解析大纲结构
  2. 分析知识点属性 (knowledgeType, cognitiveLevel)
  3. → 调用 Strategy Engine → 填充 strategy 字段
  4. 根据 strategy 生成 ResourceRef 列表
  5. 校验整体一致性
```

Strategy Engine 的输出直接写入 KnowledgePoint.strategy 字段。
