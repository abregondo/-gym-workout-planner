"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Play, Pause, RotateCcw, Check, Plus, Clock, Dumbbell, Save, X, Timer } from "lucide-react";
import { saveWorkoutSession, getExercises, seedAllExercises } from "@/lib/actions";
import { useSession } from "@/lib/use-session";
import { ExerciseImage } from "@/components/exercise-image";

interface SetData { id: string; reps: string; weight: string; completed: boolean; }
interface ExerciseData { id: string; name: string; sets: SetData[]; }
interface ExMeta { id: string; name: string; imageUrl: string | null; category: string | null; muscleGroup: string | null; }

function makeSets(count: number, prefix: string) {
  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix}-${i}`,
    reps: "8",
    weight: "0",
    completed: false,
  }));
}

function ActiveWorkoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const user = useSession();
  const templateName = searchParams.get("template") || "Workout";
  const templateId = searchParams.get("templateId") || null;
  const exerciseNames = useMemo(() => {
    try {
      const raw = searchParams.get("exercises");
      return raw ? (JSON.parse(raw) as string[]) : null;
    } catch { return null; }
  }, [searchParams]);

  const [exercises, setExercises] = useState<ExerciseData[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [restTimer, setRestTimer] = useState(0);
  const [restActive, setRestActive] = useState(false);
  const [restDuration, setRestDuration] = useState(90);
  const [finishDialog, setFinishDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exMeta, setExMeta] = useState<Record<string, ExMeta>>({});

  useEffect(() => {
    seedAllExercises().then(() => getExercises()).then((rows) => {
      const map: Record<string, ExMeta> = {};
      for (const r of rows) {
        map[r.name] = { id: r.id, name: r.name, imageUrl: r.imageUrl, category: r.category, muscleGroup: r.muscleGroup };
      }
      setExMeta(map);
    });
  }, []);

  useEffect(() => {
    if (exerciseNames) {
      setExercises(exerciseNames.map((name, i) => ({
        id: String(i + 1),
        name,
        sets: makeSets(3, `s${i}`),
      })));
    }
  }, [exerciseNames]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (restActive && restTimer > 0) interval = setInterval(() => setRestTimer((r) => r - 1), 1000);
    else if (restTimer === 0 && restActive) setRestActive(false);
    return () => clearInterval(interval);
  }, [restActive, restTimer]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const toggleSet = (exId: string, setId: string) => {
    setExercises((prev) => prev.map((ex) =>
      ex.id === exId ? { ...ex, sets: ex.sets.map((s) => s.id === setId ? { ...s, completed: !s.completed } : s) } : ex
    ));
  };

  const updateSet = (exId: string, setId: string, field: "reps" | "weight", value: string) => {
    setExercises((prev) => prev.map((ex) =>
      ex.id === exId ? { ...ex, sets: ex.sets.map((s) => s.id === setId ? { ...s, [field]: value } : s) } : ex
    ));
  };

  const addSet = (exId: string) => {
    setExercises((prev) => prev.map((ex) =>
      ex.id === exId ? { ...ex, sets: [...ex.sets, { id: crypto.randomUUID(), reps: "8", weight: "0", completed: false }] } : ex
    ));
  };

  const removeSet = (exId: string, setId: string) => {
    setExercises((prev) => prev.map((ex) =>
      ex.id === exId ? { ...ex, sets: ex.sets.filter((s) => s.id !== setId) } : ex
    ));
  };

  const startRest = useCallback(() => { setRestTimer(restDuration); setRestActive(true); }, [restDuration]);

  const handleFinish = async () => {
    if (!user?.id) return;
    setSaving(true);
    await saveWorkoutSession(
      user.id,
      templateName,
      templateId,
      elapsed,
      exercises.map((ex) => ({
        exerciseId: ex.id,
        name: ex.name,
        sets: ex.sets.map((s) => ({ reps: s.reps, weight: s.weight, completed: s.completed })),
      }))
    );
    setSaving(false);
    setFinishDialog(false);
    router.push("/dashboard");
  };

  const totalSets = exercises.reduce((a, ex) => a + ex.sets.length, 0);
  const completedSets = exercises.reduce((a, ex) => a + ex.sets.filter((s) => s.completed).length, 0);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{templateName}</h1>
          <p className="text-muted-foreground mt-1">{completedSets}/{totalSets} sets completed</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-lg font-mono font-semibold">
            <Clock className="h-5 w-5 text-primary" />{formatTime(elapsed)}
          </div>
          {!isRunning ? (
            <Button onClick={() => setIsRunning(true)} className="gap-2"><Play className="h-4 w-4" /> Start</Button>
          ) : (
            <Button onClick={() => setIsRunning(false)} variant="outline" className="gap-2"><Pause className="h-4 w-4" /> Pause</Button>
          )}
        </div>
      </div>

      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
        <div className="gradient-sunset h-full transition-all duration-300 rounded-full" style={{ width: `${totalSets > 0 ? (completedSets / totalSets) * 100 : 0}%` }} />
      </div>

      {restActive && (
        <Card className="gradient-sunset-soft ring-primary/30">
          <CardContent className="p-6 text-center">
            <Timer className="h-8 w-8 mx-auto text-primary mb-2 animate-pulse" />
            <p className="text-4xl font-bold font-mono text-primary">{formatTime(restTimer)}</p>
            <p className="text-sm text-muted-foreground mt-1">Rest Timer</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => { setRestActive(false); setRestTimer(0); }}>Skip</Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {exercises.map((exercise, exIdx) => {
          const exDone = exercise.sets.filter((s) => s.completed).length;
          return (
            <Card key={exercise.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2 min-w-0">
                    <span className="h-6 w-6 rounded bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">{exIdx + 1}</span>
                    {exMeta[exercise.name] && (
                      <ExerciseImage
                        exerciseId={exMeta[exercise.name].id}
                        name={exercise.name}
                        imageUrl={exMeta[exercise.name].imageUrl}
                        category={exMeta[exercise.name].category}
                        muscleGroup={exMeta[exercise.name].muscleGroup}
                        variant="thumb"
                        className="size-8 rounded-lg"
                      />
                    )}
                    <span className="truncate">{exercise.name}</span>
                  </CardTitle>
                  <Badge variant={exDone === exercise.sets.length ? "default" : "secondary"}>{exDone}/{exercise.sets.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-[40px_1fr_1fr_1fr_40px] gap-2 text-xs font-medium text-muted-foreground px-1">
                  <span>Set</span><span>Weight (kg)</span><span>Reps</span><span>Status</span><span></span>
                </div>
                {exercise.sets.map((set, setIdx) => (
                  <div key={set.id} className={`grid grid-cols-[40px_1fr_1fr_1fr_40px] gap-2 items-center p-2 rounded-lg transition-colors ${set.completed ? "bg-primary/10" : "bg-muted/30"}`}>
                    <span className="text-sm font-medium text-center">{setIdx + 1}</span>
                    <Input type="number" value={set.weight} onChange={(e) => updateSet(exercise.id, set.id, "weight", e.target.value)} className="h-8 text-center" disabled={set.completed} />
                    <Input type="number" value={set.reps} onChange={(e) => updateSet(exercise.id, set.id, "reps", e.target.value)} className="h-8 text-center" disabled={set.completed} />
                    <Button size="sm" variant={set.completed ? "default" : "outline"} className="h-8" onClick={() => { toggleSet(exercise.id, set.id); if (!set.completed) startRest(); }}>
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => removeSet(exercise.id, set.id)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="w-full gap-1 mt-2" onClick={() => addSet(exercise.id)}>
                  <Plus className="h-3 w-3" /> Add Set
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {exercises.length === 0 && (
        <div className="text-center py-12">
          <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No exercises loaded</h3>
          <p className="text-muted-foreground">Go to the planner and click Start on a template.</p>
        </div>
      )}

      <Card>
        <CardContent className="p-4 flex items-center gap-4">
          <Timer className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium">Rest Timer:</span>
          <div className="flex gap-2">
            {[60, 90, 120, 180].map((t) => (
              <Button key={t} size="sm" variant={restDuration === t ? "default" : "outline"} onClick={() => setRestDuration(t)}>{t}s</Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1 gap-2"
          onClick={() => {
            setExercises((prev) =>
              prev.map((ex) => ({
                ...ex,
                sets: ex.sets.map((s) => ({ ...s, completed: false })),
              }))
            );
          }}
        >
          <RotateCcw className="h-4 w-4" /> Reset
        </Button>
        <Button className="flex-1 gap-2" onClick={() => setFinishDialog(true)} disabled={completedSets === 0}>
          <Save className="h-4 w-4" /> Finish Workout
        </Button>
      </div>

      <Dialog open={finishDialog} onOpenChange={setFinishDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finish Workout?</DialogTitle>
            <DialogDescription>
              You completed {completedSets} of {totalSets} sets in {formatTime(elapsed)}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFinishDialog(false)}>Cancel</Button>
            <Button onClick={handleFinish} disabled={saving}>{saving ? "Saving..." : "Save Workout"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ActiveWorkoutPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64 text-muted-foreground">Loading workout...</div>}>
      <ActiveWorkoutContent />
    </Suspense>
  );
}
