---
name: trgs
description: Teaching Resource Generation Skill (TRGS) - 根据教学大纲全自动构建教学蓝图(Blueprint)、离线响应式幻灯片(Slides)、六维高互动动效演练器与聚合学习门户。支持质量门禁质检与一键离线发布。
---

# TRGS — Teaching Resource Generation Skill

## 触发条件

当用户提供教学大纲（一份或多份）并要求生成教学资源时触发。

触发关键词：
- "生成教学课件"
- "根据大纲生成 PPT"
- "制作交互式教学网页"
- "生成教学资源"
- "备课"

## 输入格式

接受以下输入：
- 教学大纲文本（Markdown / 纯文本）
- 教学大纲文件（PDF / DOCX 内容粘贴）
- 多份大纲（用分隔线或标题区分）

可选附加信息：
- 目标受众描述（如"大二计算机专业学生"）
- 教学时长约束（如"90 分钟一节课"）
- 教学风格偏好（如"偏重实践"、"理论为主"）

## 输出格式

生成以下文件：

1. **Teaching Blueprint**（`blueprint.json`）
   - 结构化教学计划，唯一数据源
   - 符合 `schemas/blueprint-schema.json`

2. **HTML PPT**（每章一个 `.html` 文件）
   - 单文件，零依赖，双击即可打开
   - 支持键盘导航（←→翻页，F全屏）
   - 16:9 响应式布局

3. **Interactive HTML**（每个交互资源一个 `.html` 文件）
   - 单文件，零依赖，真正可交互
   - 服务于特定教学目标
   - 包含重置功能

## 执行流程

```
Step 1: 输入解析
  └→ 提取大纲结构、识别章节和知识点

Step 2: Blueprint 构建（prompts/blueprint-builder.md）
  └→ 生成结构化 Teaching Blueprint JSON

Step 3: 策略决策（prompts/strategy-engine.md）
  └→ 为每个知识点决定最佳教学形式

Step 4: 资源生成（并行）
  ├→ PPT Generator（prompts/ppt-generator.md + templates/ppt-base.html，含离线代码高亮与交互联动）
  └→ Interactive Generator（prompts/interactive-generator.md + templates/interactive-base.html，含 9 大交互模式矩阵与诊断评价）

Step 5: 质量检查（prompts/quality-checker.md + rules/generation-rules.md）
  └→ 三层检查：Technical → Functional → Pedagogical

Step 6: 门户装配与批量构建编排 (scripts/trgs-build.js / bin/trgs.js)
  ├→ 自动生成全课程资源导航门户 index.html
  ├→ 内容寻址哈希缓存与增量构建
  └→ 异构模型路由调度 (balanced / cost-effective / premium)

Step 7: 交付
  └→ 输出所有通过 QA 与校验的完整教学套件
```

## 核心原则

1. **Blueprint First**：所有生成器只读取 Blueprint，不直接读取原始大纲
2. **Strategy Driven**：AI 先决定"怎么教"，再决定"生成什么"
3. **Quality Gated**：所有输出必须通过三层质量检查才能交付

## 文件结构

```
skill/
├── SKILL.md                     ← 本文件（主入口与工作流编排）
├── schemas/
│   └── blueprint-schema.json    ← Blueprint JSON Schema
├── prompts/
│   ├── blueprint-builder.md     ← 大纲 → Blueprint
│   ├── strategy-engine.md       ← 知识点 → 教学形式决策
│   ├── ppt-generator.md         ← Blueprint → HTML PPT
│   ├── interactive-generator.md ← Blueprint → 交互网页
│   ├── quality-checker.md       ← 三层质量检查
│   └── self-repair.md           ← 代码诊断与自修复 Prompt
├── templates/
│   ├── ppt-base.html            ← PPT HTML 骨架模板
│   ├── interactive-base.html    ← 交互组件 HTML 骨架模板
│   └── portal-base.html         ← 课程导航大厅 Portal 模板
├── rules/
│   └── generation-rules.md      ← 技术约束 + 降级策略
└── examples/
    └── cs-networking/           ← 标杆示例：计算机网络大纲蓝图
```

## 约束

- 所有输出为单文件 HTML，不引用任何外部资源
- 不使用任何框架（React/Vue/D3 等）
- 可使用：Canvas 2D API、SVG、CSS Animation、requestAnimationFrame
- Interactive 文件 < 200KB，PPT 文件 < 500KB
- 必须有真正的用户交互（不是纯动画展示）
