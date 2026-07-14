import type { Routine } from "./types";

/**
 * localStorage persistence for routines. No server, no sync — this is the
 * device-local store. The key is versioned so a future schema change can
 * migrate (or ignore) old data without clobbering it silently.
 */
const STORAGE_KEY = "routine-timers.routines.v1";

/** Generate a stable unique id for a new routine. */
export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Fallback for very old browsers.
  return `r-${Math.abs(Math.floor(performance.now() * 1000))}-${Math.floor(
    Math.random() * 1e6,
  )}`;
}

function isRoutine(value: unknown): value is Routine {
  if (typeof value !== "object" || value === null) return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r.id === "string" &&
    typeof r.name === "string" &&
    Array.isArray(r.steps) &&
    typeof r.restBetweenExercisesSeconds === "number"
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

/** Insert or replace a routine by id and persist. Returns the new list. */
export function upsertRoutine(routines: Routine[], routine: Routine): Routine[] {
  const idx = routines.findIndex((r) => r.id === routine.id);
  const next =
    idx === -1
      ? [...routines, routine]
      : routines.map((r) => (r.id === routine.id ? routine : r));
  saveRoutines(next);
  return next;
}

/** Delete a routine by id and persist. Returns the new list. */
export function deleteRoutine(routines: Routine[], id: string): Routine[] {
  const next = routines.filter((r) => r.id !== id);
  saveRoutines(next);
  return next;
}
