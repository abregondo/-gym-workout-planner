"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Star } from "lucide-react";
import { getPersonalRecords } from "@/lib/actions";
import { useSession } from "@/lib/use-session";
import { ExerciseImage } from "@/components/exercise-image";

export default function PRsPage() {
  const user = useSession();
  const [prs, setPrs] = useState<{
    id: string; exerciseId: string; exerciseName: string; weight: number; reps: number; estimated1RM: number | null; date: Date;
    exerciseImage?: string | null; exerciseCategory?: string | null; exerciseMuscleGroup?: string | null;
  }[]>([]);

  useEffect(() => {
    if (user?.id) getPersonalRecords(user.id).then(setPrs);
  }, [user?.id]);

  const isNewPR = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    return diff < 7 * 24 * 60 * 60 * 1000;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Personal Records</h1>
        <p className="text-muted-foreground mt-1">Your all-time best lifts</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center"><Trophy className="h-8 w-8 mx-auto text-chart-4 mb-2" /><p className="text-2xl font-bold">{prs.length}</p><p className="text-xs text-muted-foreground">Total PRs</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Star className="h-8 w-8 mx-auto text-chart-2 mb-2" /><p className="text-2xl font-bold">{prs.filter((pr) => isNewPR(pr.date)).length}</p><p className="text-xs text-muted-foreground">New This Week</p></CardContent></Card>
        <Card className="col-span-2 md:col-span-1"><CardContent className="p-4 text-center"><TrendingUp className="h-8 w-8 mx-auto text-chart-1 mb-2" /><p className="text-2xl font-bold">{prs.length > 0 ? `${Math.max(...prs.map((p) => p.estimated1RM || 0))} kg` : "—"}</p><p className="text-xs text-muted-foreground">Best Est. 1RM</p></CardContent></Card>
      </div>

      <div className="space-y-3">
        {prs.map((pr) => (
          <Card key={pr.id} className={`hover:shadow-md transition-shadow ${isNewPR(pr.date) ? "border-primary/50" : ""}`}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <ExerciseImage
                    exerciseId={pr.exerciseId}
                    name={pr.exerciseName}
                    imageUrl={pr.exerciseImage}
                    category={pr.exerciseCategory}
                    muscleGroup={pr.exerciseMuscleGroup}
                    variant="thumb"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{pr.exerciseName}</h3>
                      {isNewPR(pr.date) && <Badge className="gradient-sunset border-transparent text-white shadow-sm shadow-primary/25">NEW PR!</Badge>}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">{pr.weight} kg <span className="text-sm font-normal text-muted-foreground">× {pr.reps}</span></p>
                  <p className="text-sm text-muted-foreground">Est. 1RM: <span className="font-medium text-primary">{pr.estimated1RM} kg</span></p>
                  <p className="text-xs text-muted-foreground mt-0.5">{new Date(pr.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {prs.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No PRs yet</h3>
          <p className="text-muted-foreground">Complete workouts to track your personal records.</p>
        </div>
      )}
    </div>
  );
}
