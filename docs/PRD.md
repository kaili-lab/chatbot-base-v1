# RAG Chatbot - 项目 PRD（产品需求 + 技术规范 + 实施指南）

## Context

构建一个基于 RAG（检索增强生成）的通用知识库 Chatbot，作为开源项目展示 AI 全栈开发能力，用于求职。用户可以上传文档，系统自动解析并生成向量数据，通过对话式界面进行语义检索和问答。

---

## 1. 产品定义

### 1.1 核心用户场景

用户注册登录 → 上传 Markdown/TXT 文档 → 系统自动解析、分块、向量化 → 用户在对话界面提问 → 系统从知识库检索相关内容 → LLM 基于检索结果生成回答 → 回答中标注来源（知识库 or 通用问答）并提供文档引用

### 1.2 MVP 功能清单

#### 模块一：认证系统

- 邮箱 + 密码注册（含邮件验证）
- Google OAuth 登录
- 登录/登出
- 多租户数据隔离（所有数据表包含 userId 字段）

#### 模块二：知识库文件管理

- 树形目录结构：左侧展示文件夹和文件的树形层级，支持文件夹嵌套
- 新建文件夹：在目录树中创建文件夹，用于组织文档
- 上传文件：支持 Markdown (.md) 和纯文本 (.txt)，上传到指定文件夹
- 新建笔记：点击 "New Note" 弹出弹窗，用户可选择保存目录（未选择则提示"文件会保存在根目录"，已选择则不提示），确认后进入 Markdown 编辑器页面（使用 @uiw/react-md-editor，左右分栏编辑+预览）
- 删除文件/文件夹：删除文件时同时删除关联的文本块和向量数据，删除文件夹时级联删除子内容
- 查看文件内容：展示提取后的文本内容（不存储原始文件），显示元信息（日期、大小）和处理状态
- 文件详情路由校验：documentId 非法直接 404，避免触发数据库类型错误
- Markdown 渲染安全：图片链接仅允许 http/https/data/blob 或站内绝对路径，非法图片渲染为占位文本并阻止请求
- 处理状态显示：上传中 → 解析中 → 已完成 / 失败

#### 模块三：文档处理 Pipeline

- 文本提取：从上传的文件中提取纯文本内容
- 文本分块（Chunking）：将长文本拆分为适合检索的文本块
- 向量化（Embedding）：调用 Embedding API 将文本块转为向量
- 存储：文本块 + 向量存入 PostgreSQL（pgvector）

#### 模块三-B：LLM 设置

- LLM 配置表单：API Base URL、API Key（密码输入框，带显示/隐藏切换）、模型名称、Embedding 模型（固定显示 `text-embedding-3-small`，暂不开放修改）
- API Key 加密存储：服务端加密后存入数据库，前端不展示明文
- 测试连接按钮：用户填写配置后，点击按钮验证 LLM API 和 Embedding API 是否可用，返回成功/失败提示

#### 模块四：对话问答

- 对话列表：左侧展示历史对话列表（标题 + 日期），支持新建对话
- 对话星标：可收藏重要对话，星标对话置顶显示
- 对话管理："..." 菜单支持重命名、删除对话；顶部删除按钮支持批量删除未收藏对话（需确认）
- 对话界面：用户输入问题，流式输出回答
- 对话区域固定高度：对话列表与消息列表分别内部滚动
- 对话列表时间显示创建时间，不随消息更新
- Markdown 渲染：AI 回复支持 Markdown（标题/列表/代码块等）
- 来源即时展示：回复完成后显示来源，无需整页刷新
- 来源说明：未命中知识库时明确提示“未检索到知识库”
- RAG 检索：将用户问题向量化，从 pgvector 中进行相似度检索
- LLM 回答生成：将检索到的上下文 + 用户问题一起发送给 LLM
- 来源标注：回答中标明是基于知识库还是通用问答
- 文档引用：回答下方展示"Sources referenced"折叠区域，显示引用的文档名，支持点击查看原文
- AI 免责声明：对话底部显示"AI can make mistakes. Please verify important information."

---

## 2. 技术规范

### 2.1 技术栈

