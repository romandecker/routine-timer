/**
 * Core domain types for routine-timers.
 *
 * A `Routine` is the stored, editable thing: an ordered list of steps, each
 * referencing a built-in exercise by id. The timer never runs a `Routine`
 * directly — it runs a flat `TimelinePhase[]` produced by the engine. Keeping
 * the flat timeline separate from the routine is what makes the timer logic a
 * pure, testable function.
 */

/** A built-in exercise. IDs are permanent and append-only (see catalog.ts). */
export interface Exercise {
  id: string;
  name: string;
  /** Suggested hold length in seconds; a routine step may override it. */
  defaultHoldSeconds: number;
  /** Whether the exercise has a left/right side (affects "switch" cue wording). */
  bilateral?: boolean;
  description?: string;
}

/** One exercise within a routine, with the user's chosen parameters. */
export interface RoutineStep {
  exerciseId: string;
  /** Number of sets (holds) for this exercise. Min 1. */
  sets: number;
  /** How long each hold lasts, in seconds. Min 1. */
  holdSeconds: number;
  /** Rest between consecutive sets of THIS exercise, in seconds. 0 = none. */
  restBetweenSetsSeconds: number;
}

/** A saved, editable routine. */
export interface Routine {
  id: string;
  name: string;
  steps: RoutineStep[];
  /** Rest inserted between one exercise and the next, in seconds. 0 = none. */
  restBetweenExercisesSeconds: number;
}

/** Kind of a single phase the timer counts down. */
export type PhaseKind = "hold" | "rest";

/**
 * A single, flat unit of time the timer runs. The engine expands a `Routine`
 * into an ordered list of these; the timer just walks the list.
 */
export interface TimelinePhase {
  kind: PhaseKind;
  /** Human label shown on the run screen, e.g. "Standing Quad — set 2/3". */
  label: string;
  /** Duration in seconds. Always >= 1. */
  seconds: number;
  /** Index of the owning step in `Routine.steps` (for progress display). */
  stepIndex: number;
  /** 1-based set number this phase belongs to. */
  setNumber: number;
  /** Total sets for the owning step (for "2/3" style display). */
  totalSets: number;
}
