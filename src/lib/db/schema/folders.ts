import { foreignKey, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const folders = pgTable(
  "folders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    parentId: uuid("parent_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    // 避免在表定义中直接自引用导致 TS 推断失败，同时保留数据库层外键约束
    parentIdFk: foreignKey({
      columns: [table.parentId],
      foreignColumns: [table.id],
    }),
  })
);
