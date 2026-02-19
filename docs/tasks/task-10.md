# Task 10: 设置页面 — LLM 配置表单 + API Key 加密存储 + 测试连接

## 依赖

- 前置 task：Task 04（App Layout）、Task 09（认证中间件）
- 相关文件：`src/app/(app)/settings/`、`src/lib/crypto.ts`、`src/lib/db/`

## UI 参考

- 参考 UI-PROMPTS.md 中设置页面的描述
- 与截图差异：无

## 需求描述

实现设置页面，用户可配置 LLM API 接入信息。API Key 加密存储，提供测试连接功能验证配置是否正确。

## 实现要点

### 加密工具

- 创建 `src/lib/crypto.ts`
- 使用 Node.js 内置 `crypto` 模块（AES-256-GCM）
- 加密密钥从环境变量 `ENCRYPTION_KEY` 读取
- 导出 `encrypt(plaintext)` 和 `decrypt(ciphertext)` 函数

### 设置页面 (`/(app)/settings`)

- 页面标题 "设置"
- 表单卡片 "LLM 配置"：
  - API Base URL 输入框（placeholder: `https://api.openai.com/v1`）
  - API Key 输入框（password 类型，带显示/隐藏切换按钮）
  - 模型名称输入框（placeholder: `gpt-4o`）
  - Embedding 模型输入框（placeholder: `text-embedding-3-small`）
- "测试连接" 按钮（次要样式）
- "保存" 按钮（主要样式）
- 使用 Zod 验证表单（baseUrl 为 URL 格式，apiKey 非空）

### Server Actions

- `saveSettings`: 加密 API Key 后保存到 settings 表（upsert，按 userId）
- `getSettings`: 查询 settings，API Key 解密后返回（仅在服务端使用，不传给客户端明文）
- `testConnection`: 用填入的配置调用 LLM API（发一个简单的 chat completion 请求）和 Embedding API（发一个简单的 embedding 请求），返回成功/失败

### 测试连接逻辑

- LLM 测试：使用 Vercel AI SDK 创建临时客户端，发送 `messages: [{role:"user", content:"hi"}]`，能收到响应即成功
- Embedding 测试：调用 Embedding API 对 "test" 文本生成向量，能返回向量即成功
- 分别返回 LLM 和 Embedding 的测试结果，用 Sonner toast 提示

## 验证标准

### 预期行为

- 首次访问设置页，表单为空
- 填入配置后点击保存，toast 提示保存成功
- 刷新页面，之前保存的配置回显（API Key 显示为掩码 ****）
- 点击测试连接，LLM 和 Embedding 分别显示成功/失败状态
- 填入错误的 API Key，测试连接显示失败

### 需要通过的测试

- test: encrypt 函数加密后的文本与原文不同
- test: decrypt(encrypt(plaintext)) === plaintext
- test: Zod schema 验证 - baseUrl 非 URL 格式被拒绝
- test: Zod schema 验证 - apiKey 为空被拒绝
- test: saveSettings action 能正确 upsert settings 记录
- test: API Key 在数据库中是加密存储的（读取 raw 数据，不等于明文）

## 完成标志

- [x] 加密工具函数实现
- [x] 设置页面 UI 实现
- [x] 保存/读取配置正常（含加密）
- [x] 测试连接功能正常
- [x] 测试通过
- [x] `pnpm build` 构建成功
