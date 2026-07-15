import { useState } from "react";
import { CATALOG } from "../catalog";
import { exerciseFromTemplate, makeStep } from "../defaults";
import { formatDuration } from "../format";
import { totalDurationSeconds } from "../timer/engine";
import type { Exercise, Routine, RoutineStep } from "../types";

interface Props {
  initial: Routine;
  onSave: (routine: Routine) => void;
  onCancel: () => void;
}

/** Small labelled number input clamped to a minimum. */
function NumberField({
  label,
  value,
  min,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <input
        className="field__input"
        type="number"
        inputMode="numeric"
        min={min}
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value);
          onChange(Number.isFinite(n) ? Math.max(min, Math.floor(n)) : min);
        }}
      />
    </label>
  );
}

export function RoutineEditor({ initial, onSave, onCancel }: Props) {
  const [routine, setRoutine] = useState<Routine>(initial);

  const patchStep = (i: number, patch: Partial<RoutineStep>) =>
    setRoutine((r) => ({
      ...r,
      steps: r.steps.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    }));

  const patchExercise = (i: number, patch: Partial<Exercise>) =>
    setRoutine((r) => ({
      ...r,
      steps: r.steps.map((s, idx) =>
        idx === i ? { ...s, exercise: { ...s.exercise, ...patch } } : s,
      ),
    }));

  // Copy a template's fields into a step (name, description, bilateral, and the
  // suggested hold). This is a one-shot seed — no lasting link to the template.
  const applyTemplate = (i: number, templateIndex: number) => {
    const t = CATALOG[templateIndex];
    if (!t) return;
    patchStep(i, {
      exercise: exerciseFromTemplate(t),
      holdSeconds: t.defaultHoldSeconds,
    });
  };

  const removeStep = (i: number) =>
    setRoutine((r) => ({ ...r, steps: r.steps.filter((_, idx) => idx !== i) }));

  const moveStep = (i: number, dir: -1 | 1) =>
    setRoutine((r) => {
      const j = i + dir;
      if (j < 0 || j >= r.steps.length) return r;
      const steps = [...r.steps];
      [steps[i], steps[j]] = [steps[j], steps[i]];
      return { ...r, steps };
    });

  const addStep = () =>
    setRoutine((r) => ({ ...r, steps: [...r.steps, makeStep()] }));

  const canSave =
    routine.name.trim().length > 0 &&
    routine.steps.length > 0 &&
    routine.steps.every((s) => s.exercise.name.trim().length > 0);

  return (
    <section className="editor">
      <header className="editor__top">
        <button className="btn btn--ghost" onClick={onCancel}>
          ← Cancel
        </button>
        <button
          className="btn btn--primary"
          disabled={!canSave}
          onClick={() =>
            onSave({
              ...routine,
              name: routine.name.trim(),
              steps: routine.steps.map((s) => ({
                ...s,
                exercise: { ...s.exercise, name: s.exercise.name.trim() },
              })),
            })
          }
        >
          Save
        </button>
      </header>

      <label className="field field--block">
        <span className="field__label">Routine name</span>
        <input
          className="field__input"
          type="text"
          value={routine.name}
          onChange={(e) => setRoutine((r) => ({ ...r, name: e.target.value }))}
        />
      </label>

      <NumberField
        label="Rest between exercises (s)"
        value={routine.restBetweenExercisesSeconds}
        min={0}
        onChange={(n) => setRoutine((r) => ({ ...r, restBetweenExercisesSeconds: n }))}
      />

      <p className="editor__total">
        Total: {formatDuration(totalDurationSeconds(routine))}
      </p>

      <ol className="steps">
        {routine.steps.map((step, i) => (
          <li className="step" key={i}>
            <div className="step__head">
              <input
                className="field__input step__name"
                type="text"
                placeholder="Exercise name"
                value={step.exercise.name}
                onChange={(e) => patchExercise(i, { name: e.target.value })}
              />
              <div className="step__reorder">
                <button className="btn btn--icon" onClick={() => moveStep(i, -1)} disabled={i === 0}>
                  ↑
                </button>
                <button
                  className="btn btn--icon"
                  onClick={() => moveStep(i, 1)}
                  disabled={i === routine.steps.length - 1}
                >
                  ↓
                </button>
                <button className="btn btn--icon btn--danger" onClick={() => removeStep(i)}>
                  ✕
                </button>
              </div>
            </div>

            <label className="field field--block">
              <span className="field__label">Start from template</span>
              <select
                className="step__select"
                value=""
                onChange={(e) => {
                  if (e.target.value === "") return;
                  applyTemplate(i, Number(e.target.value));
                  e.target.value = "";
                }}
              >
                <option value="">Choose a template…</option>
                {CATALOG.map((t, idx) => (
                  <option key={idx} value={idx}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field field--block">
              <span className="field__label">Description (optional)</span>
              <textarea
                className="field__input step__description"
                rows={2}
                placeholder="Cue shown while holding this exercise"
                value={step.exercise.description ?? ""}
                onChange={(e) =>
                  patchExercise(i, {
                    description: e.target.value === "" ? undefined : e.target.value,
                  })
                }
              />
            </label>

            <div className="step__fields">
              <NumberField label="Sets" value={step.sets} min={1} onChange={(n) => patchStep(i, { sets: n })} />
              <NumberField label="Hold (s)" value={step.holdSeconds} min={1} onChange={(n) => patchStep(i, { holdSeconds: n })} />
              <NumberField
                label="Rest/set (s)"
                value={step.restBetweenSetsSeconds}
                min={0}
                onChange={(n) => patchStep(i, { restBetweenSetsSeconds: n })}
              />
            </div>
          </li>
        ))}
      </ol>

      <button className="btn btn--block" onClick={addStep}>
        + Add exercise
      </button>
    </section>
  );
}
