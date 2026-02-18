# Task 16: 删除文件/文件夹（级联清理向量数据）

## 依赖

- 前置 task：Task 11（文件夹 CRUD）、Task 14（Pipeline，embeddings 数据已存在）
- 相关文件：`src/lib/db/`、`src/components/documents/`

## 需求描述

完善删除逻辑：删除文件时清理关联的 embeddings 数据，删除文件夹时级联删除所有子内容（子文件夹、文件、embeddings）。

## 实现要点

### 删除文件

- `deleteDocument(documentId, userId)`:
  1. 验证文档属于当前用户
  2. 删除 embeddings 表中 documentId 匹配的所有记录（数据库级联删除已配置，但也可显式删除以确保）
  3. 删除 documents 记录
  4. 目录树中移除文件节点

### 删除文件夹

- `deleteFolderCascade(folderId, userId)`:
  1. 验证文件夹属于当前用户
  2. 递归查询所有子文件夹 ID
  3. 查询所有子文件夹和当前文件夹下的所有 documents
  4. 删除这些 documents 关联的所有 embeddings
  5. 删除所有 documents
  6. 删除所有子文件夹（从最深层开始）
  7. 删除当前文件夹

### 确认弹窗

- 删除文件：弹出确认 Dialog，显示文件名，警告 "删除后无法恢复"
- 删除文件夹：弹出确认 Dialog，显示文件夹名和包含的文件数量，警告 "将同时删除文件夹内的所有文件和子文件夹"

### 交互入口

- 目录树中：右键菜单或 hover 时显示删除按钮
- 文件详情页：顶部删除按钮（红色文字）

## 验证标准

### 需要通过的测试

- test: 删除文件后，documents 表中该记录消失
- test: 删除文件后，embeddings 表中该文档的所有 embedding 消失
- test: 删除包含 2 个文件的文件夹后，文件夹、2 个文件、所有 embeddings 全部消失
- test: 删除嵌套文件夹（父 > 子 > 文件），所有层级全部清理
- test: 用户 A 无法删除用户 B 的文件（userId 验证）

## 完成标志

- [ ] 删除文件逻辑（含 embeddings 清理）
- [ ] 删除文件夹级联逻辑
- [ ] 确认弹窗
- [ ] 目录树和详情页的删除入口
- [ ] 测试通过
- [ ] `pnpm build` 构建成功
