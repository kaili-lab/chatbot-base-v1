# Task 02: 配置 Drizzle ORM + PostgreSQL + pgvector，创建所有数据库 Schema

## 依赖

- 前置 task：Task 01
- 相关文件：`src/lib/db/`、`drizzle.config.ts`

## 需求描述

配置数据库连接和 ORM，创建 PRD 中定义的所有业务表 Schema。Better Auth 的表（user/session/account/verification）由 Better Auth 定义 schema，但**不会自动建表**，需要在 Task 06 中通过 `npx @better-auth/cli generate` 生成 Drizzle schema 后显式执行迁移。本 task 只创建业务表，不创建 Better Auth 表。

## 实现要点

### Drizzle 配置

- 安装 drizzle-orm、drizzle-kit、postgres（驱动）
- 创建 `drizzle.config.ts`
- 创建数据库连接实例 `src/lib/db/index.ts`
- 环境变量：`DATABASE_URL`

### pgvector 配置

- 安装 pgvector 扩展支持包
- 在数据库中需要先执行 `CREATE EXTENSION IF NOT EXISTS vector`
- Drizzle 中使用 `vector` 自定义类型

### Schema 定义

在 `src/lib/db/schema/` 下按表分文件：

**folders 表** (`folders.ts`)
- id: uuid, 主键, 默认生成
- userId: text, 非空, 关联 user.id
- name: text, 非空
- parentId: uuid, 可空, 自关联 folders.id
- createdAt: timestamp, 默认 now()
- updatedAt: timestamp, 默认 now()

**documents 表** (`documents.ts`)
- id: uuid, 主键
- userId: text, 非空, 关联 user.id
- folderId: uuid, 可空, 关联 folders.id
- fileName: text, 非空
- fileType: text, 非空 (md | txt)
- fileSize: integer, 非空
- content: text, 非空
- isNote: boolean, 默认 false
- status: text, 非空, 默认 'processing' (uploading | processing | completed | failed)
- createdAt: timestamp
- updatedAt: timestamp

**embeddings 表** (`embeddings.ts`)
- id: uuid, 主键
- documentId: uuid, 非空, 关联 documents.id, 级联删除
- userId: text, 非空
- content: text, 非空
- vector: vector 类型（维度暂定 1536，后续根据用户配置的 Embedding 模型调整）
- chunkIndex: integer, 非空
- metadata: jsonb, 可空
- createdAt: timestamp
- updatedAt: timestamp

**conversations 表** (`conversations.ts`)
- id: uuid, 主键
- userId: text, 非空, 关联 user.id
- title: text, 非空, 默认 'New Chat'
- starred: boolean, 默认 false
- createdAt: timestamp
- updatedAt: timestamp

**messages 表** (`messages.ts`)
- id: uuid, 主键
- conversationId: uuid, 非空, 关联 conversations.id, 级联删除
- role: text, 非空 (user | assistant)
- content: text, 非空
- sources: jsonb, 可空
- createdAt: timestamp
- updatedAt: timestamp

**settings 表** (`settings.ts`)
- id: uuid, 主键
- userId: text, 非空, unique, 关联 user.id
- llmBaseUrl: text, 可空
- llmApiKey: text, 可空（加密后存储，加密逻辑在 Task 09 实现）
- llmModel: text, 可空
- embeddingModel: text, 可空
- embeddingDimension: integer, 可空
- createdAt: timestamp
- updatedAt: timestamp

### Schema 导出

- 创建 `src/lib/db/schema/index.ts` 统一导出所有 schema
- 确保 Drizzle 的关系（relations）正确定义

### 数据库迁移

- 使用 `drizzle-kit generate` 生成迁移文件
- 使用 `drizzle-kit migrate` 执行迁移
- 在 `package.json` 中添加 `db:generate`、`db:migrate`、`db:studio` 脚本

## 验证标准

### 预期行为

- `pnpm db:generate` 能正常生成迁移文件
- `pnpm db:migrate` 能正常执行迁移，数据库中创建所有表
- `pnpm db:studio` 能打开 Drizzle Studio，看到所有表结构
- pgvector 扩展已启用（embeddings 表的 vector 列存在）

### 需要通过的测试

- test: 数据库连接成功，能执行简单查询
- test: 所有表存在且字段类型正确
- test: folders 表的 parentId 自关联约束正常（插入子文件夹，parentId 指向已存在的文件夹）
- test: documents 表的 folderId 外键约束正常
- test: 删除 document 时，关联的 embeddings 级联删除
- test: 删除 conversation 时，关联的 messages 级联删除
- test: settings 表的 userId 唯一约束正常

## 完成标志

- [x] Drizzle ORM 配置完成
- [x] pgvector 扩展启用
- [x] 所有 Schema 定义完成
- [x] 迁移文件生成并执行成功
- [x] 外键约束和级联删除正常
- [x] Drizzle Studio 可用
- [x] 测试全部通过
