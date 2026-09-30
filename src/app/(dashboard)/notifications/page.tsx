"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Trophy, Target, Dumbbell, Check, CheckCheck, Trash2 } from "lucide-react";
import { getNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification } from "@/lib/actions";
import { useSession } from "@/lib/use-session";

interface Notif {
  id: string; type: string; title: string; message: string; read: boolean; createdAt: Date;
}

export default function NotificationsPage() {
  const user = useSession();
  const [notifications, setNotifications] = useState<Notif[]>([]);

  useEffect(() => {
    if (user?.id) getNotifications(user.id).then(setNotifications);
  }, [user?.id]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllRead = async () => {
    if (!user?.id) return;
    await markAllNotificationsRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "pr": return <Trophy className="h-5 w-5 text-chart-4" />;
      case "goal": return <Target className="h-5 w-5 text-chart-2" />;
      case "workout": return <Dumbbell className="h-5 w-5 text-chart-5" />;
      default: return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-1">{unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllRead} className="gap-2"><CheckCheck className="h-4 w-4" /> Mark All Read</Button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.map((n) => (
          <Card key={n.id} className={`transition-colors ${!n.read ? "bg-primary/5 border-primary/20" : ""}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="mt-0.5">{getIcon(n.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">{n.title}</h3>
                    {!n.read && <Badge className="h-4 px-1.5 text-[10px]">New</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!n.read && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleMarkRead(n.id)}><Check className="h-4 w-4" /></Button>}
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(n.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {notifications.length === 0 && (
        <div className="text-center py-12">
          <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No notifications</h3>
          <p className="text-muted-foreground">You&apos;re all caught up!</p>
        </div>
      )}
    </div>
  );
}
