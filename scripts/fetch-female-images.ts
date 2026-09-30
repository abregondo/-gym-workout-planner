/**
 * Fetch FEMALE exercise illustrations from marcmayol/exercise-api and store
 * them in exercises.imageUrlFemale (used when the Gender filter = Women).
 *
 * Usage (from project root):
 *   npx tsx scripts/fetch-female-images.ts --dry-run   # print match report + link check
 *   npx tsx scripts/fetch-female-images.ts --apply     # write matches to the DB
 *
 * Source: https://github.com/marcmayol/exercise-api — MIT-style WITH MANDATORY
 * ATTRIBUTION. Index is served from GitHub Pages; image URLs are rewritten from
 * marcmayol.com (slow/unreachable here) to the identical assets on
 * marcmayol.github.io (verified HTTP 200).
 */
import { openLocalDb } from "../src/lib/db/local";

const db = openLocalDb();
import { exercises } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

const INDEX = "https://marcmayol.github.io/exercise-api/v1/exercises.json";
const GOOD_HOST = "https://marcmayol.github.io/exercise-api/images/";

interface SourceExercise {
  slug: string;
  name: { es: string; en: string };
  group: { id: string; es: string; en: string };
  equipment: { id: string; es: string; en: string };
  image: { male: string; female: string };
}

/** Our normalized exercise name -> their English name (for pairs the scorer can't see). */
const ALIASES: Record<string, string> = {
  // squats / deadlifts
  "back squat": "Barbell squat",
  "stiff leg deadlift": "Romanian deadlift",
  "single leg romanian deadlift": "Romanian deadlift",
  "rack pull": "Deadlift",
  "smith machine squat": "Sled hack squat (45°)",
  "sumo squat": "Goblet squat",
  // rows / back
  "barbell row": "Bent-over barbell row",
  "pendlay row": "Bent-over barbell row",
  "dumbbell row": "Bent-over dumbbell row",
  "single arm cable row": "Seated cable row",
  "machine row": "Seated row machine",
  "chest supported row": "Inverted row",
  // pulldowns
  "lat pulldown": "Lat pulldown",
  // chest
  "cable fly": "Cable crossover",
  "high to low cable fly": "Cable crossover",
  "incline cable fly": "Low cable fly (low-to-high)",
  "decline dumbbell press": "Dumbbell bench press",
  "machine chest press": "Seated chest press",
  "smith machine bench press": "Barbell bench press",
  "pec deck": "Machine chest fly (pec deck)",
  "reverse pec deck": "Reverse fly",
  "rear delt fly": "Reverse fly",
  "chin ups": "Pull-ups",
  "assisted chest dips": "Dips machine",
  // curls
  "barbell curl": "Barbell biceps curl",
  "ez bar curl": "Barbell biceps curl",
  "reverse curl": "Barbell biceps curl",
  "drag curl": "Barbell biceps curl",
  "dumbbell curl": "Alternating dumbbell biceps curl",
  "alternating dumbbell curl": "Alternating dumbbell biceps curl",
  // triceps
  "cable pushdown": "Triceps pushdown",
  "straight bar pushdown": "Triceps pushdown",
  "ez bar skull crusher": "Lying triceps extension (skull crusher)",
  "dumbbell skull crusher": "Lying triceps extension (skull crusher)",
  "cable skull crusher": "Lying triceps extension (skull crusher)",
  "overhead cable extension": "Cable overhead triceps extension",
  "dumbbell overhead extension": "Overhead triceps extension",
  "dumbbell kickback": "Triceps kickback",
  "cable kickback": "Triceps kickback",
  "triceps dips": "Bench dips",
  "assisted triceps dips": "Dips machine",
  "close grip push up": "Diamond push-up",
  "jm press": "Close-grip bench press",
  // shoulders
  "dumbbell shoulder press": "Seated dumbbell shoulder press",
  "smith machine shoulder press": "Cable shoulder press",
  "machine lateral raise": "Dumbbell lateral raises",
  // legs
  "walking lunges": "Dumbbell lunges",
  "reverse lunges": "Dumbbell lunges",
  "forward lunges": "Dumbbell lunges",
  "curtsy lunges": "Dumbbell lunges",
  "glute ham raise": "Nordic hamstring curl",
  "dumbbell hip thrust": "Barbell hip thrust",
  "machine glute kickback": "Cable glute kickback",
  "smith machine calf raise": "Standing calf raise",
  "donkey calf raise": "Standing calf raise",
  "single leg calf raise": "Standing calf raise",
  // core
  "crunch": "Abdominal crunch",
  "weighted crunch": "Abdominal crunch",
  "machine crunch": "Abdominal crunch",
  "heel touches": "Abdominal crunch",
  "reverse crunch": "Legs-up crunch",
  "hanging knee raise": "Hanging leg raise",
  "captain s chair knee raise": "Hanging leg raise",
  "cable woodchop": "Cable woodchopper",
  "standing cable rotation": "Cable woodchopper",
  // cardio / misc
  "elliptical": "Elliptical trainer",
  "step machine": "Stair climber",
  "stationary bike": "Stationary bike",
  "spin bike": "Stationary bike",
  "sit up": "Sit-up",
  "lying leg raise": "Lying leg raise",
  "farmer s carry": "Farmer's walk",
  "hack squat": "Hack squat (upright)",
  "reverse wrist curl": "Standing barbell reverse wrist curl",
  "nordic curl": "Nordic hamstring curl",
  "rope pushdown": "Triceps pushdown",
  "clean press": "Barbell overhead press",
  "thruster": "Front squat",
  "dumbbell thruster": "Goblet squat",
  "banded hip abduction": "Hip abduction machine",
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
    "with", "on", "the", "a", "an", "for", "using", "and", "at", "by", "w", "do", "exercise",
    "barbell", "dumbbell", "dumbbells", "cable", "machine", "smith", "ez", "rope", "kettlebell",
    "band", "banded", "plate", "weighted", "stability", "ball", "bosu", "pulley", "wheel", "bench",
  ].map(canon)
);

