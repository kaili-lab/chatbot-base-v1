# Task 12: 文件上传 + 文本提取（DocumentParser 接口）

## 依赖

- 前置 task：Task 11（文件夹 CRUD + 目录树）
- 相关文件：`src/lib/parsers/`、`src/app/(app)/documents/`

## 需求描述

实现文件上传功能，用户可上传 Markdown 和 TXT 文件到指定文件夹。上传后自动提取文本内容，存入 documents 表。同时设计 DocumentParser 扩展接口，方便后续添加 PDF 等格式支持。

## 实现要点

### DocumentParser 接口

```typescript
// src/lib/parsers/types.ts
interface DocumentParser {
  supportedTypes: string[];
  parse(content: string, fileName: string): Promise<string>;
}
```

### 解析器实现

- `src/lib/parsers/markdown-parser.ts`: Markdown 文件直接返回原始文本（保留 Markdown 语法，chunking 时会用到标题信息）
- `src/lib/parsers/text-parser.ts`: TXT 文件直接返回内容
- `src/lib/parsers/index.ts`: 解析器注册表，根据文件扩展名匹配对应解析器

### 上传交互

- 点击 "Upload File" 按钮，打开文件选择器（accept: .md, .txt）
- 支持多文件选择
- 上传时在目录树中显示文件节点（状态：processing）
- 上传到当前选中的文件夹（未选中则上传到根目录）

### Server Action

- `uploadDocument(file, folderId?)`:
  1. 读取文件内容（纯文本，直接在服务端用 `file.text()` 读取）
  2. 创建 documents 记录（status: processing）
  3. 调用对应 parser 提取文本
  4. 更新 documents 记录（content, fileSize, status: completed）
  5. 如果解析失败，更新 status: failed

### 目录树更新

- 上传完成后，文件出现在目录树对应文件夹下
- 文件节点显示：文件图标 + 文件名（截断显示）
- 点击文件节点跳转到文件详情页（Task 15 实现）

## 验证标准

### 预期行为

- 点击 Upload File 能选择 .md/.txt 文件
- 上传后文件出现在目录树中
- 上传非支持格式的文件被拒绝（前端文件选择器限制）
- 上传大文件时能看到 processing 状态
- 处理完成后状态变为 completed

### 需要通过的测试

- test: MarkdownParser - 解析 .md 文件返回完整文本内容
- test: TextParser - 解析 .txt 文件返回完整文本内容
- test: 解析器注册表 - .md 文件匹配到 MarkdownParser
- test: 解析器注册表 - .txt 文件匹配到 TextParser
- test: 解析器注册表 - 不支持的文件类型抛出错误
- test: uploadDocument - 上传后 documents 表新增记录，status 为 completed，content 非空

## 完成标志

- [ ] DocumentParser 接口定义
- [ ] Markdown 和 TXT 解析器实现
- [ ] 文件上传 UI 和 Server Action
- [ ] 文件出现在目录树中
- [ ] 处理状态正确流转
- [ ] 测试通过
- [ ] `pnpm build` 构建成功
