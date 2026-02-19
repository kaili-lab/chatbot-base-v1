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

### 配置完整性检查（Tailwind v4 + shadcn/ui 初始化容易不完整，需逐项确认）

- [ ] `src/app/globals.css` 包含 `@custom-variant dark` 声明（Tailwind v4 class-based 暗色模式必须）
- [ ] `globals.css` 的 `:root` 中定义了完整的 shadcn/ui 颜色变量（`--primary`、`--secondary`、`--muted`、`--accent`、`--border`、`--input`、`--ring`、`--card`、`--popover` 及各自的 `-foreground`）
- [ ] `globals.css` 包含 `.dark` 选择器并定义了对应暗色变量
- [ ] `globals.css` 的 `@theme inline` 中将所有颜色变量映射为 `--color-*` 格式
- [ ] `components.json` 中 `cssVariables: true`
- [ ] `src/lib/utils.ts` 存在且包含 `cn()` 函数

### 功能验证

- `pnpm dev` 能正常启动，浏览器访问 `http://localhost:3000` 看到页面
- shadcn/ui Button **有背景色**（如果是透明的，说明 CSS 变量未正确定义）
- 主题切换功能正常（亮色/暗色/跟随系统）
- Sonner toast 能正常弹出
- `pnpm build` 构建成功，无 TypeScript 错误

## 完成标志

- [x] 项目初始化完成
- [x] shadcn/ui 配置完成，组件样式正常（非透明）
- [x] next-themes 主题切换正常
- [x] Sonner 通知正常
- [x] 目录结构符合规范
- [x] TypeScript 严格模式，构建无错误
