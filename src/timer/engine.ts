import type { Routine, TimelinePhase } from "../types";

/**
 * Expand a `Routine` into the flat, ordered list of phases the timer runs.
 *
 * This is a pure function — no time, no side effects — which is what makes the
 * timer's behaviour easy to unit-test. Ordering for each step:
 *   hold (set 1) → rest-between-sets → hold (set 2) → ... → last hold
 * Then a rest-between-exercises before the next step. Rests of 0s are omitted,
 * as are trailing rests (after the final set / final exercise).
 */
export function buildTimeline(routine: Routine): TimelinePhase[] {
  const phases: TimelinePhase[] = [];
  const steps = routine.steps;

  steps.forEach((step, stepIndex) => {
    const name = step.exercise.name;
    const totalSets = Math.max(1, Math.floor(step.sets));
    const holdSeconds = Math.max(1, Math.floor(step.holdSeconds));
    const restBetweenSets = Math.max(0, Math.floor(step.restBetweenSetsSeconds));

    for (let set = 1; set <= totalSets; set++) {
      phases.push({
        kind: "hold",
        label: name,
        seconds: holdSeconds,
        stepIndex,
        setNumber: set,
        totalSets,
      });

      const isLastSet = set === totalSets;
      if (!isLastSet && restBetweenSets > 0) {
        phases.push({
          kind: "rest",
          label: "Rest",
          seconds: restBetweenSets,
          stepIndex,
          setNumber: set,
          totalSets,
        });
      }
    }

    const isLastStep = stepIndex === steps.length - 1;
    const restBetweenExercises = Math.max(
      0,
      Math.floor(routine.restBetweenExercisesSeconds),
    );
    if (!isLastStep && restBetweenExercises > 0) {
      phases.push({
        kind: "rest",
        label: "Rest",
        seconds: restBetweenExercises,
        stepIndex,
        setNumber: totalSets,
        totalSets,
      });
    }
  });

  return phases;
}

/** Total duration of a routine in seconds (sum of all phase durations). */
export function totalDurationSeconds(routine: Routine): number {
  return buildTimeline(routine).reduce((sum, p) => sum + p.seconds, 0);
}
