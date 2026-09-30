"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import { Target, Plus, Check, Trophy, Calendar } from "lucide-react";
import { getGoals, createGoal, updateGoalProgress, deleteGoal } from "@/lib/actions";
import { useSession } from "@/lib/use-session";

interface Goal {
  id: string; title: string; type: string; target: number; current: number; unit: string; deadline: Date | null; completed: boolean;
}

const goalTypeLabels: Record<string, string> = {
  strength: "Strength",
  frequency: "Frequency",
  bodyweight: "Body Weight",
  muscle_gain: "Muscle Gain",
  fat_loss: "Fat Loss",
  endurance: "Endurance",
  general_fitness: "General Fitness",
  glute_growth: "Glute Growth",
  body_recomposition: "Body Recomposition",
};

function goalTypeLabel(type: string) {
  return goalTypeLabels[type] ?? type;
}

export default function GoalsPage() {
  const user = useSession();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: "", type: "strength", target: 0, unit: "kg", deadline: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id) getGoals(user.id).then(setGoals);
  }, [user?.id]);

  const activeGoals = goals.filter((g) => !g.completed);
  const completedGoals = goals.filter((g) => g.completed);

  const handleCreate = async () => {
    if (!user?.id || !newGoal.title || newGoal.target <= 0) return;
    setLoading(true);
    await createGoal(user.id, newGoal.title, newGoal.type, newGoal.target, newGoal.unit, newGoal.deadline || null);
    const updated = await getGoals(user.id);
    setGoals(updated);
    setNewGoal({ title: "", type: "strength", target: 0, unit: "kg", deadline: "" });
    setCreateOpen(false);
    setLoading(false);
  };

  const handleProgress = async (goalId: string, current: number) => {
    await updateGoalProgress(goalId, current);
    if (user?.id) {
      const updated = await getGoals(user.id);
      setGoals(updated);
    }
  };

  const handleDelete = async (goalId: string) => {
    await deleteGoal(goalId);
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fitness Goals</h1>
          <p className="text-muted-foreground mt-1">{activeGoals.length} active, {completedGoals.length} completed</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button className="gap-2" />}>
            <Plus className="h-4 w-4" /> New Goal
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Fitness Goal</DialogTitle>
              <DialogDescription>Set a target to work toward.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Goal Title</Label>
                <Input placeholder="e.g. Bench Press 100kg" value={newGoal.title} onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={newGoal.type} onValueChange={(v) => setNewGoal({ ...newGoal, type: v ?? "strength" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                    <SelectItem value="fat_loss">Fat Loss</SelectItem>
                    <SelectItem value="strength">Strength</SelectItem>
                    <SelectItem value="endurance">Endurance</SelectItem>
                    <SelectItem value="general_fitness">General Fitness</SelectItem>
                    <SelectItem value="glute_growth">Glute Growth</SelectItem>
                    <SelectItem value="body_recomposition">Body Recomposition</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Target</Label>
                  <Input type="number" value={newGoal.target || ""} onChange={(e) => setNewGoal({ ...newGoal, target: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Input value={newGoal.unit} onChange={(e) => setNewGoal({ ...newGoal, unit: e.target.value })} placeholder="kg, reps..." />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Deadline (optional)</Label>
                <Input type="date" value={newGoal.deadline} onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!newGoal.title || newGoal.target <= 0 || loading}>{loading ? "Creating..." : "Create Goal"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {activeGoals.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Active Goals</h2>
          {activeGoals.map((goal) => {
            const progress = goal.target > 0 ? Math.min((goal.current / goal.target) * 100, 100) : 0;
            return (
              <Card key={goal.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{goal.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary">{goalTypeLabel(goal.type)}</Badge>
                        {goal.deadline && <Badge variant="outline" className="gap-1"><Calendar className="h-3 w-3" />{new Date(goal.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</Badge>}
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <p className="text-lg font-bold">{goal.current}/{goal.target} {goal.unit}</p>
                      <Button size="sm" variant="outline" onClick={() => handleProgress(goal.id, Math.min(goal.current + 1, goal.target))}>+1</Button>
                    </div>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-muted-foreground">{Math.round(progress)}% complete</p>
                    <Button size="sm" variant="ghost" className="text-destructive h-6 text-xs" onClick={() => handleDelete(goal.id)}>Delete</Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {completedGoals.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Trophy className="h-5 w-5 text-chart-4" /> Completed</h2>
          {completedGoals.map((goal) => (
            <Card key={goal.id} className="opacity-70">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-chart-5/10 flex items-center justify-center"><Check className="h-4 w-4 text-chart-5" /></div>
                  <div>
                    <h3 className="font-medium line-through">{goal.title}</h3>
                    <p className="text-sm text-muted-foreground">{goal.current} {goal.unit}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {goals.length === 0 && (
        <div className="text-center py-12">
          <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No goals set yet</h3>
          <p className="text-muted-foreground mb-4">Create your first fitness goal to get started.</p>
          <Button onClick={() => setCreateOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> Create Goal</Button>
        </div>
      )}
    </div>
  );
}