/**
 * Tiers (same proven scorer as the wger script):
 *  1.0  normalized equal
 *  0.95 same token set after stemming
 *  0.9  ours ⊆ theirs, their extra words are benign
 *  0.85 theirs ⊆ ours, our extra words are equipment-only
 *  0.75 theirs ⊆ ours, any extras
 *  0    otherwise
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

/** Nearest source name by token coverage — used only for dry-run suggestions. */
function coverage(ours: string, theirs: string): number {
  const at = tokens(ours);
  const bt = new Set(tokens(theirs));
  if (!at.length) return 0;
  return at.filter((t) => bt.has(t)).length / at.length;
}

function toGitHubUrl(femaleUrl: string): string {
  const file = femaleUrl.split("/").pop();
  return `${GOOD_HOST}${file}`;
}

async function headOk(url: string): Promise<boolean> {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, { method: "HEAD" });
      if (res.ok) return true;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
  }
  return false;
}

/** Low concurrency — GitHub Pages throttles rapid parallel requests (429s). */
async function checkUrls(urls: string[]): Promise<Map<string, boolean>> {
  const out = new Map<string, boolean>();
  const queue = [...urls];
  const workers = Array.from({ length: 3 }, async () => {
    for (;;) {
      const u = queue.shift();
      if (!u) return;
      out.set(u, await headOk(u));
      await new Promise((r) => setTimeout(r, 250));
    }
  });
  await Promise.all(workers);
  return out;
}

