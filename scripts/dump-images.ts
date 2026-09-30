/**
 * Dump exercise image URLs from the LOCAL SQLite DB into src/lib/db/images.ts
 * so fresh databases (e.g. production Turso) seed WITH images.
 *
 * Usage (from project root):
 *   npx tsx scripts/dump-images.ts
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import Database from "better-sqlite3";

const db = new Database("./data/gym.db", { readonly: true });
const rows = db
  .prepare(
    "SELECT name, image_url AS imageUrl, image_url_female AS imageUrlFemale FROM exercise WHERE image_url IS NOT NULL OR image_url_female IS NOT NULL ORDER BY name"
  )
  .all() as { name: string; imageUrl: string | null; imageUrlFemale: string | null }[];

const entries = rows
  .map(
    (r) =>
      `  ${JSON.stringify(r.name)}: { imageUrl: ${JSON.stringify(r.imageUrl)}, imageUrlFemale: ${JSON.stringify(r.imageUrlFemale)} },`
  )
  .join("\n");

const content = `/**
 * Exercise image URLs, dumped from the local DB by scripts/dump-images.ts.
 * Used by the seed so fresh databases (production) get images from day one.
 * DO NOT EDIT BY HAND — re-run the dump script instead.
 */
export const IMAGE_URLS: Record<string, { imageUrl: string | null; imageUrlFemale: string | null }> = {
${entries}
};
`;

writeFileSync(join(process.cwd(), "src", "lib", "db", "images.ts"), content);
console.log(`Wrote ${rows.length} image entries to src/lib/db/images.ts`);
