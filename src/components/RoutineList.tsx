import { formatDuration } from "../format";
import { totalDurationSeconds } from "../timer/engine";
import type { Routine } from "../types";

interface Props {
  routines: Routine[];
  onRun: (routine: Routine) => void;
  onEdit: (routine: Routine) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}

export function RoutineList({ routines, onRun, onEdit, onDelete, onNew }: Props) {
  return (
    <section className="list">
      <header className="list__top">
        <h1 className="list__title">Routine Timers</h1>
        <button className="btn btn--primary" onClick={onNew}>
          + New
        </button>
      </header>

      {routines.length === 0 ? (
        <p className="list__empty">No routines yet. Create one to get started.</p>
      ) : (
        <ul className="cards">
          {routines.map((r) => (
            <li className="card" key={r.id}>
              <button className="card__main" onClick={() => onRun(r)}>
                <span className="card__name">{r.name}</span>
                <span className="card__meta">
                  {r.steps.length} exercises · {formatDuration(totalDurationSeconds(r))}
                </span>
              </button>
              <div className="card__actions">
                <button className="btn btn--icon" title="Edit" onClick={() => onEdit(r)}>
                  ✎
                </button>
                <button
                  className="btn btn--icon btn--danger"
                  title="Delete"
                  onClick={() => onDelete(r.id)}
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
