import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const settings = pgTable("settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().unique(),
  llmBaseUrl: text("llm_base_url"),
  llmApiKey: text("llm_api_key"),
  llmModel: text("llm_model"),
  embeddingModel: text("embedding_model"),
  embeddingDimension: integer("embedding_dimension"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
