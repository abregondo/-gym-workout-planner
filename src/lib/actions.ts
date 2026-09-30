"use server";

import { db } from "@/lib/db";
import {
  exercises,
  workoutTemplates,
  workoutTemplateExercises,
  workoutSessions,
  workoutSets,
  favorites,
  personalRecords,
  goals,
  notifications,
  scheduleEntries,
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { seedExercises } from "@/lib/seed";

function genId() {
  return crypto.randomUUID();
}

export async function seedAllExercises() {
  await seedExercises();
}

// ─── Exercises ───────────────────────────────────────────────────────────────

export async function getExercises() {
  return db.select().from(exercises);
}

// ─── Favorites ───────────────────────────────────────────────────────────────

export async function getFavorites(userId: string) {
  return db.select().from(favorites).where(eq(favorites.userId, userId));
}

export async function toggleFavorite(userId: string, exerciseId: string) {
  const existing = await db
    .select()
    .from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.exerciseId, exerciseId)));

  if (existing.length > 0) {
    await db.delete(favorites).where(eq(favorites.id, existing[0].id));
  } else {
    await db.insert(favorites).values({
      id: genId(),
      userId,
      exerciseId,
      createdAt: new Date(),
    });
  }
  revalidatePath("/exercises");
}

// ─── Workout Templates ───────────────────────────────────────────────────────

export async function getTemplates(userId: string) {
  const templates = await db
    .select()
    .from(workoutTemplates)
    .where(eq(workoutTemplates.userId, userId))
    .orderBy(desc(workoutTemplates.createdAt));

  const result = await Promise.all(
    templates.map(async (t) => {
      const templateExercises = await db
        .select()
        .from(workoutTemplateExercises)
        .where(eq(workoutTemplateExercises.templateId, t.id));

      const exDetails = await Promise.all(
        templateExercises.map(async (te) => {
          const ex = await db.select().from(exercises).where(eq(exercises.id, te.exerciseId));
          return {
            ...te,
            name: ex[0]?.name || "Unknown Exercise",
            category: ex[0]?.category ?? null,
            muscleGroup: ex[0]?.muscleGroup ?? null,
            imageUrl: ex[0]?.imageUrl ?? null,
          };
        })
      );

      return { ...t, exercises: exDetails.sort((a, b) => a.orderIndex - b.orderIndex) };
    })
  );

  return result;
}

