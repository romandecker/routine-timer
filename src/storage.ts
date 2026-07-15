import type { Exercise, Routine, RoutineStep } from "./types";

/**
 * localStorage persistence for routines. No server, no sync — this is the
 * device-local store. The key is versioned so a future schema change can
 * migrate (or ignore) old data without clobbering it silently.
 *
 * Routines have no id: within a session they are identified by object
 * reference, so `upsertRoutine`/`deleteRoutine` take the live object, not a key.
 */
const STORAGE_KEY = "routine-timers.routines.v2";

function isExercise(value: unknown): value is Exercise {
  if (typeof value !== "object" || value === null) return false;
  const e = value as Record<string, unknown>;
  return (
    typeof e.name === "string" &&
    (e.bilateral === undefined || typeof e.bilateral === "boolean") &&
    (e.description === undefined || typeof e.description === "string")
  );
}

function isStep(value: unknown): value is RoutineStep {
  if (typeof value !== "object" || value === null) return false;
  const s = value as Record<string, unknown>;
  return (
    isExercise(s.exercise) &&
    typeof s.sets === "number" &&
    typeof s.holdSeconds === "number" &&
    typeof s.restBetweenSetsSeconds === "number"
  );
}

/**
 * Deep shape-check for an untrusted `Routine`. This is the safety net for both
 * corrupt localStorage and decoded share links: anything that doesn't match is
 * rejected outright rather than half-imported.
 */
export function isRoutine(value: unknown): value is Routine {
  if (typeof value !== "object" || value === null) return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r.name === "string" &&
    typeof r.restBetweenExercisesSeconds === "number" &&
    Array.isArray(r.steps) &&
    r.steps.every(isStep)
  );
}

/** Load all saved routines, or `[]` if none / corrupt. */
export function loadRoutines(): Routine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isRoutine);
  } catch {
    return [];
  }
}

/** Persist the full list of routines. */
export function saveRoutines(routines: Routine[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(routines));
  } catch {
    // Storage full / disabled — nothing we can do here; the app stays usable
    // for the current session.
  }
}

/**
 * Replace `original` with `next`, or append `next` if `original` isn't in the
 * list (i.e. a brand-new routine). Identity is by object reference. Persists
 * and returns the new list.
 */
export function upsertRoutine(
  routines: Routine[],
  original: Routine | null,
  next: Routine,
): Routine[] {
  const idx = original ? routines.indexOf(original) : -1;
  const list =
    idx === -1
      ? [...routines, next]
      : routines.map((r, i) => (i === idx ? next : r));
  saveRoutines(list);
  return list;
}

/** Delete a routine by reference and persist. Returns the new list. */
export function deleteRoutine(routines: Routine[], target: Routine): Routine[] {
  const list = routines.filter((r) => r !== target);
  saveRoutines(list);
  return list;
}

/** Append an imported routine and persist. Returns the new list. */
export function addRoutine(routines: Routine[], routine: Routine): Routine[] {
  const list = [...routines, routine];
  saveRoutines(list);
  return list;
}
