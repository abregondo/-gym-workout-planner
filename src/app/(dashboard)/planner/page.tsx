"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarDays, Dumbbell, Plus, Trash2, Play, GripVertical, X, Coffee } from "lucide-react";
import {
  getTemplates,
  createTemplate,
  deleteTemplate,
  getExercises,
  seedAllExercises,
  getSchedule,
  setScheduleDay,
  clearScheduleDay,
  type ScheduleDay,
} from "@/lib/actions";
import { useSession } from "@/lib/use-session";
import { WorkoutCover, coverGradient } from "@/components/workout-cover";
import { ExerciseImage } from "@/components/exercise-image";

// Mon-first display order; stored dayOfWeek uses JS getDay() (0=Sun..6=Sat)
const WEEK_DAYS = [
  { label: "Mon", full: "Monday", getDay: 1 },
  { label: "Tue", full: "Tuesday", getDay: 2 },
  { label: "Wed", full: "Wednesday", getDay: 3 },
  { label: "Thu", full: "Thursday", getDay: 4 },
  { label: "Fri", full: "Friday", getDay: 5 },
  { label: "Sat", full: "Saturday", getDay: 6 },
  { label: "Sun", full: "Sunday", getDay: 0 },
];

interface TemplateExercise {
  id: string;
  exerciseId: string;
  name: string;
  targetSets: number;
  targetReps: string;
  category?: string | null;
  muscleGroup?: string | null;
  imageUrl?: string | null;
}

interface WorkoutTemplate {
  id: string;
  name: string;
  description: string | null;
  exercises: TemplateExercise[];
}

