"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Heart, Filter, X, Dumbbell, Info, Users, Gauge } from "lucide-react";
import { getExercises, getFavorites, toggleFavorite, seedAllExercises } from "@/lib/actions";
import { useSession } from "@/lib/use-session";
import { ExerciseImage } from "@/components/exercise-image";

const bodyParts = [
  "all",
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "forearms",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
  "abs",
  "obliques",
  "cardio",
  "full_body",
];
const equipmentTypes = [
  "all",
  "barbell",
  "dumbbell",
  "cable",
  "machine",
  "smith machine",
  "kettlebell",
  "resistance band",
  "bodyweight",
  "other",
];
const genderOptions = ["all", "men", "women"];
const difficultyOptions = ["all", "beginner", "intermediate", "advanced"];

function label(value: string) {
  if (value === "all") return "All";
  if (value === "full_body") return "Full Body";
  if (value === "smith machine") return "Smith Machine";
  if (value === "resistance band") return "Resistance Band";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

interface Exercise {
  id: string;
  name: string;
  category: string;
  muscleGroup: string;
  equipment: string;
  gender: string;
  difficulty: string;
  instructions: string | null;
  imageUrl: string | null;
  imageUrlFemale: string | null;
}

export default function ExercisesPage() {
  const user = useSession();
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [bodyPart, setBodyPart] = useState("all");
  const [equipment, setEquipment] = useState("all");
  const [gender, setGender] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  useEffect(() => {
    seedAllExercises().then(() => getExercises()).then(setAllExercises);
  }, []);

  useEffect(() => {
    if (user?.id) {
      getFavorites(user.id).then((favs) => {
        setFavoriteIds(new Set(favs.map((f) => f.exerciseId)));
      });
    }
  }, [user?.id]);

  const handleToggleFavorite = async (exerciseId: string) => {
    if (!user?.id) return;
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(exerciseId)) next.delete(exerciseId);
      else next.add(exerciseId);
      return next;
    });
    await toggleFavorite(user.id, exerciseId);
  };

  const filtered = allExercises.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
    const matchesBody = bodyPart === "all" || ex.category === bodyPart;
    const matchesEquipment = equipment === "all" || ex.equipment === equipment;
    const matchesGender = gender === "all" || ex.gender === gender || ex.gender === "both";
    const matchesDifficulty = difficulty === "all" || ex.difficulty === difficulty;
    const matchesFavorite = !showFavoritesOnly || favoriteIds.has(ex.id);
    return matchesSearch && matchesBody && matchesEquipment && matchesGender && matchesDifficulty && matchesFavorite;
  });

  const hasFilters =
    search || bodyPart !== "all" || equipment !== "all" || gender !== "all" || difficulty !== "all" || showFavoritesOnly;

  /** Women filter shows female illustrations (gradient cover when none exists — never male art). */
  const imageFor = (ex: Exercise) => (gender === "women" ? ex.imageUrlFemale : ex.imageUrl);

  const clearFilters = () => {
    setSearch("");
    setBodyPart("all");
    setEquipment("all");
    setGender("all");
    setDifficulty("all");
    setShowFavoritesOnly(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Exercise Library</h1>
        <p className="text-muted-foreground mt-1">{filtered.length} exercises available</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search exercises..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <div className="flex flex-wrap gap-3">
              <Select value={bodyPart} onValueChange={(v) => setBodyPart(v ?? "all")}>
                <SelectTrigger className="w-[160px]"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Body Part" /></SelectTrigger>
                <SelectContent>{bodyParts.map((bp) => <SelectItem key={bp} value={bp}>{label(bp)}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={equipment} onValueChange={(v) => setEquipment(v ?? "all")}>
                <SelectTrigger className="w-[160px]"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Equipment" /></SelectTrigger>
                <SelectContent>{equipmentTypes.map((eq) => <SelectItem key={eq} value={eq}>{label(eq)}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={gender} onValueChange={(v) => setGender(v ?? "all")}>
                <SelectTrigger className="w-[140px]"><Users className="h-4 w-4 mr-2" /><SelectValue placeholder="Gender" /></SelectTrigger>
                <SelectContent>{genderOptions.map((g) => <SelectItem key={g} value={g}>{label(g)}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v ?? "all")}>
                <SelectTrigger className="w-[150px]"><Gauge className="h-4 w-4 mr-2" /><SelectValue placeholder="Difficulty" /></SelectTrigger>
                <SelectContent>{difficultyOptions.map((d) => <SelectItem key={d} value={d}>{label(d)}</SelectItem>)}</SelectContent>
              </Select>
              <Button variant={showFavoritesOnly ? "default" : "outline"} onClick={() => setShowFavoritesOnly(!showFavoritesOnly)} className="gap-2">
                <Heart className={`h-4 w-4 ${showFavoritesOnly ? "fill-current" : ""}`} /> Favorites
              </Button>
              {hasFilters && (
                <Button variant="ghost" onClick={clearFilters} className="gap-2">
                  <X className="h-4 w-4" /> Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((exercise) => (
          <Card key={exercise.id} className="group cursor-pointer hover:shadow-md transition-all" onClick={() => setSelectedExercise(exercise)}>
            <div className="relative -mt-4">
              <ExerciseImage
                exerciseId={exercise.id}
                name={exercise.name}
                imageUrl={imageFor(exercise)}
                category={exercise.category}
                muscleGroup={exercise.muscleGroup}
                variant="banner"
                className="rounded-none rounded-t-2xl"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10 size-8 rounded-full bg-black/35 text-white backdrop-blur-sm hover:bg-black/55 hover:text-white"
                onClick={(e) => { e.stopPropagation(); handleToggleFavorite(exercise.id); }}
              >
                <Heart className={`h-4 w-4 transition-colors ${favoriteIds.has(exercise.id) ? "fill-primary text-primary" : "text-white"}`} />
              </Button>
            </div>
            <CardContent className="p-5 pt-0">
              <h3 className="font-semibold mb-1">{exercise.name}</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs">{label(exercise.category)}</Badge>
                <Badge variant="outline" className="text-xs">{label(exercise.equipment)}</Badge>
                <Badge variant="outline" className="text-xs capitalize">{exercise.difficulty}</Badge>
                {exercise.gender !== "both" && (
                  <Badge variant="outline" className="text-xs capitalize">{exercise.gender}</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No exercises found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filters.</p>
        </div>
      )}

      <Dialog open={!!selectedExercise} onOpenChange={() => setSelectedExercise(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-primary" />{selectedExercise?.name}
            </DialogTitle>
            <DialogDescription className="flex gap-2 flex-wrap">
              <Badge variant="secondary">{label(selectedExercise?.category ?? "")}</Badge>
              <Badge variant="outline">{label(selectedExercise?.equipment ?? "")}</Badge>
              <Badge variant="outline" className="capitalize">{selectedExercise?.difficulty}</Badge>
              <Badge variant="outline" className="capitalize">
                {selectedExercise?.gender === "both" ? "Men & Women" : selectedExercise?.gender}
              </Badge>
            </DialogDescription>
          </DialogHeader>
          {selectedExercise && (
            <ExerciseImage
              exerciseId={selectedExercise.id}
              name={selectedExercise.name}
              imageUrl={imageFor(selectedExercise)}
              category={selectedExercise.category}
              muscleGroup={selectedExercise.muscleGroup}
              variant="banner"
              className="mx-auto max-w-72"
            />
          )}
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><Info className="h-4 w-4" />Instructions</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{selectedExercise?.instructions}</p>
          </div>
        </DialogContent>
      </Dialog>

      <p className="text-xs text-muted-foreground text-center pb-4">
        Exercise images from{" "}
        <a href="https://wger.de" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
          wger
        </a>{" "}
        contributors (CC BY-SA 4.0): Everkinetic, cshep442, Settebello, Imobard, Franpol, nishant0712, 54str, utkb, philip, roneydya, Rottekongen, carlos3c, barry, AlucardEvil40, clafal, lion, wger.de.
        Illustrations from{" "}
        <a href="https://github.com/marcmayol/exercise-api" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
          marcmayol/exercise-api
        </a>{" "}
        (attribution required). Exercise photos from{" "}
        <a href="https://github.com/yuhonas/free-exercise-db" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
          yuhonas/free-exercise-db
        </a>{" "}
        (public domain).
      </p>
    </div>
  );
}
