# SPEC ⑤ Quality Checker (QA)

## 定位

Quality Checker 是 TRGS 的最后一道关卡。

**所有生成的资源（PPT / Interactive）在交付前必须通过 QA。**

```
Generated Resource
       ↓
[Quality Checker]
       ↓
  PASS → 交付
  FAIL → 回退到 Generator 的 Self-Repair
```

## 设计原则

1. **自动化**：QA 不依赖人工判断，全部由 AI + 规则自动完成
2. **分层**：技术层 → 功能层 → 教学层，逐层递进
3. **可量化**：每项检查有明确的 PASS/FAIL 标准
4. **快速失败**：技术层不通过则不进入功能层检查

## 三层检查模型

```
Layer 1: Technical QA（技术可用性）
    ↓ PASS
Layer 2: Functional QA（功能完整性）
    ↓ PASS
Layer 3: Pedagogical QA（教学有效性）
    ↓ PASS
交付
```

---

## Layer 1: Technical QA

目标：确保文件能正常运行，无技术错误。

### 1.1 HTML 结构检查

| # | 检查项 | PASS 标准 | 方法 |
|---|--------|-----------|------|
| T1 | DOCTYPE 声明 | 存在 `<!DOCTYPE html>` | 正则匹配 |
| T2 | 必要标签完整 | html, head, body, meta charset 均存在 | DOM 解析 |
| T3 | 无未闭合标签 | 标签配对完整 | DOM 解析 |
| T4 | 无外部资源引用 | 不含 `src="http` 或 `href="http` | 正则匹配 |
| T5 | 无禁止 API | 不含 alert/confirm/prompt/fetch/XHR | 正则匹配 |
| T6 | 编码正确 | UTF-8，无乱码 | 编码检测 |

### 1.2 JavaScript 检查

| # | 检查项 | PASS 标准 | 方法 |
|---|--------|-----------|------|
| T7 | 语法正确 | 无 SyntaxError | 静态分析 / eval 检测 |
| T8 | 无未定义变量 | 所有变量已声明 | 静态分析 |
| T9 | 无运行时崩溃 | 初始化代码不抛异常 | 沙箱执行 |
| T10 | 事件绑定有效 | addEventListener 的目标元素存在 | DOM 交叉检查 |

### 1.3 CSS 检查

| # | 检查项 | PASS 标准 | 方法 |
|---|--------|-----------|------|
| T11 | 无语法错误 | 所有规则可解析 | CSS 解析 |
| T12 | 无不可见内容 | 没有元素被意外 display:none 或 opacity:0 | 计算样式检查 |
| T13 | 布局不溢出 | 内容不超出视口 | 尺寸检查 |

### 1.4 性能检查

| # | 检查项 | PASS 标准 | 方法 |
|---|--------|-----------|------|
| T14 | 文件大小 | PPT < 500KB, Interactive < 200KB | 文件读取 |
| T15 | 无内存泄漏风险 | 无无限 setInterval 未清理 | 代码审查 |
| T16 | 无无限循环 | for/while 有明确终止条件 | 静态分析 |

---

## Layer 2: Functional QA

目标：确保交互功能真正可用。

### 2.1 交互存在性

| # | 检查项 | PASS 标准 | 方法 |
|---|--------|-----------|------|
| F1 | 有事件监听 | 至少 1 个用户交互事件绑定 | 代码搜索 |
| F2 | 有视觉反馈 | 交互后 DOM/Canvas/SVG 发生变化 | 逻辑分析 |
| F3 | 有重置功能 | 存在回到初始状态的路径 | 逻辑分析 |

### 2.2 交互模式匹配

根据 Blueprint 中声明的 interactionPattern 检查：

| Pattern | 必须存在 |
|---------|----------|
| step-through | 前进/后退按钮 + 步骤指示器 + 至少 3 步 |
| drag-and-drop | draggable 元素 + drop zone + 成功/失败反馈 |
| parameter-control | 至少 1 个滑块/输入 + 实时响应 + 数值显示 |
| free-explore | 至少 3 个可点击/悬停区域 + 信息展示 |
| quiz-embedded | 问题 + 选项 + 提交 + 判分 + 解释 |

### 2.3 状态完整性

| # | 检查项 | PASS 标准 |
|---|--------|-----------|
| F4 | 初始状态明确 | 页面加载后有明确的初始展示 |
| F5 | 终态可达 | 用户能通过操作到达"完成"状态 |
| F6 | 无死锁 | 不存在无法继续操作的状态 |
| F7 | 边界处理 | 极端输入不会导致崩溃 |

