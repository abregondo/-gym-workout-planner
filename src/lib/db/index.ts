import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";
import { localDb } from "./local";

// Production (Vercel): TURSO_DATABASE_URL + TURSO_AUTH_TOKEN point at a hosted
// Turso (libSQL) database — local files don't persist on serverless.
// Development: falls back to the local SQLite file.
const tursoUrl = process.env.TURSO_DATABASE_URL;

export const db = tursoUrl
  ? drizzleLibsql(createClient({ url: tursoUrl, authToken: process.env.TURSO_AUTH_TOKEN }), {
      schema,
    })
  : localDb;