| 用途          | 选型                                              |
| ------------- | ------------------------------------------------- |
| 全栈框架      | Next.js (latest, App Router)                      |
| 语言          | TypeScript                                        |
| UI 组件       | shadcn/ui                                         |
| 提示通知      | Sonner                                            |
| 主题切换      | next-themes                                       |
| 表单/数据校验 | Zod                                               |
| ORM           | Drizzle ORM                                       |
| 数据库        | PostgreSQL + pgvector 扩展                        |
| 认证          | Better Auth                                       |
| 邮件服务      | Resend                                            |
| AI SDK        | Vercel AI SDK                                     |
| LLM 接入      | OpenAI 兼容接口（baseURL + API Key）              |
| Markdown 编辑 | @uiw/react-md-editor（轻量，左右分栏编辑+预览）   |
| 状态管理      | 按需引入 Zustand，MVP 阶段优先使用 React 自带状态 |
| 部署          | Vercel                                            |

### 2.2 Next.js 最佳实践约束（中小型项目）

以下规范将同步写入项目 `CLAUDE.md`，开发和 review 时强制遵守：

1. **Server Components 优先**：默认所有组件为 Server Component，仅在需要交互/浏览器 API 时添加 `"use client"`
2. **数据获取**：使用 Server Actions 处理数据变更（mutations），使用 Route Handlers 仅在需要对外暴露 API 时
3. **布局与页面**：合理使用 `layout.tsx` 共享布局，`loading.tsx` 处理加载状态，`error.tsx` 处理错误边界
4. **路由组织**：使用 Route Groups `(group)` 组织路由，不影响 URL 结构
5. **环境变量**：服务端变量不加前缀，客户端变量使用 `NEXT_PUBLIC_` 前缀
6. **图片与字体**：使用 `next/image` 和 `next/font`
7. **Metadata**：每个页面导出 `metadata` 对象用于 SEO

### 2.3 数据库设计

```
users (Better Auth 管理)
├── id
├── email
├── name
├── emailVerified
└── ...

folders
├── id (uuid)
├── userId (关联 users，数据隔离)
├── name
├── parentId (自关联 folders.id，null 表示根目录)
├── createdAt
└── updatedAt

documents
├── id (uuid)
├── userId (关联 users，数据隔离)
├── folderId (关联 folders.id，null 表示根目录)
├── fileName
├── fileType (md | txt)
├── fileSize
├── content (提取后的完整文本，TEXT 类型)
├── isNote (boolean，区分上传文件和在线创建的笔记)
├── status (uploading | processing | completed | failed)
├── createdAt
└── updatedAt

embeddings
├── id (uuid)
├── documentId (关联 documents)
├── userId (冗余字段，加速检索时的权限过滤)
├── content (文本块内容)
├── vector (vector 类型，当前固定为 1536 维)
├── chunkIndex (块在原文中的顺序)
├── metadata (JSONB，存储起止位置等信息)
├── createdAt
└── updatedAt

conversations
├── id (uuid)
├── userId
├── title
├── starred (boolean，默认 false，星标对话置顶)
├── createdAt
└── updatedAt

messages
├── id (uuid)
├── conversationId
├── role (user | assistant)
├── content
├── sources (JSONB，引用的 chunk 信息)
├── createdAt
└── updatedAt

settings
├── id (uuid)
├── userId (unique)
├── llmBaseUrl
├── llmApiKey (加密存储)
├── llmModel
├── embeddingModel (当前固定为 text-embedding-3-small)
├── embeddingDimension (integer，当前固定为 1536)
├── createdAt
└── updatedAt
```

### 2.4 Chunking 策略

**选择：基于段落的递归分块（Recursive Character Text Splitting）**

**原因：**

1. **适合 Markdown 和纯文本**：按自然段落边界（`\n\n`、`\n`、句号）递归分割，保持语义完整性
2. **实现简单，效果够用**：对于 MVP 阶段的文档类型（md/txt），不需要复杂的语义分块
3. **可控性强**：通过 `chunkSize`（建议 500-1000 字符）和 `chunkOverlap`（建议 100-200 字符）两个参数调优
4. **Markdown 感知**：优先按标题（`#`、`##`）分割，保持章节完整性，这对用户的笔记文档特别有效

**分割优先级：**

```
Markdown 标题（# ## ###）→ 空行（\n\n）→ 换行（\n）→ 句号（。.）→ 强制按 chunkSize 截断
```

**Overlap 的作用**：相邻块之间有重叠内容，避免关键信息恰好被切断在两个块的边界上。

**为什么不用更复杂的方案：**

- 语义分块（Semantic Chunking）需要额外的模型调用，增加成本和复杂度，MVP 不需要
- 固定大小分块太粗暴，会破坏段落语义
- 当前方案在简单和效果之间取得了最佳平衡

### 2.5 RAG 检索流程

