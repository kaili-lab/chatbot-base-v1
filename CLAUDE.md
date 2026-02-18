# Chatbot Base - 开发规范

## 项目概述

基于 RAG 的通用知识库 Chatbot，技术栈：Next.js + TypeScript + shadcn/ui + Drizzle + PostgreSQL + pgvector + Better Auth + Vercel AI SDK。

详细 PRD：`docs/PRD.md` | Task 总览：`docs/tasks/index.md`

---

## 系统环境

- 当前操作系统：WSL2 Ubuntu，Shell：bash
- 项目路径：`/home/kai/projects/chatbot-base-v1`
- 文件系统操作使用标准 bash 命令（`ls`、`cp`、`mv`、`rm` 等）
- 路径使用正斜杠：`/home/kai/projects/chatbot-base-v1`

### shadcn/ui 安装注意事项

- `shadcn init` 和 `shadcn add` 分两步执行
- 安装组件后需补装依赖：`pnpm add class-variance-authority clsx tailwind-merge lucide-react`
- 检查 `src/lib/utils.ts` 是否存在，不存在则创建

---

## Next.js 开发规范（中小型项目）

1. **Server Components 优先**：默认 Server Component，需要交互/浏览器 API 时才加 `"use client"`
2. **数据变更用 Server Actions**，Route Handlers 仅用于需要对外暴露的 API
3. **布局文件**：`layout.tsx` 共享布局，`loading.tsx` 加载状态，`error.tsx` 错误边界
4. **路由组织**：用 Route Groups `(group)` 组织路由，不影响 URL
5. **环境变量**：服务端不加前缀，客户端用 `NEXT_PUBLIC_` 前缀
6. **图片字体**：用 `next/image` 和 `next/font`
7. **Metadata**：每个页面导出 `metadata` 对象

---

## 代码规范

- TypeScript 严格模式，**禁止 `any`**
- 中文注释：只在关键逻辑点添加，说明 WHAT 和 WHY，自解释的代码不加注释
- 组件：PascalCase；文件：kebab-case
- 所有外部输入（API 入参、表单）用 **Zod 验证**
- Server Actions 必须有错误处理和输入验证
- **禁止把数据库 schema 直接暴露给客户端**

---

## 数据库规范

- 所有业务表必须有 `userId` 字段，查询时带 `userId` 过滤（数据隔离）
- 使用 Drizzle query builder，不写原生 SQL（pgvector 相似度查询除外）
- 外键约束：documents 删除时级联删除 embeddings，conversations 删除时级联删除 messages

---

## 测试策略

- 框架：**Vitest**
- 单元测试：工具函数、文本分块逻辑、数据转换、加密工具
- 集成测试：Server Actions、数据库操作、权限隔离
- E2E 测试：由开发者手动完成
- 实现新功能后运行 `pnpm test` 确认通过
- 测试文件：`__tests__/` 目录或与源文件同级的 `*.test.ts`

---

## 常用命令

```bash
pnpm dev          # 启动开发服务器
pnpm build        # 构建
pnpm test         # 运行测试
pnpm db:generate  # 生成数据库迁移
pnpm db:migrate   # 执行迁移
pnpm db:studio    # 打开 Drizzle Studio
```
