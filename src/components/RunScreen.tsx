import { useRoutineTimer } from "../timer/useRoutineTimer";
import { formatDuration } from "../format";
import { totalDurationSeconds } from "../timer/engine";
import { Minimap } from "./Minimap";
import type { Routine } from "../types";

interface Props {
  routine: Routine;
  onExit: () => void;
}

export function RunScreen({ routine, onExit }: Props) {
  const timer = useRoutineTimer(routine);
  const { status, phase, next, remainingSeconds, index, totalPhases, timeline } =
    timer;

  const sideWord = (side: "left" | "right") =>
    side === "left" ? "Left" : "Right";

  const nextLabel = !next
    ? "Finish"
    : next.kind === "rest"
      ? next.side
        ? `Switch to ${sideWord(next.side)}`
        : "Rest"
      : `${next.side ? `${sideWord(next.side)} · ` : ""}${next.label} (set ${next.setNumber}/${next.totalSets})`;

  // A switch-rest (bilateral) carries the side it leads into; holds carry their
  // own side. Either way, `phase.side` is what the L/R indicator should light.
  const activeSide = phase?.side;
  const isSwitchRest = phase?.kind === "rest" && phase.side !== undefined;

  return (
    <section className={`run run--${phase?.kind ?? "idle"}`}>
      <header className="run__top">
        <span className="run__routine">{routine.name}</span>
        <button className="btn btn--ghost" onClick={onExit}>
          ✕ Exit
        </button>
      </header>

      {status === "idle" && (
        <div className="run__center">
          <p className="run__ready">Ready</p>
          <p className="run__total">
            {routine.steps.length} exercises · {formatDuration(totalDurationSeconds(routine))}
          </p>
          <button className="btn btn--primary btn--big" onClick={timer.start}>
            Start
          </button>
        </div>
      )}

      {(status === "running" || status === "paused") && phase && (
        <>
          <Minimap
            timeline={timeline}
            index={index}
            remainingSeconds={remainingSeconds}
          />
          <div className="run__center">
            <p className="run__kind">
              {phase.kind === "hold" ? "HOLD" : isSwitchRest ? "SWITCH" : "REST"}
            </p>
            <h1 className="run__phase">
              {phase.kind === "hold"
                ? phase.label
                : isSwitchRest && activeSide
                  ? `Switch to ${sideWord(activeSide)}`
                  : "Rest"}
            </h1>
            {activeSide && (
              <div className="run__sides" role="img" aria-label={`${sideWord(activeSide)} side`}>
                <span className={`run__side ${activeSide === "left" ? "is-active" : ""}`}>
                  LEFT
                </span>
                <span className={`run__side ${activeSide === "right" ? "is-active" : ""}`}>
                  RIGHT
                </span>
              </div>
            )}
            {phase.kind === "hold" && (
              <>
                <p className="run__set">
                  Set {phase.setNumber} / {phase.totalSets}
                </p>
                {routine.steps[phase.stepIndex]?.exercise.description && (
                  <p className="run__hint">
                    {routine.steps[phase.stepIndex].exercise.description}
                  </p>
                )}
              </>
            )}
            <p className="run__count">{formatDuration(remainingSeconds)}</p>
            <p className="run__next">Next: {nextLabel}</p>
            <p className="run__progress">
              Phase {index + 1} / {totalPhases}
            </p>

            <div className="run__controls">
              {status === "running" ? (
                <button className="btn" onClick={timer.pause}>
                  Pause
                </button>
              ) : (
                <button className="btn btn--primary" onClick={timer.resume}>
                  Resume
                </button>
              )}
              <button className="btn" onClick={timer.skip}>
                Skip ⏭
              </button>
              <button className="btn btn--danger" onClick={timer.reset}>
                Stop
              </button>
            </div>
          </div>
        </>
      )}

      {status === "finished" && (
        <div className="run__center">
          <p className="run__ready">Done! 🎉</p>
          <div className="run__controls">
            <button className="btn btn--primary" onClick={timer.start}>
              Restart
            </button>
            <button className="btn" onClick={onExit}>
              Back
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
