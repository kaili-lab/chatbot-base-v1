# Task 07: 集成 Resend 邮件验证

## 依赖

- 前置 task：Task 06（Better Auth + 注册登录）
- 相关文件：`src/lib/auth/`、`src/app/(auth)/verify-email/`

## 需求描述

用户注册后发送验证邮件，用户点击邮件中的链接完成邮箱验证。未验证的用户登录后提示需要验证。

## 实现要点

### Resend 集成

- 安装 resend 包
- 创建 `src/lib/email.ts`，封装 Resend 客户端
- 在 Better Auth 配置中启用 emailVerification，配置发送邮件的回调函数

### 邮件验证流程

1. 用户注册成功 → Better Auth 自动生成验证 token → 调用 Resend 发送验证邮件
2. 邮件中包含验证链接：`/verify-email?token=xxx`
3. 用户点击链接 → Better Auth 验证 token → 更新 user.emailVerified = true
4. 验证成功后跳转到登录页

### 验证邮件页面 (`/verify-email`)

- 显示邮件图标
- 标题 "验证你的邮箱"
- 描述文字提示用户查收邮件
- "重新发送验证邮件" 按钮
- "返回登录" 链接

### 未验证用户处理

- 未验证用户登录后，重定向到验证提示页面
- 或在登录时提示 "请先验证邮箱"

## 验证标准

### 预期行为

- 注册后收到验证邮件（Resend 发送）
- 点击邮件中的验证链接，邮箱验证成功
- 验证成功后能正常登录
- 未验证用户无法正常使用系统
- "重新发送" 按钮能再次发送验证邮件

## 完成标志

- [ ] Resend 集成完成
- [ ] 注册后自动发送验证邮件
- [ ] 验证链接点击后邮箱状态更新
- [ ] 验证邮件页面实现
- [ ] 未验证用户处理逻辑
- [ ] `pnpm build` 构建成功
