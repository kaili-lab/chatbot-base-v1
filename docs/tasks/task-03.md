# Task 03: 编写项目 CLAUDE.md（开发规范 + 测试策略）

## 依赖

- 前置 task：Task 01
- 相关文件：项目根目录 `CLAUDE.md`

## 需求描述

编写项目级的 CLAUDE.md，作为 AI 开发工具在本项目中的执行规范。所有后续 task 的实现都必须遵守此文件中的规则。

## 实现要点

CLAUDE.md 应包含以下章节：

### 1. 项目概述

- 一句话描述项目
- 技术栈清单
- 关键文件路径说明

### 2. Next.js 开发规范

从 PRD 2.2 节提取，包括：
- Server Components 优先原则
- Server Actions 用于数据变更
- Route Groups 组织路由
- 环境变量命名规范
- layout.tsx / loading.tsx / error.tsx 使用规范
- Metadata 导出要求

### 3. 代码风格

- TypeScript 严格模式，禁止 `any`
- 中文注释：仅在关键逻辑点添加，说明 WHAT 和 WHY
- 组件命名：PascalCase
- 文件命名：kebab-case
- 使用 Zod 做所有外部输入验证（API 输入、表单数据）
- Server Actions 必须有错误处理和输入验证

### 4. 数据库规范

- 所有业务表必须包含 userId 字段做数据隔离
- 查询时必须带 userId 过滤条件
- 使用 Drizzle 的 query builder，不写原生 SQL（除非 pgvector 相似度查询）

### 5. 测试策略

- 使用 Vitest 作为测试框架
- 单元测试覆盖：工具函数、文本分块逻辑、数据转换
- 集成测试覆盖：Server Actions、数据库操作
- 每次实现新功能后运行 `pnpm test` 确保通过
- 测试文件放在 `__tests__/` 目录下，或与源文件同目录的 `*.test.ts`

### 6. 常用命令

```
pnpm dev          # 启动开发服务器
pnpm build        # 构建项目
pnpm test         # 运行测试
pnpm db:generate  # 生成数据库迁移
pnpm db:migrate   # 执行迁移
pnpm db:studio    # 打开 Drizzle Studio
```

## 验证标准

### 预期行为

- CLAUDE.md 文件存在于项目根目录
- 内容覆盖上述所有章节
- 规范与 PRD 中的技术约束一致，无矛盾
- Vitest 已安装并配置，`pnpm test` 能正常运行（即使暂时没有测试用例）

## 完成标志

- [x] CLAUDE.md 编写完成
- [x] Vitest 安装和配置完成
- [x] `pnpm test` 命令可用
- [x] 规范与 PRD 一致
