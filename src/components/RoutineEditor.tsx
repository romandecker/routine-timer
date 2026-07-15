import { useEffect, useRef, useState } from "react";
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

/**
 * Labelled integer input with −/+ steppers, tuned for mobile.
 *
 * Uses a numeric text input (not `type="number"`) so the mobile keypad shows
 * without the flaky native spinners/selection. A local draft lets you type or
 * clear freely; clamping to `min` happens only on blur (and via the steppers),
 * so overwriting "1" with "2" isn't fought by the minimum mid-keystroke.
 */
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
  const [draft, setDraft] = useState(String(value));
  const editing = useRef(false);

  // Reflect external value changes (e.g. applying a template) unless the user
  // is mid-edit, in which case their draft wins until they blur.
  useEffect(() => {
    if (!editing.current) setDraft(String(value));
  }, [value]);

  const commit = (n: number) => {
    const clamped = Number.isFinite(n) ? Math.max(min, Math.floor(n)) : min;
    onChange(clamped);
    setDraft(String(clamped));
  };

  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <div className="stepper">
        <button
          type="button"
          className="stepper__btn"
          onClick={() => commit(value - 1)}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <input
          className="field__input stepper__input"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={draft}
          onFocus={(e) => {
            editing.current = true;
            e.currentTarget.select();
          }}
          onChange={(e) => {
            const raw = e.currentTarget.value.replace(/[^0-9]/g, "");
            setDraft(raw);
            if (raw !== "") onChange(Math.max(min, Math.floor(Number(raw))));
          }}
          onBlur={() => {
            editing.current = false;
            commit(Number(draft));
          }}
        />
        <button
          type="button"
          className="stepper__btn"
          onClick={() => commit(value + 1)}
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
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

            <label className="step__bilateral">
              <input
                type="checkbox"
                checked={step.exercise.bilateral === true}
                onChange={(e) =>
                  patchExercise(i, {
                    bilateral: e.target.checked ? true : undefined,
                  })
                }
              />
              <span>Both sides (left, then right)</span>
            </label>
          </li>
        ))}
      </ol>

      <button className="btn btn--block" onClick={addStep}>
        + Add exercise
      </button>
    </section>
  );
}
