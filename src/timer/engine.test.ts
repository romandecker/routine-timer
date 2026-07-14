import { describe, expect, it } from "vitest";
import { buildTimeline, totalDurationSeconds } from "./engine";
import type { Routine } from "../types";

const routine = (overrides: Partial<Routine> = {}): Routine => ({
  id: "r1",
  name: "Test",
  steps: [],
  restBetweenExercisesSeconds: 0,
  ...overrides,
});

describe("buildTimeline", () => {
  it("expands a single exercise with multiple sets and inter-set rests", () => {
    const t = buildTimeline(
      routine({
        steps: [
          {
            exerciseId: "standing-quad",
            sets: 3,
            holdSeconds: 30,
            restBetweenSetsSeconds: 10,
          },
        ],
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
        steps: [
          { exerciseId: "child-pose", sets: 2, holdSeconds: 45, restBetweenSetsSeconds: 0 },
        ],
      }),
    );
    expect(t.map((p) => p.kind)).toEqual(["hold", "hold"]);
  });

  it("inserts rest-between-exercises but not after the last exercise", () => {
    const t = buildTimeline(
      routine({
        restBetweenExercisesSeconds: 15,
        steps: [
          { exerciseId: "cat-cow", sets: 1, holdSeconds: 20, restBetweenSetsSeconds: 0 },
          { exerciseId: "child-pose", sets: 1, holdSeconds: 20, restBetweenSetsSeconds: 0 },
        ],
      }),
    );
    expect(t.map((p) => p.kind)).toEqual(["hold", "rest", "hold"]);
    expect(t[1].seconds).toBe(15);
    // no trailing rest
    expect(t[t.length - 1].kind).toBe("hold");
  });

  it("labels holds with the catalog name and falls back for unknown ids", () => {
    const t = buildTimeline(
      routine({
        steps: [
          { exerciseId: "standing-quad", sets: 1, holdSeconds: 5, restBetweenSetsSeconds: 0 },
          { exerciseId: "does-not-exist", sets: 1, holdSeconds: 5, restBetweenSetsSeconds: 0 },
        ],
      }),
    );
    expect(t[0].label).toBe("Standing Quad Stretch");
    expect(t[1].label).toBe("Unknown exercise");
  });

  it("clamps degenerate values (0 sets -> 1, fractional hold floored, min 1s)", () => {
    const t = buildTimeline(
      routine({
        steps: [
          { exerciseId: "cat-cow", sets: 0, holdSeconds: 0.4, restBetweenSetsSeconds: 3 },
        ],
      }),
    );
    expect(t).toHaveLength(1);
    expect(t[0].seconds).toBe(1);
    expect(t[0].totalSets).toBe(1);
  });

  it("returns an empty timeline for a routine with no steps", () => {
    expect(buildTimeline(routine())).toEqual([]);
  });
});

describe("totalDurationSeconds", () => {
  it("sums all phase durations", () => {
    const r = routine({
      restBetweenExercisesSeconds: 15,
      steps: [
        { exerciseId: "cat-cow", sets: 2, holdSeconds: 20, restBetweenSetsSeconds: 5 },
        { exerciseId: "child-pose", sets: 1, holdSeconds: 45, restBetweenSetsSeconds: 0 },
      ],
    });
    // 20 + 5 + 20 (step1) + 15 (between) + 45 (step2) = 105
    expect(totalDurationSeconds(r)).toBe(105);
  });
});
