# Task 13: 新建笔记（目录选择弹窗 + Markdown 编辑器页面）

## 依赖

- 前置 task：Task 11（文件夹 CRUD + 目录树）
- 相关文件：`src/app/(app)/documents/`、`src/components/documents/`

## 需求描述

实现新建笔记功能，用户可在应用内直接创建 Markdown 文档。点击 "New Note" 后弹出目录选择弹窗，确认后进入编辑器页面。

## 实现要点

### 目录选择弹窗

- 点击 "New Note" 按钮弹出 Dialog
- 弹窗内容：
  - 笔记标题输入框
  - 目录选择器（树形结构，复用 Task 11 的目录树组件，可选择文件夹）
  - 可以不选择目录
- 确认逻辑：
  - 未选择目录 → 显示提示 "文件会保存在根目录"，用户可确认或返回选择
  - 已选择目录 → 直接创建，不显示额外提示
- 确认后创建 documents 记录（isNote: true, status: completed），跳转到编辑页面

### Markdown 编辑器页面

- 路由：`/(app)/documents/[id]/edit`（或在详情页中直接提供编辑模式）
- 使用 `@uiw/react-md-editor`
- 左右分栏：左侧编辑 Markdown 原文，右侧实时预览
- 自动保存：用户编辑后自动保存（debounce 1-2 秒），或提供手动保存按钮
- 保存时更新 documents 表的 content 和 fileSize 字段
- 保存后触发重新处理 pipeline（如果内容变化，需重新 chunking + embedding，此逻辑在 Task 14 实现）

### 笔记在目录树中的显示

- 笔记和上传文件使用不同图标区分（笔记用编辑图标，上传文件用文件图标）
- 点击笔记节点跳转到编辑器页面

## 验证标准

### 预期行为

- 点击 New Note，弹出目录选择弹窗
- 不选择目录直接确认，显示根目录保存提示
- 选择目录后确认，不显示提示，直接创建
- 创建后跳转到编辑器页面，Markdown 编辑器可用
- 左右分栏编辑和预览正常
- 编辑内容后保存，刷新页面内容保持
- 笔记在目录树中正确显示（位于选择的文件夹下）

### 需要通过的测试

- test: 创建笔记 - documents 表新增记录，isNote 为 true，folderId 正确
- test: 更新笔记内容 - documents 表的 content 和 fileSize 更新
- test: 不同用户的笔记数据隔离

## 完成标志

- [x] 目录选择弹窗实现
- [x] @uiw/react-md-editor 集成
- [x] 编辑器页面（左右分栏）
- [x] 自动/手动保存功能
- [x] 笔记在目录树中正确显示
- [x] 测试通过
- [x] `pnpm build` 构建成功
