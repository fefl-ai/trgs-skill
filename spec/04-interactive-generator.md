# SPEC ④ Interactive Generator

## 定位

Interactive Generator 是 TRGS 最核心的生成器。

它将 Blueprint 中 `type: "interactive"` 的 ResourceRef 转化为**可交互的教学网页**。

```
Blueprint (ResourceRef where type="interactive")
       ↓
[Interactive Generator]
       ↓
单个 HTML 文件（内联 CSS + JS，真正可交互）
```

## 与"让 AI 生成 HTML"的本质区别

| | Claude Artifact 思路 | TRGS Interactive Generator |
|---|---|---|
| 输入 | "帮我生成一个 XXX 的 HTML" | Blueprint 中的结构化教学决策 |
| 决策 | AI 自由发挥 | Strategy Engine 已决定形式和交互模式 |
| 目标 | 看起来像那么回事 | 真正服务于教学目标 |
| 质量 | 一次性生成 | 生成 → 校验 → 自修复 → 再校验 |
| 约束 | 无 | 严格的 Schema、复杂度预算、交互模式 |

## 生成流程（四阶段）

```
Phase 1: Spec Assembly（规格组装）
Phase 2: Code Generation（代码生成）
Phase 3: Validation（校验）
Phase 4: Self-Repair（自修复，条件触发）
```

---

## Phase 1: Spec Assembly

从 Blueprint 提取生成所需的全部信息，组装为 Generation Spec：

```typescript
interface GenerationSpec {
  resource: ResourceRef;
  knowledgePoint: KnowledgePoint;
  strategy: StrategyOutput;
  constraints: GenerationConstraints;
}

interface GenerationConstraints {
  maxFileSize: "200KB";
  noExternalDependencies: true;
  supportedAPIs: string[];
  targetBrowsers: ["Chrome 90+", "Safari 15+", "Firefox 90+"];
  interactionPattern: InteractionPattern;
  complexityBudget: "low" | "medium" | "high";
  mustBeInteractive: true;
  accessibilityLevel: "AA";
}
```

### 从 Strategy 到交互规格的映射

| InteractionPattern | 必须包含的交互元素 |
|---|---|
| passive | 无（纯展示，但仍有 hover 效果） |
| step-through | 上一步/下一步按钮、步骤指示器、状态变化 |
| drag-and-drop | 可拖动元素、放置区域、正确/错误反馈 |
| parameter-control | 滑块/输入框、实时响应、数值显示 |
| free-explore | 点击/悬停探索、信息面板、无固定路径 |
| quiz-embedded | 问题、选项、提交、判分、解释 |

---

## Phase 2: Code Generation

### 生成 Prompt 结构

AI 收到的生成指令包含以下层次：

```
[Layer 1: 角色与目标]
你是一个教学交互组件开发者。你的任务是生成一个服务于特定教学目标的交互网页。

[Layer 2: 教学上下文]
- 知识点：{knowledgePoint.title}
- 教学目标：{knowledgePoint.teachingObjectives}
- 重点：{knowledgePoint.keyPoints}
- 难点：{knowledgePoint.difficultPoints}
- 认知层次：{knowledgePoint.cognitiveLevel}

[Layer 3: 形式与交互约束]
- 形式：{strategy.primaryForm}
- 交互模式：{strategy.interactionPattern}
- 复杂度：{strategy.complexityEstimate}
- 视觉元素：{resource.spec.visualElements}
- 数据需求：{resource.spec.dataRequirements}

[Layer 4: 技术约束]
- 单文件 HTML，内联所有 CSS 和 JS
- 不使用任何外部库/CDN
- 可使用：Canvas API, SVG, CSS Animation, requestAnimationFrame
- 文件大小 < 200KB
- 必须有真正的用户交互（不是纯动画）

[Layer 5: 质量标准]
- 交互必须服务于教学目标（不是为了炫技）
- 学生通过操作能理解 {keyPoints}
- 操作后有明确的视觉反馈
- 有重置按钮可以回到初始状态
```

### 输出 HTML 结构规范

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{resource.title}</title>
  <style>
    /* === Reset === */
    /* === Layout === */
    /* === Components === */
    /* === Animation === */
    /* === Responsive === */
  </style>
</head>
<body>
  <!-- 标题区 -->
  <header class="interactive-header">
    <h1>{title}</h1>
    <p class="objective">{teachingObjective 的一句话概括}</p>
  </header>

  <!-- 主交互区 -->
  <main class="interactive-stage">
    <!-- 根据 form 不同，这里是 Canvas / SVG / DOM 元素 -->
  </main>

  <!-- 控制面板 -->
  <aside class="control-panel">
    <!-- 按钮、滑块、步骤指示器等 -->
  </aside>

  <!-- 信息/反馈区 -->
  <footer class="info-panel">
    <!-- 当前状态说明、提示文字 -->
  </footer>

  <script>
    // === State Management ===
    // === Rendering ===
    // === Interaction Handlers ===
    // === Animation Loop ===
    // === Initialization ===
  </script>
