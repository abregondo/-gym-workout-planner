import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Flame, Dumbbell, TrendingUp, Trophy, Target, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Flame className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold">FitForge</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Log In</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="container mx-auto px-4 py-20 md:py-32 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
            <Dumbbell className="h-4 w-4" />
            Your Ultimate Workout Companion
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            Forge Your{" "}
            <span className="text-primary">Strongest</span>{" "}
            Self
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Track workouts, monitor progress, crush personal records, and achieve your fitness goals
            with the most comprehensive workout planner.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="gap-2 text-base px-8">
                Start Training <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-base px-8">
                Log In to Continue
              </Button>
            </Link>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16 border-t">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Everything You Need to Dominate
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Dumbbell,
                title: "Workout Planner",
                desc: "Create custom workout templates with target sets and reps for every exercise.",
              },
              {
                icon: TrendingUp,
                title: "Progress Tracking",
                desc: "Visualize your journey with charts showing volume, frequency, and strength gains.",
              },
              {
                icon: Trophy,
                title: "Personal Records",
                desc: "Automatically detect and celebrate every new PR you hit.",
              },
              {
                icon: Target,
                title: "Fitness Goals",
                desc: "Set targets, track progress, and stay motivated to reach your goals.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm hover:shadow-md transition-shadow"
              >
                <feature.icon className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <div className="container mx-auto px-4">
          FitForge — Built for athletes, by athletes.
        </div>
      </footer>
    </div>
  );
}