export async function createTemplate(
  userId: string,
  name: string,
  description: string,
  exerciseIds: string[],
  targetSets: number[],
  targetReps: string[]
) {
  const templateId = genId();
  await db.insert(workoutTemplates).values({
    id: templateId,
    userId,
    name,
    description,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  for (let i = 0; i < exerciseIds.length; i++) {
    await db.insert(workoutTemplateExercises).values({
      id: genId(),
      templateId,
      exerciseId: exerciseIds[i],
      orderIndex: i,
      targetSets: targetSets[i] || 3,
      targetReps: targetReps[i] || "8-12",
    });
  }

  revalidatePath("/planner");
  return templateId;
}

export async function deleteTemplate(templateId: string) {
  await db.delete(workoutTemplateExercises).where(eq(workoutTemplateExercises.templateId, templateId));
  await db.delete(scheduleEntries).where(eq(scheduleEntries.templateId, templateId));
  await db.delete(workoutTemplates).where(eq(workoutTemplates.id, templateId));
  revalidatePath("/planner");
}

// ─── Weekly Schedule ────────────────────────────────────────────────────────

export interface ScheduleDay {
  dayOfWeek: number;
  templateId: string;
  templateName: string;
  exerciseCount: number;
}

export async function getSchedule(userId: string): Promise<ScheduleDay[]> {
  const entries = await db
    .select()
    .from(scheduleEntries)
    .where(eq(scheduleEntries.userId, userId));

  const result: ScheduleDay[] = [];
  for (const entry of entries) {
    const template = await db
      .select()
      .from(workoutTemplates)
      .where(eq(workoutTemplates.id, entry.templateId));
    if (template.length === 0) continue;
    const templateExercises = await db
      .select()
      .from(workoutTemplateExercises)
      .where(eq(workoutTemplateExercises.templateId, entry.templateId));
    result.push({
      dayOfWeek: entry.dayOfWeek,
      templateId: entry.templateId,
      templateName: template[0].name,
      exerciseCount: templateExercises.length,
    });
  }
  return result;
}

export async function setScheduleDay(userId: string, dayOfWeek: number, templateId: string) {
  const existing = await db
    .select()
    .from(scheduleEntries)
    .where(and(eq(scheduleEntries.userId, userId), eq(scheduleEntries.dayOfWeek, dayOfWeek)));

  if (existing.length > 0) {
    await db
      .update(scheduleEntries)
      .set({ templateId })
      .where(and(eq(scheduleEntries.userId, userId), eq(scheduleEntries.dayOfWeek, dayOfWeek)));
  } else {
    await db.insert(scheduleEntries).values({
      id: genId(),
      userId,
      dayOfWeek,
      templateId,
      createdAt: new Date(),
    });
  }
  revalidatePath("/planner");
  revalidatePath("/dashboard");
}

export async function clearScheduleDay(userId: string, dayOfWeek: number) {
  await db
    .delete(scheduleEntries)
    .where(and(eq(scheduleEntries.userId, userId), eq(scheduleEntries.dayOfWeek, dayOfWeek)));
  revalidatePath("/planner");
  revalidatePath("/dashboard");
}

// ─── Workout Sessions ────────────────────────────────────────────────────────

export async function saveWorkoutSession(
  userId: string,
  name: string,
  templateId: string | null,
  elapsed: number,
  exerciseData: { exerciseId: string; name: string; sets: { reps: string; weight: string; completed: boolean }[] }[]
) {
  const sessionId = genId();
  const now = new Date();
  const startedAt = new Date(now.getTime() - elapsed * 1000);

  await db.insert(workoutSessions).values({
    id: sessionId,
    userId,
    templateId,
    name,
    startedAt,
    completedAt: now,
    notes: `Duration: ${Math.floor(elapsed / 60)}m ${elapsed % 60}s`,
  });

  for (const exercise of exerciseData) {
    // Look up the actual exercise ID by name for PR detection
    const exRow = await db.select().from(exercises).where(eq(exercises.name, exercise.name));
    const realExerciseId = exRow[0]?.id || exercise.exerciseId;

    for (let i = 0; i < exercise.sets.length; i++) {
      const s = exercise.sets[i];
      await db.insert(workoutSets).values({
        id: genId(),
        sessionId,
        exerciseId: exercise.exerciseId,
        setNumber: i + 1,
        reps: s.reps ? parseInt(s.reps) : null,
        weight: s.weight ? parseFloat(s.weight) : null,
        restTime: 90,
        completed: s.completed,
      });

      // Auto-detect PRs
      if (s.completed && s.weight && s.reps) {
        const weight = parseFloat(s.weight);
        const reps = parseInt(s.reps);
        if (weight > 0 && reps > 0) {
          const estimated1RM = weight * (1 + reps / 30);
          const existingPR = await db
            .select()
            .from(personalRecords)
            .where(
              and(
                eq(personalRecords.userId, userId),
                eq(personalRecords.exerciseId, realExerciseId)
              )
            )
            .orderBy(desc(personalRecords.weight))
            .limit(1);

          if (existingPR.length === 0 || weight > existingPR[0].weight) {
            await db.insert(personalRecords).values({
              id: genId(),
              userId,
              exerciseId: realExerciseId,
              weight,
              reps,
              estimated1RM: Math.round(estimated1RM * 10) / 10,
              date: now,
            });

            // Create PR notification
            await db.insert(notifications).values({
              id: genId(),
              userId,
              type: "pr",
              title: "New Personal Record!",
              message: `${exercise.name}: ${weight}kg x ${reps} reps (Est. 1RM: ${Math.round(estimated1RM)}kg)`,
              read: false,
              createdAt: now,
            });
          }
        }
      }
    }
  }

  revalidatePath("/history");
  revalidatePath("/prs");
  revalidatePath("/dashboard");
  return sessionId;
}

export async function getWorkoutHistory(userId: string) {
  const sessions = await db
    .select()
    .from(workoutSessions)
    .where(eq(workoutSessions.userId, userId))
    .orderBy(desc(workoutSessions.startedAt));

  const result = await Promise.all(
    sessions.map(async (s) => {
      const sets = await db.select().from(workoutSets).where(eq(workoutSets.sessionId, s.id));
      const completedSets = sets.filter((set) => set.completed).length;
      const totalVolume = sets.reduce((acc, set) => {
        if (set.completed && set.weight && set.reps) {
          return acc + set.weight * set.reps;
        }
        return acc;
      }, 0);

      return {
        ...s,
        totalSets: sets.length,
        completedSets,
        totalVolume: Math.round(totalVolume),
        exerciseCount: new Set(sets.map((set) => set.exerciseId)).size,
      };
    })
  );

  return result;
}

// ─── Goals ───────────────────────────────────────────────────────────────────

export async function getGoals(userId: string) {
  return db.select().from(goals).where(eq(goals.userId, userId)).orderBy(desc(goals.createdAt));
}

export async function createGoal(
  userId: string,
  title: string,
  type: string,
  target: number,
  unit: string,
  deadline: string | null
) {
  await db.insert(goals).values({
    id: genId(),
    userId,
    title,
    type,
    target,
    current: 0,
    unit,
    deadline: deadline ? new Date(deadline) : null,
    completed: false,
    createdAt: new Date(),
  });
  revalidatePath("/goals");
}

export async function updateGoalProgress(goalId: string, current: number) {
  const goal = await db.select().from(goals).where(eq(goals.id, goalId));
  if (goal.length > 0) {
    const completed = current >= goal[0].target;
    await db.update(goals).set({ current, completed }).where(eq(goals.id, goalId));

    if (completed && !goal[0].completed) {
      await db.insert(notifications).values({
        id: genId(),
        userId: goal[0].userId,
        type: "goal",
        title: "Goal Completed!",
        message: `Congratulations! You completed: ${goal[0].title}`,
        read: false,
        createdAt: new Date(),
      });
      revalidatePath("/notifications");
    }
  }
  revalidatePath("/goals");
}

export async function deleteGoal(goalId: string) {
  await db.delete(goals).where(eq(goals.id, goalId));
  revalidatePath("/goals");
}

export async function getProgressData(userId: string) {
  const sessions = await db
    .select()
    .from(workoutSessions)
    .where(eq(workoutSessions.userId, userId))
    .orderBy(desc(workoutSessions.startedAt));

  const prs = await db
    .select()
    .from(personalRecords)
    .where(eq(personalRecords.userId, userId))
    .orderBy(desc(personalRecords.date));

  const result: { history: { startedAt: Date; totalVolume: number }[]; prs: { exerciseId: string; weight: number; date: Date }[] } = {
    history: [],
    prs: [],
  };

  for (const session of sessions) {
    const sets = await db.select().from(workoutSets).where(eq(workoutSets.sessionId, session.id));
    const volume = sets.reduce((acc, set) => {
      if (set.completed && set.weight && set.reps) return acc + set.weight * set.reps;
      return acc;
    }, 0);
    result.history.push({ startedAt: session.startedAt, totalVolume: volume });
  }

  result.prs = prs.map((pr) => ({ exerciseId: pr.exerciseId, weight: pr.weight, date: pr.date }));

  return result;
}

export async function getPersonalRecords(userId: string) {
  const records = await db
    .select()
    .from(personalRecords)
    .where(eq(personalRecords.userId, userId))
    .orderBy(desc(personalRecords.date));

  const result = await Promise.all(
    records.map(async (pr) => {
      const ex = await db.select().from(exercises).where(eq(exercises.id, pr.exerciseId));
      return {
        ...pr,
        exerciseName: ex[0]?.name || "Unknown",
        exerciseImage: ex[0]?.imageUrl ?? null,
        exerciseCategory: ex[0]?.category ?? null,
        exerciseMuscleGroup: ex[0]?.muscleGroup ?? null,
      };
    })
  );

  return result;
}

// ─── Notifications ───────────────────────────────────────────────────────────

export async function getNotifications(userId: string) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt));
}

