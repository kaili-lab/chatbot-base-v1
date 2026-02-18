import { relations } from "drizzle-orm";

import { conversations } from "./conversations";
import { documents } from "./documents";
import { embeddings } from "./embeddings";
import { folders } from "./folders";
import { messages } from "./messages";

export const foldersRelations = relations(folders, ({ one, many }) => ({
  parent: one(folders, {
    fields: [folders.parentId],
    references: [folders.id],
    relationName: "folder_parent",
  }),
  children: many(folders, { relationName: "folder_parent" }),
  documents: many(documents),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  folder: one(folders, {
    fields: [documents.folderId],
    references: [folders.id],
  }),
  embeddings: many(embeddings),
}));

export const embeddingsRelations = relations(embeddings, ({ one }) => ({
  document: one(documents, {
    fields: [embeddings.documentId],
    references: [documents.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ many }) => ({
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));
