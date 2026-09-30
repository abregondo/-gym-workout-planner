import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";

/**
 * Local-only SQLite database. Used for development and by the maintenance
 * scripts (fetch, fill and dump scripts), which need better-sqlite3's
 * synchronous API. App runtime code should import { db } from "./index",
 * which switches to Turso in production.
 */
const sqlite = new Database("./data/gym.db");
sqlite.pragma("journal_mode = WAL");

export const localDb = drizzle(sqlite, { schema });
