import { describe, expect, it } from "vitest";
import { decodeRoutine, encodeRoutine } from "./share";
import type { Routine } from "./types";

const sample: Routine = {
  name: "Morning Stretch",
  restBetweenExercisesSeconds: 15,
  steps: [
    {
      exercise: { name: "Cat–Cow", description: "Arch and round the spine." },
      sets: 1,
      holdSeconds: 30,
      restBetweenSetsSeconds: 0,
    },
    {
      // Same exercise twice: independent inline copies, deflate collapses them.
      exercise: { name: "Cat–Cow", description: "Arch and round the spine." },
      sets: 2,
      holdSeconds: 30,
      restBetweenSetsSeconds: 10,
    },
    {
      exercise: { name: "Standing Quad Stretch", bilateral: true },
      sets: 2,
      holdSeconds: 30,
      restBetweenSetsSeconds: 10,
    },
  ],
};

describe("share codec", () => {
  it("round-trips a routine through encode → decode", async () => {
    const decoded = await decodeRoutine(await encodeRoutine(sample));
    expect(decoded).toEqual(sample);
  });

  it("produces a URL-safe payload with a plaintext version prefix", async () => {
    const payload = await encodeRoutine(sample);
    expect(payload.startsWith("1~")).toBe(true);
    expect(payload).toMatch(/^[0-9]+~[A-Za-z0-9_-]+$/);
  });

  it("rejects a malformed payload without throwing", async () => {
    expect(await decodeRoutine("not-a-real-payload")).toBeNull();
    expect(await decodeRoutine("1~$$$notbase64$$$")).toBeNull();
    expect(await decodeRoutine("")).toBeNull();
  });

  it("rejects an unknown version", async () => {
    const payload = await encodeRoutine(sample);
    const bumped = "9" + payload.slice(1);
    expect(await decodeRoutine(bumped)).toBeNull();
  });

  it("rejects a valid-compression payload whose content isn't a routine", async () => {
    // Re-encode a bogus object using the same envelope, then confirm the
    // shape-check rejects it rather than importing garbage.
    const bogus = await encodeRoutine({ nope: true } as unknown as Routine);
    expect(await decodeRoutine(bogus)).toBeNull();
  });
});
