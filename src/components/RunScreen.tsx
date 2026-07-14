import { useRoutineTimer } from "../timer/useRoutineTimer";
import { getExercise } from "../catalog";
import { formatDuration } from "../format";
import { totalDurationSeconds } from "../timer/engine";
import type { Routine } from "../types";

interface Props {
  routine: Routine;
  onExit: () => void;
}

export function RunScreen({ routine, onExit }: Props) {
  const timer = useRoutineTimer(routine);
  const { status, phase, next, remainingSeconds, index, totalPhases } = timer;

  const nextLabel = next
    ? next.kind === "hold"
      ? `${next.label} (set ${next.setNumber}/${next.totalSets})`
      : "Rest"
    : "Finish";

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
        <div className="run__center">
          <p className="run__kind">{phase.kind === "hold" ? "HOLD" : "REST"}</p>
          <h1 className="run__phase">
            {phase.kind === "hold" ? phase.label : "Rest"}
          </h1>
          {phase.kind === "hold" && (
            <>
              <p className="run__set">
                Set {phase.setNumber} / {phase.totalSets}
              </p>
              {getExercise(routine.steps[phase.stepIndex]?.exerciseId)?.description && (
                <p className="run__hint">
                  {getExercise(routine.steps[phase.stepIndex].exerciseId)!.description}
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
