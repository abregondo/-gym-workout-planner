"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Dumbbell,
  Library,
  History,
  TrendingUp,
  Trophy,
  Target,
  Bell,
  Settings,
  Flame,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/planner", label: "Workout Planner", icon: Dumbbell },
  { href: "/exercises", label: "Exercise Library", icon: Library },
  { href: "/history", label: "Workout History", icon: History },
  { href: "/progress", label: "Progress", icon: TrendingUp },
  { href: "/prs", label: "Personal Records", icon: Trophy },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

function SidebarContent() {
  const pathname = usePathname();

  return (
    <>
      <div className="flex items-center gap-2 px-6 py-5">
        <div className="flex size-9 items-center justify-center rounded-full gradient-sunset glow-primary">
          <Flame className="h-5 w-5 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight gradient-text">FitForge</span>
      </div>
      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-full px-3.5 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "gradient-sunset-soft text-primary ring-1 ring-primary/30 shadow-sm shadow-primary/10"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-4 border-t border-sidebar-border">
        <Link
          href="/profile"
          className={cn(
            "flex items-center gap-3 rounded-full px-3.5 py-2.5 text-sm font-medium transition-all",
            pathname === "/profile"
              ? "gradient-sunset-soft text-primary ring-1 ring-primary/30"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          )}
        >
          <Settings className="h-5 w-5" />
          Profile & Settings
        </Link>
      </div>
    </>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-sidebar border-r border-sidebar-border">
      <SidebarContent />
    </aside>
  );
}

export function MobileSidebar() {
  return (
    <aside className="flex w-64 flex-col h-full bg-sidebar">
      <SidebarContent />
    </aside>
  );
}
