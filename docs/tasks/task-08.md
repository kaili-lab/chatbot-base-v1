# Task 08: Google OAuth 登录

## 依赖

- 前置 task：Task 06（Better Auth + 注册登录）
- 相关文件：`src/lib/auth/`、`src/app/(auth)/login/`

## 需求描述

在登录页面实现 Google OAuth 登录，用户点击 "Google 登录" 按钮后跳转 Google 授权页面，授权完成后回调到应用并自动登录。

## 实现要点

### Better Auth Google Provider 配置

- 在 Better Auth 服务端配置中添加 Google social provider
- 使用环境变量 `GOOGLE_CLIENT_ID` 和 `GOOGLE_CLIENT_SECRET`
- 回调 URL：`/api/auth/callback/google`

### 登录页面更新

- Task 06 中已放置 Google 登录按钮 UI，现在接入真实逻辑
- 点击按钮调用 Better Auth 的 `signIn.social({ provider: "google" })`
- Google 登录成功后跳转到 `/chat`

### 用户合并

- 如果用户先用邮箱注册，后用同一邮箱的 Google 登录，Better Auth 会自动关联到同一 user（通过 account 表）

## 验证标准

### 预期行为

- 点击 Google 登录按钮，跳转到 Google 授权页面
- 授权完成后回调到应用，自动登录并跳转到 `/chat`
- 侧边栏显示 Google 账号的用户名和头像
- 用同一邮箱的 Google 登录和邮箱密码登录，对应同一个用户

## 完成标志

- [ ] Google OAuth Provider 配置完成
- [ ] Google 登录流程正常
- [ ] 用户数据正确关联
- [ ] `pnpm build` 构建成功
