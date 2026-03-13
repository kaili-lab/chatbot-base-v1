# Chat 页面开发态自动刷新排查记录

> 更新时间：2026-02-23  
> 适用版本：Next.js 16.1.6、React 19.2.3、better-auth 1.0.0

## 现象

- 启动项目后，`/chat` 页面出现“疯狂自动刷新”。
- 服务端日志反复出现：
  - `GET /chat 200 in ...`
- 浏览器控制台反复报错：
  - `Failed to execute 'measure' on 'Performance': 'ChatPage' cannot have a negative time stamp`
  - 调用栈集中在 `flushComponentPerformance` / `flushInitialRenderPerformance`。

## 根因（本项目中的触发链路）

1. `src/proxy.ts` 原逻辑只判断 `getSessionCookie(request)` 是否存在。
2. 当本地残留了**失效会话 cookie**（例如 `better-auth.session_token`）时，proxy 会误判为“已登录”，放行 `/chat`。
3. `/chat` 的 Server Component 内部会再次校验会话；会话无效时执行 `redirect("/login")`。
4. 在 Next.js 16.1.6 开发态（RSC/HMR）下，这个重定向路径会触发负时间戳测量异常，导致前端不断重连与重渲染，看起来像页面无限刷新。

## 修复方案

在 proxy 层补上“会话有效性二次校验”，并在无效时清理 cookie，阻断循环：

- 新增 `hasValidSession(request)`：
  - 调用 `/api/auth/get-session`，确认 `session.user.id` 存在才视为已登录。
- 访问受保护路由（`/chat`、`/documents`、`/settings`）且会话无效时：
  - 重定向到 `/login`
  - 删除 better-auth 相关 cookie（含 `__Secure-` 前缀版本）

对应代码：

- `src/proxy.ts`
- `src/proxy.test.ts`

## 验证结果

- 注入伪造/失效 cookie 后访问 `/chat`：
  - 修复前：反复请求 `/chat`，控制台持续报 `negative time stamp`
  - 修复后：一次跳转 `/login`，并清除失效 cookie，不再循环刷新

## 后续建议

- 如果再次出现类似现象，先清理站点 cookie 再复测。
- 开发态临时规避可使用 Webpack：
  - `pnpm dev -- --webpack`
- 关注 Next.js 后续版本对该开发态问题的修复，再评估升级。

## 参考链接

- Next.js Issue: https://github.com/vercel/next.js/issues/86060
- 相关 PR（未合并）：https://github.com/vercel/next.js/pull/88688
