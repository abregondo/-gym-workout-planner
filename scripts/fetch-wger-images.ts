/**
 * Fetch exercise photos from wger's open API and store them in exercises.imageUrl.
 *
 * Usage (from project root):
 *   npx tsx scripts/fetch-wger-images.ts --dry-run   # print match report
 *   npx tsx scripts/fetch-wger-images.ts --apply     # write matches to the DB
 *
 * Images are CC BY-SA 4.0 (authors vary, mostly Everkinetic / wger contributors).
 * Re-runs simply refresh the stored URL for each match.
 */
import { localDb as db } from "../src/lib/db/local";
import { exercises } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

const API = "https://wger.de/api/v2/exerciseinfo/?language=2&limit=100";

interface WgerImage {
  image: string;
  thumbnails?: { small?: string; medium?: string; large?: string };
  is_main?: boolean;
  license_author?: string;
}

interface WgerExercise {
  id: number;
  translations: { name: string; language: number }[];
  images: WgerImage[];
}

/** Our normalized exercise name -> wger's name (for pairs the scorer can't see). */
const ALIASES: Record<string, string> = {
  // back / rows
  "dumbbell row": "Bent Over Dumbbell Rows (Single Arm)",
  "chest supported row": "Incline Chest-Supported Dumbbell Row",
  "machine row": "Seated Row (Machine)",
  "t bar row": "Rowing, T-bar",
  "back extension": "Lower Back Extensions",
  // pulldowns
  "lat pulldown": "Close-grip Lat Pull Down",
  "close grip lat pulldown": "Close-grip Lat Pull Down",
  // curls
  "barbell curl": "Biceps Curls With Barbell",
  "dumbbell curl": "Biceps Curls With Dumbbell",
  "alternating dumbbell curl": "Alternating Biceps Curls With Dumbbell",
  "cable curl": "Biceps Curl With Cable",
  "bayesian cable curl": "Biceps Curl With Cable",
  "ez bar curl": "Biceps Curls With SZ-bar",
  "reverse curl": "Reverse Grip Barbell Curls",
  // triceps
  "cable pushdown": "Tricep Pushdown on Cable",
  "rope pushdown": "Tricep Rope Pushdowns",
  "dumbbell overhead extension": "Triceps Overhead (Dumbbell)",
  // raises / shoulders
  "dumbbell front raise": "Shoulder Raise (Dumbbell)",
  "cable front raise": "Cable Front Raise with a small bar",
  "face pull": "Face pulls with yellow/green band",
  // misc
  "incline cable fly": "Fly With Cable",
  "bulgarian split squat": "Bulgarian split squats left",
  "sit up": "Sit Up Elbow Thrust",
  "lying leg raise": "Leg Raises, Lying",
  "stationary bike": "Stationary bike cardio",
  "spin bike": "Stationary bike cardio",
  "back squat": "Barbell squat",
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/** Canonical form so plurals/inflections line up: raises→rais, press→press, ups→up. */
function canon(t: string): string {
  if (t.endsWith("ss")) return t; // press
  if (t.endsWith("s")) t = t.slice(0, -1); // raises→raise, ups→up, curls→curl
  if (t.endsWith("e")) t = t.slice(0, -1); // raise→rais, cable→cabl
  return t;
}

function tokens(s: string): string[] {
  return normalize(s).split(" ").filter(Boolean).map(canon);
}

/** Extra words that don't change which exercise it is (canonicalized to match tokens()). */
const BENIGN_CANON = new Set(
  [
    // fillers
    "with", "on", "the", "a", "an", "for", "using", "and", "at", "by", "w", "do", "exercise",
    // equipment
    "barbell", "dumbbell", "dumbbells", "cable", "machine", "smith", "ez", "rope", "kettlebell",
    "band", "banded", "plate", "weighted", "stability", "ball", "bosu", "pulley", "wheel", "bench",
  ].map(canon)
);

/**
 * Tiers:
 *  1.0  normalized equal
 *  0.95 same token set after stemming ("Pull-Ups" vs "Pull-up")
 *  0.9  ours ⊆ theirs, extra words on their side are benign ("Concentration Curl" ← "Cable Concentration Curl")
 *  0.85 theirs ⊆ ours, our extra words are equipment-only ("Smith Machine Bench Press" ← "Bench Press")
 *  0.75 theirs ⊆ ours, any extras (their name is the broader version: "Ab Wheel Rollout" ← "Ab wheel")
 *  0    otherwise — no fuzzy/partial matching, mismatched modifiers never match
 */
function scoreMatch(ours: string, theirs: string): number {
  const a = normalize(ours);
  const b = normalize(theirs);
  if (a === b) return 1;

  const at = tokens(ours);
  const bt = tokens(theirs);
  const as = new Set(at);
  const bs = new Set(bt);
  if (at.length && at.length === bt.length && at.every((t) => bs.has(t))) return 0.95;

  const aSubB = at.length > 0 && at.every((t) => bs.has(t));
  const bSubA = bt.length > 0 && bt.every((t) => as.has(t));

  if (aSubB && at.length < bt.length) {
    const extras = bt.filter((t) => !as.has(t));
    return extras.every((t) => BENIGN_CANON.has(t)) ? 0.9 : 0;
  }
  if (bSubA && bt.length < at.length) {
    const extras = at.filter((t) => !bs.has(t));
    return extras.every((t) => BENIGN_CANON.has(t)) ? 0.85 : 0.75;
  }
  return 0;
}

/** Nearest wger name by token coverage — used only for dry-run suggestions. */
function coverage(ours: string, theirs: string): number {
  const at = tokens(ours);
  const bt = new Set(tokens(theirs));
  if (!at.length) return 0;
  return at.filter((t) => bt.has(t)).length / at.length;
}

async function fetchAllWger(): Promise<WgerExercise[]> {
  const all: WgerExercise[] = [];
  let next: string | null = API;
  while (next) {
    const res = await fetch(next, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`wger ${res.status} for ${next}`);
    const page = (await res.json()) as { results: WgerExercise[]; next: string | null };
    all.push(...page.results);
    next = page.next;
    process.stdout.write(`\rfetched ${all.length} wger exercises...`);
  }
  process.stdout.write("\n");
  return all;
}

function pickImage(ex: WgerExercise): { url: string; author: string } | null {
  if (!ex.images.length) return null;
  const img =
    ex.images.find((i) => i.is_main && i.thumbnails?.medium) ??
    ex.images.find((i) => i.thumbnails?.medium) ??
    ex.images.find((i) => i.is_main) ??
    ex.images[0];
  const url = img.thumbnails?.medium ?? img.image;
  if (!url) return null;
  return { url, author: (img.license_author || "").trim() };
}

async function main() {
  const apply = process.argv.includes("--apply");

  const wger = await fetchAllWger();
  const ours = await db.select().from(exercises);

  type Candidate = { key: string; name: string; img: { url: string; author: string } };
  const candidates: Candidate[] = [];
  for (const w of wger) {
    const name = w.translations.find((t) => t.language === 2)?.name;
    if (!name) continue;
    const img = pickImage(w);
    if (img) candidates.push({ key: String(w.id), name, img });
  }

  const used = new Set<string>();
  const authors = new Set<string>();
  const results: { id: string; ours: string; theirs: string | null; url: string | null }[] = [];

  for (const ex of ours) {
    const target = ALIASES[normalize(ex.name)] ?? normalize(ex.name);
    let best: { rank: number; c: Candidate } | null = null;

    for (const c of candidates) {
      const s = scoreMatch(target, c.name);
      if (s < 0.75) continue;
      const rank = s - (used.has(c.key) ? 0.15 : 0);
      if (!best || rank > best.rank) best = { rank, c };
    }

    if (best) {
      used.add(best.c.key);
      if (best.c.img.author) authors.add(best.c.img.author);
      results.push({ id: ex.id, ours: ex.name, theirs: best.c.name, url: best.c.img.url });
    } else {
      results.push({ id: ex.id, ours: ex.name, theirs: null, url: null });
    }
  }

  const matched = results.filter((r) => r.url);
  const missed = results.filter((r) => !r.url);

  console.log(`\n=== wger match report ===`);
  console.log(`our exercises: ${results.length} | matched: ${matched.length} | unmatched: ${missed.length}`);
  console.log(`image authors: ${authors.size ? [...authors].join(", ") : "n/a"}`);

  if (matched.length) {
    console.log(`\nMATCHED (${matched.length}):`);
    matched.forEach((r) => console.log(`  ${r.ours}  ->  ${r.theirs}`));
  }
  if (missed.length) {
    console.log(`\nUNMATCHED (${missed.length}) — nearest wger names (img = has photo):`);
    for (const r of missed) {
      const near = wger
        .map((w) => {
          const name = w.translations.find((t) => t.language === 2)?.name;
          if (!name) return null;
          return { name, cov: coverage(r.ours, name), img: w.images.length > 0 };
        })
        .filter((x): x is { name: string; cov: number; img: boolean } => !!x && x.cov >= 0.5)
        .sort((a, b) => b.cov - a.cov || Number(b.img) - Number(a.img))
        .slice(0, 2);
      const hint = near.length
        ? near.map((n) => `~~ ${n.name} (img:${n.img ? "Y" : "N"})`).join("   ")
        : "(no close wger name)";
      console.log(`  - ${r.ours}  ${hint}`);
    }
  }

  if (!apply) {
    console.log(`\nDry run — no rows written. Re-run with --apply to save the ${matched.length} matches.`);
    return;
  }

  let written = 0;
  for (const r of matched) {
    if (!r.url) continue;
    const res = await db
      .update(exercises)
      .set({ imageUrl: r.url })
      .where(eq(exercises.id, r.id))
      .run();
    written += res.changes ?? 0;
  }

  const rows = await db.select().from(exercises);
  const withImage = rows.filter((r) => r.imageUrl).length;
  console.log(`\nApplied: ${written} rows updated.`);
  console.log(`exercises with imageUrl now: ${withImage}/${rows.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

