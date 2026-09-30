/**
 * Fill remaining NULL exercise image URLs so EVERY card has an image.
 *
 * imageUrl (default view)       — wger filled 112/182; fill: marcmayol male -> yuhonas.
 * imageUrlFemale (Women view)   — marcmayol female filled 103/182; fill:
 *                                 marcmayol female (free pool) -> copy the exercise's
 *                                 own wger image -> yuhonas photo.
 *
 * Sources:
 *  - https://github.com/marcmayol/exercise-api (MIT-style, mandatory attribution)
 *  - https://github.com/yuhonas/free-exercise-db (Unlicense / public domain)
 *
 * Rules: score >= 0.75, greedy SINGLE-USE assignment per source (no two exercises
 * may share a URL within a column), alias hits capped at 0.9.
 *
 * Usage (from project root):
 *   npx tsx scripts/fill-images.ts --dry-run   # report only
 *   npx tsx scripts/fill-images.ts --apply     # write to DB
 */
import { localDb as db } from "../src/lib/db/local";
import { exercises } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

const MARCMAYOL_INDEX = "https://marcmayol.github.io/exercise-api/v1/exercises.json";
const MARCMAYOL_HOST = "https://marcmayol.github.io/exercise-api/images/";
const YUHONAS_INDEX = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";
const YUHONAS_HOST = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";

interface MarcmayolExercise {
  slug: string;
  name: { es: string; en: string };
  image: { male: string; female: string };
}
interface YuhonasExercise {
  name: string;
  images: string[];
}

