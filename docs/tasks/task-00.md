# Task 00: 环境准备（人工操作，非 AI 执行）

## 说明

本 task 由开发者手动完成，列出整个项目开发过程中需要的所有第三方服务和环境变量。全部准备好之后，后续 task 可由 AI 工具无中断执行。

## 需要注册的服务

### 1. Neon 数据库（Phase 1 需要）

- 注册 [neon.tech](https://neon.tech)
- 创建新项目（Region 选择离你最近的）
- Neon 已内置 pgvector 扩展，无需手动启用
- 获取连接字符串

```
DATABASE_URL=postgresql://username:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
```

### 2. Resend 邮件服务（Phase 2 需要）

- 注册 [resend.com](https://resend.com)
- 创建 API Key
- 配置发件域名（或使用 Resend 提供的测试域名）

```
RESEND_API_KEY=re_xxxxxxxx
```

### 3. Google OAuth（Phase 2 需要）

- 进入 [Google Cloud Console](https://console.cloud.google.com)
- 创建项目 → 启用 Google+ API
- 配置 OAuth 同意屏幕
- 创建 OAuth 2.0 客户端 ID（类型：Web 应用）
- 授权重定向 URI 添加：`http://localhost:3000/api/auth/callback/google`

```
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxx
```

### 4. LLM 中转平台 API Key（Phase 3 需要）

- 从你使用的中转平台获取 API Key 和 Base URL
- 这个是开发测试用的，用户正式使用时在设置页面填自己的

```
# 开发测试用，写入 .env.local
TEST_LLM_BASE_URL=https://your-proxy.com/v1
TEST_LLM_API_KEY=sk-xxxxxxxx
TEST_LLM_MODEL=gpt-4o
TEST_EMBEDDING_MODEL=text-embedding-3-small
```

### 5. Better Auth Secret（Phase 2 需要）

- 生成一个随机字符串作为 session 加密密钥

```
BETTER_AUTH_SECRET=随机字符串（可用 openssl rand -base64 32 生成）
BETTER_AUTH_URL=http://localhost:3000
```

### 6. API Key 加密密钥（Phase 3 需要）

- 用于加密存储用户的 LLM API Key

```
ENCRYPTION_KEY=随机字符串（可用 openssl rand -base64 32 生成）
```

## 完整的 .env.local 模板

```bash
# ===== 数据库 =====
DATABASE_URL=

# ===== 认证 =====
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000

# ===== Google OAuth =====
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# ===== 邮件 =====
RESEND_API_KEY=

# ===== 加密 =====
ENCRYPTION_KEY=

# ===== 开发测试用 LLM 配置 =====
TEST_LLM_BASE_URL=
TEST_LLM_API_KEY=
TEST_LLM_MODEL=
TEST_EMBEDDING_MODEL=
```

## 验证标准

- [x] Neon 数据库创建完成，连接字符串可用
- [x] Resend API Key 获取完成
- [x] Google OAuth 凭据创建完成
- [x] LLM 中转平台 API Key 可用
- [x] BETTER_AUTH_SECRET 和 ENCRYPTION_KEY 已生成
- [x] `.env.local` 文件已创建，所有变量已填写
