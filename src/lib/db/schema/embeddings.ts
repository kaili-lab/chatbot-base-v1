import { integer, jsonb, pgTable, text, timestamp, uuid, vector } from "drizzle-orm/pg-core";

import { documents } from "./documents";

export const embeddings = pgTable("embeddings", {
  id: uuid("id").defaultRandom().primaryKey(),
  documentId: uuid("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  content: text("content").notNull(),
  // 使用默认 1536 维向量，便于先跑通流程，后续由配置动态调整
  vector: vector("vector", { dimensions: 1536 }).notNull(),
  chunkIndex: integer("chunk_index").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
