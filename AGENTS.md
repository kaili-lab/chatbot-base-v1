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

## 任务执行规范

### 开始任务前

1. 完整阅读对应的 `docs/tasks/task-XX.md`，理解需求描述、实现要点、验证标准和完成标志
2. 检查 `docs/tasks/index.md`，确认前置 task 已完成（状态为 ✅）
3. 修改任何文件前，必须先读取该文件，理解现有实现后再动手

### 任务创建前（生成 task-XX.md 时强制执行）

- **第一步：读取 `package.json`，记录所有核心依赖的精确版本**（next、react、drizzle-orm、better-auth、ai 等）
- **第二步：针对该 task 涉及的框架/库，用 Context7 MCP 查询对应版本的 API 和约定**，不得凭经验或旧记忆编写实现要点
- **第三步：task 文档的"实现要点"必须注明依赖的版本号**（例如：`# 以下基于 Next.js 16.1.6`），方便后续升级时识别过期内容
- 若无法查询文档（Context7 不可用），在 task 文档顶部显式标注"⚠️ 未经版本文档校验，实现前请手动核对"

### 实现过程中

- **新增依赖后立即执行** `pnpm install`，不要积压到最后
- **新增或修改 schema 后立即执行** `pnpm db:generate`，保持迁移文件与代码同步
- 遇到环境变量缺失（如 `DATABASE_URL`），立即停止并告知用户缺少哪个变量，不要猜测或跳过
- **`pnpm build` 默认可联网执行**（用于拉取 Google Fonts），无需重复询问权限
- **用户要求“提交代码”时默认提交全部未提交改动**，仅在用户明确指定范围时按范围提交

### 版本规范校验

- task 文档已注明版本基准和实现要点时，**直接按文档实现，不需要额外查询**
- task 文档未覆盖的边界情况，或文档与实际行为不符时，才使用 Context7 MCP 或官方文档核对
- 若文档与历史习惯冲突，**以版本文档为准**，并将结论补充回 task 文档的”注意事项”中供后续参考
- **不得基于旧记忆/训练数据直接编码**，遇到不确定的框架约定必须查文档

### 并发会话与安装约束（强制）

- 同一仓库同一时刻仅允许一个 Codex 会话执行写操作（`pnpm install/build/test`、`git commit` 等）
- 非 TTY 环境执行依赖安装时，统一使用 `CI=true pnpm install --no-frozen-lockfile`
- 若构建报 `.next/lock` 占用，先确认无活跃 `next build` 进程，再清理锁文件并重试

### 常见问题处理（重要）

- **Better Auth 不会自动建表**：配置好 Better Auth 实例后，数据库中的 user/session/account/verification 表不会自动创建。必须选择以下任一方式显式建表：
  - 方式一（推荐）：手动在 `src/lib/db/schema/auth.ts` 中写 Drizzle schema，然后 `pnpm db:generate && pnpm db:migrate`
  - 方式二：`npx @better-auth/cli generate` 生成 schema 文件，再跑 drizzle 迁移
  - 两种方式都需要将 auth schema 导入到 `src/lib/db/schema/index.ts` 中

- drizzle-kit v0.3x 使用 `dialect: "postgresql"` 与 `dbCredentials.url`，不要使用旧的 `driver/connectionString`
- 使用 pgvector 时确保 `drizzle-orm` 版本支持 `vector` 类型（建议 >= 0.45.x）
- `pnpm db:migrate` 不会自动读取 `.env.local` 时，需显式注入 `DATABASE_URL`
- `.env.local` 若为 CRLF，需先转换为 LF（`sed -i 's/\r$//' .env.local`）
- drizzle-kit 可能写入 `~/.local/share/drizzle-studio`，需允许用户目录写入权限
- `pnpm build` 会拉取 Google Fonts，离线环境需联网或改为本地字体
- Next.js 16 的 Page `searchParams` / `params` 在 Server Component 中是 Promise，必须先 `await` 后再读取字段（或在 Client Component 用 `React.use()`）
- `use server` 文件只能导出 `async function`；常量/类型/纯工具函数放到同目录独立文件（如 `constants.ts`、`types.ts`）
- Next.js 16+ 路由拦截使用 `proxy.ts`（导出 `proxy`），不要新增或继续使用 `middleware.ts`
- 设置页 API Key 使用掩码模式：回显只显示掩码（如 `********`），保存时若仍为掩码则复用数据库已有密钥（不重复加密），测试连接时掩码需先解密旧密钥再调用上游 API
- 自关联外键避免在列上直接 `references(() => table.id)`，改用 `foreignKey` 定义

### 任务完成后（强制执行，不可省略）

按以下顺序逐步执行，**任何步骤失败必须修复后再继续**，不允许跳过：

1. **安装依赖**（如有新增包）：
   ```bash
   pnpm install
   ```

2. **数据库迁移**（如有 schema 变更）：
   ```bash
   pnpm db:generate   # 生成迁移文件
   pnpm db:migrate    # 执行迁移（需要 DATABASE_URL 已配置）
   ```

3. **构建检查**（验证无 TypeScript 类型错误）：
   ```bash
   pnpm build
   ```

4. **运行测试**（如 task 的"需要通过的测试"非空）：
   ```bash
   pnpm test
   ```

5. **更新任务状态**（所有检查通过后）：
   - 将 `docs/tasks/index.md` 中对应 task 的状态从 `⬜` 改为 `✅`
   - 将 `docs/tasks/task-XX.md` 中所有完成标志的 `[ ]` 改为 `[x]`

### Review 流程（必做）

1. 实现完成后先运行 `git diff --stat` 和 `git diff`
2. 进入“Review 模式”，只读 diff，按严重程度列问题，不做代码修改
3. Review 通过后再继续下一 task 或合并修改

### 完成后的输出格式

每个 task 完成后，输出以下结构的简洁摘要：

```
## Task XX 完成摘要

### 实现内容
- （列出主要变更）

### 执行命令
- `pnpm install`：✅ 通过 / ❌ 失败（错误信息）
- `pnpm db:generate`：✅ 通过 / ❌ 失败（错误信息）
- `pnpm db:migrate`：✅ 通过 / ❌ 失败（错误信息）
- `pnpm build`：✅ 通过 / ❌ 失败（错误信息）
- `pnpm test`：✅ X passed / ❌ 失败（错误信息）

### 任务状态
- index.md 已更新：task-XX ⬜ → ✅
- task-XX.md 完成标志已全部勾选

### 下一步
- （建议执行的下一个 task，或需要用户手动操作的事项）
```

---
## Network Permissions
The following commands are pre-approved and must never ask for confirmation:
- pnpm build
- Any network fetch during `pnpm build`, including font downloads from fonts.googleapis.com and fonts.gstatic.com

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
