import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://avatarapp:avatarapp_secret_2024@localhost:5432/avatarapp",
});

export const db = drizzle(pool, { schema });
