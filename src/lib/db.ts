import { neon, NeonQueryFunction } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL;

/**
 * Neon SQL tagged template function.
 * Returns empty results gracefully if DATABASE_URL is not configured.
 */
export const sql: NeonQueryFunction<false, false> = DATABASE_URL
  ? neon(DATABASE_URL)
  : (async () => []) as unknown as NeonQueryFunction<false, false>;
