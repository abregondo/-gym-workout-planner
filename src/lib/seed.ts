import { db } from "./db/index";
import { exercises } from "./db/schema";
import { IMAGE_URLS } from "./db/images";
import { eq } from "drizzle-orm";

type SeedExercise = {
  name: string;
  category: string;
  muscleGroup: string;
  equipment: string;
  gender: "men" | "women" | "both";
  difficulty: "beginner" | "intermediate" | "advanced";
  instructions: string;
};

function slug(name: string) {
  return `seed-${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
}

function normalize(name: string) {
  return name.toLowerCase().trim();
}

// Maps legacy/alternate names onto canonical library entries (IDs of existing
// rows are preserved so favorites, PRs and templates keep working).
const ALIASES: Record<string, string> = {
  "barbell rows": "Barbell Row",
  "overhead press": "Barbell Overhead Press",
  "front raise": "Dumbbell Front Raise",
  "tricep pushdown": "Cable Pushdown",
  "leg curl": "Lying Leg Curl",
  "hip thrust": "Barbell Hip Thrust",
  "barbell squat": "Back Squat",
  "skull crushers": "EZ-Bar Skull Crusher",
  "skull crusher": "EZ-Bar Skull Crusher",
  "barbell deadlift": "Deadlift",
  "conventional deadlift": "Deadlift",
  "cable pull through": "Cable Pull-Through",
  "squat": "Back Squat",
  "step-up": "Step-Ups",
  "walking lunge": "Walking Lunges",
  "machine kickback": "Machine Glute Kickback",
  "triceps kickback": "Dumbbell Kickback",
};

const SEED_EXERCISES: SeedExercise[] = [
  // ─── Chest ────────────────────────────────────────────────────────────────
  { name: "Barbell Bench Press", category: "chest", muscleGroup: "chest", equipment: "barbell", gender: "both", difficulty: "intermediate", instructions: "Lie on the bench, grip slightly wider than shoulders, lower the bar to mid-chest and press up." },
  { name: "Incline Barbell Bench Press", category: "chest", muscleGroup: "upper chest", equipment: "barbell", gender: "men", difficulty: "intermediate", instructions: "Set the bench to 30-45°, lower the bar to your upper chest and press up." },
  { name: "Decline Bench Press", category: "chest", muscleGroup: "lower chest", equipment: "barbell", gender: "men", difficulty: "intermediate", instructions: "On a decline bench, lower the bar to your lower chest and press back to lockout." },
  { name: "Dumbbell Bench Press", category: "chest", muscleGroup: "chest", equipment: "dumbbell", gender: "both", difficulty: "intermediate", instructions: "Press two dumbbells from chest level, keeping wrists stacked over elbows." },
  { name: "Incline Dumbbell Press", category: "chest", muscleGroup: "upper chest", equipment: "dumbbell", gender: "both", difficulty: "intermediate", instructions: "On a 30-45° bench, press dumbbells from upper-chest level until arms extend." },
  { name: "Decline Dumbbell Press", category: "chest", muscleGroup: "lower chest", equipment: "dumbbell", gender: "men", difficulty: "intermediate", instructions: "On a decline bench, press dumbbells from chest level upward with control." },
  { name: "Machine Chest Press", category: "chest", muscleGroup: "chest", equipment: "machine", gender: "both", difficulty: "beginner", instructions: "Sit tall, grip the handles and press forward until arms are straight, then return slowly." },
  { name: "Smith Machine Bench Press", category: "chest", muscleGroup: "chest", equipment: "smith machine", gender: "both", difficulty: "beginner", instructions: "Press the guided bar from mid-chest to full lockout without bouncing." },
  { name: "Cable Chest Press", category: "chest", muscleGroup: "chest", equipment: "cable", gender: "both", difficulty: "beginner", instructions: "Press the handles forward from chest level and squeeze the chest at the end." },
  { name: "Pec Deck", category: "chest", muscleGroup: "chest", equipment: "machine", gender: "both", difficulty: "beginner", instructions: "With elbows at 90°, bring your forearms together in front of your face." },
  { name: "Dumbbell Fly", category: "chest", muscleGroup: "chest", equipment: "dumbbell", gender: "both", difficulty: "beginner", instructions: "With a slight bend in the elbows, open your arms wide and hug back together." },
  { name: "Cable Fly", category: "chest", muscleGroup: "chest", equipment: "cable", gender: "both", difficulty: "beginner", instructions: "Bring the handles together in an arc motion and squeeze the chest." },
  { name: "Low-to-High Cable Fly", category: "chest", muscleGroup: "upper chest", equipment: "cable", gender: "men", difficulty: "intermediate", instructions: "From a low pulley, scoop the handles upward and together in front of your forehead." },
  { name: "High-to-Low Cable Fly", category: "chest", muscleGroup: "lower chest", equipment: "cable", gender: "men", difficulty: "intermediate", instructions: "From a high pulley, press the handles down and together toward your hips." },
  { name: "Incline Cable Fly", category: "chest", muscleGroup: "upper chest", equipment: "cable", gender: "women", difficulty: "intermediate", instructions: "On an incline bench between two low cables, fly the handles up over your upper chest." },
  { name: "Chest Dips", category: "chest", muscleGroup: "chest", equipment: "bodyweight", gender: "men", difficulty: "intermediate", instructions: "Lean forward on parallel bars, lower until elbows reach 90°, then press up." },
  { name: "Assisted Chest Dips", category: "chest", muscleGroup: "chest", equipment: "machine", gender: "women", difficulty: "beginner", instructions: "Use the assisted dip machine with a forward lean to press up with controlled form." },
  { name: "Push-Ups", category: "chest", muscleGroup: "chest", equipment: "bodyweight", gender: "both", difficulty: "beginner", instructions: "Keep a straight line from head to heels, lower your chest to the floor and press up." },
  { name: "Weighted Push-Ups", category: "chest", muscleGroup: "chest", equipment: "bodyweight", gender: "men", difficulty: "advanced", instructions: "Perform push-ups with a plate on your back for added resistance." },

  // ─── Back ─────────────────────────────────────────────────────────────────
  { name: "Pull-Ups", category: "back", muscleGroup: "lats", equipment: "bodyweight", gender: "both", difficulty: "intermediate", instructions: "Hang from the bar and pull your chin above it, then lower with control." },
  { name: "Weighted Pull-Ups", category: "back", muscleGroup: "lats", equipment: "bodyweight", gender: "men", difficulty: "advanced", instructions: "Perform pull-ups with a dip belt or plate for extra load." },
  { name: "Chin-Ups", category: "back", muscleGroup: "lats", equipment: "bodyweight", gender: "men", difficulty: "intermediate", instructions: "Pull up with an underhand grip, driving your elbows down to your ribs." },
  { name: "Assisted Pull-Up", category: "back", muscleGroup: "lats", equipment: "machine", gender: "women", difficulty: "beginner", instructions: "Use the assisted pull-up machine pad to offset bodyweight as you pull." },
  { name: "Lat Pulldown", category: "back", muscleGroup: "lats", equipment: "cable", gender: "both", difficulty: "beginner", instructions: "Pull the bar to your upper chest while squeezing the lats, then return slowly." },
  { name: "Close-Grip Lat Pulldown", category: "back", muscleGroup: "lats", equipment: "cable", gender: "both", difficulty: "beginner", instructions: "Use a close grip and pull the bar to your chest with elbows tucked." },
  { name: "Wide-Grip Lat Pulldown", category: "back", muscleGroup: "lats", equipment: "cable", gender: "both", difficulty: "beginner", instructions: "With a wide overhand grip, pull the bar down to your upper chest." },
  { name: "Single-Arm Lat Pulldown", category: "back", muscleGroup: "lats", equipment: "cable", gender: "men", difficulty: "intermediate", instructions: "Pull one handle to your side at a time, focusing on each lat independently." },
  { name: "Barbell Row", category: "back", muscleGroup: "lats", equipment: "barbell", gender: "both", difficulty: "intermediate", instructions: "Hinge at the hips and row the bar to your lower chest, squeezing the shoulder blades." },
  { name: "Pendlay Row", category: "back", muscleGroup: "lats", equipment: "barbell", gender: "men", difficulty: "advanced", instructions: "Row explosively from the floor to your chest each rep, resetting the bar down." },
  { name: "T-Bar Row", category: "back", muscleGroup: "lats", equipment: "machine", gender: "both", difficulty: "intermediate", instructions: "Chest supported, pull the handles to your torso and squeeze." },
  { name: "Dumbbell Row", category: "back", muscleGroup: "lats", equipment: "dumbbell", gender: "both", difficulty: "beginner", instructions: "Support one hand on a bench and row the dumbbell to your hip." },
  { name: "Single-Arm Cable Row", category: "back", muscleGroup: "lats", equipment: "cable", gender: "women", difficulty: "beginner", instructions: "Row one cable handle to your hip while keeping your torso square." },
  { name: "Chest-Supported Row", category: "back", muscleGroup: "lats", equipment: "machine", gender: "both", difficulty: "intermediate", instructions: "With chest on the pad, pull the handles back and squeeze the shoulder blades." },
  { name: "Seated Cable Row", category: "back", muscleGroup: "lats", equipment: "cable", gender: "both", difficulty: "beginner", instructions: "Sit upright, pull the handle to your midsection and squeeze, then extend." },
  { name: "Machine Row", category: "back", muscleGroup: "lats", equipment: "machine", gender: "both", difficulty: "beginner", instructions: "Pull the handles toward your torso while keeping your back straight." },
  { name: "Straight-Arm Pulldown", category: "back", muscleGroup: "lats", equipment: "cable", gender: "both", difficulty: "beginner", instructions: "With straight arms, push the bar down to your thighs feeling the lats work." },
  { name: "Deadlift", category: "back", muscleGroup: "back", equipment: "barbell", gender: "men", difficulty: "advanced", instructions: "Hinge to grip the bar at mid-shin, drive through the floor and stand tall." },
  { name: "Rack Pull", category: "back", muscleGroup: "back", equipment: "barbell", gender: "men", difficulty: "advanced", instructions: "Pull the bar from the pins just below the knees to a full stand." },
  { name: "Back Extension", category: "back", muscleGroup: "lower back", equipment: "bodyweight", gender: "both", difficulty: "beginner", instructions: "Hinge at the hips over the bench and raise your torso to a straight line." },
  { name: "Dumbbell Shrugs", category: "back", muscleGroup: "traps", equipment: "dumbbell", gender: "both", difficulty: "beginner", instructions: "Hold dumbbells at sides, shrug shoulders up toward ears, hold, then lower." },

  // ─── Shoulders ────────────────────────────────────────────────────────────
  { name: "Barbell Overhead Press", category: "shoulders", muscleGroup: "front delts", equipment: "barbell", gender: "men", difficulty: "intermediate", instructions: "Press the bar from your shoulders to lockout overhead without arching." },
  { name: "Dumbbell Shoulder Press", category: "shoulders", muscleGroup: "front delts", equipment: "dumbbell", gender: "both", difficulty: "beginner", instructions: "Press dumbbells from shoulder height overhead until the arms extend." },
  { name: "Arnold Press", category: "shoulders", muscleGroup: "front delts", equipment: "dumbbell", gender: "both", difficulty: "intermediate", instructions: "Start palms facing you, rotate outward as you press overhead, then reverse." },
  { name: "Machine Shoulder Press", category: "shoulders", muscleGroup: "front delts", equipment: "machine", gender: "both", difficulty: "beginner", instructions: "Sit back and press the handles overhead with a controlled tempo." },
  { name: "Smith Machine Shoulder Press", category: "shoulders", muscleGroup: "front delts", equipment: "smith machine", gender: "both", difficulty: "beginner", instructions: "Press the guided bar overhead with an upright, stable torso." },
  { name: "Landmine Press", category: "shoulders", muscleGroup: "front delts", equipment: "barbell", gender: "men", difficulty: "intermediate", instructions: "Press the anchored bar up and away at an angle, leaning slightly forward." },
  { name: "Dumbbell Lateral Raise", category: "shoulders", muscleGroup: "side delts", equipment: "dumbbell", gender: "both", difficulty: "beginner", instructions: "Raise dumbbells out to your sides to shoulder height, then lower slowly." },
  { name: "Cable Lateral Raise", category: "shoulders", muscleGroup: "side delts", equipment: "cable", gender: "both", difficulty: "beginner", instructions: "From a low pulley, lift the handle out to the side with a controlled tempo." },
  { name: "Machine Lateral Raise", category: "shoulders", muscleGroup: "side delts", equipment: "machine", gender: "both", difficulty: "beginner", instructions: "Raise your elbows against the pads to shoulder height and lower slowly." },
  { name: "Dumbbell Front Raise", category: "shoulders", muscleGroup: "front delts", equipment: "dumbbell", gender: "both", difficulty: "beginner", instructions: "Raise one dumbbell in front of you to eye level, then alternate arms." },
  { name: "Cable Front Raise", category: "shoulders", muscleGroup: "front delts", equipment: "cable", gender: "both", difficulty: "beginner", instructions: "Lift the low-pulley handle in front of you to shoulder height." },
  { name: "Reverse Pec Deck", category: "shoulders", muscleGroup: "rear delts", equipment: "machine", gender: "both", difficulty: "beginner", instructions: "With chest on the pad, sweep the handles back and squeeze the rear delts." },
  { name: "Rear Delt Fly", category: "shoulders", muscleGroup: "rear delts", equipment: "dumbbell", gender: "both", difficulty: "beginner", instructions: "Hinge forward and fly the dumbbells out to the sides." },
  { name: "Face Pull", category: "shoulders", muscleGroup: "rear delts", equipment: "cable", gender: "both", difficulty: "beginner", instructions: "Pull the rope to your face, separating the handles and externally rotating." },

  // ─── Biceps ───────────────────────────────────────────────────────────────
  { name: "Barbell Curl", category: "biceps", muscleGroup: "biceps", equipment: "barbell", gender: "men", difficulty: "beginner", instructions: "Curl the bar with elbows pinned to your sides, then lower under control." },
  { name: "EZ-Bar Curl", category: "biceps", muscleGroup: "biceps", equipment: "barbell", gender: "both", difficulty: "beginner", instructions: "Curl the EZ-bar with a comfortable grip, squeezing at the top." },
  { name: "Dumbbell Curl", category: "biceps", muscleGroup: "biceps", equipment: "dumbbell", gender: "both", difficulty: "beginner", instructions: "Curl both dumbbells with palms up, keeping the elbows still." },
  { name: "Alternating Dumbbell Curl", category: "biceps", muscleGroup: "biceps", equipment: "dumbbell", gender: "both", difficulty: "beginner", instructions: "Curl one arm at a time, supinating the palm as you lift." },
  { name: "Hammer Curl", category: "biceps", muscleGroup: "biceps", equipment: "dumbbell", gender: "both", difficulty: "beginner", instructions: "Curl with palms facing each other to target the brachialis and forearms." },
  { name: "Incline Dumbbell Curl", category: "biceps", muscleGroup: "biceps", equipment: "dumbbell", gender: "both", difficulty: "intermediate", instructions: "On a 45° bench, curl the dumbbells with arms hanging for a deep stretch." },
  { name: "Preacher Curl", category: "biceps", muscleGroup: "biceps", equipment: "barbell", gender: "both", difficulty: "intermediate", instructions: "Rest your arms on the preacher pad and curl without swinging." },
  { name: "Machine Preacher Curl", category: "biceps", muscleGroup: "biceps", equipment: "machine", gender: "both", difficulty: "beginner", instructions: "Sit and curl the machine handles, controlling the negative." },
  { name: "Concentration Curl", category: "biceps", muscleGroup: "biceps", equipment: "dumbbell", gender: "both", difficulty: "beginner", instructions: "Seated, brace your elbow against your thigh and curl to your shoulder." },
  { name: "Cable Curl", category: "biceps", muscleGroup: "biceps", equipment: "cable", gender: "both", difficulty: "beginner", instructions: "Curl the low-pulley bar with elbows fixed at your sides." },
  { name: "Bayesian Cable Curl", category: "biceps", muscleGroup: "biceps", equipment: "cable", gender: "both", difficulty: "intermediate", instructions: "Face away from a high pulley and curl with your arm behind you." },
  { name: "Spider Curl", category: "biceps", muscleGroup: "biceps", equipment: "dumbbell", gender: "men", difficulty: "intermediate", instructions: "Lie chest-down on an incline bench and curl with arms hanging." },
  { name: "Reverse Curl", category: "biceps", muscleGroup: "forearms", equipment: "barbell", gender: "both", difficulty: "intermediate", instructions: "Curl with an overhand grip to target the forearms and brachialis." },
  { name: "Drag Curl", category: "biceps", muscleGroup: "biceps", equipment: "barbell", gender: "men", difficulty: "intermediate", instructions: "Drag the bar up your torso by raising your elbows back." },

  // ─── Triceps ──────────────────────────────────────────────────────────────
  { name: "Close-Grip Bench Press", category: "triceps", muscleGroup: "triceps", equipment: "barbell", gender: "men", difficulty: "intermediate", instructions: "Press with hands shoulder-width apart, keeping elbows close to your ribs." },
  { name: "Triceps Dips", category: "triceps", muscleGroup: "triceps", equipment: "bodyweight", gender: "men", difficulty: "intermediate", instructions: "Keep your torso upright on parallel bars, lower and press up." },
  { name: "Assisted Triceps Dips", category: "triceps", muscleGroup: "triceps", equipment: "machine", gender: "women", difficulty: "beginner", instructions: "Use the assisted dip machine to press up with elbows tucked in." },
  { name: "Close-Grip Push-Up", category: "triceps", muscleGroup: "triceps", equipment: "bodyweight", gender: "women", difficulty: "beginner", instructions: "Perform push-ups with hands under your shoulders, elbows tracking back." },
  { name: "Cable Pushdown", category: "triceps", muscleGroup: "triceps", equipment: "cable", gender: "both", difficulty: "beginner", instructions: "Push the bar down to your thighs with elbows pinned, then return slowly." },
  { name: "Rope Pushdown", category: "triceps", muscleGroup: "triceps", equipment: "cable", gender: "both", difficulty: "beginner", instructions: "Push the rope down and spread the ends apart at the bottom." },
  { name: "Straight-Bar Pushdown", category: "triceps", muscleGroup: "triceps", equipment: "cable", gender: "both", difficulty: "beginner", instructions: "Using a straight bar, extend your elbows fully and control the return." },
  { name: "Overhead Cable Extension", category: "triceps", muscleGroup: "triceps", equipment: "cable", gender: "both", difficulty: "intermediate", instructions: "From a high pulley behind you, extend your arms overhead." },
  { name: "Dumbbell Overhead Extension", category: "triceps", muscleGroup: "triceps", equipment: "dumbbell", gender: "both", difficulty: "intermediate", instructions: "Hold one dumbbell with both hands behind your head and extend overhead." },
  { name: "EZ-Bar Skull Crusher", category: "triceps", muscleGroup: "triceps", equipment: "barbell", gender: "both", difficulty: "intermediate", instructions: "Lower the EZ-bar toward your forehead, then extend without moving your elbows." },
  { name: "Dumbbell Skull Crusher", category: "triceps", muscleGroup: "triceps", equipment: "dumbbell", gender: "men", difficulty: "intermediate", instructions: "Lower dumbbells beside your head and press back to straight arms." },
  { name: "Cable Skull Crusher", category: "triceps", muscleGroup: "triceps", equipment: "cable", gender: "men", difficulty: "intermediate", instructions: "From a low pulley behind your head, extend your arms to lockout." },
  { name: "Dumbbell Kickback", category: "triceps", muscleGroup: "triceps", equipment: "dumbbell", gender: "both", difficulty: "beginner", instructions: "Hinge forward and extend one arm back until straight, squeezing the triceps." },
  { name: "Cable Kickback", category: "triceps", muscleGroup: "triceps", equipment: "cable", gender: "both", difficulty: "beginner", instructions: "From a low pulley, extend your arm straight back and squeeze at lockout." },
  { name: "JM Press", category: "triceps", muscleGroup: "triceps", equipment: "barbell", gender: "men", difficulty: "advanced", instructions: "Lower the bar toward your upper chest with elbows flaring slightly, then press." },

  // ─── Forearms ─────────────────────────────────────────────────────────────
  { name: "Wrist Curl", category: "forearms", muscleGroup: "forearms", equipment: "dumbbell", gender: "men", difficulty: "beginner", instructions: "Rest forearms on your thighs and curl the weight up using only your wrists." },
  { name: "Reverse Wrist Curl", category: "forearms", muscleGroup: "forearms", equipment: "dumbbell", gender: "men", difficulty: "beginner", instructions: "With palms down, extend your wrists upward against the weight." },
  { name: "Farmer's Carry", category: "forearms", muscleGroup: "forearms", equipment: "dumbbell", gender: "both", difficulty: "beginner", instructions: "Hold heavy dumbbells at your sides and walk with a tall, braced posture." },
  { name: "Plate Pinch", category: "forearms", muscleGroup: "forearms", equipment: "other", gender: "men", difficulty: "intermediate", instructions: "Pinch two weight plates together with your fingertips and hold for time." },
  { name: "Dead Hang", category: "forearms", muscleGroup: "forearms", equipment: "bodyweight", gender: "men", difficulty: "beginner", instructions: "Hang from the bar with a full grip and hold for time." },
  { name: "Barbell Hold", category: "forearms", muscleGroup: "forearms", equipment: "barbell", gender: "men", difficulty: "beginner", instructions: "Hold a loaded barbell at your sides with a crushing grip for time." },
  { name: "Grip Trainer", category: "forearms", muscleGroup: "forearms", equipment: "other", gender: "men", difficulty: "beginner", instructions: "Squeeze a grip trainer repeatedly with controlled reps." },

  // ─── Quadriceps ───────────────────────────────────────────────────────────
  { name: "Back Squat", category: "quads", muscleGroup: "quads", equipment: "barbell", gender: "both", difficulty: "intermediate", instructions: "Bar on your upper back, squat to at least parallel and drive up." },
  { name: "Front Squat", category: "quads", muscleGroup: "quads", equipment: "barbell", gender: "both", difficulty: "advanced", instructions: "Hold the bar in a front rack and squat while keeping your torso upright." },
  { name: "Hack Squat", category: "quads", muscleGroup: "quads", equipment: "machine", gender: "both", difficulty: "intermediate", instructions: "With your back on the pad, lower until knees reach 90° and press up." },
  { name: "Leg Press", category: "quads", muscleGroup: "quads", equipment: "machine", gender: "both", difficulty: "beginner", instructions: "Lower the sled until your knees reach 90°, then press without locking hard." },
  { name: "Smith Machine Squat", category: "quads", muscleGroup: "quads", equipment: "smith machine", gender: "both", difficulty: "beginner", instructions: "Squat under the guided bar with a stable, controlled tempo." },
  { name: "Bulgarian Split Squat", category: "quads", muscleGroup: "quads", equipment: "dumbbell", gender: "both", difficulty: "intermediate", instructions: "Rear foot elevated, lower until your front thigh is parallel, then drive up." },
  { name: "Goblet Squat", category: "quads", muscleGroup: "quads", equipment: "dumbbell", gender: "both", difficulty: "beginner", instructions: "Hold a dumbbell at your chest and squat down with a tall torso." },
  { name: "Walking Lunges", category: "quads", muscleGroup: "quads", equipment: "dumbbell", gender: "both", difficulty: "beginner", instructions: "Step forward into a lunge and alternate legs as you walk." },
  { name: "Reverse Lunges", category: "quads", muscleGroup: "quads", equipment: "dumbbell", gender: "both", difficulty: "beginner", instructions: "Step backward into a lunge, keeping your front shin vertical." },
  { name: "Forward Lunges", category: "quads", muscleGroup: "quads", equipment: "dumbbell", gender: "both", difficulty: "beginner", instructions: "Step forward and lower your back knee toward the floor, then push back." },
  { name: "Step-Ups", category: "quads", muscleGroup: "quads", equipment: "dumbbell", gender: "both", difficulty: "beginner", instructions: "Step onto a bench and drive through your heel to stand tall." },
  { name: "Leg Extension", category: "quads", muscleGroup: "quads", equipment: "machine", gender: "both", difficulty: "beginner", instructions: "Extend your legs fully, squeeze the quads, then lower slowly." },
  { name: "Sissy Squat", category: "quads", muscleGroup: "quads", equipment: "bodyweight", gender: "both", difficulty: "advanced", instructions: "Lean back with knees travelling forward, lowering with control and returning." },

  // ─── Hamstrings ───────────────────────────────────────────────────────────
  { name: "Romanian Deadlift", category: "hamstrings", muscleGroup: "hamstrings", equipment: "barbell", gender: "both", difficulty: "intermediate", instructions: "With soft knees, hinge the bar down your legs until you feel a hamstring stretch." },
  { name: "Dumbbell Romanian Deadlift", category: "hamstrings", muscleGroup: "hamstrings", equipment: "dumbbell", gender: "women", difficulty: "intermediate", instructions: "Hinge with dumbbells sliding down your thighs, feeling the stretch." },
  { name: "Stiff-Leg Deadlift", category: "hamstrings", muscleGroup: "hamstrings", equipment: "barbell", gender: "both", difficulty: "intermediate", instructions: "Deadlift with nearly straight legs while keeping the bar close to your body." },
  { name: "Good Morning", category: "hamstrings", muscleGroup: "hamstrings", equipment: "barbell", gender: "both", difficulty: "intermediate", instructions: "Bar on your back, hinge forward with a flat back, then stand back up." },
  { name: "Lying Leg Curl", category: "hamstrings", muscleGroup: "hamstrings", equipment: "machine", gender: "both", difficulty: "beginner", instructions: "Curl the pad up to your glutes and lower slowly." },
  { name: "Seated Leg Curl", category: "hamstrings", muscleGroup: "hamstrings", equipment: "machine", gender: "both", difficulty: "beginner", instructions: "Press the pad down, squeezing the hamstrings, then return under control." },
  { name: "Standing Leg Curl", category: "hamstrings", muscleGroup: "hamstrings", equipment: "machine", gender: "both", difficulty: "beginner", instructions: "Curl one leg up against the pad while keeping your hips square." },
  { name: "Nordic Curl", category: "hamstrings", muscleGroup: "hamstrings", equipment: "bodyweight", gender: "both", difficulty: "advanced", instructions: "Kneel with ankles secured, lower your body slowly and curl back up." },
  { name: "Glute-Ham Raise", category: "hamstrings", muscleGroup: "hamstrings", equipment: "machine", gender: "men", difficulty: "advanced", instructions: "Lower on the GHD with control, then curl your body back up." },
  { name: "Stability-Ball Leg Curl", category: "hamstrings", muscleGroup: "hamstrings", equipment: "bodyweight", gender: "women", difficulty: "beginner", instructions: "With heels on a ball, curl it toward your glutes while keeping hips up." },
  { name: "Single-Leg Romanian Deadlift", category: "hamstrings", muscleGroup: "hamstrings", equipment: "dumbbell", gender: "both", difficulty: "intermediate", instructions: "Hinge on one leg with the other extended behind, then return tall." },

  // ─── Glutes ───────────────────────────────────────────────────────────────
  { name: "Barbell Hip Thrust", category: "glutes", muscleGroup: "glutes", equipment: "barbell", gender: "both", difficulty: "intermediate", instructions: "Drive your hips up until your body forms a line, squeezing the glutes." },
  { name: "Smith Machine Hip Thrust", category: "glutes", muscleGroup: "glutes", equipment: "smith machine", gender: "both", difficulty: "beginner", instructions: "Thrust the guided bar upward, pausing at lockout." },
  { name: "Dumbbell Hip Thrust", category: "glutes", muscleGroup: "glutes", equipment: "dumbbell", gender: "both", difficulty: "beginner", instructions: "Rest a dumbbell on your hips and thrust up with a glute squeeze." },
  { name: "Glute Bridge", category: "glutes", muscleGroup: "glutes", equipment: "bodyweight", gender: "both", difficulty: "beginner", instructions: "Lie on your back and drive hips up, squeezing the glutes at the top." },
  { name: "Single-Leg Glute Bridge", category: "glutes", muscleGroup: "glutes", equipment: "bodyweight", gender: "women", difficulty: "intermediate", instructions: "Bridge with one foot planted and the other leg extended." },
  { name: "Cable Pull-Through", category: "glutes", muscleGroup: "glutes", equipment: "cable", gender: "women", difficulty: "beginner", instructions: "Face away from the cable, hinge at hips and squeeze glutes to stand." },
  { name: "Machine Glute Kickback", category: "glutes", muscleGroup: "glutes", equipment: "machine", gender: "both", difficulty: "beginner", instructions: "Kick the padded leg straight back and squeeze the glute at the top." },
  { name: "Curtsy Lunges", category: "glutes", muscleGroup: "glutes", equipment: "dumbbell", gender: "women", difficulty: "beginner", instructions: "Step one leg behind and across, lowering into a curtsy lunge." },
  { name: "Sumo Squat", category: "glutes", muscleGroup: "glutes", equipment: "barbell", gender: "both", difficulty: "intermediate", instructions: "Wide stance with toes out, squat deep and drive through your heels." },
  { name: "Sumo Deadlift", category: "glutes", muscleGroup: "glutes", equipment: "barbell", gender: "both", difficulty: "intermediate", instructions: "Wide stance, grip inside your knees and stand tall squeezing the glutes." },
  { name: "Frog Pumps", category: "glutes", muscleGroup: "glutes", equipment: "bodyweight", gender: "women", difficulty: "beginner", instructions: "Soles of your feet together, pump your hips up squeezing the glutes." },
  { name: "Banded Glute Bridge", category: "glutes", muscleGroup: "glutes", equipment: "resistance band", gender: "women", difficulty: "beginner", instructions: "Bridge with a band above your knees, pressing your knees outward." },
  { name: "Banded Hip Abduction", category: "glutes", muscleGroup: "glutes", equipment: "resistance band", gender: "women", difficulty: "beginner", instructions: "With a band around your thighs, push your knees apart against the tension." },

  // ─── Calves ───────────────────────────────────────────────────────────────
  { name: "Standing Calf Raise", category: "calves", muscleGroup: "calves", equipment: "machine", gender: "both", difficulty: "beginner", instructions: "Rise onto your toes at the machine, pause at the top, then lower fully." },
  { name: "Seated Calf Raise", category: "calves", muscleGroup: "calves", equipment: "machine", gender: "both", difficulty: "beginner", instructions: "Seated with knees bent, raise your heels high and lower for a stretch." },
  { name: "Leg Press Calf Raise", category: "calves", muscleGroup: "calves", equipment: "machine", gender: "both", difficulty: "beginner", instructions: "On the leg press, push the sled with just your toes through full range." },
  { name: "Smith Machine Calf Raise", category: "calves", muscleGroup: "calves", equipment: "smith machine", gender: "both", difficulty: "beginner", instructions: "Stand under the bar and perform calf raises with a controlled pause." },
  { name: "Donkey Calf Raise", category: "calves", muscleGroup: "calves", equipment: "machine", gender: "both", difficulty: "intermediate", instructions: "Bent over with the pad on your back, raise your heels high." },
  { name: "Single-Leg Calf Raise", category: "calves", muscleGroup: "calves", equipment: "bodyweight", gender: "both", difficulty: "beginner", instructions: "Raise one heel on a step, lowering for a full stretch each rep." },

  // ─── Abs / Core ───────────────────────────────────────────────────────────
  { name: "Crunch", category: "abs", muscleGroup: "abs", equipment: "bodyweight", gender: "both", difficulty: "beginner", instructions: "Curl your shoulders off the floor, squeezing the abs, then lower." },
  { name: "Weighted Crunch", category: "abs", muscleGroup: "abs", equipment: "bodyweight", gender: "men", difficulty: "intermediate", instructions: "Hold a weight at your chest and crunch up with control." },
  { name: "Cable Crunch", category: "abs", muscleGroup: "abs", equipment: "cable", gender: "both", difficulty: "beginner", instructions: "Kneel and crunch your elbows down toward your knees, squeezing." },
  { name: "Machine Crunch", category: "abs", muscleGroup: "abs", equipment: "machine", gender: "both", difficulty: "beginner", instructions: "Sit and crunch against the pad, focusing on the contraction." },
  { name: "Sit-Up", category: "abs", muscleGroup: "abs", equipment: "bodyweight", gender: "men", difficulty: "beginner", instructions: "With feet anchored, lift your whole torso up toward your knees." },
  { name: "Reverse Crunch", category: "abs", muscleGroup: "abs", equipment: "bodyweight", gender: "both", difficulty: "beginner", instructions: "Curl your knees toward your chest, lifting your hips off the floor." },
  { name: "Hanging Knee Raise", category: "abs", muscleGroup: "abs", equipment: "bodyweight", gender: "women", difficulty: "intermediate", instructions: "Hang and raise your knees to your chest without swinging." },
  { name: "Hanging Leg Raise", category: "abs", muscleGroup: "abs", equipment: "bodyweight", gender: "both", difficulty: "intermediate", instructions: "Hang and lift straight legs to hip height with control." },
  { name: "Lying Leg Raise", category: "abs", muscleGroup: "abs", equipment: "bodyweight", gender: "both", difficulty: "beginner", instructions: "Lying flat, raise straight legs to vertical and lower slowly." },
  { name: "Captain's Chair Knee Raise", category: "abs", muscleGroup: "abs", equipment: "bodyweight", gender: "both", difficulty: "beginner", instructions: "Support yourself on the captain's chair and raise your knees to your chest." },
  { name: "Ab Wheel Rollout", category: "abs", muscleGroup: "abs", equipment: "other", gender: "both", difficulty: "advanced", instructions: "Roll the wheel forward with a tight core, then pull back to the start." },
  { name: "Plank", category: "abs", muscleGroup: "core", equipment: "bodyweight", gender: "both", difficulty: "beginner", instructions: "Hold a straight line on your forearms, bracing the abs." },
  { name: "Weighted Plank", category: "abs", muscleGroup: "core", equipment: "bodyweight", gender: "both", difficulty: "intermediate", instructions: "Hold a plank with a plate resting on your back." },
  { name: "Russian Twist", category: "abs", muscleGroup: "obliques", equipment: "bodyweight", gender: "both", difficulty: "beginner", instructions: "Seated with feet up, rotate your torso side to side." },
  { name: "Cable Woodchop", category: "abs", muscleGroup: "obliques", equipment: "cable", gender: "both", difficulty: "intermediate", instructions: "Chop the high pulley diagonally across your body with controlled rotation." },
  { name: "Pallof Press", category: "abs", muscleGroup: "core", equipment: "cable", gender: "both", difficulty: "beginner", instructions: "Press the handle straight out from your chest, resisting the rotation." },
  { name: "Side Plank", category: "abs", muscleGroup: "obliques", equipment: "bodyweight", gender: "both", difficulty: "beginner", instructions: "Hold your body in a straight line resting on one forearm." },
  { name: "Dead Bug", category: "abs", muscleGroup: "core", equipment: "bodyweight", gender: "both", difficulty: "beginner", instructions: "Lie on your back, extend opposite arm and leg while keeping your back flat." },
  { name: "Bicycle Crunch", category: "abs", muscleGroup: "obliques", equipment: "bodyweight", gender: "women", difficulty: "beginner", instructions: "Alternate bringing elbow to opposite knee in a pedalling motion." },
  { name: "Bird Dog", category: "abs", muscleGroup: "core", equipment: "bodyweight", gender: "women", difficulty: "beginner", instructions: "On all fours, extend opposite arm and leg while keeping hips level." },

  // ─── Obliques ─────────────────────────────────────────────────────────────
  { name: "Cable Side Bend", category: "obliques", muscleGroup: "obliques", equipment: "cable", gender: "women", difficulty: "beginner", instructions: "Stand side-on to a low pulley and bend away from the weight." },
  { name: "Heel Touches", category: "obliques", muscleGroup: "obliques", equipment: "bodyweight", gender: "women", difficulty: "beginner", instructions: "Lie on your back and alternate reaching your hands to your heels." },
  { name: "Standing Cable Rotation", category: "obliques", muscleGroup: "obliques", equipment: "cable", gender: "women", difficulty: "beginner", instructions: "Rotate the cable handle across your body with a stable base." },

  // ─── Cardio ───────────────────────────────────────────────────────────────
  { name: "Treadmill Walking", category: "cardio", muscleGroup: "cardio", equipment: "machine", gender: "women", difficulty: "beginner", instructions: "Walk at a steady pace, keeping an upright posture." },
  { name: "Incline Treadmill Walking", category: "cardio", muscleGroup: "cardio", equipment: "machine", gender: "women", difficulty: "beginner", instructions: "Walk on an incline to raise the effort without running." },
  { name: "Jogging", category: "cardio", muscleGroup: "cardio", equipment: "bodyweight", gender: "women", difficulty: "beginner", instructions: "Jog at a conversational pace with light, quick steps." },
  { name: "Running", category: "cardio", muscleGroup: "cardio", equipment: "bodyweight", gender: "women", difficulty: "intermediate", instructions: "Run with a midfoot strike and relaxed shoulders." },
  { name: "Stair Climber", category: "cardio", muscleGroup: "cardio", equipment: "machine", gender: "women", difficulty: "beginner", instructions: "Climb at a steady rhythm, pressing through your heels." },
  { name: "Stationary Bike", category: "cardio", muscleGroup: "cardio", equipment: "machine", gender: "women", difficulty: "beginner", instructions: "Cycle at steady resistance with smooth pedal strokes." },
  { name: "Spin Bike", category: "cardio", muscleGroup: "cardio", equipment: "machine", gender: "women", difficulty: "intermediate", instructions: "Ride seated and standing intervals on the spin bike." },
  { name: "Elliptical", category: "cardio", muscleGroup: "cardio", equipment: "machine", gender: "women", difficulty: "beginner", instructions: "Push and pull through the handles while keeping a steady stride." },
  { name: "Rowing Machine", category: "cardio", muscleGroup: "cardio", equipment: "machine", gender: "women", difficulty: "intermediate", instructions: "Drive with your legs first, then lean back and pull the handle to your ribs." },
  { name: "Jump Rope", category: "cardio", muscleGroup: "cardio", equipment: "other", gender: "women", difficulty: "beginner", instructions: "Jump lightly on the balls of your feet, keeping wrists relaxed." },
  { name: "Step Machine", category: "cardio", muscleGroup: "cardio", equipment: "machine", gender: "women", difficulty: "beginner", instructions: "Step continuously with a tall posture and an even rhythm." },

  // ─── Full Body ────────────────────────────────────────────────────────────
  { name: "Clean", category: "full_body", muscleGroup: "full body", equipment: "barbell", gender: "men", difficulty: "advanced", instructions: "Pull the bar from the floor and catch it at shoulder height in a front rack." },
  { name: "Power Clean", category: "full_body", muscleGroup: "full body", equipment: "barbell", gender: "men", difficulty: "advanced", instructions: "Explosively pull the bar and catch it on your shoulders with bent knees." },
  { name: "Clean & Press", category: "full_body", muscleGroup: "full body", equipment: "barbell", gender: "men", difficulty: "advanced", instructions: "Clean the bar to your shoulders, then press it overhead in one flow." },
  { name: "Snatch", category: "full_body", muscleGroup: "full body", equipment: "barbell", gender: "men", difficulty: "advanced", instructions: "Lift the bar from the floor to overhead in one continuous motion." },
  { name: "Thruster", category: "full_body", muscleGroup: "full body", equipment: "barbell", gender: "men", difficulty: "intermediate", instructions: "Squat with the bar at your shoulders and press overhead as you stand." },
  { name: "Dumbbell Thruster", category: "full_body", muscleGroup: "full body", equipment: "dumbbell", gender: "women", difficulty: "intermediate", instructions: "Squat holding dumbbells at your shoulders, then press as you stand." },
  { name: "Kettlebell Swing", category: "full_body", muscleGroup: "glutes", equipment: "kettlebell", gender: "both", difficulty: "beginner", instructions: "Hinge and snap your hips to swing the bell to chest height." },
  { name: "Turkish Get-Up", category: "full_body", muscleGroup: "full body", equipment: "kettlebell", gender: "both", difficulty: "advanced", instructions: "Lie down holding a bell overhead and stand up while keeping it locked out." },
  { name: "Sled Push", category: "full_body", muscleGroup: "full body", equipment: "other", gender: "both", difficulty: "intermediate", instructions: "Lean into the sled and drive with short, powerful steps." },
  { name: "Sled Pull", category: "full_body", muscleGroup: "full body", equipment: "other", gender: "both", difficulty: "intermediate", instructions: "Pull the loaded sled toward you with a strong, braced stance." },
  { name: "Battle Ropes", category: "full_body", muscleGroup: "full body", equipment: "other", gender: "both", difficulty: "intermediate", instructions: "Create waves with alternating or simultaneous arm slams." },
  { name: "Burpees", category: "full_body", muscleGroup: "full body", equipment: "bodyweight", gender: "both", difficulty: "beginner", instructions: "Drop to a push-up, jump your feet in, then explode upward." },
  { name: "Dumbbell Clean", category: "full_body", muscleGroup: "full body", equipment: "dumbbell", gender: "women", difficulty: "intermediate", instructions: "Pull a dumbbell from the floor to your shoulder in one motion." },
  { name: "Dumbbell Clean & Press", category: "full_body", muscleGroup: "full body", equipment: "dumbbell", gender: "women", difficulty: "intermediate", instructions: "Clean the dumbbell to your shoulder and press it overhead." },
  { name: "Dumbbell Complex", category: "full_body", muscleGroup: "full body", equipment: "dumbbell", gender: "women", difficulty: "advanced", instructions: "Flow through several dumbbell lifts back-to-back without dropping the weight." },
];

export async function seedExercises() {
  try {
    const existing = await db.select().from(exercises);
    const existingById = new Map(existing.map((row) => [row.id, row]));
    const byTargetId = new Map<string, string>(); // new exercise id -> existing row id

    // Pass 1: match existing rows to canonical entries (IDs preserved).
    for (const row of existing) {
      const targetName =
        SEED_EXERCISES.find((e) => slug(e.name) === row.id)?.name ??
        SEED_EXERCISES.find((e) => normalize(e.name) === normalize(row.name))?.name ??
        ALIASES[normalize(row.name)];
      if (!targetName) continue;
      const target = SEED_EXERCISES.find((e) => e.name === targetName);
      if (!target) continue;
      const targetId = slug(target.name);
      if (byTargetId.has(targetId)) continue;
      byTargetId.set(targetId, row.id);
      const imgs = IMAGE_URLS[target.name];
      await db
        .update(exercises)
        .set({
          name: target.name,
          category: target.category,
          muscleGroup: target.muscleGroup,
          equipment: target.equipment,
          gender: target.gender,
          difficulty: target.difficulty,
          instructions: target.instructions,
          // Backfill image URLs only — never clobber existing ones.
          imageUrl: row.imageUrl ?? imgs?.imageUrl ?? null,
          imageUrlFemale: row.imageUrlFemale ?? imgs?.imageUrlFemale ?? null,
        })
        .where(eq(exercises.id, row.id));
    }

    // Pass 2: insert canonical entries that have no existing row.
    let inserted = 0;
    for (const ex of SEED_EXERCISES) {
      const id = slug(ex.name);
      if (byTargetId.has(id) || existingById.has(id)) continue;
      const imgs = IMAGE_URLS[ex.name];
      await db.insert(exercises).values({
        id,
        name: ex.name,
        category: ex.category,
        muscleGroup: ex.muscleGroup,
        equipment: ex.equipment,
        gender: ex.gender,
        difficulty: ex.difficulty,
        instructions: ex.instructions,
        imageUrl: imgs?.imageUrl ?? null,
        imageUrlFemale: imgs?.imageUrlFemale ?? null,
      });
      inserted++;
    }

    if (inserted > 0) console.log(`Seeded ${inserted} exercises`);
  } catch (err) {
    console.error("Seed failed:", err);
  }
}
