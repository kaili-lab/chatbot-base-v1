# Task 06: 集成 Better Auth + 邮箱密码注册/登录页面

## 依赖

- 前置 task：Task 02（数据库 Schema）、Task 04（App Layout）
- 相关文件：`src/lib/auth/`、`src/app/(auth)/`

## 需求描述

集成 Better Auth 框架，实现邮箱 + 密码注册和登录功能，包含前端页面和后端逻辑。

## UI 参考

- 登录页和注册页为居中卡片布局，不使用 (app) 侧边栏布局
- 参考 UI-PROMPTS.md 中的登录页/注册页描述

## 实现要点

### Better Auth 服务端配置

- 创建 `src/lib/auth/index.ts`，配置 Better Auth 实例
- 数据库适配器使用 Drizzle
- 启用 email + password 认证
- 创建 API Route：`src/app/api/auth/[...all]/route.ts`

### Better Auth 数据库迁移（必须显式执行，不会自动发生）

Better Auth **不会**在启动时自动建表，必须手动执行迁移。使用 Drizzle 适配器时推荐方式：

```bash
# 方式一（推荐）：生成 Drizzle schema 文件后走统一的 drizzle 迁移流程
npx @better-auth/cli generate   # 生成 auth-schema.ts（包含 user/session/account/verification 表）
pnpm db:generate                # 生成包含 Better Auth 表的迁移文件
pnpm db:migrate                 # 执行迁移
```

生成的 `auth-schema.ts` 需要引入到 `drizzle.config.ts` 的 `schema` 字段中，使 drizzle-kit 能感知到 Better Auth 表。

> **为什么不用方式二（`@better-auth/cli migrate`）**：该命令直接执行 SQL 绕过 drizzle，与现有的 drizzle 迁移流程分离，导致迁移历史不一致。

### Better Auth 客户端配置

- 创建 `src/lib/auth/client.ts`，导出客户端 auth 实例
- 提供 `useSession` hook 获取当前用户

### 注册页面 (`/register`)

- 用户名输入框
- 邮箱输入框
- 密码输入框
- 确认密码输入框
- 注册按钮
- "已有账号？登录" 链接
- 使用 Zod 做表单验证（邮箱格式、密码长度 >= 8、两次密码一致）
- 注册成功后跳转到邮件验证页

### 登录页面 (`/login`)

- 邮箱输入框
- 密码输入框
- 登录按钮
- "还没有账号？注册" 链接
- Google 登录按钮（UI 先放着，功能在 Task 08 实现）
- 分隔线 "或"
- 登录成功后跳转到 `/chat`

### 侧边栏用户信息

- 更新 Task 04 中的用户信息占位，接入真实用户数据（头像 + 名字）
- 登出按钮接入真实逻辑

## 验证标准

### 预期行为

- 访问 `/register`，填写信息后能注册成功
- 注册后跳转到邮件验证提示页
- 访问 `/login`，用注册的邮箱密码能登录成功
- 登录后跳转到 `/chat`，侧边栏显示真实用户名和头像
- 点击登出按钮能成功登出，跳转回登录页
- 表单验证：邮箱格式错误、密码太短、两次密码不一致，都能给出错误提示

### 需要通过的测试

- test: Zod schema 验证 - 正确的注册数据通过验证
- test: Zod schema 验证 - 邮箱格式错误被拒绝
- test: Zod schema 验证 - 密码不一致被拒绝
- test: Zod schema 验证 - 密码少于 8 位被拒绝

## 完成标志

- [x] Better Auth 服务端和客户端配置完成
- [x] 注册页面和逻辑正常
- [x] 登录页面和逻辑正常
- [x] 侧边栏用户信息和登出功能接入真实数据
- [x] 表单验证正常
- [x] 测试通过
- [x] `pnpm build` 构建成功
