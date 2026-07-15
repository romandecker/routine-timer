import { describe, expect, it } from "vitest";
import { buildTimeline, totalDurationSeconds } from "./engine";
import type { Routine, RoutineStep } from "../types";

const routine = (overrides: Partial<Routine> = {}): Routine => ({
  name: "Test",
  steps: [],
  restBetweenExercisesSeconds: 0,
  ...overrides,
});

/** Build a step with an inline exercise, mirroring the editor's output. */
const step = (
  name: string,
  sets: number,
  holdSeconds: number,
  restBetweenSetsSeconds: number,
): RoutineStep => ({
  exercise: { name },
  sets,
  holdSeconds,
  restBetweenSetsSeconds,
});

/** A bilateral step (runs each set on both sides). */
const bilateralStep = (
  name: string,
  sets: number,
  holdSeconds: number,
  restBetweenSetsSeconds: number,
): RoutineStep => ({
  exercise: { name, bilateral: true },
  sets,
  holdSeconds,
  restBetweenSetsSeconds,
});

describe("buildTimeline", () => {
  it("expands a single exercise with multiple sets and inter-set rests", () => {
    const t = buildTimeline(
      routine({
        steps: [step("Standing Quad Stretch", 3, 30, 10)],
      }),
    );
    // hold, rest, hold, rest, hold  (no trailing rest after last set)
    expect(t.map((p) => p.kind)).toEqual(["hold", "rest", "hold", "rest", "hold"]);
    expect(t.map((p) => p.seconds)).toEqual([30, 10, 30, 10, 30]);
    expect(t.filter((p) => p.kind === "hold").map((p) => p.setNumber)).toEqual([1, 2, 3]);
    expect(t[0].totalSets).toBe(3);
  });

  it("omits inter-set rest when restBetweenSetsSeconds is 0", () => {
    const t = buildTimeline(
      routine({
        steps: [step("Child's Pose", 2, 45, 0)],
      }),
    );
    expect(t.map((p) => p.kind)).toEqual(["hold", "hold"]);
  });

  it("inserts rest-between-exercises but not after the last exercise", () => {
    const t = buildTimeline(
      routine({
        restBetweenExercisesSeconds: 15,
        steps: [
          step("Cat–Cow", 1, 20, 0),
          step("Child's Pose", 1, 20, 0),
        ],
      }),
    );
    expect(t.map((p) => p.kind)).toEqual(["hold", "rest", "hold"]);
    expect(t[1].seconds).toBe(15);
    // no trailing rest
    expect(t[t.length - 1].kind).toBe("hold");
  });

  it("labels holds with the step's inline exercise name", () => {
    const t = buildTimeline(
      routine({
        steps: [
          step("Standing Quad Stretch", 1, 5, 0),
          step("My Custom Move", 1, 5, 0),
        ],
      }),
    );
    expect(t[0].label).toBe("Standing Quad Stretch");
    expect(t[1].label).toBe("My Custom Move");
  });

  it("clamps degenerate values (0 sets -> 1, fractional hold floored, min 1s)", () => {
    const t = buildTimeline(
      routine({
        steps: [step("Cat–Cow", 0, 0.4, 3)],
      }),
    );
    expect(t).toHaveLength(1);
    expect(t[0].seconds).toBe(1);
    expect(t[0].totalSets).toBe(1);
  });

  it("returns an empty timeline for a routine with no steps", () => {
    expect(buildTimeline(routine())).toEqual([]);
  });

  it("expands a bilateral step to left/right holds with rests between every hold", () => {
    // The worked example: 2 sets of 30s, 5s rest.
    const t = buildTimeline(
      routine({ steps: [bilateralStep("Kneeling Hip Flexor Lunge", 2, 30, 5)] }),
    );
    // L, rest, R, rest, L, rest, R  (rest between every hold, none trailing).
    expect(t.map((p) => p.kind)).toEqual([
      "hold", "rest", "hold", "rest", "hold", "rest", "hold",
    ]);
    expect(t.filter((p) => p.kind === "hold").map((p) => p.side)).toEqual([
      "left", "right", "left", "right",
    ]);
    // Set counter stays 1..N; side tells the two halves apart.
    expect(t.filter((p) => p.kind === "hold").map((p) => p.setNumber)).toEqual([
      1, 1, 2, 2,
    ]);
    expect(t.every((p) => p.totalSets === 2)).toBe(true);
  });

  it("tags each switch-rest with the side it leads into", () => {
    const t = buildTimeline(
      routine({ steps: [bilateralStep("Lunge", 2, 30, 5)] }),
    );
    // rests appear at indices 1 (->right), 3 (->left), 5 (->right)
    expect(t.filter((p) => p.kind === "rest").map((p) => p.side)).toEqual([
      "right", "left", "right",
    ]);
  });

  it("runs bilateral sides back-to-back when rest is 0", () => {
    const t = buildTimeline(
      routine({ steps: [bilateralStep("Lunge", 2, 30, 0)] }),
    );
    expect(t.map((p) => p.kind)).toEqual(["hold", "hold", "hold", "hold"]);
    expect(t.map((p) => p.side)).toEqual(["left", "right", "left", "right"]);
  });

  it("leaves non-bilateral phases without a side", () => {
    const t = buildTimeline(routine({ steps: [step("Cat–Cow", 2, 20, 5)] }));
    expect(t.every((p) => p.side === undefined)).toBe(true);
  });
});

describe("totalDurationSeconds", () => {
  it("sums all phase durations", () => {
    const r = routine({
      restBetweenExercisesSeconds: 15,
      steps: [
        step("Cat–Cow", 2, 20, 5),
        step("Child's Pose", 1, 45, 0),
      ],
    });
    // 20 + 5 + 20 (step1) + 15 (between) + 45 (step2) = 105
    expect(totalDurationSeconds(r)).toBe(105);
  });
});
