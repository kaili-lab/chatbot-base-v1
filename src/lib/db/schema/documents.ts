import { boolean, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { folders } from "./folders";

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  folderId: uuid("folder_id").references(() => folders.id),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").$type<"md" | "txt">().notNull(),
  fileSize: integer("file_size").notNull(),
  content: text("content").notNull(),
  isNote: boolean("is_note").default(false).notNull(),
  status: text("status")
    .$type<"uploading" | "processing" | "completed" | "failed">()
    .default("processing")
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
