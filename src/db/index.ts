// ============================================================
// Database Connection — Housing Near Hospitals
//
// Uses Neon serverless driver + Drizzle ORM.
// Only initializes when DATABASE_URL is set.
// ============================================================

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const DATABASE_URL = process.env.DATABASE_URL;

function createDb() {
  if (!DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Set it in .env to connect to Neon Postgres."
    );
  }
  const sql = neon(DATABASE_URL);
  return drizzle(sql, { schema });
}

// Lazy singleton — only created on first access
let _db: ReturnType<typeof createDb> | null = null;

export function getDb() {
  if (!_db) {
    _db = createDb();
  }
  return _db;
}

export { schema };