export default function PlannerPage() {
  const user = useSession();
  const router = useRouter();
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [exerciseOptions, setExerciseOptions] = useState<{ id: string; name: string; category?: string | null; muscleGroup?: string | null; imageUrl?: string | null }[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newExercises, setNewExercises] = useState<{ id: string; exerciseId: string; name: string; targetSets: number; targetReps: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleDay[]>([]);
  const [dayDialogOpen, setDayDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<{ label: string; full: string; getDay: number } | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [savingDay, setSavingDay] = useState(false);

  useEffect(() => {
    seedAllExercises().then(() => getExercises()).then(setExerciseOptions);
  }, []);

  useEffect(() => {
    if (user?.id) {
      getTemplates(user.id).then(setTemplates);
      getSchedule(user.id).then(setSchedule);
    }
  }, [user?.id]);

  const today = new Date().getDay();

  const openDayDialog = (day: { label: string; full: string; getDay: number }) => {
    setSelectedDay(day);
    setSelectedTemplateId(schedule.find((s) => s.dayOfWeek === day.getDay)?.templateId ?? "");
    setDayDialogOpen(true);
  };

  const saveDay = async () => {
    if (!user?.id || !selectedDay) return;
    setSavingDay(true);
    if (selectedTemplateId === "rest") {
      await clearScheduleDay(user.id, selectedDay.getDay);
      setSchedule((prev) => prev.filter((s) => s.dayOfWeek !== selectedDay.getDay));
    } else if (selectedTemplateId) {
      await setScheduleDay(user.id, selectedDay.getDay, selectedTemplateId);
      const updated = await getSchedule(user.id);
      setSchedule(updated);
    }
    setSavingDay(false);
    setDayDialogOpen(false);
    setSelectedDay(null);
    setSelectedTemplateId("");
  };

  const addExercise = () => {
    const firstEx = exerciseOptions[0];
    if (!firstEx) return;
    setNewExercises((prev) => [
      ...prev,
      { id: crypto.randomUUID(), exerciseId: firstEx.id, name: firstEx.name, targetSets: 3, targetReps: "8-12" },
    ]);
  };

  const updateExercise = (id: string, field: Partial<typeof newExercises[0]>) => {
    setNewExercises((prev) => prev.map((ex) => (ex.id === id ? { ...ex, ...field } : ex)));
  };

  const removeExercise = (id: string) => {
    setNewExercises((prev) => prev.filter((ex) => ex.id !== id));
  };

  const handleCreate = async () => {
    if (!user?.id || !newName || newExercises.length === 0) return;
    setLoading(true);
    await createTemplate(
      user.id,
      newName,
      newDesc,
      newExercises.map((e) => e.exerciseId),
      newExercises.map((e) => e.targetSets),
      newExercises.map((e) => e.targetReps)
    );
    const updated = await getTemplates(user.id);
    setTemplates(updated);
    setNewName("");
    setNewDesc("");
    setNewExercises([]);
    setCreateOpen(false);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    await deleteTemplate(id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    if (user?.id) getSchedule(user.id).then(setSchedule);
  };

  const startWorkout = (template: WorkoutTemplate) => {
    router.push(
      `/workout/active?template=${encodeURIComponent(template.name)}&exercises=${encodeURIComponent(JSON.stringify(template.exercises.map((e) => e.name)))}&templateId=${template.id}`
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workout Planner</h1>
          <p className="text-muted-foreground mt-1">Create and manage your workout templates</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button className="gap-2" />}>
            <Plus className="h-4 w-4" /> New Template
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Workout Template</DialogTitle>
              <DialogDescription>Build a reusable workout template with exercises.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Template Name</Label>
                <Input placeholder="e.g. Push Day, Upper Body..." value={newName} onChange={(e) => setNewName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Textarea placeholder="Brief description..." value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Exercises ({newExercises.length})</Label>
                  <Button size="sm" variant="outline" onClick={addExercise} className="gap-1"><Plus className="h-3 w-3" /> Add Exercise</Button>
                </div>
                {newExercises.map((ex, idx) => {
                  const opt = exerciseOptions.find((o) => o.id === ex.exerciseId);
                  return (
                  <div key={ex.id} className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                    <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                    {opt && (
                      <ExerciseImage
                        exerciseId={opt.id}
                        name={opt.name}
                        imageUrl={opt.imageUrl}
                        category={opt.category}
                        muscleGroup={opt.muscleGroup}
                        variant="thumb"
                        className="size-9 rounded-lg"
                      />
                    )}
                    <span className="text-sm font-medium w-4 text-center">{idx + 1}.</span>
                    <Select value={ex.exerciseId} onValueChange={(v) => {
                      const opt = exerciseOptions.find((o) => o.id === v);
                      updateExercise(ex.id, { exerciseId: v ?? ex.exerciseId, name: opt?.name ?? ex.name });
                    }}>
                      <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {exerciseOptions.map((opt) => (
                          <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-1">
                      <Input type="number" value={ex.targetSets} onChange={(e) => updateExercise(ex.id, { targetSets: parseInt(e.target.value) || 3 })} className="w-16 text-center" min={1} max={10} />
                      <span className="text-xs text-muted-foreground">sets</span>
                    </div>
                    <Input value={ex.targetReps} onChange={(e) => updateExercise(ex.id, { targetReps: e.target.value })} className="w-20 text-center" placeholder="8-12" />
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeExercise(ex.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  );
                })}
                {newExercises.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No exercises added yet.</p>}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!newName || newExercises.length === 0 || loading}>
                {loading ? "Creating..." : "Create Template"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            This Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {WEEK_DAYS.map((day) => {
              const entry = schedule.find((s) => s.dayOfWeek === day.getDay);
              const isToday = day.getDay === today;
              return (
                <button
                  key={day.label}
                  type="button"
                  onClick={() => openDayDialog(day)}
                  className={`rounded-xl border p-3 text-left transition-colors hover:border-primary/60 ${
                    isToday ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-semibold uppercase ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                      {day.label}
                    </span>
                    {isToday && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Today</Badge>}
                  </div>
                  {entry ? (
                    <>
                      <p className="text-sm font-medium truncate">{entry.templateName}</p>
                      <div
                        className="mt-1.5 h-1 w-full rounded-full"
                        style={{ backgroundImage: coverGradient(entry.templateId) }}
                      />
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Coffee className="h-3 w-3" /> Rest
                    </p>
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-3">Click a day to assign a workout template or mark it as rest.</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <div className="-mt-4">
              <WorkoutCover templateId={template.id} exercises={template.exercises} />
            </div>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  {template.description && <p className="text-sm text-muted-foreground mt-1">{template.description}</p>}
                </div>
                <Badge variant="secondary">{template.exercises.length} exercises</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                {template.exercises.slice(0, 4).map((ex) => (
                  <div key={ex.id} className="flex items-center justify-between text-sm gap-2">
                    <span className="flex items-center gap-2 min-w-0">
                      <ExerciseImage
                        exerciseId={ex.exerciseId}
                        name={ex.name}
                        imageUrl={ex.imageUrl}
                        category={ex.category}
                        muscleGroup={ex.muscleGroup}
                        variant="thumb"
                        className="size-6 rounded-md"
                      />
                      <span className="truncate">{ex.name}</span>
                    </span>
                    <span className="text-muted-foreground shrink-0 ml-2">{ex.targetSets}×{ex.targetReps}</span>
                  </div>
                ))}
                {template.exercises.length > 4 && <p className="text-xs text-muted-foreground">+{template.exercises.length - 4} more</p>}
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 gap-1" onClick={() => startWorkout(template)}>
                  <Play className="h-3 w-3" /> Start
                </Button>
                <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleDelete(template.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12">
          <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No workout templates yet</h3>
          <p className="text-muted-foreground mb-4">Create your first template to get started.</p>
          <Button onClick={() => setCreateOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> Create Template</Button>
        </div>
      )}

      <Dialog open={dayDialogOpen} onOpenChange={(open) => { setDayDialogOpen(open); if (!open) setSelectedDay(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedDay?.full}</DialogTitle>
            <DialogDescription>Assign a workout template to this day, or mark it as rest.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedTemplateId} onValueChange={(v) => setSelectedTemplateId(v ?? "")}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Choose a template..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="rest">Rest day (no workout)</SelectItem>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {templates.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No templates yet — create one first in the New Template dialog.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDayDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveDay} disabled={!selectedTemplateId || savingDay}>
              {savingDay ? "Saving..." : "Save Day"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
