import type { Routine, Side, TimelinePhase } from "../types";

/**
 * Expand a `Routine` into the flat, ordered list of phases the timer runs.
 *
 * This is a pure function — no time, no side effects — which is what makes the
 * timer's behaviour easy to unit-test. Ordering for each step:
 *   hold (set 1) → rest-between-sets → hold (set 2) → ... → last hold
 * Then a rest-between-exercises before the next step. Rests of 0s are omitted,
 * as are trailing rests (after the final set / final exercise).
 *
 * A BILATERAL step runs each set on both sides: every set expands to a left
 * hold then a right hold (so N sets become 2N holds), and the between-sets rest
 * is inserted between EVERY consecutive hold — including the L→R switch within a
 * set — again dropping only the trailing one. The set counter still reads 1…N;
 * the side tells the two halves apart. A switch-rest is tagged with the side it
 * switches TO.
 */
export function buildTimeline(routine: Routine): TimelinePhase[] {
  const phases: TimelinePhase[] = [];
  const steps = routine.steps;

  steps.forEach((step, stepIndex) => {
    const name = step.exercise.name;
    const totalSets = Math.max(1, Math.floor(step.sets));
    const holdSeconds = Math.max(1, Math.floor(step.holdSeconds));
    const restBetweenSets = Math.max(0, Math.floor(step.restBetweenSetsSeconds));
    const bilateral = step.exercise.bilateral === true;
    const sides: (Side | undefined)[] = bilateral ? ["left", "right"] : [undefined];

    // The ordered holds for this step: one per side per set (just one, sideless,
    // when not bilateral). Rests then go between every consecutive hold.
    const holds: { setNumber: number; side?: Side }[] = [];
    for (let set = 1; set <= totalSets; set++) {
      for (const side of sides) holds.push({ setNumber: set, side });
    }

    holds.forEach((hold, holdIndex) => {
      phases.push({
        kind: "hold",
        label: name,
        seconds: holdSeconds,
        stepIndex,
        setNumber: hold.setNumber,
        totalSets,
        ...(hold.side ? { side: hold.side } : {}),
      });

      const nextHold = holds[holdIndex + 1];
      if (nextHold && restBetweenSets > 0) {
        phases.push({
          kind: "rest",
          label: "Rest",
          seconds: restBetweenSets,
          stepIndex,
          setNumber: hold.setNumber,
          totalSets,
          // Tag switch-rests with the side they lead into (undefined otherwise).
          ...(nextHold.side ? { side: nextHold.side } : {}),
        });
      }
    });

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
