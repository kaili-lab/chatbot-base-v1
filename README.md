# Chatbot Base

基于 RAG 的通用知识库 Chatbot，支持知识库管理与对话问答。

## 技术栈

- Next.js 16 + React 19 + TypeScript
- shadcn/ui + Tailwind CSS
- Drizzle ORM + PostgreSQL + pgvector
- Better Auth
- Vercel AI SDK

## 本地开发

1. 安装依赖
   ```bash
   pnpm install
   ```

2. 配置环境变量
   ```bash
   cp .env.example .env.local
   ```
   按需填写 `.env.local` 中的值。

3. 生成并执行数据库迁移
   ```bash
   pnpm db:generate
   pnpm db:migrate
   ```

4. 启动开发服务器
   ```bash
   pnpm dev
   ```

访问 `http://localhost:3000`。

## 环境变量

必需变量（生产与开发）：

- `DATABASE_URL`
- `BETTER_AUTH_URL`
- `BETTER_AUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `RESEND_API_KEY`
- `RESEND_FROM`
- `ENCRYPTION_KEY`

可选（本地测试 LLM 配置时使用）：

- `TEST_LLM_BASE_URL`
- `TEST_LLM_API_KEY`
- `TEST_LLM_MODEL`
- `TEST_EMBEDDING_MODEL`

## 部署（Vercel）

1. 推送代码到 Git 平台并在 Vercel 创建项目。
2. 在 Vercel 项目中配置上述环境变量。
3. 设置 `DATABASE_URL` 指向生产数据库。
4. 部署后访问项目地址完成验证。
