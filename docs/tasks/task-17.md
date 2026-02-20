# Task 17: 对话列表 + 新建对话 + 星标 + 更多菜单

## 依赖

- 前置 task：Task 04（App Layout）、Task 09（认证中间件）
- 相关文件：`src/app/(app)/chat/`、`src/components/chat/`

## UI 参考

- 参考截图：`chat-section.jpg`
- 左侧为对话列表（含 New Chat 按钮、星标、更多菜单），右侧为对话内容区

## 需求描述

实现对话管理功能：对话列表展示、新建对话、星标收藏、重命名和删除。不涉及实际的 AI 对话逻辑（在 Task 18 实现）。

## 实现要点

### Chat 页面布局

- 左侧对话列表面板（窄列，可折叠）：
  - 顶部："+ New Chat" 按钮 + 删除按钮（垃圾桶图标，批量删除未收藏对话，需确认）
  - 列表项：对话标题 + 日期 + 星标图标 + "..." 更多菜单
  - 星标对话置顶显示
  - 当前选中的对话高亮
- 右侧对话内容区（Task 18 实现对话功能，此 task 显示空状态）

### 对话列表数据

- Server Component 查询当前用户的所有 conversations
- 排序：starred 置顶，然后按 updatedAt 降序
- 点击对话列表项，URL 变为 `/chat?id=xxx`，右侧加载对应对话

### 新建对话

- 点击 "New Chat" 按钮
- 创建 conversations 记录（title: "New Chat"）
- 自动选中新对话，右侧显示空对话界面

### 星标功能

- 点击对话列表项的星标图标，切换 starred 状态
- 星标对话在列表中置顶，星标图标高亮（黄色）

### 更多菜单（... 按钮）

- 点击后弹出 DropdownMenu
- 菜单项：
  - 重命名：弹出 Dialog，输入新标题，确认后更新
  - 删除：弹出确认 Dialog，确认后删除对话和关联的所有 messages

### Server Actions

- `createConversation(userId)`: 创建新对话
- `deleteConversation(conversationId, userId)`: 删除对话 + 关联 messages
- `deleteUnstarredConversations(userId)`: 删除全部未收藏对话（保留星标）
- `renameConversation(conversationId, userId, newTitle)`: 重命名
- `toggleStar(conversationId, userId)`: 切换星标状态

## 验证标准

### 预期行为

- 访问 `/chat`，看到左侧对话列表
- 点击 New Chat 创建新对话
- 点击星标图标切换收藏状态，星标对话置顶
- 点击 "..." 菜单能重命名和删除对话
- 点击顶部删除按钮，确认后删除全部未收藏对话，星标对话保留
- 删除对话后从列表消失
- 点击不同对话，URL 中的 id 参数变化

### 需要通过的测试

- test: createConversation - 创建对话，title 默认为 "New Chat"
- test: toggleStar - starred 在 true/false 间切换
- test: deleteConversation - 对话和关联的 messages 全部删除
- test: deleteUnstarredConversations - 未收藏对话批量删除，星标保留
- test: 对话列表排序 - starred 对话在前，非 starred 按时间降序
- test: 数据隔离 - 用户 A 看不到用户 B 的对话

## 完成标志

- [x] 对话列表 UI
- [x] 新建对话功能
- [x] 星标切换和置顶排序
- [x] 更多菜单（重命名、删除）
- [x] 顶部批量删除未收藏对话
- [x] Server Actions 全部实现
- [x] 测试通过
- [x] `pnpm build` 构建成功
