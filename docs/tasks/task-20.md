# Task 20: 部署准备 + 最终完善

## 依赖

- 前置 task：Task 19（RAG 检索，全部核心功能完成）
- 相关文件：项目根目录

## 需求描述

确保项目具备部署条件，完善错误处理和响应式适配。实际部署由开发者手动在 Vercel 上操作。

## 实现要点

### 部署配置

- 确认 `next.config.ts` 中无 Vercel 不兼容的配置
- 创建 `.env.example` 文件，列出所有环境变量（不含值），方便其他开发者参考
- 确认 `package.json` 中的 build 和 start 脚本正确
- 确认所有环境变量通过 `process.env` 读取，无硬编码

### 错误处理完善

- `src/app/(app)/error.tsx`: App 路由组通用错误边界
- `src/app/(app)/not-found.tsx`: 404 页面
- `src/app/(app)/loading.tsx`: 通用加载状态
- 所有 Server Actions 的错误都被捕获并返回用户友好的错误消息
- 所有 API Route 的错误都返回合适的 HTTP 状态码

### 响应式适配检查

- 落地页：移动端/平板/桌面 布局正常
- 登录/注册页：居中卡片在小屏幕上不溢出
- App 布局：移动端侧边栏收起，汉堡菜单可用
- 对话页：移动端对话列表和内容区能切换显示
- 文件管理页：移动端目录树和内容区能切换显示

### 构建验证

- `pnpm build` 成功，无错误无警告
- `pnpm test` 所有测试通过
- 检查 bundle 大小是否合理（`@next/bundle-analyzer` 可选）

### README.md

- 项目简介
- 技术栈
- 本地开发步骤（clone、install、配置 .env.local、db:migrate、dev）
- 环境变量说明
- 部署说明（Vercel）

## 验证标准

### 预期行为

- `pnpm build` 零错误零警告
- `pnpm test` 所有测试通过
- 主要页面在移动端浏览器（375px 宽度）布局正常
- 错误页面（404、500）展示友好
- `.env.example` 包含所有需要的环境变量
- README 完整清晰

## 完成标志

- [x] 部署配置检查完成
- [x] 错误边界和 404 页面
- [x] 响应式适配
- [x] 构建和测试全部通过
- [x] README.md 编写完成
- [x] `.env.example` 创建
