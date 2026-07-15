import type { TimelinePhase } from "../types";

interface Props {
  timeline: TimelinePhase[];
  /** Index of the phase currently running. */
  index: number;
  /** Whole seconds left in the current phase (from the timer tick). */
  remainingSeconds: number;
}

/** Smallest a segment may render, so a short rest never vanishes (px). */
const MIN_SEGMENT_PX = 4;

/**
 * A minimap "slot" is one drawn block. Most phases map 1:1 to a plain slot;
 * a bilateral set (left hold + optional switch-rest + right hold) collapses
 * into a single split slot drawn as two side-by-side columns.
 */
type Slot =
  | { kind: "plain"; phase: TimelinePhase; startIndex: number; seconds: number }
  | {
      kind: "split";
      seconds: number; // left + switch-rest + right
      leftSeconds: number;
      rightSeconds: number;
      leftIndex: number;
      rightIndex: number;
      restIndex: number | null;
    };

/** Group the flat timeline into slots, merging each bilateral set into a block. */
function buildSlots(timeline: TimelinePhase[]): Slot[] {
  const slots: Slot[] = [];
  let i = 0;
  while (i < timeline.length) {
    const p = timeline[i];
    if (p.kind === "hold" && p.side === "left") {
      // A bilateral set: left hold, an optional switch-rest, then the right hold.
      let j = i + 1;
      let restIndex: number | null = null;
      let restSeconds = 0;
      const switchRest = timeline[j];
      if (switchRest && switchRest.kind === "rest" && switchRest.side === "right") {
        restIndex = j;
        restSeconds = switchRest.seconds;
        j += 1;
      }
      const right = timeline[j];
      if (right && right.kind === "hold" && right.side === "right") {
        slots.push({
          kind: "split",
          leftIndex: i,
          rightIndex: j,
          restIndex,
          leftSeconds: p.seconds,
          rightSeconds: right.seconds,
          seconds: p.seconds + restSeconds + right.seconds,
        });
        i = j + 1;
        continue;
      }
      // Malformed (no matching right hold) — fall through and draw as plain.
    }
    slots.push({ kind: "plain", phase: p, startIndex: i, seconds: p.seconds });
    i += 1;
  }
  return slots;
}

/** Fraction (0..100) of a phase elapsed, given seconds left on the clock. */
const pctElapsed = (seconds: number, remaining: number) =>
  Math.min(100, Math.max(0, ((seconds - remaining) / seconds) * 100));

/**
 * A vertical "you are here" strip for the run screen.
 *
 * One slot per timeline phase (bilateral sets merge into a split L|R block),
 * height proportional to duration (floored so short phases stay visible). Past
 * fills fully, the current slot fills as its time elapses, future stays a muted
 * track. The caret lives INSIDE the current slot at the same fill fraction that
 * drives the fill, so the two can never drift apart.
 */
export function Minimap({ timeline, index, remainingSeconds }: Props) {
  if (!timeline.length) return null;

  const slots = buildSlots(timeline);
  const totalSeconds = slots.reduce((sum, s) => sum + s.seconds, 0);
  if (totalSeconds <= 0) return null;

  return (
    <div className="minimap" aria-hidden="true">
      <div className="minimap__track">
        {slots.map((slot, si) => {
          const style = {
            flexBasis: `${(slot.seconds / totalSeconds) * 100}%`,
            minHeight: `${MIN_SEGMENT_PX}px`,
          };

          if (slot.kind === "split") {
            const { leftIndex, rightIndex, restIndex } = slot;
            const state =
              index > rightIndex ? "past" : index < leftIndex ? "future" : "current";
            const leftFill =
              index > leftIndex ? 100 : index < leftIndex ? 0 : pctElapsed(slot.leftSeconds, remainingSeconds);
            const rightFill =
              index > rightIndex ? 100 : index < rightIndex ? 0 : pctElapsed(slot.rightSeconds, remainingSeconds);
            // Caret follows the side that is currently filling; it parks at the
            // bottom of the left column through the switch-rest, then resumes at
            // the top of the right column.
            const caretTop =
              state !== "current"
                ? null
                : index === leftIndex
                  ? leftFill
                  : restIndex !== null && index === restIndex
                    ? 100
                    : rightFill;
            return (
              <div
                key={si}
                className={`minimap__seg minimap__seg--split minimap__seg--${state}`}
                style={style}
              >
                <span className="minimap__col">
                  <span className="minimap__fill" style={{ height: `${leftFill}%` }} />
                </span>
                <span className="minimap__col">
                  <span className="minimap__fill" style={{ height: `${rightFill}%` }} />
                </span>
                {caretTop !== null && (
                  <span className="minimap__caret" style={{ top: `${caretTop}%` }} />
                )}
              </div>
            );
          }

          const state =
            index > slot.startIndex ? "past" : index === slot.startIndex ? "current" : "future";
          const fill =
            state === "past" ? 100 : state === "current" ? pctElapsed(slot.seconds, remainingSeconds) : 0;
          return (
            <div
              key={si}
              className={`minimap__seg minimap__seg--${slot.phase.kind} minimap__seg--${state}`}
              style={style}
            >
              <span className="minimap__fill" style={{ height: `${fill}%` }} />
              {state === "current" && (
                <span className="minimap__caret" style={{ top: `${fill}%` }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
