import { cn } from "@/lib/utils";
import {
  BicepsFlexed,
  Dumbbell,
  Footprints,
  HeartPulse,
  PersonStanding,
  StretchHorizontal,
  type LucideIcon,
} from "lucide-react";

interface CoverExercise {
  category?: string | null;
  muscleGroup?: string | null;
}

type WorkoutCoverProps = {
  templateId: string;
  exercises?: CoverExercise[];
  variant?: "card" | "thumb";
  className?: string;
};

const GRADIENTS = [
  "linear-gradient(135deg, oklch(0.6 0.24 300) 0%, oklch(0.64 0.26 345) 100%)",
  "linear-gradient(135deg, oklch(0.64 0.26 345) 0%, oklch(0.72 0.19 45) 100%)",
  "linear-gradient(135deg, oklch(0.55 0.2 320) 0%, oklch(0.66 0.26 350) 100%)",
  "linear-gradient(135deg, oklch(0.72 0.19 45) 0%, oklch(0.82 0.16 80) 100%)",
  "linear-gradient(135deg, oklch(0.72 0.13 210) 0%, oklch(0.6 0.24 300) 100%)",
];

const ICONS = {
  cardio: HeartPulse,
  legs: Footprints,
  core: PersonStanding,
  arms: BicepsFlexed,
  upper: StretchHorizontal,
  default: Dumbbell,
} as const;

type IconKey = keyof typeof ICONS;

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

export function coverGradient(id: string): string {
  return GRADIENTS[hashId(id) % GRADIENTS.length];
}

function iconKeyForExercise(ex: CoverExercise): IconKey {
  const tags = `${ex.category ?? ""} ${ex.muscleGroup ?? ""}`.toLowerCase();
  if (/(cardio|conditioning|warm)/.test(tags)) return "cardio";
  if (/(leg|calf|glute|hamstring|quad|squat)/.test(tags)) return "legs";
  if (/(core|ab|oblique|abdom)/.test(tags)) return "core";
  if (/(arm|bicep|tricep|forearm)/.test(tags)) return "arms";
  if (/(chest|shoulder|back|trap|lat)/.test(tags)) return "upper";
  return "default";
}

function dominantIconKey(exercises?: CoverExercise[]): IconKey {
  if (!exercises || exercises.length === 0) return "default";
  const counts = new Map<IconKey, number>();
  for (const ex of exercises) {
    const key = iconKeyForExercise(ex);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  let best: IconKey = "default";
  let bestCount = 0;
  for (const [key, count] of counts) {
    if (count > bestCount) {
      best = key;
      bestCount = count;
    }
  }
  return best;
}

function CoverIcon({
  iconKey,
  className,
  strokeWidth,
}: {
  iconKey: IconKey;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon: LucideIcon = ICONS[iconKey];
  return <Icon className={className} strokeWidth={strokeWidth} />;
}

export function WorkoutCover({
  templateId,
  exercises,
  variant = "card",
  className,
}: WorkoutCoverProps) {
  const gradient = coverGradient(templateId);
  const iconKey = dominantIconKey(exercises);

  if (variant === "thumb") {
    return (
      <div
        className={cn(
          "relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl",
          className
        )}
        style={{ backgroundImage: gradient }}
        aria-hidden
      >
        <div className="absolute -top-4 -right-4 size-12 rounded-full bg-white/25 blur-md" />
        <CoverIcon iconKey={iconKey} className="relative h-6 w-6 text-white drop-shadow-sm" />
      </div>
    );
  }

  return (
    <div
      className={cn("relative h-32 w-full overflow-hidden", className)}
      style={{ backgroundImage: gradient }}
      aria-hidden
    >
      <div className="absolute -top-10 -right-6 size-36 rounded-full bg-white/20 blur-2xl" />
      <div className="absolute -bottom-8 -left-4 size-24 rounded-full bg-black/15 blur-xl" />
      <CoverIcon
        iconKey={iconKey}
        className="absolute right-4 bottom-3 h-24 w-24 text-white/25"
        strokeWidth={1.5}
      />
      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/35 to-transparent" />
    </div>
  );
}
