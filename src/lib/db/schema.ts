import { sqliteTable, text, integer, real, uniqueIndex } from "drizzle-orm/sqlite-core";

// ─── Auth tables (used by Better Auth adapter) ───────────────────────────────

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  issuer: text("issuer").notNull(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// ─── App tables ──────────────────────────────────────────────────────────────

export const exercises = sqliteTable("exercise", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  muscleGroup: text("muscle_group").notNull(),
  equipment: text("equipment").notNull(),
  gender: text("gender").notNull().default("both"),
  difficulty: text("difficulty").notNull().default("beginner"),
  instructions: text("instructions"),
  imageUrl: text("image_url"),
  imageUrlFemale: text("image_url_female"),
});

export const workoutTemplates = sqliteTable("workout_template", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const scheduleEntries = sqliteTable(
  "schedule_entry",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    dayOfWeek: integer("day_of_week").notNull(),
    templateId: text("template_id").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [uniqueIndex("schedule_user_day_unique").on(table.userId, table.dayOfWeek)]
);

export const workoutTemplateExercises = sqliteTable("workout_template_exercise", {
  id: text("id").primaryKey(),
  templateId: text("template_id").notNull(),
  exerciseId: text("exercise_id").notNull(),
  orderIndex: integer("order_index").notNull(),
  targetSets: integer("target_sets").notNull().default(3),
  targetReps: text("target_reps").notNull().default("8-12"),
});

export const workoutSessions = sqliteTable("workout_session", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  templateId: text("template_id"),
  name: text("name"),
  startedAt: integer("started_at", { mode: "timestamp" }).notNull(),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  notes: text("notes"),
});

export const workoutSets = sqliteTable("workout_set", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  exerciseId: text("exercise_id").notNull(),
  setNumber: integer("set_number").notNull(),
  reps: integer("reps"),
  weight: real("weight"),
  restTime: integer("rest_time"),
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
});

export const favorites = sqliteTable("favorite", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  exerciseId: text("exercise_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const personalRecords = sqliteTable("personal_record", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  exerciseId: text("exercise_id").notNull(),
  weight: real("weight").notNull(),
  reps: integer("reps").notNull(),
  estimated1RM: real("estimated_1rm"),
  date: integer("date", { mode: "timestamp" }).notNull(),
});

export const goals = sqliteTable("goal", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(),
  target: real("target").notNull(),
  current: real("current").notNull().default(0),
  unit: text("unit").notNull(),
  deadline: integer("deadline", { mode: "timestamp" }),
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const notifications = sqliteTable("notification", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: integer("read", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const userSettings = sqliteTable("user_settings", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  theme: text("theme").notNull().default("system"),
  weightUnit: text("weight_unit").notNull().default("kg"),
  restTimerDefault: integer("rest_timer_default").notNull().default(90),
  soundEnabled: integer("sound_enabled", { mode: "boolean" }).notNull().default(true),
});
