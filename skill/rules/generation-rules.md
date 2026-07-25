# 生成规则（Generation Rules）

本文件定义 TRGS 全部生成器（PPT Generator、Interactive Generator）必须遵守的技术约束、复杂度控制与降级策略。Quality Checker 依据本文件判定资源是否合规。

---

## 技术约束

### 禁止使用的 API / 资源

- 外部资源引用（CDN、外部字体、外部图片 URL）
- eval()（code-playground 沙箱除外）
- alert() / confirm() / prompt()
- fetch() / XMLHttpRequest / 任何网络请求
- localStorage / sessionStorage
- Web Worker
- 任何框架（React / Vue / D3 / jQuery 等）

### 允许使用的 API

- Canvas 2D API
- SVG 创建和操作（document.createElementNS）
- CSS Animation / Transition
- requestAnimationFrame
- DOM 事件（click, mousemove, touchstart, touchend, keydown）
- Math 对象
- JSON.parse / JSON.stringify
- CSS Grid / Flexbox
- CSS Custom Properties
- IntersectionObserver

### 文件约束

- 单文件 HTML，所有 CSS / JS 内联
- Interactive < 200KB
- PPT < 500KB
- 编码 UTF-8
- 目标浏览器：Chrome 90+、Safari 15+、Firefox 90+

---

## 复杂度控制

### Low Complexity

- 纯 DOM 操作 + CSS Animation + 简单事件
- 代码量 < 300 行
- 适用：comparison-table、timeline、diagram、mind-map

### Medium Complexity

- SVG 动态创建 + requestAnimationFrame + 状态机
- 代码量 300–600 行
- 适用：animation、flowchart、svg-visualization

### High Complexity

- Canvas 2D + 物理 / 数学模拟 + 多步交互
- 代码量 600–1000 行
- 适用：simulator、canvas-demo、3d-model、code-playground

### 硬性上限

- 任何情况不超过 1500 行
- 超过必须简化或拆分

---

## 降级策略

### 自修复流程

```
首次生成 → QA 检查
  ↓ FAIL
收集错误 → 修复 Prompt → 重新生成（第 1 次修复）
  ↓ 仍 FAIL
再次修复（第 2 次修复）
  ↓ 仍 FAIL
降级到 alternativeForms[0] → 从 Phase 2 重新开始
  ↓ 仍 FAIL
标记 generation_failed → 回退到纯 Slide 形式
```

1. 首次生成 → QA 检查
2. FAIL → 收集错误 → 修复 Prompt → 重新生成（第 1 次修复）
3. 仍 FAIL → 再次修复（第 2 次修复）
4. 仍 FAIL → 降级到 alternativeForms[0] → 从 Phase 2 重新开始
5. 降级后仍 FAIL → 标记 generation_failed → 回退到纯 Slide 形式

### 复杂度降级

- high complexity 连续 2 次 QA FAIL → 自动降为 medium complexity 重新生成
- medium 仍失败 → 降为 low
- low 仍失败 → 回退 Slide

### 回退 Slide 规则

- 生成 2–3 页静态 Slide 替代交互组件
- 包含：标题页 + 核心内容页（用文字和静态图描述）
- 在 Slide 中标注"（原计划为交互组件，因生成限制改为静态展示）"
