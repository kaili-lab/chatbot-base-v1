# Task 19: RAG 检索 + 上下文注入 + 来源标注 + 文档引用展示

## 依赖

- 前置 task：Task 14（Pipeline，embeddings 数据已存在）、Task 18（流式对话）
- 相关文件：`src/lib/rag/`、`src/app/api/chat/route.ts`、`src/components/chat/`

## 需求描述

在对话流程中加入 RAG 检索：用户提问后先从知识库检索相关内容，将检索结果作为上下文注入 LLM prompt，回答中标注来源并展示引用文档。

## 实现要点

### RAG 检索逻辑

- 创建 `src/lib/rag/retriever.ts`
- `retrieveRelevantChunks(query, userId, topK = 5, threshold = 0.7)`:
  1. 读取用户的 Embedding 配置
  2. 调用 Embedding API 将 query 转为向量
  3. 在 pgvector 中执行 cosine similarity 搜索（`<=>` 操作符）
  4. 过滤条件：`userId = 当前用户` AND `similarity >= threshold`
  5. 返回 Top-K 个 chunk（content + metadata + documentId + similarity score）

### pgvector 查询

```sql
SELECT e.*, d."fileName",
       1 - (e.vector <=> $queryVector) as similarity
FROM embeddings e
JOIN documents d ON e."documentId" = d.id
WHERE e."userId" = $userId
ORDER BY e.vector <=> $queryVector
LIMIT $topK
```

在 Drizzle 中使用 `sql` 模板执行。

### 上下文注入

- 修改 `src/app/api/chat/route.ts` 中的对话逻辑：
  1. 收到用户消息后，先调用 `retrieveRelevantChunks`
  2. 如果检索到相关内容（similarity >= threshold）：
     - 构造 system prompt，包含检索到的 chunk 内容
     - 在 system prompt 中指示 LLM："基于以下参考资料回答用户问题，如果参考资料不足以回答，请明确说明。"
     - 将 chunk 信息作为 sources 保存到 messages 表
  3. 如果未检索到相关内容：
     - 不注入上下文，直接发给 LLM
     - system prompt 中不包含参考资料

### 来源标注

- AI 回复中根据是否使用了知识库上下文，在 messages.sources 中记录：
  - 有来源：`{ type: "knowledge_base", chunks: [{documentId, fileName, content, similarity}] }`
  - 无来源：`{ type: "general" }`

### 文档引用 UI

- AI 回复气泡下方：
  - 如果有来源 → 显示可折叠的 "X Sources referenced" 区域
  - 折叠内容：每个引用源显示文档图标 + 文件名
  - 点击文件名跳转到对应文件详情页（`/documents/[documentId]`）
  - 如果无来源 → 不显示来源区域（或显示 "通用回答" 标签）

### 相似度阈值

- 默认阈值 0.7，可在代码中配置为常量
- 低于阈值的结果视为不相关，不注入上下文

## 验证标准

### 需要通过的测试

**检索测试：**
- test: 知识库中有相关文档时，retrieveRelevantChunks 返回非空结果
- test: 知识库为空时，返回空数组
- test: 返回结果按 similarity 降序排列
- test: 只返回当前用户的 embeddings（数据隔离）
- test: 返回结果数量不超过 topK

**来源标注测试：**
- test: 检索到相关内容时，messages.sources.type 为 "knowledge_base"
- test: 未检索到相关内容时，messages.sources.type 为 "general"

### 预期行为

- 用户提问与知识库相关的问题 → AI 基于文档内容回答，下方显示引用来源
- 用户提问通用问题（知识库无相关内容）→ AI 正常回答，不显示来源
- 点击引用的文件名能跳转到文件详情页
- Sources referenced 区域可折叠/展开

## 完成标志

- [ ] RAG 检索器实现（pgvector cosine similarity）
- [ ] 上下文注入到 LLM prompt
- [ ] 来源标注和持久化
- [ ] 文档引用 UI（折叠区域 + 文件名链接）
- [ ] 检索测试通过
- [ ] `pnpm build` 构建成功
