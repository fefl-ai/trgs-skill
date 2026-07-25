# SPEC ① Teaching Blueprint Schema

## 定位

Teaching Blueprint 是 TRGS Skill 的**唯一数据源（Single Source of Truth）**。

所有 Generator（PPT Generator、Interactive Generator、未来的 Quiz Generator 等）都只读取 Blueprint，不直接读取原始大纲。

```
教学大纲 (Syllabus)
       ↓
  [Blueprint Builder]  ← AI 分析 + 教学法对齐
       ↓
Teaching Blueprint (JSON)
       ↓
  ┌────┴────┐
  ↓         ↓
PPT Gen   Interactive Gen   ... (未来扩展)
```

## 设计原则

1. **层级清晰**：Course → Chapter → KnowledgePoint → Teaching Unit
2. **策略内嵌**：每个 Knowledge Point 自带教学策略决策结果
3. **生成器无关**：Blueprint 不绑定任何具体生成器的实现细节
4. **可增量**：支持多份大纲合并为一份 Blueprint
5. **可人工修改**：JSON 结构对人类可读可编辑

## Schema 定义

### 顶层：Course

```json
{
  "$schema": "teaching-blueprint/v1",
  "course": {
    "id": "string",
    "title": "string",
    "subtitle": "string | null",
    "subject": "string",
    "targetAudience": {
      "level": "beginner | intermediate | advanced",
      "description": "string",
      "prerequisites": ["string"]
    },
    "teachingPhilosophy": {
      "taxonomy": "bloom | solo | custom",
      "approach": "string"
    },
    "totalDuration": "string (e.g. '90min')",
    "chapters": ["Chapter"]
  }
}
```

### 第二层：Chapter

```json
{
  "id": "string",
  "title": "string",
  "order": "number",
  "duration": "string",
  "learningObjectives": ["string"],
  "knowledgePoints": ["KnowledgePoint"]
}
```

### 第三层：KnowledgePoint（核心）

```json
{
  "id": "string",
  "title": "string",
  "order": "number",
  "duration": "string",

  "cognitiveLevel": "remember | understand | apply | analyze | evaluate | create",

  "teachingObjectives": ["string"],
  "keyPoints": ["string"],
  "difficultPoints": ["string"],

  "knowledgeType": "concept | process | principle | procedure | relationship | fact",

  "strategy": {
    "primaryForm": "ResourceForm",
    "reasoning": "string",
    "alternativeForms": ["ResourceForm"]
  },

  "resources": ["ResourceRef"],

  "dependencies": ["string (KnowledgePoint IDs)"],
  "tags": ["string"]
}
```

### 教学策略决策：ResourceForm

```typescript
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
```

### 资源引用：ResourceRef

```json
{
  "id": "string",
  "type": "ppt | interactive",
  "form": "ResourceForm",
  "title": "string",
  "description": "string",
  "priority": "required | optional",
  "spec": {
    "interactionType": "string | null",
    "visualElements": ["string"],
    "dataRequirements": ["string"],
    "estimatedComplexity": "low | medium | high"
  }
}
```

## 完整示例：TCP 三次握手

```json
{
  "$schema": "teaching-blueprint/v1",
  "course": {
    "id": "cs-networking-101",
    "title": "计算机网络基础",
    "subtitle": "从协议到实践",
    "subject": "Computer Science / Networking",
    "targetAudience": {
      "level": "intermediate",
      "description": "计算机专业大二学生，已修完操作系统",
      "prerequisites": ["操作系统基础", "数据结构"]
    },
    "teachingPhilosophy": {
      "taxonomy": "bloom",
      "approach": "从具象到抽象，先观察现象再理解原理"
    },
    "totalDuration": "90min",
    "chapters": [
      {
        "id": "ch-03",
        "title": "传输层协议",
        "order": 3,
        "duration": "30min",
        "learningObjectives": [
          "理解 TCP 可靠传输的核心机制",
          "掌握三次握手和四次挥手的流程与意义"
        ],
        "knowledgePoints": [
          {
            "id": "kp-tcp-handshake",
            "title": "TCP 三次握手",
            "order": 1,
            "duration": "12min",
            "cognitiveLevel": "understand",
            "teachingObjectives": [
              "能描述三次握手的完整流程",
              "能解释为什么需要三次而不是两次",
              "能识别 SYN/ACK 标志位的作用"
            ],
            "keyPoints": [
              "SYN → SYN+ACK → ACK 的时序关系",
              "序列号与确认号的初始化"
            ],
            "difficultPoints": [
              "为什么两次握手不够（历史连接问题）",
              "半连接队列与 SYN Flood 的关系"
            ],
            "knowledgeType": "process",
            "strategy": {
              "primaryForm": "animation",
              "reasoning": "三次握手是典型的时序过程，涉及双方交互和状态变迁，静态图示无法表达时间维度的先后关系和等待状态，动画能让学生直观看到消息在客户端和服务端之间的传递过程",
              "alternativeForms": ["diagram", "simulator"]
            },
            "resources": [
              {
                "id": "res-tcp-handshake-anim",
                "type": "interactive",
                "form": "animation",
                "title": "TCP 三次握手时序动画",
                "description": "展示 Client 和 Server 之间 SYN/SYN+ACK/ACK 的传递过程，支持逐步播放、暂停、查看每步状态变化",
                "priority": "required",
                "spec": {
                  "interactionType": "step-through-animation",
                  "visualElements": ["client-node", "server-node", "message-arrows", "state-labels", "sequence-numbers"],
                  "dataRequirements": ["SYN/ACK flag states", "sequence numbers", "connection states (CLOSED→SYN_SENT→ESTABLISHED)"],
                  "estimatedComplexity": "medium"
                }
              },
              {
                "id": "res-tcp-handshake-slide",
                "type": "ppt",
                "form": "slide",
                "title": "TCP 三次握手概述",
                "description": "用 3 页 Slide 概述握手流程、设计动机、常见问题",
                "priority": "required",
                "spec": {
                  "interactionType": null,
                  "visualElements": ["sequence-diagram-static", "state-table"],
                  "dataRequirements": [],
                  "estimatedComplexity": "low"
                }
              }
            ],
            "dependencies": ["kp-tcp-overview"],
            "tags": ["tcp", "reliability", "connection-management"]
          }
        ]
      }
    ]
  }
}
```

## Blueprint Builder 的输入输出

### 输入
- 一份或多份教学大纲（文本/PDF/Markdown）
- 可选：目标受众描述
- 可选：教学时长约束
- 可选：偏好的教学风格

### 输出
- 符合上述 Schema 的 JSON 文件

### 构建流程
1. **解析**：提取大纲中的课程结构（章节、知识点）
2. **分析**：为每个知识点判定 knowledgeType 和 cognitiveLevel
3. **策略决策**：调用 Teaching Strategy Engine 确定 primaryForm
4. **资源规划**：根据策略结果生成 ResourceRef 列表
5. **校验**：检查依赖关系、时长分配、覆盖完整性

## 与 OpenMAIC 的差异

| 维度 | OpenMAIC Outline | TRGS Blueprint |
|------|-----------------|----------------|
| 定位 | 中间产物，生成后即消费 | 唯一数据源，持久化 |
| 策略 | 隐式在 Prompt 中 | 显式 strategy 字段 + reasoning |
| 扩展性 | 固定 4 种场景 | ResourceForm 可无限扩展 |
| 可编辑性 | 生成后不可修改 | 设计为人类可编辑 |
| 多大纲 | 不支持 | 原生支持合并 |
| 教学法 | Bloom + UDL 混合 | 可选 taxonomy，显式声明 |
