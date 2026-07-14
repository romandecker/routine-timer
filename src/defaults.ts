import { CATALOG } from "./catalog";
import { newId } from "./storage";
import type { Routine, RoutineStep } from "./types";

/** A blank step for a given exercise, seeded from its catalog defaults. */
export function makeStep(exerciseId: string): RoutineStep {
  const ex = CATALOG.find((e) => e.id === exerciseId) ?? CATALOG[0];
  return {
    exerciseId: ex.id,
    sets: 1,
    holdSeconds: ex.defaultHoldSeconds,
    restBetweenSetsSeconds: 10,
  };
}

/** An empty, unsaved routine with one starter step. */
export function makeEmptyRoutine(): Routine {
  return {
    id: newId(),
    name: "New routine",
    steps: [makeStep(CATALOG[0].id)],
    restBetweenExercisesSeconds: 15,
  };
}

/** A ready-made sample so first-run isn't empty. */
export function makeSampleRoutine(): Routine {
  return {
    id: newId(),
    name: "Morning Stretch",
    restBetweenExercisesSeconds: 15,
    steps: [
      { exerciseId: "cat-cow", sets: 1, holdSeconds: 30, restBetweenSetsSeconds: 0 },
      { exerciseId: "child-pose", sets: 1, holdSeconds: 45, restBetweenSetsSeconds: 0 },
      { exerciseId: "standing-quad", sets: 2, holdSeconds: 30, restBetweenSetsSeconds: 10 },
      { exerciseId: "hamstring-forward-fold", sets: 2, holdSeconds: 30, restBetweenSetsSeconds: 10 },
      { exerciseId: "hip-flexor-lunge", sets: 2, holdSeconds: 30, restBetweenSetsSeconds: 10 },
      { exerciseId: "butterfly-groin", sets: 1, holdSeconds: 45, restBetweenSetsSeconds: 0 },
    ],
  };
}
