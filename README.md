# KnowledgeChat

![Next.js](https://img.shields.io/badge/Next.js_15-App_Router-black?logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pgvector-336791?logo=postgresql&logoColor=white)
![Vercel AI SDK](https://img.shields.io/badge/Vercel_AI_SDK-streaming-black?logo=vercel&logoColor=white)
![Better Auth](https://img.shields.io/badge/Better_Auth-email_%2B_OAuth-22c55e)

> Turn your documents into a queryable knowledge base — full RAG pipeline with pgvector semantic search, streaming AI responses, and bring-your-own-LLM support.

[🔗 Live Demo](#demo) · [中文文档](./README_CN.md)

---

<!-- SCREENSHOT: Record a 5–8s GIF of the core flow: type a question → streaming response appears → "Sources referenced" section expands to show cited documents. Place the file at public/demo.gif and replace this comment with: ![Demo](./public/demo.gif) -->
> **Screenshot pending** — GIF will be added after live deployment.

---

## ✨ Highlights

**End-to-end RAG pipeline** — Upload Markdown or plain-text files; the system automatically parses, chunks (Markdown-aware recursive splitting), and embeds them into pgvector. Every AI response cites the exact source documents with a link back to the original.

**Bring your own LLM** — Connect any OpenAI-compatible API (OpenAI, Azure OpenAI, local models via Ollama, etc.). Your API key is AES-encrypted before storage and never sent to the client.

**Honest fallback with source attribution** — Similarity threshold dynamically adapts to question length. When no relevant chunks are found, the response is explicitly labeled "general answer" rather than silently hallucinating from an empty context.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript |
| UI | shadcn/ui + Tailwind CSS |
| Database | PostgreSQL + pgvector |
| ORM | Drizzle ORM |
| Auth | Better Auth — email/password + Google OAuth |
| AI | Vercel AI SDK + any OpenAI-compatible API |
| Email | Resend |
| Deployment | Vercel |

---

## Features

**Knowledge base management**
- Nested folder tree — create folders and sub-folders to organize documents
- Upload `.md` / `.txt` files, or create notes in the built-in Markdown editor (split-pane edit + preview)
- Document detail page — view extracted text, file metadata, and processing status

**Document processing pipeline**
- Text extraction → recursive character text splitting (respects Markdown headings, paragraphs, sentences) → vector embedding via `text-embedding-3-small` → stored in pgvector

**Semantic chat**
- Conversation list with star (pinned), rename, and delete
- Streaming responses with full Markdown rendering (headings, code blocks, lists)
- "Sources referenced" collapsible section — shows cited document names, click to open original

**LLM configuration**
- Configure base URL, API key, and model per user account
- "Test Connection" validates both the chat and embedding API before saving

**Auth & multi-tenancy**
- Email + password with email verification (Resend), Google OAuth
- All data scoped by `userId` — no cross-user data leakage

**UX**
- Dark / light theme toggle
- Collapsible sidebar (icon-only mode)

## Architecture

```
                    ┌─────────────────────────────┐
                    │        RAG Pipeline          │
  Upload file ──►  Parse  ──►  Chunk  ──►  Embed  ──►  pgvector
                    └─────────────────────────────┘
                                                        │
  User question ──►  Embed  ──►  cosine similarity ────┘
                                       │
                               Top-K chunks (k=10)
                               + dynamic threshold
                                       │
                              LLM (context injection)
                                       │
                          Streaming response + sources
```

**Key design decisions:**
- Server Components by default; `"use client"` only where interaction is required
- Server Actions for all mutations; Route Handlers only for external-facing APIs
- Chunking uses recursive splitting (500–1000 chars, 100-char overlap) — no extra model calls needed
- `DocumentParser` interface makes adding PDF/DOCX parsers a drop-in change

## Getting Started

**Prerequisites:** Node.js 18+, pnpm, PostgreSQL with the pgvector extension enabled

1. **Clone and install**
   ```bash
   git clone https://github.com/your-username/knowledgechat.git
   cd knowledgechat
   pnpm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   Required variables:

   | Variable | Description |
   |---|---|
   | `DATABASE_URL` | PostgreSQL connection string |
   | `BETTER_AUTH_SECRET` | Random secret (≥ 32 chars) |
   | `BETTER_AUTH_URL` | App base URL (`http://localhost:3000` locally) |
   | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth credentials |
   | `RESEND_API_KEY` / `RESEND_FROM` | Transactional email |
   | `ENCRYPTION_KEY` | AES key for LLM API key encryption |

3. **Run database migrations**
   ```bash
   pnpm db:generate
   pnpm db:migrate
   ```

4. **Start the dev server**
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

5. **Configure your LLM** — Go to **Settings**, enter your OpenAI-compatible base URL, API key, and model name, then click **Test Connection**.

## Roadmap

- [ ] PDF and DOCX support — `DocumentParser` interface is already defined; implementations pending
- [ ] Live demo deployment

## License

MIT

---

<a name="demo"></a>
> **Demo coming soon.** The live deployment will be linked here once available.