</body>
</html>
```

### 各 Form 的技术实现指南

| Form | 推荐技术 | 典型交互 |
|------|----------|----------|
| animation | SVG + CSS Animation / requestAnimationFrame | 播放/暂停/步进 |
| simulator | Canvas + 数学计算 | 参数滑块 + 实时重绘 |
| canvas-demo | Canvas 2D API | 绘制/拖拽/变换 |
| svg-visualization | SVG DOM 操作 | 点击/悬停/展开 |
| 3d-model | CSS 3D Transform（不用 Three.js） | 旋转/缩放/剖面 |
| flowchart | SVG + 状态机 | 点击节点/高亮路径 |
| timeline | DOM + CSS Animation | 滚动/点击时间点 |
| code-playground | textarea + eval（沙箱化） | 编辑/运行/查看输出 |
| comparison-table | DOM + CSS Grid | 排序/筛选/高亮 |
| mind-map | SVG + 力导向布局 | 展开/折叠/拖拽 |
| diagram | SVG | 悬停显示详情 |

### 禁止事项

1. ❌ 不引用任何外部资源（CDN、字体、图片 URL）
2. ❌ 不使用 eval() 执行用户输入（code-playground 除外，且需沙箱）
3. ❌ 不使用 alert() / confirm() / prompt()
4. ❌ 不发起任何网络请求
5. ❌ 不使用 localStorage / sessionStorage
6. ❌ 不使用 Web Worker（保持单线程简单性）
7. ❌ 不使用任何框架（React/Vue/D3 等）

### 允许事项

1. ✅ Canvas 2D API
2. ✅ SVG 创建和操作
3. ✅ CSS Animation / Transition
4. ✅ requestAnimationFrame
5. ✅ DOM 事件（click, mousemove, touch, keyboard）
6. ✅ Math 对象
7. ✅ JSON 解析
8. ✅ CSS Grid / Flexbox
9. ✅ CSS Custom Properties (变量)
10. ✅ IntersectionObserver（用于滚动触发）

---

## Phase 3: Validation（校验）

生成后立即执行校验。校验分为两层：

### Layer 1: 静态校验（无需运行）

| 检查项 | 规则 | 严重度 |
|--------|------|--------|
| HTML 结构完整 | 有 DOCTYPE, html, head, body | ERROR |
| 无外部引用 | 不含 http:// 或 https:// 的 src/href | ERROR |
| 无禁止 API | 不含 alert/confirm/prompt/fetch/XMLHttpRequest | ERROR |
| 文件大小 | < 200KB | WARNING |
| 有交互元素 | 包含 addEventListener 或 onclick | ERROR |
| 有重置功能 | 包含"重置"/"reset"相关逻辑 | WARNING |
| 标题存在 | h1 标签非空 | WARNING |

### Layer 2: 语义校验（AI 自检）

AI 审视生成的代码，回答以下问题：

1. **教学目标对齐**：学生通过这个交互能理解 {keyPoints} 吗？
2. **交互有效性**：交互操作是否真的帮助理解，还是只是装饰？
3. **难点覆盖**：{difficultPoints} 是否通过交互得到了化解？
4. **认知负荷**：界面是否过于复杂，分散了注意力？
5. **反馈清晰度**：操作后学生能否立即看到结果？

如果任何一项回答为"否"，触发 Phase 4。

---

## Phase 4: Self-Repair（自修复）

### 触发条件

- Phase 3 静态校验发现 ERROR
- Phase 3 语义校验任何一项不通过

### 修复流程

```
1. 收集错误信息：
   - 静态校验：具体哪条规则违反
   - 语义校验：哪个问题回答为"否"，为什么

2. 构造修复 Prompt：
   "你之前生成的交互组件存在以下问题：
    {error_description}
    
    原始教学目标：{objectives}
    原始交互模式：{interactionPattern}
    
    请修复上述问题，保持其他部分不变。"

3. 重新生成（最多 2 次）

4. 再次校验

5. 如果 2 次修复后仍不通过：
   - 降级到 alternativeForms 中的下一个
   - 重新从 Phase 2 开始
```

### 修复次数限制

- 单个 ResourceRef 最多修复 2 次
- 降级最多 1 次
- 如果降级后仍失败，标记为 `generation_failed`，回退到纯 Slide 形式

---

## 复杂度控制

### Low Complexity
- 纯 DOM 操作
- CSS Animation
- 简单事件处理
- 预计代码量：< 300 行

### Medium Complexity
- SVG 动态创建
- requestAnimationFrame 动画循环
- 状态机管理
- 预计代码量：300-600 行

### High Complexity
- Canvas 2D 渲染
- 物理/数学模拟
- 多步交互流程
- 预计代码量：600-1000 行

### 硬性上限
- 任何情况下不超过 1500 行
- 超过则必须简化或拆分

---

## 完整示例：TCP 三次握手动画

### 输入（从 Blueprint）

```json
{
  "form": "animation",
  "interactionPattern": "step-through",
  "visualElements": ["client-node", "server-node", "message-arrows", "state-labels"],
  "dataRequirements": ["SYN/ACK flags", "sequence numbers", "connection states"]
}
```

### 期望输出特征

- 左右两个节点：Client / Server
- 中间区域：消息箭头动画（SYN →, ← SYN+ACK, ACK →）
- 每步显示：标志位、序列号、当前连接状态
- 控制：上一步 / 下一步 / 自动播放 / 重置
- 状态标签：CLOSED → SYN_SENT → SYN_RECEIVED → ESTABLISHED
- 额外：悬停箭头显示详细说明

### 交互流程

```
初始状态：Client=CLOSED, Server=LISTEN
  ↓ [点击"下一步"]
Step 1：SYN 箭头从 Client 飞向 Server
        Client 状态变为 SYN_SENT
        显示：seq=x, SYN=1
  ↓ [点击"下一步"]
Step 2：SYN+ACK 箭头从 Server 飞向 Client
        Server 状态变为 SYN_RECEIVED
        显示：seq=y, ack=x+1, SYN=1, ACK=1
  ↓ [点击"下一步"]
Step 3：ACK 箭头从 Client 飞向 Server
        双方状态变为 ESTABLISHED
        显示：seq=x+1, ack=y+1, ACK=1
  ↓
完成状态：显示"连接建立"，可重置
```
