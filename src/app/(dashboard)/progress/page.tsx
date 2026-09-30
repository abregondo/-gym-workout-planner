"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { TrendingUp, Activity, Dumbbell, Calendar } from "lucide-react";
import { getProgressData } from "@/lib/actions";
import { useSession } from "@/lib/use-session";

export default function ProgressPage() {
  const user = useSession();
  const [history, setHistory] = useState<{ startedAt: Date; totalVolume: number }[]>([]);
  const [prs, setPrs] = useState<{ exerciseId: string; weight: number; date: Date }[]>([]);

  useEffect(() => {
    if (user?.id) {
      getProgressData(user.id).then((data) => {
        setHistory(data.history);
        setPrs(data.prs);
      });
    }
  }, [user?.id]);

  // Volume by week
  const volumeData = (() => {
    const weeks: Record<string, number> = {};
    history.forEach((h) => {
      const d = new Date(h.startedAt);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      weeks[key] = (weeks[key] || 0) + h.totalVolume;
    });
    return Object.entries(weeks).slice(-8).map(([week, volume]) => ({ week, volume: Math.round(volume) }));
  })();

  // Workout frequency by month
  const frequencyData = (() => {
    const months: Record<string, number> = {};
    history.forEach((h) => {
      const d = new Date(h.startedAt);
      const key = d.toLocaleDateString("en-US", { month: "short" });
      months[key] = (months[key] || 0) + 1;
    });
    return Object.entries(months).slice(-6).map(([month, workouts]) => ({ month, workouts }));
  })();

  // PR progress for top exercise
  const prProgressData = (() => {
    const grouped: Record<string, { date: string; weight: number }[]> = {};
    prs.forEach((pr) => {
      if (!grouped[pr.exerciseId]) grouped[pr.exerciseId] = [];
      grouped[pr.exerciseId].push({
        date: new Date(pr.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        weight: pr.weight,
      });
    });
    // Find exercise with most data points
    const top = Object.entries(grouped).sort((a, b) => b[1].length - a[1].length)[0];
    return top ? top[1].reverse() : [];
  })();

  const totalWorkouts = history.length;
  const totalVolume = history.reduce((a, h) => a + h.totalVolume, 0);
  const avgSession = totalWorkouts > 0 ? Math.round(totalVolume / totalWorkouts) : 0;
  const weeksCount = Math.max(1, Math.ceil((Date.now() - (history[history.length - 1] ? new Date(history[history.length - 1].startedAt).getTime() : Date.now())) / (7 * 24 * 60 * 60 * 1000)));
  const freqPerWeek = (totalWorkouts / weeksCount).toFixed(1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Progress</h1>
        <p className="text-muted-foreground mt-1">Track your fitness journey over time</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-xl bg-chart-5/10"><Dumbbell className="h-5 w-5 text-chart-5" /></div><div><p className="text-2xl font-bold">{totalWorkouts}</p><p className="text-xs text-muted-foreground">Total Workouts</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-xl bg-chart-1/10"><TrendingUp className="h-5 w-5 text-chart-1" /></div><div><p className="text-2xl font-bold">{totalVolume.toLocaleString()} kg</p><p className="text-xs text-muted-foreground">Total Volume</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-xl bg-chart-2/10"><Activity className="h-5 w-5 text-chart-2" /></div><div><p className="text-2xl font-bold">{avgSession.toLocaleString()} kg</p><p className="text-xs text-muted-foreground">Avg Volume</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-xl bg-chart-3/10"><Calendar className="h-5 w-5 text-chart-3" /></div><div><p className="text-2xl font-bold">{freqPerWeek}x</p><p className="text-xs text-muted-foreground">Freq/Week</p></div></div></CardContent></Card>
      </div>

      {volumeData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Weekly Volume</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={volumeData}>
                <defs>
                  <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="week" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px" }} />
                <Area type="monotone" dataKey="volume" stroke="var(--chart-1)" fill="url(#volumeGradient)" fillOpacity={1} strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {frequencyData.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Monthly Frequency</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={frequencyData}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--chart-4)" />
                        <stop offset="55%" stopColor="var(--chart-2)" />
                        <stop offset="100%" stopColor="var(--chart-1)" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px" }} />
                    <Bar dataKey="workouts" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
                  </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {prProgressData.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Strength Progress</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={prProgressData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px" }} />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="var(--chart-3)"
                      strokeWidth={3}
                      dot={{ r: 5, fill: "var(--chart-2)", strokeWidth: 0 }}
                      activeDot={{ r: 7, fill: "var(--chart-4)", strokeWidth: 0 }}
                    />
                  </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {volumeData.length === 0 && (
        <div className="text-center py-12">
          <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No data yet</h3>
          <p className="text-muted-foreground">Complete workouts to see your progress charts.</p>
        </div>
      )}
    </div>
  );
}
