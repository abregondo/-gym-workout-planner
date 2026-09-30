"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dumbbell,
  TrendingUp,
  Trophy,
  Target,
  Flame,
  ArrowRight,
  Clock,
  Zap,
  CalendarDays,
  Coffee,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getDashboardStats, getSchedule, getTemplates, seedAllExercises } from "@/lib/actions";
import { useSession } from "@/lib/use-session";
import { WorkoutCover } from "@/components/workout-cover";

export default function DashboardPage() {
  const user = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<{
    workoutsThisWeek: number;
    totalVolume: number;
    newPRs: number;
    goalsCompleted: number;
    recentWorkouts: { name: string; date: string; exercises: number; duration: string; volume: string }[];
    unreadNotifications: number;
  } | null>(null);
  const [todayWorkout, setTodayWorkout] = useState<{ templateId: string; templateName: string; exerciseCount: number } | null>(null);
  const [todayTemplate, setTodayTemplate] = useState<{
    id: string;
    name: string;
    exercises: { name: string; category?: string | null; muscleGroup?: string | null }[];
  } | null>(null);

  useEffect(() => {
    if (user?.id) {
      getDashboardStats(user.id).then(setStats);
      const today = new Date().getDay();
      Promise.all([getSchedule(user.id), seedAllExercises().then(() => getTemplates(user.id))]).then(
        ([schedule, templates]) => {
          const entry = schedule.find((s) => s.dayOfWeek === today);
          if (entry) {
            setTodayWorkout(entry);
            const t = templates.find((tpl) => tpl.id === entry.templateId) ?? null;
            setTodayTemplate(t);
          }
        }
      );
    }
  }, [user?.id]);

  const startTodayWorkout = () => {
    if (!todayTemplate) return;
    router.push(
      `/workout/active?template=${encodeURIComponent(todayTemplate.name)}&exercises=${encodeURIComponent(JSON.stringify(todayTemplate.exercises.map((e) => e.name)))}&templateId=${todayTemplate.id}`
    );
  };

  const s = stats;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome Back{user?.name ? `, ${user.name}` : "!"}
          </h1>
          <p className="text-muted-foreground mt-1">Ready to crush today&apos;s workout?</p>
        </div>
        <Link href="/planner">
          <Button className="gap-2">
            <Flame className="h-4 w-4" />
            Start Workout
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Workouts This Week", value: String(s?.workoutsThisWeek ?? 0), icon: Dumbbell, color: "text-chart-5" },
          { label: "Total Volume", value: `${(s?.totalVolume ?? 0).toLocaleString()} kg`, icon: TrendingUp, color: "text-chart-1" },
          { label: "New PRs", value: String(s?.newPRs ?? 0), icon: Trophy, color: "text-chart-4" },
          { label: "Goals Completed", value: String(s?.goalsCompleted ?? 0), icon: Target, color: "text-chart-2" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-muted/50 ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Today&apos;s Workout
          </CardTitle>
          <Link href="/planner">
            <Button variant="ghost" size="sm" className="gap-1">
              Edit Schedule <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {todayWorkout && todayTemplate ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-3">
                <WorkoutCover
                  templateId={todayTemplate.id}
                  exercises={todayTemplate.exercises}
                  variant="thumb"
                />
                <div>
                  <p className="font-semibold">{todayWorkout.templateName}</p>
                  <p className="text-sm text-muted-foreground">
                    {todayWorkout.exerciseCount} exercise{todayWorkout.exerciseCount === 1 ? "" : "s"} scheduled for today
                  </p>
                </div>
              </div>
              <Button className="gap-2 shrink-0" onClick={startTodayWorkout}>
                <Flame className="h-4 w-4" />
                Start Workout
              </Button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                  <Coffee className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold">Rest day</p>
                  <p className="text-sm text-muted-foreground">Nothing scheduled for today.</p>
                </div>
              </div>
              <Link href="/planner">
                <Button variant="outline" className="gap-2 shrink-0">
                  <CalendarDays className="h-4 w-4" />
                  Plan Your Week
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Recent Workouts
          </CardTitle>
          <Link href="/history">
            <Button variant="ghost" size="sm" className="gap-1">
              View All <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {s?.recentWorkouts && s.recentWorkouts.length > 0 ? (
            <div className="space-y-3">
              {s.recentWorkouts.map((workout, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Dumbbell className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{workout.name}</p>
                      <p className="text-sm text-muted-foreground">{workout.date}</p>
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium">{workout.duration}</p>
                    <p className="text-xs text-muted-foreground">{workout.exercises} exercises</p>
                  </div>
                  <Badge variant="secondary">{workout.volume}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">No workouts yet. Start your first one!</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link href="/planner">
              <Button variant="outline" className="w-full justify-start gap-2 h-12">
                <Dumbbell className="h-4 w-4 text-primary" />
                Create Workout Template
              </Button>
            </Link>
            <Link href="/exercises">
              <Button variant="outline" className="w-full justify-start gap-2 h-12">
                <TrendingUp className="h-4 w-4 text-primary" />
                Browse Exercise Library
              </Button>
            </Link>
            <Link href="/goals">
              <Button variant="outline" className="w-full justify-start gap-2 h-12">
                <Target className="h-4 w-4 text-primary" />
                Set a New Goal
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
