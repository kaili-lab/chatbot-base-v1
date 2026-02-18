# Task 14: 文档处理 Pipeline — 文本分块 + 向量化 + 存储

## 依赖

- 前置 task：Task 10（设置页面，需要 Embedding API 配置）、Task 12（文件上传）
- 相关文件：`src/lib/pipeline/`、`src/lib/db/`

## 需求描述

实现文档上传/保存后的自动处理流水线：将文本内容分块（chunking），调用 Embedding API 生成向量，存入 embeddings 表。这是 RAG 检索的基础。

## 实现要点

### 文本分块器

- 创建 `src/lib/pipeline/chunker.ts`
- 实现基于段落的递归分块（Recursive Character Text Splitting）
- 参数：`chunkSize = 800`（字符），`chunkOverlap = 150`（字符）

**分割优先级（按顺序尝试）：**
1. Markdown 标题（`# `、`## `、`### `）
2. 空行（`\n\n`）
3. 换行（`\n`）
4. 句号（`。`、`.`）
5. 强制按 chunkSize 截断

**逻辑：**
1. 按最高优先级的分隔符拆分文本
2. 如果某个片段 > chunkSize，用下一级分隔符继续拆分
3. 如果片段 <= chunkSize，合并相邻的小片段直到接近 chunkSize
4. 相邻 chunk 之间保持 chunkOverlap 的重叠

**返回格式：**
```typescript
interface Chunk {
  content: string;
  chunkIndex: number;
  metadata: {
    startOffset: number;  // 在原文中的起始位置
    endOffset: number;    // 在原文中的结束位置
  };
}
```

### Embedding 生成

- 创建 `src/lib/pipeline/embedder.ts`
- 从 settings 表读取当前用户的 Embedding 配置（baseUrl, apiKey, embeddingModel）
- 使用 Vercel AI SDK 的 `embed` 或 `embedMany` 函数
- 批量处理：一次性将所有 chunk 发送（注意 API 的 batch 限制，必要时分批）

### Pipeline 编排

- 创建 `src/lib/pipeline/index.ts`
- `processDocument(documentId, userId)`:
  1. 读取 documents 表的 content
  2. 调用 chunker 分块
  3. 调用 embedder 批量生成向量
  4. 批量插入 embeddings 表
  5. 更新 documents 表 status = completed
  6. 如果任何步骤失败，status = failed
- 该函数在文件上传完成后和笔记保存后调用

### 重新处理逻辑

- 如果文档已有 embeddings（比如笔记更新），先删除旧的 embeddings，再重新生成
- 避免重复数据

### 错误处理

- Embedding API 不可用（用户未配置或配置错误）→ status = failed，toast 提示用户检查 LLM 设置
- 分块过程出错 → status = failed，记录错误信息

## 验证标准

### 需要通过的测试

**Chunker 测试（核心，覆盖要全面）：**
- test: 短文本（< chunkSize）→ 返回 1 个 chunk，内容完整
- test: 长文本包含 Markdown 标题 → 按标题优先分割，每个 chunk 包含完整章节
- test: 长文本无标题，有多个段落 → 按空行分割
- test: 单个超长段落 → 按句号分割，每个 chunk <= chunkSize
- test: chunkOverlap 正确 → 相邻 chunk 的尾/头有重叠内容
- test: 每个 chunk 的 metadata.startOffset 和 endOffset 正确
- test: 空文本 → 返回空数组

**Pipeline 测试：**
- test: processDocument 执行后，embeddings 表新增记录，数量等于 chunk 数
- test: 每条 embedding 的 chunkIndex 从 0 递增
- test: 重新处理文档时，旧 embeddings 被删除，新的被写入
- test: Embedding API 不可用时，documents.status 更新为 failed

## 完成标志

- [ ] 文本分块器实现（递归分割 + overlap）
- [ ] Embedding 生成器实现
- [ ] Pipeline 编排完成
- [ ] 文件上传后自动触发 pipeline
- [ ] 笔记保存后自动触发 pipeline
- [ ] 重新处理逻辑正常
- [ ] 错误处理完善
- [ ] 测试通过（尤其是 chunker 测试）
- [ ] `pnpm build` 构建成功
