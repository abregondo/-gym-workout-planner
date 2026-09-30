import { mkdirSync } from "node:fs";
import { drizzle } from "drizzle-orm/better-sqlite3";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";

/**
 * Local-only SQLite database. Used for development and by the maintenance
 * scripts (fetch, fill and dump scripts), which need better-sqlite3's
 * synchronous API. App runtime code should import { db } from "./index",
 * which switches to Turso in production.
 *
 * Lazily opened on first use: merely importing this module must NOT touch
 * the filesystem, because Vercel's build imports the module graph (via the
 * auth route) where ./data does not exist.
 */
let cached: BetterSQLite3Database<typeof schema> | undefined;

export function openLocalDb(): BetterSQLite3Database<typeof schema> {
  if (!cached) {
    mkdirSync("./data", { recursive: true });
    const sqlite = new Database("./data/gym.db");
    sqlite.pragma("journal_mode = WAL");
    cached = drizzle(sqlite, { schema });
  }
  return cached;
}
