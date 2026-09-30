"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Dumbbell, TrendingUp } from "lucide-react";
import { getWorkoutHistory } from "@/lib/actions";
import { useSession } from "@/lib/use-session";

export default function HistoryPage() {
  const user = useSession();
  const [history, setHistory] = useState<{
    id: string; name: string | null; startedAt: Date; completedAt: Date | null;
    totalSets: number; completedSets: number; totalVolume: number; exerciseCount: number;
    notes: string | null;
  }[]>([]);

  useEffect(() => {
    if (user?.id) getWorkoutHistory(user.id).then(setHistory);
  }, [user?.id]);

  const thisWeekCount = history.filter((w) => {
    const d = new Date(w.startedAt);
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    return d >= weekStart;
  }).length;

  const avgDuration = history.length > 0
    ? Math.round(history.reduce((a, w) => {
        const dur = w.completedAt ? (new Date(w.completedAt).getTime() - new Date(w.startedAt).getTime()) / 60000 : 0;
        return a + dur;
      }, 0) / history.length)
    : 0;

  const avgVolume = history.length > 0
    ? Math.round(history.reduce((a, w) => a + w.totalVolume, 0) / history.length)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Workout History</h1>
        <p className="text-muted-foreground mt-1">{history.length} workouts completed</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{thisWeekCount}</p><p className="text-xs text-muted-foreground">This Week</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{history.length}</p><p className="text-xs text-muted-foreground">All Time</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{avgDuration} min</p><p className="text-xs text-muted-foreground">Avg Duration</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{avgVolume.toLocaleString()} kg</p><p className="text-xs text-muted-foreground">Avg Volume</p></CardContent></Card>
      </div>

      <div className="space-y-3">
        {history.map((workout) => {
          const duration = workout.completedAt
            ? Math.round((new Date(workout.completedAt).getTime() - new Date(workout.startedAt).getTime()) / 60000)
            : 0;
          return (
            <Card key={workout.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Dumbbell className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{workout.name || "Workout"}</h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(workout.startedAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />{duration} min
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <Badge variant="secondary" className="mb-1">{workout.exerciseCount} exercises</Badge>
                    <p className="text-sm font-medium flex items-center gap-1 justify-end">
                      <TrendingUp className="h-3 w-3 text-primary" />{workout.totalVolume.toLocaleString()} kg
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {history.length === 0 && (
        <div className="text-center py-12">
          <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No workouts yet</h3>
          <p className="text-muted-foreground">Complete your first workout to see it here.</p>
        </div>
      )}
    </div>
  );
}
