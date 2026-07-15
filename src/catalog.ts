import type { ExerciseTemplate } from "./types";

/**
 * Built-in exercise templates.
 *
 * These are only starting points for authoring: picking one copies its fields
 * into a routine step, after which the step owns that data outright. Nothing
 * references this list at runtime, so it is an ordinary editable seed list —
 * rename, reorder, add, or remove entries freely.
 */
export const CATALOG: readonly ExerciseTemplate[] = [
  {
    name: "Standing Quad Stretch",
    defaultHoldSeconds: 30,
    bilateral: true,
    description: "Stand tall, pull one heel toward your glutes, knees together.",
  },
  {
    name: "Standing Hamstring Fold",
    defaultHoldSeconds: 30,
    description: "Hinge at the hips and reach toward the floor, soft knees.",
  },
  {
    name: "Seated Hamstring Stretch",
    defaultHoldSeconds: 30,
    bilateral: true,
    description: "Seated, one leg extended, reach toward the toes.",
  },
  {
    name: "Figure-Four Glute Stretch",
    defaultHoldSeconds: 30,
    bilateral: true,
    description: "Lying on your back, ankle over opposite knee, pull thigh in.",
  },
  {
    name: "Kneeling Hip Flexor Lunge",
    defaultHoldSeconds: 30,
    bilateral: true,
    description: "Half-kneel, tuck the pelvis, push the hips gently forward.",
  },
  {
    name: "Child's Pose",
    defaultHoldSeconds: 45,
    description: "Knees wide, hips back to heels, arms reaching forward.",
  },
  {
    name: "Cat–Cow",
    defaultHoldSeconds: 30,
    description: "On all fours, alternate arching and rounding the spine.",
  },
  {
    name: "Thread-the-Needle",
    defaultHoldSeconds: 30,
    bilateral: true,
    description: "From all fours, thread one arm under the other, rotate.",
  },
  {
    name: "Doorway Chest Stretch",
    defaultHoldSeconds: 30,
    description: "Forearm on a doorframe, step through to open the chest.",
  },
  {
    name: "Lateral Neck Stretch",
    defaultHoldSeconds: 20,
    bilateral: true,
    description: "Gently tilt the ear toward the shoulder; do not pull hard.",
  },
  {
    name: "Standing Calf Stretch",
    defaultHoldSeconds: 30,
    bilateral: true,
    description: "Back leg straight, heel down, lean into a wall.",
  },
  {
    name: "Butterfly (Groin) Stretch",
    defaultHoldSeconds: 45,
    description: "Seated, soles together, let the knees fall open.",
  },
];
