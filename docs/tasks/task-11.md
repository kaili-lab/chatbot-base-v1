# Task 11: 文件夹 CRUD + 树形目录 UI

## 依赖

- 前置 task：Task 04（App Layout）、Task 09（认证中间件）
- 相关文件：`src/app/(app)/documents/`、`src/components/documents/`

## UI 参考

- 参考截图：`document-section.jpg`
- 左侧为 DIRECTORY 树形结构，右侧为主内容区

## 需求描述

实现文件管理页面的目录树结构，支持文件夹的创建、重命名、删除操作。文件部分在后续 task 实现，本 task 只做文件夹。

## 实现要点

### 页面布局

- Documents 页面分为两栏：
  - 左侧：目录树（DIRECTORY 标签 + 树形结构）
  - 右侧：主内容区（默认显示 Knowledge Base 空状态，含 "New Folder"、"New Note"、"Upload File" 按钮）

### 目录树组件

- 创建 `src/components/documents/directory-tree.tsx`
- 文件夹节点：文件夹图标 + 名称，可展开/折叠
- 支持多层嵌套（至少 3 层）
- 点击文件夹不跳转，只展开/折叠
- 文件夹右键菜单或 hover 显示操作按钮：重命名、删除

### Server Actions

- `createFolder(name, parentId?)`: 创建文件夹，parentId 为空时在根目录创建
- `renameFolder(id, newName)`: 重命名文件夹
- `deleteFolder(id)`: 删除文件夹（级联删除子文件夹，子文档在 Task 16 实现级联逻辑）
- 所有操作都带 userId 过滤

### 新建文件夹交互

- 点击 "New Folder" 按钮
- 在目录树中出现一个可编辑的新节点（inline editing）
- 用户输入名称后按 Enter 确认，按 Esc 取消
- 如果当前选中了某个文件夹，则在其下创建子文件夹；否则在根目录创建

### 数据获取

- 使用 Server Component 在页面级别获取目录树数据
- 查询当前用户的所有 folders，在前端构建树形结构

## 验证标准

### 预期行为

- 访问 `/documents`，看到左侧目录树和右侧空状态
- 点击 "New Folder"，目录树中出现可编辑节点，输入名称后创建成功
- 文件夹可展开/折叠
- 在某个文件夹下可创建子文件夹
- 重命名文件夹生效
- 删除文件夹后从目录树中消失，子文件夹也一起删除
- 刷新页面后目录结构保持

### 需要通过的测试

- test: createFolder - 根目录创建文件夹，返回新文件夹数据
- test: createFolder - 在指定父文件夹下创建子文件夹，parentId 正确
- test: deleteFolder - 删除文件夹时级联删除所有子文件夹
- test: 不同用户的文件夹数据隔离（用户 A 看不到用户 B 的文件夹）

## 完成标志

- [x] 目录树 UI 组件实现
- [x] 文件夹 CRUD Server Actions 实现
- [x] 新建文件夹交互（inline editing）
- [x] 重命名和删除功能
- [x] 多层嵌套正常
- [x] 数据隔离测试通过
- [x] `pnpm build` 构建成功
