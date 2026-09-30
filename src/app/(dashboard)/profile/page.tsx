"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Settings, Palette, Weight, Timer, Volume2, Save, LogOut } from "lucide-react";
import { useSession } from "@/lib/use-session";

export default function ProfilePage() {
  const user = useSession();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [weightUnit, setWeightUnit] = useState("kg");
  const [restTimer, setRestTimer] = useState("90");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/sign-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Sign out failed", err);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile & Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-primary" /> Profile</CardTitle>
          <CardDescription>Your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button className="gap-2"><Save className="h-4 w-4" /> Save Changes</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5 text-primary" /> Appearance</CardTitle>
          <CardDescription>Customize the look and feel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div><p className="font-medium">Theme</p><p className="text-sm text-muted-foreground">Switch between light and dark mode</p></div>
            <ThemeToggle />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5 text-primary" /> Workout Preferences</CardTitle>
          <CardDescription>Configure your workout defaults</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3"><Weight className="h-4 w-4 text-muted-foreground" /><div><p className="font-medium">Weight Unit</p><p className="text-sm text-muted-foreground">Choose kg or lbs</p></div></div>
            <Select value={weightUnit} onValueChange={(v) => setWeightUnit(v ?? "kg")}><SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="kg">kg</SelectItem><SelectItem value="lbs">lbs</SelectItem></SelectContent></Select>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3"><Timer className="h-4 w-4 text-muted-foreground" /><div><p className="font-medium">Default Rest Timer</p><p className="text-sm text-muted-foreground">Rest time between sets</p></div></div>
            <Select value={restTimer} onValueChange={(v) => setRestTimer(v ?? "90")}><SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="30">30s</SelectItem><SelectItem value="60">60s</SelectItem><SelectItem value="90">90s</SelectItem><SelectItem value="120">120s</SelectItem><SelectItem value="180">180s</SelectItem></SelectContent></Select>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3"><Volume2 className="h-4 w-4 text-muted-foreground" /><div><p className="font-medium">Sound Effects</p><p className="text-sm text-muted-foreground">Play sounds for timer and completions</p></div></div>
            <Button variant={soundEnabled ? "default" : "outline"} size="sm" onClick={() => setSoundEnabled(!soundEnabled)}>{soundEnabled ? "On" : "Off"}</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <Button variant="destructive" className="w-full gap-2" onClick={handleSignOut}><LogOut className="h-4 w-4" /> Sign Out</Button>
        </CardContent>
      </Card>
    </div>
  );
}
