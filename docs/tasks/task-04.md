# Task 04: App Layout — 侧边栏 + 顶部栏布局

## 依赖

- 前置 task：Task 01
- 相关文件：`src/app/(app)/layout.tsx`、`src/components/`

## 需求描述

实现已登录用户的通用页面布局：左侧可折叠侧边栏 + 顶部栏。所有 `(app)` 路由组下的页面共享此布局。此 task 只做布局骨架和导航，不涉及业务逻辑。

## UI 参考

- 参考截图：`chat-section.jpg`、`document-section.jpg`
- 三张截图中的侧边栏和顶部栏保持一致

## 实现要点

### 侧边栏（使用 shadcn/ui Sidebar 组件）

- 顶部：Logo（文字 "Agent" + 图标）
- 导航项（各带图标）：
  - Chat（对话）
  - Documents（文档管理）
  - Settings（设置）
- 当前页面对应的导航项高亮显示
- 底部：用户信息区域（头像 + 名字），暂时用静态占位，Task 05 接入真实用户数据
- 侧边栏可折叠：点击折叠按钮后只显示图标，再点展开

### 顶部栏

- 左侧：面包屑导航（根据当前路由动态生成，如 "Chat / Q3 Financial Analysis"）
- 右侧：
  - 搜索框（占位，MVP 不实现搜索功能，只展示 UI）
  - 主题切换按钮（亮色/暗色切换，调用 next-themes）
  - 登出按钮（图标按钮，暂时用 placeholder onClick）

### 组件拆分

```
src/components/
├── layout/
│   ├── app-sidebar.tsx       # 侧边栏组件
│   ├── app-header.tsx        # 顶部栏组件
│   ├── breadcrumb-nav.tsx    # 面包屑导航
│   └── theme-toggle.tsx      # 主题切换按钮
```

### 响应式

- 桌面端（>= 1024px）：侧边栏常驻显示
- 移动端（< 1024px）：侧边栏默认隐藏，通过汉堡菜单按钮触发（shadcn/ui Sidebar 内置支持）

## 验证标准

### 预期行为

- 访问 `/chat`、`/documents`、`/settings` 都能看到侧边栏 + 顶部栏布局
- 点击导航项能正确跳转，当前页面导航项高亮
- 侧边栏折叠/展开动画流畅
- 主题切换按钮能切换亮色/暗色
- 面包屑根据路由动态变化
- 移动端侧边栏能通过汉堡菜单打开/关闭
- 布局整体样式与 UI 截图一致（方向性一致，不要求像素级）

### 需要通过的测试

- test: 渲染 AppSidebar 组件，包含 Chat、Documents、Settings 三个导航项
- test: 渲染 ThemeToggle 组件，点击后主题在 light/dark 间切换

## 完成标志

- [x] 侧边栏组件实现（导航、折叠、用户信息占位）
- [x] 顶部栏组件实现（面包屑、搜索占位、主题切换、登出占位）
- [x] 路由跳转和导航高亮正常
- [x] 响应式布局正常
- [x] 主题切换正常
- [x] 测试通过
- [x] `pnpm build` 构建成功