export async function markNotificationRead(notificationId: string) {
  await db.update(notifications).set({ read: true }).where(eq(notifications.id, notificationId));
  revalidatePath("/notifications");
}

export async function markAllNotificationsRead(userId: string) {
  await db.update(notifications).set({ read: true }).where(eq(notifications.userId, userId));
  revalidatePath("/notifications");
}

export async function deleteNotification(notificationId: string) {
  await db.delete(notifications).where(eq(notifications.id, notificationId));
  revalidatePath("/notifications");
}

// ─── Dashboard Stats ─────────────────────────────────────────────────────────

export async function getDashboardStats(userId: string) {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const sessions = await db
    .select()
    .from(workoutSessions)
    .where(
      and(
        eq(workoutSessions.userId, userId),
      )
    )
    .orderBy(desc(workoutSessions.startedAt));

  const thisWeek = sessions.filter((s) => new Date(s.startedAt) >= weekStart);

  let totalVolume = 0;
  let recentWorkouts: { name: string; date: string; exercises: number; duration: string; volume: string }[] = [];

  for (const session of sessions.slice(0, 5)) {
    const sets = await db.select().from(workoutSets).where(eq(workoutSets.sessionId, session.id));
    const volume = sets.reduce((acc, set) => {
      if (set.completed && set.weight && set.reps) return acc + set.weight * set.reps;
      return acc;
    }, 0);

    if (new Date(session.startedAt) >= weekStart) {
      totalVolume += volume;
    }

    const duration = session.completedAt
      ? Math.round((new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / 60000)
      : 0;

    recentWorkouts.push({
      name: session.name || "Workout",
      date: new Date(session.startedAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      exercises: sets.length > 0 ? new Set(sets.map((s) => s.exerciseId)).size : 0,
      duration: `${duration} min`,
      volume: `${Math.round(volume).toLocaleString()} kg`,
    });
  }

  const unreadNotifs = await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));

  const completedGoals = await db
    .select()
    .from(goals)
    .where(and(eq(goals.userId, userId), eq(goals.completed, true)));

  const thisWeekPRs = await db
    .select()
    .from(personalRecords)
    .where(eq(personalRecords.userId, userId))
    .orderBy(desc(personalRecords.date));

  const weekPRs = thisWeekPRs.filter((pr) => new Date(pr.date) >= weekStart);

  return {
    workoutsThisWeek: thisWeek.length,
    totalVolume: Math.round(totalVolume),
    newPRs: weekPRs.length,
    goalsCompleted: completedGoals.length,
    recentWorkouts,
    unreadNotifications: unreadNotifs.length,
  };
}
