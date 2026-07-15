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
 * A vertical "you are here" strip for the run screen.
 *
 * One segment per timeline phase, height proportional to the phase's duration
 * (floored so short phases stay visible). Past phases are fully filled in their
 * own colour, the current phase fills as its time elapses, and future phases
 * show as a muted track. A caret marks the fill line.
 *
 * Display-only: it reflects the timer, it does not drive it.
 */
export function Minimap({ timeline, index, remainingSeconds }: Props) {
  if (!timeline.length) return null;

  // Overall fill fraction (0..1) across the whole routine, by elapsed time, so
  // the caret sits at a true elapsed-vs-total position. Within the current
  // phase we interpolate from remainingSeconds.
  const totalSeconds = timeline.reduce((sum, p) => sum + p.seconds, 0);
  let elapsedBefore = 0;
  for (let i = 0; i < index; i++) elapsedBefore += timeline[i].seconds;
  const current = timeline[index];
  const currentElapsed = current
    ? Math.min(current.seconds, Math.max(0, current.seconds - remainingSeconds))
    : 0;
  const fillFraction = Math.min(1, (elapsedBefore + currentElapsed) / totalSeconds);

  return (
    <div className="minimap" aria-hidden="true">
      <div className="minimap__track">
        {timeline.map((phase, i) => {
          const heightPct = (phase.seconds / totalSeconds) * 100;
          const state = i < index ? "past" : i === index ? "current" : "future";
          // The current segment fills top-down as its own time elapses.
          const segFill =
            state === "past"
              ? 100
              : state === "current" && current
                ? (currentElapsed / current.seconds) * 100
                : 0;
          return (
            <div
              key={i}
              className={`minimap__seg minimap__seg--${phase.kind} minimap__seg--${state}`}
              style={{
                flexBasis: `${heightPct}%`,
                minHeight: `${MIN_SEGMENT_PX}px`,
              }}
            >
              <span className="minimap__fill" style={{ height: `${segFill}%` }} />
            </div>
          );
        })}
      </div>
      <span className="minimap__caret" style={{ top: `${fillFraction * 100}%` }} />
    </div>
  );
}
