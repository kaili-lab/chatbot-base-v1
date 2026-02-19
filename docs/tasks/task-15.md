# Task 15: 文件详情页

## 依赖

- 前置 task：Task 12（文件上传）、Task 14（Pipeline）
- 相关文件：`src/app/(app)/documents/[id]/`

## UI 参考

- 参考截图：`document-detail.jpg`
- 左侧目录树保持不变，右侧显示文件详情

## 需求描述

实现文件详情页面，用户点击目录树中的文件节点后，在右侧主内容区展示文件的元信息和文本内容。

## 实现要点

### 页面布局

- 顶部：返回按钮（←）+ 文件图标 + 文件名标题
- 文件名下方：日期 + 文件大小（如 "2024-03-01 • 2k"）
- 右上角：处理状态 Badge（processing 黄色 / completed 绿色 "Indexed" / failed 红色）
- 主内容区：文件的完整文本内容，使用等宽字体或 Markdown 渲染（如果是 .md 文件）
- 内容区可滚动

### 路由

- `/(app)/documents/[id]/page.tsx`
- Server Component，通过 documentId + userId 查询

### 数据获取

- 查询 documents 表（带 userId 过滤）
- 如果文档不存在或不属于当前用户 → 404 页面
- 获取关联的 embeddings 数量，展示 "X chunks indexed"

### 笔记 vs 上传文件

- 如果是笔记（isNote: true），显示 "编辑" 按钮，点击进入编辑器页面（Task 13）
- 如果是上传文件，不显示编辑按钮

## 验证标准

### 预期行为

- 在目录树中点击文件，右侧显示文件详情
- 文件元信息正确（名称、日期、大小、状态）
- 文本内容完整展示，可滚动
- Markdown 文件渲染为格式化内容
- 笔记文件显示编辑按钮
- 访问不存在的文档 ID 显示 404
- 其他用户的文档 ID 也显示 404（数据隔离）

## 完成标志

- [x] 文件详情页 UI 实现
- [x] 元信息和状态 Badge 展示正确
- [x] 文本内容展示和滚动
- [x] 笔记编辑入口
- [x] 404 处理
- [x] `pnpm build` 构建成功
