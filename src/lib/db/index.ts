import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // 启动时强制检查连接字符串，避免运行到数据库操作时才报错
  throw new Error("DATABASE_URL is not set");
}

const client = postgres(connectionString);

export const db = drizzle(client, { schema });
export { client };