/** Our normalized exercise name -> marcmayol English name (shared with fetch-female-images.ts). */
const ALIASES: Record<string, string> = {
  "back squat": "Barbell squat",
  "stiff leg deadlift": "Romanian deadlift",
  "single leg romanian deadlift": "Romanian deadlift",
  "rack pull": "Deadlift",
  "smith machine squat": "Sled hack squat (45°)",
  "sumo squat": "Goblet squat",
  "barbell row": "Bent-over barbell row",
  "pendlay row": "Bent-over barbell row",
  "dumbbell row": "Bent-over dumbbell row",
  "single arm cable row": "Seated cable row",
  "machine row": "Seated row machine",
  "chest supported row": "Inverted row",
  "lat pulldown": "Lat pulldown",
  "cable fly": "Cable crossover",
  "high to low cable fly": "Cable crossover",
  "low to high cable fly": "Low cable fly (low-to-high)",
  "incline cable fly": "Low cable fly (low-to-high)",
  "decline dumbbell press": "Dumbbell bench press",
  "machine chest press": "Seated chest press",
  "smith machine bench press": "Barbell bench press",
  "pec deck": "Machine chest fly (pec deck)",
  "reverse pec deck": "Reverse fly",
  "rear delt fly": "Reverse fly",
  "chin ups": "Pull-ups",
  "assisted chest dips": "Dips machine",
  "barbell curl": "Barbell biceps curl",
  "ez bar curl": "Barbell biceps curl",
  "reverse curl": "Barbell biceps curl",
  "drag curl": "Barbell biceps curl",
  "dumbbell curl": "Alternating dumbbell biceps curl",
  "alternating dumbbell curl": "Alternating dumbbell biceps curl",
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
  "dumbbell shoulder press": "Seated dumbbell shoulder press",
  "smith machine shoulder press": "Cable shoulder press",
  "machine lateral raise": "Dumbbell lateral raises",
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
  "crunch": "Abdominal crunch",
  "weighted crunch": "Abdominal crunch",
  "machine crunch": "Abdominal crunch",
  "heel touches": "Abdominal crunch",
  "reverse crunch": "Legs-up crunch",
  "hanging knee raise": "Hanging leg raise",
  "captain s chair knee raise": "Hanging leg raise",
  "cable woodchop": "Cable woodchopper",
  "standing cable rotation": "Cable woodchopper",
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

/** Aliases targeting yuhonas/free-exercise-db naming (used only for yuhonas passes). */
const YUHONAS_ALIASES: Record<string, string> = {
  "single arm lat pulldown": "One Arm Lat Pulldown",
  "jogging": "Jogging, Treadmill",
  "running": "Running, Treadmill",
  "battle ropes": "Battling Ropes",
  "turkish get up": "Kettlebell Turkish Get-Up (Squat style)",
  "dumbbell clean press": "Clean and Press",
  "dumbbell skull crusher": "EZ-Bar Skullcrusher",
  "cable skull crusher": "Band Skull Crusher",
  "landmine press": "Landmine Linear Jammer",
  "dumbbell thruster": "Kettlebell Thruster",
  "sled pull": "Sled Drag - Harness",
  "step machine": "Step Mill",
  "stair climber": "Stairmaster",
  "standing cable rotation": "Pallof Press With Rotation",
  "single leg calf raise": "Dumbbell Seated One-Leg Calf Raise",
  "barbell hold": "Barbell Shrug",
  "grip trainer": "Cable Wrist Curl",
  "frog pumps": "Barbell Glute Bridge",
  "banded glute bridge": "Single Leg Glute Bridge",
  "curtsy lunges": "Barbell Lunge",
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function canon(t: string): string {
  if (t.endsWith("ss")) return t;
  if (t.endsWith("s")) t = t.slice(0, -1);
  if (t.endsWith("e")) t = t.slice(0, -1);
  return t;
}

function tokens(s: string): string[] {
  return normalize(s).split(" ").filter(Boolean).map(canon);
}

const BENIGN_CANON = new Set(
  [
    "with", "on", "the", "a", "an", "for", "using", "and", "at", "by", "w", "do", "exercise",
    "barbell", "dumbbell", "dumbbells", "cable", "machine", "smith", "ez", "rope", "kettlebell",
    "band", "banded", "plate", "weighted", "stability", "ball", "bosu", "pulley", "wheel", "bench",
  ].map(canon)
);

/** Tiers: 1.0 equal | 0.95 same token set | 0.9 ours⊆theirs benign extras |
 *  0.85 theirs⊆ours equipment extras | 0.75 theirs⊆ours any extras | 0 otherwise */
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

function coverage(ours: string, theirs: string): number {
  const at = tokens(ours);
  const bt = new Set(tokens(theirs));
  if (!at.length) return 0;
  return at.filter((t) => bt.has(t)).length / at.length;
}

function marcmayolUrl(raw: string): string {
  return `${MARCMAYOL_HOST}${raw.split("/").pop()}`;
}

function yuhonasUrl(path: string): string {
  return `${YUHONAS_HOST}${path}`;
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

type FillPlan = Map<string, { url: string; via: string }>;

/** Greedy single-use assignment over scored pairs; returns exercise id -> url. */
function assign(
  targets: { id: string; name: string }[],
  candidates: { label: string; url: string }[],
  aliasFor: (name: string) => string | undefined,
  via: string
): FillPlan {
  type Pair = { t: number; c: number; score: number };
  const pairs: Pair[] = [];
  for (let i = 0; i < targets.length; i++) {
    const raw = normalize(targets[i].name);
    const alias = aliasFor(raw);
    for (let j = 0; j < candidates.length; j++) {
      let s = scoreMatch(raw, candidates[j].label);
      if (alias) s = Math.max(s, Math.min(scoreMatch(alias, candidates[j].label), 0.9));
      if (s >= 0.75) pairs.push({ t: i, c: j, score: s });
    }
  }
  pairs.sort((a, b) => b.score - a.score);
  const plan: FillPlan = new Map();
  const used = new Set<number>();
  for (const p of pairs) {
    if (plan.has(targets[p.t].id) || used.has(p.c)) continue;
    plan.set(targets[p.t].id, { url: candidates[p.c].url, via });
    used.add(p.c);
  }
  return plan;
}

async function main() {
  const apply = process.argv.includes("--apply");

  const mar = (
    (await (await fetch(MARCMAYOL_INDEX)).json()) as { count: number; exercises: MarcmayolExercise[] }
  ).exercises;
  const yuh = (await (await fetch(YUHONAS_INDEX)).json()) as YuhonasExercise[];
  console.log(`sources: marcmayol=${mar.length} yuhonas=${yuh.length}`);

  const ours = await db.select().from(exercises);

  const maleTargets = ours.filter((r) => !r.imageUrl).map((r) => ({ id: r.id, name: r.name }));
  const femaleTargets = ours.filter((r) => !r.imageUrlFemale).map((r) => ({ id: r.id, name: r.name }));
  console.log(`fill needed: male ${maleTargets.length}, female ${femaleTargets.length}`);

  // Column: imageUrl (male) — marcmayol male first, then yuhonas.
  const mPlan: FillPlan = new Map();
  const merge = (into: FillPlan, from: FillPlan) => {
    for (const [k, v] of from) into.set(k, v);
  };
  const marMaleCands = mar
    .filter((e) => e.image?.male)
    .map((e) => ({ label: e.name.en, url: marcmayolUrl(e.image.male) }));
  const stillM = () => maleTargets.filter((t) => !mPlan.has(t.id));
  merge(mPlan, assign(stillM(), marMaleCands, (n) => ALIASES[n], "marcmayol-male"));
  const yuhCands = yuh
    .filter((e) => e.images?.[0])
    .map((e) => ({ label: e.name, url: yuhonasUrl(e.images[0]) }));
  merge(mPlan, assign(stillM(), yuhCands, (n) => YUHONAS_ALIASES[n] ?? ALIASES[n], "yuhonas"));

  // Column: imageUrlFemale — marcmayol female (candidates free of the 103 already used),
  // then copy the exercise's own wger image, then yuhonas.
  const fPlan: FillPlan = new Map();
  const usedFemale = new Set(ours.map((r) => r.imageUrlFemale).filter(Boolean));
  const marFemaleCands = mar
    .filter((e) => e.image?.female)
    .map((e) => ({ label: e.name.en, url: marcmayolUrl(e.image.female) }))
    .filter((c) => !usedFemale.has(c.url));
  const stillF = () => femaleTargets.filter((t) => !fPlan.has(t.id));
  merge(fPlan, assign(stillF(), marFemaleCands, (n) => ALIASES[n], "marcmayol-female"));

  // Copy the exercise's own wger image — but only if that URL isn't already
  // used in the female column (several wger photos are shared by 2-4 of our
  // exercises, e.g. Dips, Pull-ups). The loser(s) stay for the yuhonas pass.
  const byId = new Map(ours.map((r) => [r.id, r]));
  const takenF = new Set(usedFemale);
  for (const v of fPlan.values()) takenF.add(v.url);
  const skippedCopy: string[] = [];
  for (const t of stillF()) {
    const own = byId.get(t.id)?.imageUrl;
    if (!own) continue;
    if (takenF.has(own)) {
      skippedCopy.push(t.name);
      continue;
    }
    fPlan.set(t.id, { url: own, via: "wger-copy" });
    takenF.add(own);
  }
  if (skippedCopy.length) console.log(`wger-copy skipped (shared URL, left for yuhonas): ${skippedCopy.join(", ")}`);
  merge(fPlan, assign(stillF(), yuhCands, (n) => YUHONAS_ALIASES[n] ?? ALIASES[n], "yuhonas"));

  // P4 (female only): marcmayol MALE illustrations for exercises with no female
  // image anywhere free — an image beats the gradient (e.g. Captain's Chair).
  const marMaleFree = marMaleCands.filter((c) => !takenF.has(c.url));
  const beforeP4 = fPlan.size;
  merge(fPlan, assign(stillF(), marMaleFree, (n) => ALIASES[n], "marcmayol-male"));
  for (const v of fPlan.values()) takenF.add(v.url);
  console.log(`female P4 marcmayol-male added: ${fPlan.size - beforeP4}`);

  // Sanity: duplicate URLs within each column.
  const dupReport = (plan: FillPlan, column: "imageUrl" | "imageUrlFemale") => {
    const existing = new Set(
      ours.map((r) => (column === "imageUrl" ? r.imageUrl : r.imageUrlFemale)).filter(Boolean)
    );
    const urls = new Map<string, string[]>();
    for (const [id, v] of plan) urls.set(v.url, [...(urls.get(v.url) ?? []), id]);
    const dups: string[] = [];
    for (const [url, ids] of urls) if (ids.length > 1 || existing.has(url)) dups.push(url);
    return dups;
  };

  const printPlan = (label: string, targets: { id: string; name: string }[], plan: FillPlan) => {
    const viaCount = new Map<string, number>();
    for (const v of plan.values()) viaCount.set(v.via, (viaCount.get(v.via) ?? 0) + 1);
    console.log(`\n=== ${label} ===`);
    console.log(`fill: ${plan.size}/${targets.length}  ${[...viaCount].map(([k, n]) => `${k}:${n}`).join("  ")}`);
    for (const t of targets) {
      const v = plan.get(t.id);
      if (v) console.log(`  + ${t.name}  <=  ${v.url.split("/").pop()}  [${v.via}]`);
    }
    const left = targets.filter((t) => !plan.has(t.id));
    if (left.length) {
      console.log(`STILL MISSING (${left.length}) — nearest source names:`);
      const pool = [...marFemaleCands.map((c) => c.label), ...yuhCands.map((c) => c.label)];
      for (const t of left) {
        const near = pool
          .map((n) => ({ n, c: coverage(t.name, n) }))
          .filter((x) => x.c >= 0.5)
          .sort((a, b) => b.c - a.c)
          .slice(0, 2);
        console.log(`  - ${t.name}${near.length ? "  ~~ " + near.map((x) => x.n).join("   ~~ ") : ""}`);
      }
    }
  };

  printPlan("imageUrl fill", maleTargets, mPlan);
  printPlan("imageUrlFemale fill", femaleTargets, fPlan);

  const mDups = dupReport(mPlan, "imageUrl");
  const fDups = dupReport(fPlan, "imageUrlFemale");
  if (mDups.length || fDups.length) {
    console.log(`\nDUPLICATE URLS! male: ${mDups.length} female: ${fDups.length}`);
    mDups.forEach((u) => console.log("  M " + u));
    fDups.forEach((u) => console.log("  F " + u));
  } else {
    console.log("\nno duplicate URLs in either column");
  }

  // Dead-link check on every URL we plan to write.
  const all = [...new Set([...mPlan.values(), ...fPlan.values()].map((v) => v.url))];
  const status = await checkUrls(all);
  const dead = all.filter((u) => !status.get(u));
  console.log(`link check: ${all.length - dead.length}/${all.length} ok`);
  dead.forEach((u) => console.log("  DEAD " + u));

  if (!apply) {
    const okM = [...mPlan].filter(([, v]) => status.get(v.url));
    const okF = [...fPlan].filter(([, v]) => status.get(v.url));
    console.log(
      `\nDry run — would write male ${okM.length} (+112 = ${112 + okM.length}/182), female ${okF.length} (+103 = ${103 + okF.length}/182). Re-run with --apply.`
    );
    return;
  }

  let written = 0;
  for (const [id, v] of mPlan) {
    if (!status.get(v.url)) continue;
    written += (await db.update(exercises).set({ imageUrl: v.url }).where(eq(exercises.id, id)).run())
      .changes ?? 0;
  }
  for (const [id, v] of fPlan) {
    if (!status.get(v.url)) continue;
    written +=
      (await db.update(exercises).set({ imageUrlFemale: v.url }).where(eq(exercises.id, id)).run())
        .changes ?? 0;
  }

  const rows = await db.select().from(exercises);
  console.log(`\nApplied: ${written} rows updated.`);
  console.log(`imageUrl: ${rows.filter((r) => r.imageUrl).length}/${rows.length}`);
  console.log(`imageUrlFemale: ${rows.filter((r) => r.imageUrlFemale).length}/${rows.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
