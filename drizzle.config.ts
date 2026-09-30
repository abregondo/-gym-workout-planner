import type { Config } from "drizzle-kit";

// Push to Turso when TURSO_DATABASE_URL is set, otherwise the local SQLite file.
const tursoUrl = process.env.TURSO_DATABASE_URL;

export default {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  ...(tursoUrl
    ? {
        dialect: "turso",
        dbCredentials: { url: tursoUrl, authToken: process.env.TURSO_AUTH_TOKEN! },
      }
    : {
        dialect: "sqlite",
        dbCredentials: { url: "./data/gym.db" },
      }),
} satisfies Config;
