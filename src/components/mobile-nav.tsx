"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Dumbbell,
  Library,
  Trophy,
  Target,
  Flame,
} from "lucide-react";

const mobileNavItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/planner", label: "Planner", icon: Dumbbell },
  { href: "/exercises", label: "Library", icon: Library },
  { href: "/prs", label: "PRs", icon: Trophy },
  { href: "/goals", label: "Goals", icon: Target },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
      <div className="flex items-center justify-around py-2">
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
          className={cn(
            "flex flex-col items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
            isActive
              ? "gradient-sunset-soft text-primary ring-1 ring-primary/30"
              : "text-muted-foreground"
          )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
