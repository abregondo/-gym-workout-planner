"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { WorkoutCover } from "@/components/workout-cover";

interface ExerciseImageProps {
  exerciseId: string;
  name: string;
  imageUrl?: string | null;
  category?: string | null;
  muscleGroup?: string | null;
  variant?: "banner" | "thumb";
  className?: string;
}

export function ExerciseImage({
  exerciseId,
  name,
  imageUrl,
  category,
  muscleGroup,
  variant = "banner",
  className,
}: ExerciseImageProps) {
  const [failed, setFailed] = useState(false);
  const showImage = !!imageUrl && !failed;

  if (showImage) {
    if (variant === "thumb") {
      return (
        <Image
          src={imageUrl!}
          alt={name}
          width={56}
          height={56}
          className={cn("size-14 shrink-0 rounded-xl bg-white object-cover", className)}
          onError={() => setFailed(true)}
        />
      );
    }
    return (
      <div className={cn("relative w-full aspect-square overflow-hidden rounded-2xl bg-white", className)}>
        <Image
          src={imageUrl!}
          alt={name}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <WorkoutCover
      templateId={exerciseId}
      exercises={[{ category, muscleGroup }]}
      variant={variant === "thumb" ? "thumb" : "card"}
      className={variant === "banner" ? cn("h-auto aspect-square rounded-2xl", className) : className}
    />
  );
}
