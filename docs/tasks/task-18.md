# Task 18: 对话界面 + Vercel AI SDK 流式对话

## 依赖

- 前置 task：Task 10（设置页面，LLM 配置可用）、Task 17（对话列表）
- 相关文件：`src/app/(app)/chat/`、`src/app/api/chat/`、`src/components/chat/`

## 需求描述

实现对话聊天功能，用户输入问题后 LLM 以流式方式输出回答，消息保存到数据库。此 task 不含 RAG 检索逻辑（Task 19），只做纯 LLM 对话。

## UI 参考

- 参考截图：`chat-section.jpg`
- 对话标题 + 消息流（用户消息右侧蓝色，AI 回复左侧白色）+ 底部输入框

## 实现要点

### 对话内容区

- 顶部：对话标题（面包屑 "Chat / 对话标题"）
- 消息区域（可滚动）：
  - 用户消息：右对齐，蓝色气泡，显示用户头像
  - AI 回复：左对齐，白色/灰色气泡，显示 AI 图标
  - 新消息自动滚动到底部
  - 加载中显示打字指示器（typing indicator）
- 底部输入区：
  - 输入框（placeholder: "Ask a question about your documents..."）
  - 发送按钮
  - 下方免责声明文字 "AI can make mistakes. Please verify important information."

### Vercel AI SDK 集成

- 使用 `useChat` hook（客户端）
- 创建 Route Handler：`src/app/api/chat/route.ts`
- 读取当前用户的 LLM 配置（从 settings 表，解密 API Key）
- 使用 `createOpenAI` 创建 OpenAI 兼容客户端（传入用户配置的 baseURL + API Key）
- 使用 `streamText` 实现流式响应

### 消息持久化

- 用户发送消息 → 保存到 messages 表（role: user）
- AI 回复完成后 → 保存到 messages 表（role: assistant）
- 加载对话时，从 messages 表读取历史消息
- 第一条用户消息自动作为对话标题（截取前 50 字符更新 conversations.title）

### 错误处理

- 用户未配置 LLM → 提示 "请先在设置中配置 LLM API"，提供跳转链接
- LLM API 调用失败 → 在对话中显示错误消息，用 Sonner toast 提示

## 验证标准

### 预期行为

- 选中对话后，右侧显示对话界面
- 输入框输入文字，点击发送或按 Enter
- AI 以流式方式逐字输出回复
- 回复完成后，刷新页面消息仍在（已持久化）
- 新对话发送第一条消息后，左侧列表的对话标题自动更新
- 未配置 LLM 时，给出明确提示

### 需要通过的测试

- test: 消息保存 - 发送消息后 messages 表新增 user 角色记录
- test: 消息保存 - AI 回复后 messages 表新增 assistant 角色记录
- test: 自动标题 - 发送第一条消息后 conversations.title 更新
- test: 数据隔离 - 用户 A 无法访问用户 B 的对话消息

## 完成标志

- [ ] 对话界面 UI（消息气泡、输入框、免责声明）
- [ ] Vercel AI SDK 流式对话集成
- [ ] Route Handler 实现
- [ ] 消息持久化
- [ ] 自动对话标题
- [ ] 错误处理（未配置 LLM）
- [ ] 测试通过
- [ ] `pnpm build` 构建成功
