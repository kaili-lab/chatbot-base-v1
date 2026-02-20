# KnowledgeChat

![Next.js](https://img.shields.io/badge/Next.js_15-App_Router-black?logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pgvector-336791?logo=postgresql&logoColor=white)
![Vercel AI SDK](https://img.shields.io/badge/Vercel_AI_SDK-流式输出-black?logo=vercel&logoColor=white)
![Better Auth](https://img.shields.io/badge/Better_Auth-邮箱_%2B_OAuth-22c55e)

> 将你的文档变成可检索的知识库——完整 RAG Pipeline，pgvector 语义搜索，流式 AI 回答，支持接入任意 LLM。

[🔗 在线演示](#demo) · [English](./README.md)

---

<!-- 截图：录制一段 5–8 秒 GIF，核心流程：输入问题 → 流式回答出现 → "Sources referenced" 展开显示引用文档。文件放在 public/demo.gif，替换此处注释为：![演示](./public/demo.gif) -->
> **截图待补充** — 部署上线后添加。

---

## ✨ 核心亮点

**完整 RAG Pipeline** — 上传 Markdown 或纯文本文件，系统自动解析、分块（Markdown 感知递归分割）并写入 pgvector。每条 AI 回答都会标注引用了哪些文档，并附跳转链接。

**自带 LLM，灵活接入** — 支持任意 OpenAI 兼容接口（OpenAI、Azure OpenAI、本地 Ollama 等）。API Key 在服务端 AES 加密后存入数据库，客户端不可见。

**诚实回退 + 来源标注** — 相似度阈值随问题长度动态调整。检索不到相关内容时明确标注"通用回答"，而非用空上下文让模型胡编。

---

## 技术栈

| 层级 | 选型 |
|---|---|
| 框架 | Next.js 15（App Router）+ TypeScript |
| UI | shadcn/ui + Tailwind CSS |
| 数据库 | PostgreSQL + pgvector |
| ORM | Drizzle ORM |
| 认证 | Better Auth — 邮箱密码 + Google OAuth |
| AI | Vercel AI SDK + 任意 OpenAI 兼容接口 |
| 邮件 | Resend |
| 部署 | Vercel |

---

## 功能列表

**知识库管理**
- 嵌套文件夹树——创建文件夹和子文件夹，灵活组织文档
- 上传 `.md` / `.txt` 文件，或在内置 Markdown 编辑器中新建笔记（左右分栏编辑+预览）
- 文件详情页——查看提取的文本内容、元信息和处理状态

**文档处理 Pipeline**
- 文本提取 → 递归字符分块（按 Markdown 标题、段落、句号优先分割）→ `text-embedding-3-small` 向量化 → 存入 pgvector

**语义对话**
- 对话列表支持星标（置顶）、重命名、删除
- 流式输出，完整 Markdown 渲染（标题、代码块、列表）
- "Sources referenced" 折叠区域——显示引用的文档名，点击跳转原文

**LLM 配置**
- 每个用户独立配置 Base URL、API Key、模型名称
- "测试连接"按钮——保存前验证 Chat API 和 Embedding API 是否可用

**认证与多租户**
- 邮箱密码注册（Resend 邮件验证）+ Google OAuth
- 所有数据以 `userId` 隔离，不同用户数据完全独立

**体验**
- 深色/浅色主题切换
- 侧边栏可折叠（仅显示图标模式）

## 架构

```
                    ┌─────────────────────────────┐
                    │        RAG Pipeline          │
  上传文件 ──►  解析  ──►  分块  ──►  向量化  ──►  pgvector
                    └─────────────────────────────┘
                                                        │
  用户提问 ──►  向量化  ──►  余弦相似度检索 ────────────┘
                                       │
                           Top-K 文本块（k=10）
                           + 动态相似度阈值
                                       │
                           LLM（注入检索上下文）
                                       │
                         流式回答 + 来源标注
```

**关键设计决策：**
- 默认 Server Component，仅在需要交互时加 `"use client"`
- 数据变更全部走 Server Actions，Route Handler 只用于对外 API
- 分块参数：500–1000 字符，100 字符 overlap——无需额外模型调用
- `DocumentParser` 接口已预留，后续接入 PDF/DOCX 解析器无需改动核心逻辑

## 本地运行

**前置条件：** Node.js 18+、pnpm、已启用 pgvector 扩展的 PostgreSQL

1. **克隆并安装依赖**
   ```bash
   git clone https://github.com/your-username/knowledgechat.git
   cd knowledgechat
   pnpm install
   ```

2. **配置环境变量**
   ```bash
   cp .env.local.example .env.local
   ```
   必填变量：

   | 变量 | 说明 |
   |---|---|
   | `DATABASE_URL` | PostgreSQL 连接字符串 |
   | `BETTER_AUTH_SECRET` | 随机密钥（≥ 32 字符）|
   | `BETTER_AUTH_URL` | 应用 Base URL（本地为 `http://localhost:3000`）|
   | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth 凭证 |
   | `RESEND_API_KEY` / `RESEND_FROM` | 邮件服务 |
   | `ENCRYPTION_KEY` | LLM API Key 的 AES 加密密钥 |

3. **执行数据库迁移**
   ```bash
   pnpm db:generate
   pnpm db:migrate
   ```

4. **启动开发服务器**
   ```bash
   pnpm dev
   ```
   访问 [http://localhost:3000](http://localhost:3000)。

5. **配置 LLM** — 进入**设置**页面，填写 Base URL、API Key 和模型名称，点击**测试连接**验证。

## Roadmap

- [ ] PDF 和 DOCX 支持——`DocumentParser` 接口已定义，解析器实现待补充
- [ ] 在线演示部署

## License

MIT

---

<a name="demo"></a>
> **演示地址即将上线**，部署完成后将在此更新。
