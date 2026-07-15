/**
 * Core domain types for routine-timers.
 *
 * A `Routine` is the stored, editable thing: an ordered list of steps. Each
 * step carries its exercise data INLINE — a routine is fully self-contained,
 * which is what lets us share it as a self-describing URL with no server and no
 * shared catalog on the other end (see share.ts).
 *
 * The built-in catalog (catalog.ts) is now only a set of starting templates you
 * copy from when authoring; nothing references it at runtime.
 *
 * The timer never runs a `Routine` directly — it runs a flat `TimelinePhase[]`
 * produced by the engine. Keeping the flat timeline separate from the routine
 * is what makes the timer logic a pure, testable function.
 */

/**
 * The descriptive part of an exercise, copied inline into each routine step.
 * There is no id: two steps with "the same" exercise are independent copies,
 * and editing one never touches the other.
 */
export interface Exercise {
  name: string;
  /** Whether the exercise has a left/right side (affects "switch" cue wording). */
  bilateral?: boolean;
  description?: string;
}

/**
 * A built-in catalog entry: an exercise plus a suggested default hold. Picking
 * one in the editor copies its fields into a step; the template itself is never
 * referenced afterward.
 */
export interface ExerciseTemplate extends Exercise {
  /** Suggested hold length in seconds, used to seed a new step. */
  defaultHoldSeconds: number;
}

/** One exercise within a routine, with the user's chosen parameters. */
export interface RoutineStep {
  /** The exercise, stored inline (not a reference to any catalog entry). */
  exercise: Exercise;
  /** Number of sets (holds) for this exercise. Min 1. */
  sets: number;
  /** How long each hold lasts, in seconds. Min 1. */
  holdSeconds: number;
  /** Rest between consecutive sets of THIS exercise, in seconds. 0 = none. */
  restBetweenSetsSeconds: number;
}

/**
 * A saved, editable routine.
 *
 * There is no `id`: within a session a routine is identified by its object
 * reference (edit/delete operate on the live object), and across the share
 * boundary it is identified purely by its content. Two content-identical
 * routines in the library are allowed and indistinguishable.
 */
export interface Routine {
  name: string;
  steps: RoutineStep[];
  /** Rest inserted between one exercise and the next, in seconds. 0 = none. */
  restBetweenExercisesSeconds: number;
}

/** Kind of a single phase the timer counts down. */
export type PhaseKind = "hold" | "rest";

/** Which side of the body a bilateral phase belongs to. */
export type Side = "left" | "right";

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
  /**
   * For bilateral exercises: which body side this phase is for. Holds carry
   * their own side; a switch-rest carries the side it is switching TO; the
   * between-exercises rest (and all non-bilateral phases) carry none.
   */
  side?: Side;
}
