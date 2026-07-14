import type { Exercise } from "./types";

/**
 * The built-in exercise catalog.
 *
 * ⚠️ APPEND-ONLY CONTRACT ⚠️
 * Shared routines reference exercises by `id`. There is no server to migrate
 * old links, so an exercise's identity must never change:
 *   - NEVER change or reuse an existing `id`.
 *   - NEVER remove an entry (retire it via `retired: true` if truly needed).
 *   - Only APPEND new exercises to the end.
 * You MAY freely edit cosmetic fields (name, description, defaultHoldSeconds)
 * since links carry their own per-step overrides for hold/sets/rest.
 */
export const CATALOG: readonly Exercise[] = [
  {
    id: "standing-quad",
    name: "Standing Quad Stretch",
    defaultHoldSeconds: 30,
    bilateral: true,
    description: "Stand tall, pull one heel toward your glutes, knees together.",
  },
  {
    id: "hamstring-forward-fold",
    name: "Standing Hamstring Fold",
    defaultHoldSeconds: 30,
    description: "Hinge at the hips and reach toward the floor, soft knees.",
  },
  {
    id: "seated-hamstring",
    name: "Seated Hamstring Stretch",
    defaultHoldSeconds: 30,
    bilateral: true,
    description: "Seated, one leg extended, reach toward the toes.",
  },
  {
    id: "figure-four-glute",
    name: "Figure-Four Glute Stretch",
    defaultHoldSeconds: 30,
    bilateral: true,
    description: "Lying on your back, ankle over opposite knee, pull thigh in.",
  },
  {
    id: "hip-flexor-lunge",
    name: "Kneeling Hip Flexor Lunge",
    defaultHoldSeconds: 30,
    bilateral: true,
    description: "Half-kneel, tuck the pelvis, push the hips gently forward.",
  },
  {
    id: "child-pose",
    name: "Child's Pose",
    defaultHoldSeconds: 45,
    description: "Knees wide, hips back to heels, arms reaching forward.",
  },
  {
    id: "cat-cow",
    name: "Cat–Cow",
    defaultHoldSeconds: 30,
    description: "On all fours, alternate arching and rounding the spine.",
  },
  {
    id: "thoracic-rotation",
    name: "Thread-the-Needle",
    defaultHoldSeconds: 30,
    bilateral: true,
    description: "From all fours, thread one arm under the other, rotate.",
  },
  {
    id: "chest-doorway",
    name: "Doorway Chest Stretch",
    defaultHoldSeconds: 30,
    description: "Forearm on a doorframe, step through to open the chest.",
  },
  {
    id: "neck-lateral",
    name: "Lateral Neck Stretch",
    defaultHoldSeconds: 20,
    bilateral: true,
    description: "Gently tilt the ear toward the shoulder; do not pull hard.",
  },
  {
    id: "calf-wall",
    name: "Standing Calf Stretch",
    defaultHoldSeconds: 30,
    bilateral: true,
    description: "Back leg straight, heel down, lean into a wall.",
  },
  {
    id: "butterfly-groin",
    name: "Butterfly (Groin) Stretch",
    defaultHoldSeconds: 45,
    description: "Seated, soles together, let the knees fall open.",
  },
];

const CATALOG_BY_ID = new Map(CATALOG.map((e) => [e.id, e]));

/** Look up an exercise by id, or `undefined` if the id is unknown. */
export function getExercise(id: string): Exercise | undefined {
  return CATALOG_BY_ID.get(id);
}
