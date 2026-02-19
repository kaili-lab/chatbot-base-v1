# Task 09: 认证中间件（路由保护）

## 依赖

- 前置 task：Task 06（Better Auth + 注册登录）
- 相关文件：`src/middleware.ts`

## 需求描述

实现路由保护，未登录用户访问受保护页面时重定向到登录页，已登录用户访问登录/注册页时重定向到 /chat。

## 实现要点

### Next.js Middleware

- 创建 `src/middleware.ts`
- 使用 Better Auth 的 session 检查机制

### 路由保护规则

| 路由 | 未登录 | 已登录 |
|------|--------|--------|
| `/` | 显示落地页 | 重定向到 `/chat` |
| `/login`、`/register` | 正常访问 | 重定向到 `/chat` |
| `/verify-email` | 正常访问 | 正常访问 |
| `/(app)/*`（chat、documents、settings） | 重定向到 `/login` | 正常访问 |

### 注意事项

- Middleware 中不要做重型操作（数据库查询等），只检查 session cookie 是否存在
- API routes（`/api/auth/*`）不需要被 middleware 拦截
- 配置 `matcher` 只匹配需要保护的路由

## 验证标准

### 预期行为

- 未登录访问 `/chat` → 重定向到 `/login`
- 未登录访问 `/documents` → 重定向到 `/login`
- 已登录访问 `/login` → 重定向到 `/chat`
- 已登录访问 `/register` → 重定向到 `/chat`
- 已登录访问 `/` → 重定向到 `/chat`
- 未登录访问 `/` → 显示落地页
- `/api/auth/*` 路由不受中间件影响

### 需要通过的测试

- test: middleware matcher 配置正确，包含所有需要保护的路由
- test: 未登录状态访问受保护路由返回重定向响应
- test: API 路由不受中间件拦截

## 完成标志

- [x] Middleware 实现
- [x] 路由保护规则全部生效
- [x] API 路由不受影响
- [x] 测试通过
- [x] `pnpm build` 构建成功
