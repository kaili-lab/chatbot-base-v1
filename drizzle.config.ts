import { config } from "dotenv";
import type { Config } from "drizzle-kit";

// drizzle-kit 不会自动读取 .env.local，这里显式加载避免迁移命令拿不到 DATABASE_URL
config({ path: ".env.local" });

export default {
  schema: "./src/lib/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  strict: true,
  verbose: true,
} satisfies Config;
