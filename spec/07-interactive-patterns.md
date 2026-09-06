# SPEC ⑦ Interactive Pattern Matrix & Pedagogical Extensions

## 1. 架构定位与设计目标

在 TRGS 系统中，`spec/04-interactive-generator.md` 确立了单文件纯原生 HTML5/JS 交互课件的基石规范。随着教学场景纵深演进，本规范（`07-interactive-patterns.md`）作为方案 2 深度扩展，**将交互模式从基础模型扩充为完整的六维教学法交互矩阵**。

所有交互模式均严格遵循 **零外部 CDN / 库依赖、单文件内联、强语义状态驱动、教学反馈即时可触达** 的工业级标准。

---

## 2. 交互模式六维矩阵定义

```typescript
type InteractionPattern =
  | "step-through"          // ① 步进引导型：按序推导/状态机流转 (原支持)
  | "parameter-control"     // ② 参数探索型：多变量实时联动与沙箱实验 (新增增强)
  | "quiz-embedded"         // ③ 即时诊断测评型：形成性评价与认知误区靶向反馈 (新增增强)
  | "dual-view-diff"        // ④ 双视角对比型：并行算法对比/协议流对照 (新增增强)
  | "drag-and-drop"         // ⑤ 拖拽归类/连线装配型 (原有扩充)
  | "free-explore";         // ⑥ 自由沙盒探索型 (原有扩充)
```

### 模式矩阵与认知目标映射表

| 交互模式 | 适用知识类型 | 认知层级 (Bloom) | 核心 UI 结构与交互机制 | 教学反馈闭环 |
| :--- | :--- | :--- | :--- | :--- |
| **step-through**<br>步进引导型 | 算法推导、网络握手、生命周期 | Understand / Apply | 进度步进条、上一帧/下一帧、当前解释气泡、时序图高亮 | 步骤解释 + 变量状态表同步变动 |
| **parameter-control**<br>参数探索型 | 物理/几何公式、吞吐量/拥塞控制、超参数调优 | Analyze / Evaluate | 动态多滑块（Range Slider）、输入框、实时数据曲线/画布（Canvas/SVG）、重置预设 | 实时推演参数敏感度，直观呈现临界值与拐点 |
| **quiz-embedded**<br>即时诊断测评型 | 概念辨析、易混淆陷阱、典型错题诊断 | Evaluate / Apply | 题干卡片、选项点击/拖拽分类、提交校验按钮、深度答疑解析面板 | 错误选项提供针对性认知根因归因解析 |
| **dual-view-diff**<br>双视角对比型 | 空间与时间换取对比、不同协议效率对比、树/图遍历策略 | Analyze / Evaluate | 分屏双栏（Dual Pane）、双轴同步步进器、指标对比卡片（步数、内存、耗时） | 差异部分逐位/逐行对比高亮 |

---

## 3. 三大核心扩展模式详细规范与组件契约

### 模式 A：参数探索型 (parameter-control / Exploratory Sandbox)

#### 3.1 状态驱动模型
```javascript
const SandboxEngine = {
  params: {
    windowSize: 16,
    packetLossRate: 0.05,
    rttMs: 100
  },
  derivedState: {
    effectiveBandwidth: 0,
    retransmissionCount: 0
  },
  presets: [
    { name: "高延迟卫星信道", values: { windowSize: 32, packetLossRate: 0.08, rttMs: 600 } },
    { name: "低损局域网", values: { windowSize: 64, packetLossRate: 0.001, rttMs: 2 } }
  ],
  compute() { /* 纯函数状态派生 */ },
  render() { /* 绘制 DOM / Canvas */ }
};
```

#### 3.2 必须包含的 UI 要素
1. **参数控制板（Control Panel）**：支持 `<input type="range">` 与数字显示，带步长 `step`、范围 `min/max` 与默认值。
2. **预设情境选择器（Preset Bar）**：提供至少 2 个极端典型案例（如“极限边界”、“理想状态”），一键载入参数。
3. **动态状态指示与可视化舞台（Simulation Stage）**：图形/数值随滑块拖动产生实时视觉反馈（`requestAnimationFrame` 防抖渲染）。

---

### 模式 B：即时诊断测评型 (quiz-embedded / Diagnostic Assessment)

#### 3.1 测评数据 Schema
```typescript
interface DiagnosticQuiz {
  id: string;
  type: "single-choice" | "multiple-choice" | "sort-sequence";
  stem: string;
  options: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
    misconceptionDiagnosis?: string; // 针对典型错误的归因分析
  }>;
  explanation: {
    coreConcept: string;
    detailedAnalysis: string;
    relatedKnowledgePoint: string;
  };
}
```

#### 3.2 交互行为规范
1. **未提交状态**：选项选中态高亮，支持修改，禁用“下一题”或展示“提交诊断”按钮。
2. **提交即时判分**：
   - 正确选项标注绿色边框与 `✓` 徽章。
   - 若用户选错，选中项呈现警示红，并弹出针对该错误认知的专门反思解析（如：“你可能混淆了 SYN 标志与 ACK 标志的作用”）。
3. **解释折叠区（Pedagogical Deep-dive）**：展开完整知识点链路，给出推导路径。

---

### 模式 C：双视角对比型 (dual-view-diff / Comparative Matrix)

#### 3.1 结构规范
- 左右（或上下）双面板并列，分别呈现方案 A（例如“递归调用”）与方案 B（例如“动态规划”）。
- **统一时钟/步进控制器（Unified Clock/Stepper）**：点击“下一步”时，两侧视图同步演算对应阶段状态。
- **动态性能/开销比对指示器**：实时统计各方时间复杂度开销计数器、内存占用单元格，形成直观对比差异。

---

## 4. PPT 演示端联动与离线代码高亮规范

为了强化教与学的闭环，PPT 课件与交互资源形成无缝协同：

1. **零依赖离线代码高亮器 (Lightweight Offline Syntax Highlighter)**：
   - 不引入 Prism.js 或 Highlight.js 等体积庞大的 CDN 库。
   - PPT 模版内建纯原生微型分词器（基于正则捕获字符串、关键字、注释、数字、函数），在客户端运行期直接对 `<pre><code>` 完成安全的高亮染色。
2. **内嵌交互浮层与一键全屏弹窗 (Interactive Embed Modal)**：
   - 在 PPT 相关内容页预留“进入互动演练”按钮；
   - 点击可唤起轻量 Iframe 浮层或全屏展开交互实验，无需脱离授课主线流程。
