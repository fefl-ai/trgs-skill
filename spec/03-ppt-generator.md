# SPEC ③ Web PPT Generator

## 定位

Web PPT Generator 负责将 Blueprint 中 `type: "ppt"` 的 ResourceRef 转化为**可在浏览器中演示的 HTML PPT**。

不是 PowerPoint 文件。是一个独立的 HTML 文件，打开即可全屏演示。

```
Blueprint (ResourceRef where type="ppt")
       ↓
[Web PPT Generator]
       ↓
单个 HTML 文件（内联 CSS + JS，无外部依赖）
```

## 设计原则

1. **单文件交付**：一个 .html 文件包含所有 CSS/JS，双击即可打开
2. **零依赖**：不引用任何 CDN、外部字体、外部图片（图片用 SVG 内联或 CSS 绘制）
3. **键盘导航**：← → 翻页，F 全屏，ESC 退出
4. **响应式**：适配 16:9 比例，在投影仪和笔记本上都正常显示
5. **打印友好**：支持浏览器打印为 PDF

## Slide Schema

每一页 Slide 是一个结构化对象：

```typescript
interface Slide {
  id: string;
  layout: SlideLayout;
  title?: string;
  subtitle?: string;
  content: SlideContent[];
  notes?: string;
  transition?: TransitionType;
  animation?: AnimationConfig;
}

type SlideLayout =
  | "title"
  | "section"
  | "content"
  | "two-column"
  | "image-text"
  | "full-visual"
  | "quote"
  | "code"
  | "comparison"
  | "summary";

type SlideContent =
  | TextBlock
  | ListBlock
  | CodeBlock
  | DiagramBlock
  | TableBlock
  | QuoteBlock
  | VisualBlock;

interface TextBlock {
  type: "text";
  text: string;
  emphasis?: boolean;
}

interface ListBlock {
  type: "list";
  items: string[];
  ordered?: boolean;
  animationOrder?: "sequential" | "simultaneous";
}

interface CodeBlock {
  type: "code";
  language: string;
  code: string;
  highlights?: number[];
}

interface DiagramBlock {
  type: "diagram";
  format: "svg" | "mermaid-syntax";
  content: string;
}

interface TableBlock {
  type: "table";
  headers: string[];
  rows: string[][];
  highlightCells?: [number, number][];
}

interface QuoteBlock {
  type: "quote";
  text: string;
  attribution?: string;
}

interface VisualBlock {
  type: "visual";
  description: string;
  svgContent?: string;
}
```

## Theme 系统

```typescript
interface Theme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    code: string;
  };
  typography: {
    titleFont: string;
    bodyFont: string;
    codeFont: string;
    titleSize: string;
    bodySize: string;
  };
  spacing: {
    slidePadding: string;
    contentGap: string;
  };
  borderRadius: string;
  shadow: string;
}
```

### 默认 Theme：Academic Clean

```json
{
  "name": "academic-clean",
  "colors": {
    "primary": "#1a365d",
    "secondary": "#2c5282",
    "accent": "#ed8936",
    "background": "#ffffff",
    "surface": "#f7fafc",
    "text": "#1a202c",
    "textSecondary": "#4a5568",
    "code": "#2d3748"
  },
  "typography": {
    "titleFont": "system-ui, -apple-system, sans-serif",
    "bodyFont": "system-ui, -apple-system, sans-serif",
    "codeFont": "'SF Mono', 'Fira Code', monospace",
    "titleSize": "2.5rem",
    "bodySize": "1.25rem"
  },
  "spacing": {
    "slidePadding": "4rem",
    "contentGap": "1.5rem"
  },
  "borderRadius": "8px",
  "shadow": "0 4px 6px rgba(0,0,0,0.1)"
}
```

## Animation 配置

```typescript
interface AnimationConfig {
  entrance: EntranceAnimation;
  emphasis?: EmphasisAnimation;
}

type EntranceAnimation =
  | "fade"
  | "slide-up"
  | "slide-left"
  | "scale"
  | "typewriter"
  | "none";

type EmphasisAnimation =
  | "highlight"
  | "pulse"
  | "underline-draw"
  | "none";

type TransitionType =
  | "fade"
  | "slide"
  | "zoom"
  | "none";
```

### 动画规则

1. 标题页：fade + scale
2. 内容页列表：sequential slide-up（逐条出现）
3. 代码页：typewriter（逐行显示）
4. 对比页：两列同时 slide-left / slide-right
5. 总结页：fade

## Navigation 系统

### 键盘
- `→` / `Space` / `PageDown`：下一页
- `←` / `PageUp`：上一页
- `F`：全屏切换
- `ESC`：退出全屏
- `Home`：第一页
- `End`：最后一页
- `数字 + Enter`：跳转到第 N 页

### 触摸
- 左滑：下一页
- 右滑：上一页

### 进度指示
- 底部细线进度条
- 右下角页码 `3 / 12`

## HTML 输出结构

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{course.title} - {chapter.title}</title>
  <style>
    /* Theme CSS */
    /* Layout CSS */
    /* Animation CSS */
    /* Print CSS */
  </style>
</head>
<body>
  <div class="deck">
    <section class="slide" data-layout="title">...</section>
    <section class="slide" data-layout="content">...</section>
    <!-- ... -->
  </div>
  <div class="progress-bar"></div>
  <div class="page-indicator"></div>
  <script>
    /* Navigation JS */
    /* Animation JS */
    /* Keyboard handler */
  </script>
</body>
</html>
```

## 生成规则

### 从 Blueprint 到 Slides 的映射

1. 每个 Chapter 生成一个 PPT 文件
2. 每个 KnowledgePoint 生成 2-5 页 Slides：
   - 1 页标题/引入
   - 1-3 页核心内容
   - 0-1 页小结/过渡
3. Chapter 开头生成 1 页 Section 页
4. Chapter 结尾生成 1 页 Summary 页

### 内容密度规则

- 每页 Slide 文字不超过 6 行
- 列表项不超过 5 条
- 代码块不超过 15 行（超出则拆分）
- 每页只有一个核心信息

### 视觉层次

```
Level 1: Slide Title（最大，primary 色）
Level 2: Subtitle / Section Label（中等，secondary 色）
Level 3: Body Content（标准，text 色）
Level 4: Caption / Note（最小，textSecondary 色）
```

## 与 Interactive 的协作

当一个 KnowledgePoint 同时有 PPT 和 Interactive 资源时：

- PPT 负责**概述和引入**（是什么、为什么重要）
- Interactive 负责**深入体验**（动手操作、观察变化）
- PPT 的最后一页可以包含一个链接/提示："接下来进入交互演示"

## 质量要求

1. HTML 文件 < 500KB（不含 base64 图片）
2. 首屏渲染 < 100ms
3. 翻页动画 60fps
4. 在 Chrome / Safari / Firefox 中表现一致
5. 打印为 PDF 时布局不变形