```
用户提问
  ↓
将问题文本通过 Embedding API 转为向量
  ↓
在 pgvector 中执行相似度搜索（cosine similarity）
过滤条件：userId = 当前用户
返回 Top-K 个最相关的文本块（K=10）
  ↓
判断检索结果的相关性（相似度阈值随问题长度动态调整，短问题适度降低）
  ↓
├─ 相似度 >= 阈值 → 将检索到的文本块作为上下文，连同问题发给 LLM，回答标注"基于知识库"
└─ 相似度 < 阈值 → 不注入上下文，直接将问题发给 LLM，回答标注"通用回答"
```

### 2.6 文件解析器扩展设计

```typescript
// 预留接口，方便后续添加 PDF、Word 等解析器
interface DocumentParser {
  supportedTypes: string[];
  parse(content: string, fileName: string): Promise<string>;
}

// MVP 实现
class MarkdownParser implements DocumentParser { ... }
class TextParser implements DocumentParser { ... }

// 未来扩展
// class PdfParser implements DocumentParser { ... }
// class DocxParser implements DocumentParser { ... }
```

---

## 3. 页面结构

```
/                        → 首页（未登录展示介绍，已登录重定向到 /chat）
/login                   → 登录页
/register                → 注册页
/verify-email            → 邮件验证页
/(app)/chat              → 对话页面（主功能页）
/(app)/documents          → 文件管理页面
/(app)/documents/[id]     → 文件详情（查看提取的文本内容）
/(app)/settings           → 设置页面（配置 LLM 接入信息）
```

### 3.1 布局结构

采用"左侧边栏 + 顶部栏"经典管理后台布局（参考 GitHub、Notion、Linear 风格），使用 shadcn/ui Sidebar 组件实现。

```
┌──────┬───────────────────────────┐
│ Logo │  搜索栏    主题切换  头像  │
│      ├───────────────────────────┤
│ 对话 │                           │
│ 文档 │                           │
│ 设置 │        页面内容区          │
│      │                           │
│      │                           │
│      ├───────────────────────────┤
│ 用户 │                           │
│ 信息 │                           │
└──────┴───────────────────────────┘
```

- 侧边栏可折叠（收起后只显示图标）
- 侧边栏导航项：对话、文档管理、设置
- 侧边栏底部：用户信息 + 登出
- 顶部栏：搜索（可选）、主题切换、用户头像

---

## 4. 实施计划

### Phase 1：项目基础搭建

- 初始化 Next.js 项目 + TypeScript 配置
- 配置 shadcn/ui + next-themes + Sonner
- 配置 Drizzle ORM + PostgreSQL 连接
- 启用 pgvector 扩展
- 创建数据库 Schema（所有表）
- 编写项目 CLAUDE.md（开发规范）

### Phase 2：认证系统

- 集成 Better Auth
- 实现邮箱 + 密码注册/登录
- 集成 Resend 实现邮件验证
- 配置 Google OAuth
- 实现认证中间件（路由保护）

### Phase 3：设置页面

- LLM 配置页面（baseURL、API Key、模型选择）
- API Key 加密存储
- 配置验证（测试连接）

### Phase 4：知识库文件管理

- 文件夹 CRUD + 树形目录结构 UI
- 文件上传 + 文本提取
- 新建笔记功能（集成 Tiptap 编辑器）
- 实现 DocumentParser 接口 + Markdown/TXT 解析器
- 文本分块 + 向量化 Pipeline
- 文件详情页（查看提取的文本、元信息、处理状态）
- 删除文件/文件夹时级联清理数据

### Phase 5：对话问答

- 对话列表 + 对话详情页面
- 对话星标 + 更多菜单（重命名、删除）
- 集成 Vercel AI SDK 实现流式对话
- RAG 检索逻辑（向量相似度搜索）
- LLM 上下文注入 + 回答生成
- 来源标注 + 文档引用展示（Sources referenced 折叠区域）

### Phase 6：完善与部署

- 首页设计
- 响应式适配
- 错误处理完善
- 部署到 Vercel

---

## 5. 验证方案

每个 Phase 完成后的验证：

1. **Phase 1**：项目能正常启动，数据库表能正常创建
2. **Phase 2**：能注册、收到验证邮件、登录、Google 登录、登出
3. **Phase 3**：能保存 LLM 配置，测试连接成功
4. **Phase 4**：能创建文件夹、上传文件、新建笔记（Tiptap 编辑器可用）、在树形目录中浏览、查看文件详情和处理状态、删除文件/文件夹级联清理
5. **Phase 5**：能发起对话、星标/重命名/删除对话、得到流式回答、回答能引用文档内容并展示来源、无文档匹配时标注为通用回答
6. **Phase 6**：Vercel 部署成功，全流程可走通