async function main() {
  const apply = process.argv.includes("--apply");

  const res = await fetch(INDEX);
  if (!res.ok) throw new Error(`index ${res.status} for ${INDEX}`);
  const data = (await res.json()) as { count: number; exercises: SourceExercise[] };
  const source = data.exercises;
  console.log(`source exercises: ${source.length}`);

  const ours = await db.select().from(exercises);

  const candidates = source.filter((s) => s.image?.female);

  // Build every plausible (our exercise -> source image) pair with its score.
  // Alias hits are capped at 0.9 so a NATURAL raw match (1.0/0.95/0.85) for the
  // same image always outranks an alias-assisted claim; raw name is scored as fallback.
  type Pair = { ex: number; cand: number; score: number };
  const pairs: Pair[] = [];
  for (let i = 0; i < ours.length; i++) {
    const raw = normalize(ours[i].name);
    const alias = ALIASES[raw];
    for (let j = 0; j < candidates.length; j++) {
      let s = scoreMatch(raw, candidates[j].name.en);
      if (alias) s = Math.max(s, Math.min(scoreMatch(alias, candidates[j].name.en), 0.9));
      if (s >= 0.75) pairs.push({ ex: i, cand: j, score: s });
    }
  }

  // Greedy SINGLE-USE assignment: best score first (ties keep our DB order),
  // so each source illustration is used by AT MOST ONE exercise — no duplicate images.
  pairs.sort((a, b) => b.score - a.score);
  const assigned = new Map<number, number>();
  const usedCand = new Set<number>();
  for (const p of pairs) {
    if (assigned.has(p.ex) || usedCand.has(p.cand)) continue;
    assigned.set(p.ex, p.cand);
    usedCand.add(p.cand);
  }

  const results: { id: string; ours: string; theirs: string | null; url: string | null }[] = ours.map((ex, i) => {
    const j = assigned.get(i);
    if (j === undefined) return { id: ex.id, ours: ex.name, theirs: null, url: null };
    return { id: ex.id, ours: ex.name, theirs: candidates[j].name.en, url: toGitHubUrl(candidates[j].image.female) };
  });

  const matched = results.filter((r) => r.url);
  const missed = results.filter((r) => !r.url);

  const urlCounts = new Map<string, number>();
  matched.forEach((r) => urlCounts.set(r.url!, (urlCounts.get(r.url!) ?? 0) + 1));
  const dups = [...urlCounts.entries()].filter(([, n]) => n > 1);

  console.log(`\n=== female-image match report ===`);
  console.log(`our exercises: ${results.length} | matched: ${matched.length} | unmatched: ${missed.length} | duplicate images: ${dups.length}`);

  const urlStatus = await checkUrls([...new Set(matched.map((r) => r.url!))]);
  const dead = matched.filter((r) => !urlStatus.get(r.url!));

  if (matched.length) {
    console.log(`\nMATCHED (${matched.length}):`);
    matched.forEach((r) => console.log(`  ${r.ours}  ->  ${r.theirs}`));
  }
  if (dead.length) {
    console.log(`\nDEAD LINKS (${dead.length}):`);
    dead.forEach((r) => console.log(`  ! ${r.ours}  ${r.url}`));
  }
  if (missed.length) {
    console.log(`\nUNMATCHED (${missed.length}) — nearest source names:`);
    for (const r of missed) {
      const near = candidates
        .map((c) => ({ name: c.name.en, cov: coverage(r.ours, c.name.en) }))
        .filter((x) => x.cov >= 0.5)
        .sort((a, b) => b.cov - a.cov)
        .slice(0, 2);
      const hint = near.length ? near.map((n) => `~~ ${n.name}`).join("   ") : "(no close name)";
      console.log(`  - ${r.ours}  ${hint}`);
    }
  }

  if (!apply) {
    console.log(`\nDry run — no rows written. Re-run with --apply to save the ${matched.length - dead.length} matches.`);
    return;
  }

  let written = 0;
  for (const r of results) {
    const url = r.url && urlStatus.get(r.url) ? r.url : null;
    const upd = await db
      .update(exercises)
      .set({ imageUrlFemale: url })
      .where(eq(exercises.id, r.id))
      .run();
    written += upd.changes ?? 0;
  }

  const rows = await db.select().from(exercises);
  const withFemale = rows.filter((r) => r.imageUrlFemale).length;
  console.log(`\nApplied: ${written} rows updated.`);
  console.log(`exercises with imageUrlFemale now: ${withFemale}/${rows.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
