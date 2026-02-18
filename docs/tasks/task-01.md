# Task 01: 初始化 Next.js 项目 + 基础配置

## 依赖

- 前置 task：无
- 相关文件：项目根目录

## 需求描述

创建 Next.js 项目，配置基础开发环境和 UI 基础设施。这是所有后续 task 的基础。

## 实现要点

### 项目初始化

- 在 `D:\web\my-projects\chatbot-base` 目录下执行初始化，使用 `.` 表示当前目录作为项目根目录：
  ```bash
  pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
  ```
- 目录非空时（已有 `docs/` 目录）工具会提示警告，选择继续即可，不会覆盖已有文件
- 项目名称即为目录名 `chatbot-base`
- 包管理器使用 pnpm

### shadcn/ui 配置

- 初始化 shadcn/ui（`pnpm dlx shadcn@latest init`）
- 预装常用组件：Button、Input、Card、Dialog、DropdownMenu、Separator、Badge、Skeleton、Tooltip
- 配置 CSS 变量主题方案

### next-themes 配置

- 安装 next-themes
- 在 root layout 中配置 ThemeProvider，支持 light/dark/system 三种模式
- 默认跟随系统主题

### Sonner 配置

- 安装 sonner
- 在 root layout 中添加 Toaster 组件

### 项目结构

```
src/
├── app/
│   ├── layout.tsx          # Root layout（ThemeProvider + Toaster）
│   ├── page.tsx            # 首页占位
│   ├── (auth)/             # 认证相关路由组
│   │   ├── login/
│   │   └── register/
│   └── (app)/              # 已登录用户路由组
│       ├── layout.tsx      # App layout（侧边栏 + 顶部栏，Task 04 实现）
│       ├── chat/
│       ├── documents/
│       └── settings/
├── components/
│   └── ui/                 # shadcn/ui 组件
├── lib/
│   └── utils.ts            # shadcn/ui 工具函数
└── styles/
    └── globals.css
```

### 其他配置

- TypeScript 严格模式（`strict: true`）
- 配置 `.env.local.example` 列出所有需要的环境变量（留空值）
- 配置 `.gitignore`

## 验证标准

### 预期行为

- `pnpm dev` 能正常启动，浏览器访问 `http://localhost:3000` 看到页面
- shadcn/ui 组件能正常渲染（在首页放一个 Button 测试）
- 主题切换功能正常（亮色/暗色/跟随系统）
- Sonner toast 能正常弹出
- `pnpm build` 构建成功，无 TypeScript 错误

## 完成标志

- [x] 项目初始化完成
- [x] shadcn/ui 配置完成，组件可用
- [x] next-themes 主题切换正常
- [x] Sonner 通知正常
- [x] 目录结构符合规范
- [x] TypeScript 严格模式，构建无错误