---

## Layer 3: Pedagogical QA

目标：确保资源真正服务于教学。

### 3.1 教学目标对齐

AI 审视生成的内容，评估：

| # | 问题 | PASS 标准 |
|---|------|-----------|
| P1 | 核心知识点是否被突出展示？ | keyPoints 中的每一项在页面中有对应呈现 |
| P2 | 难点是否被有效化解？ | difficultPoints 通过交互/可视化变得可理解 |
| P3 | 认知层次是否匹配？ | 交互深度与 cognitiveLevel 一致 |
| P4 | 是否存在无关干扰？ | 没有与教学目标无关的花哨效果 |

### 3.2 课堂适用性

| # | 问题 | PASS 标准 |
|---|------|-----------|
| P5 | 投影可见性 | 文字/元素在投影仪上（远距离）可辨认 |
| P6 | 操作直觉性 | 不需要阅读说明就能知道如何操作 |
| P7 | 时间合理性 | 交互时长与 Blueprint 中的 duration 匹配 |
| P8 | 独立可理解 | 不依赖教师口头解释即可理解交互目的 |

### 3.3 信息准确性

| # | 问题 | PASS 标准 |
|---|------|-----------|
| P9 | 概念正确 | 展示的知识内容无事实错误 |
| P10 | 术语一致 | 使用的术语与 Blueprint 中一致 |
| P11 | 数据合理 | 示例数据/参数在合理范围内 |

---

## QA 执行流程

```
1. 接收生成的 HTML 文件

2. 执行 Layer 1 (Technical QA)
   - 任何 ERROR 级别检查失败 → FAIL，返回错误列表
   - 仅 WARNING → 记录但继续

3. 执行 Layer 2 (Functional QA)
   - 任何必须项缺失 → FAIL
   - 全部通过 → 继续

4. 执行 Layer 3 (Pedagogical QA)
   - AI 逐项评估 P1-P11
   - 任何一项明确不通过 → FAIL
   - 全部通过 → PASS

5. 输出 QA Report
```

## QA Report 格式

```json
{
  "resourceId": "res-tcp-handshake-anim",
  "timestamp": "2026-07-25T10:30:00Z",
  "result": "PASS | FAIL",
  "layers": {
    "technical": {
      "passed": true,
      "checks": [
        { "id": "T1", "name": "DOCTYPE", "result": "pass" },
        { "id": "T7", "name": "JS Syntax", "result": "pass" }
      ],
      "warnings": []
    },
    "functional": {
      "passed": true,
      "checks": [
        { "id": "F1", "name": "Event Listeners", "result": "pass" },
        { "id": "F4", "name": "Initial State", "result": "pass" }
      ]
    },
    "pedagogical": {
      "passed": true,
      "checks": [
        { "id": "P1", "name": "Key Points Coverage", "result": "pass", "evidence": "SYN/ACK/序列号均有展示" },
        { "id": "P2", "name": "Difficulty Resolution", "result": "pass", "evidence": "通过逐步动画展示了为什么两次握手不够" }
      ]
    }
  },
  "failReason": null,
  "repairSuggestion": null
}
```

## FAIL 后的处理

```
QA FAIL
  ↓
分析失败原因
  ↓
├── Technical FAIL → 返回 Interactive Generator Phase 4 (Self-Repair)
│                    附带具体错误信息
│
├── Functional FAIL → 返回 Interactive Generator Phase 4
│                     附带缺失功能描述
│
└── Pedagogical FAIL → 返回 Interactive Generator Phase 2 (重新生成)
                       附带教学目标重申 + 失败原因
```

## 与 Self-Repair 的协作

```
Interactive Generator Phase 2 (生成)
       ↓
Interactive Generator Phase 3 (内部校验 - 轻量版)
       ↓
Quality Checker (完整校验 - 严格版)
       ↓ FAIL
Interactive Generator Phase 4 (修复)
       ↓
Quality Checker (再次校验)
       ↓ 最多循环 2 次
       ↓ 仍 FAIL
降级到 alternativeForm → 重新生成
       ↓ 仍 FAIL
标记 generation_failed → 回退到 Slide
```

## 特殊规则

1. **PPT 的 QA 简化**：PPT 只需通过 Layer 1 + Layer 3 的 P5/P6/P9/P10
2. **批量生成时**：同一 Chapter 的所有资源生成完毕后，额外检查整体一致性（风格统一、术语一致、无重复内容）
3. **复杂度降级触发**：如果 high complexity 资源连续 2 次 QA FAIL，自动降级为 medium complexity 重新生成
