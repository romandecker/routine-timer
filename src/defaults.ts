import { CATALOG } from "./catalog";
import type { Exercise, ExerciseTemplate, Routine, RoutineStep } from "./types";

/** Copy a template's exercise fields into a fresh inline exercise. */
export function exerciseFromTemplate(t: ExerciseTemplate): Exercise {
  return {
    name: t.name,
    ...(t.bilateral ? { bilateral: true } : {}),
    ...(t.description ? { description: t.description } : {}),
  };
}

/** A blank step seeded from a catalog template. */
export function makeStep(template: ExerciseTemplate = CATALOG[0]): RoutineStep {
  return {
    exercise: exerciseFromTemplate(template),
    sets: 1,
    holdSeconds: template.defaultHoldSeconds,
    restBetweenSetsSeconds: 10,
  };
}

/** An empty, unsaved routine with one starter step. */
export function makeEmptyRoutine(): Routine {
  return {
    name: "New routine",
    steps: [makeStep()],
    restBetweenExercisesSeconds: 15,
  };
}

/** A ready-made sample so first-run isn't empty. */
export function makeSampleRoutine(): Routine {
  const pick = (name: string): ExerciseTemplate =>
    CATALOG.find((t) => t.name === name) ?? CATALOG[0];
  const step = (
    name: string,
    sets: number,
    holdSeconds: number,
    restBetweenSetsSeconds: number,
  ): RoutineStep => ({
    exercise: exerciseFromTemplate(pick(name)),
    sets,
    holdSeconds,
    restBetweenSetsSeconds,
  });
  return {
    name: "Morning Stretch",
    restBetweenExercisesSeconds: 15,
    steps: [
      step("Cat–Cow", 1, 30, 0),
      step("Child's Pose", 1, 45, 0),
      step("Standing Quad Stretch", 2, 30, 10),
      step("Standing Hamstring Fold", 2, 30, 10),
      step("Kneeling Hip Flexor Lunge", 2, 30, 10),
      step("Butterfly (Groin) Stretch", 1, 45, 0),
    ],
  };
}
