import { useEffect, useState } from "react";
import { RoutineList } from "./components/RoutineList";
import { RoutineEditor } from "./components/RoutineEditor";
import { RunScreen } from "./components/RunScreen";
import { makeEmptyRoutine, makeSampleRoutine } from "./defaults";
import {
  deleteRoutine as deleteRoutineFrom,
  loadRoutines,
  saveRoutines,
  upsertRoutine,
} from "./storage";
import type { Routine } from "./types";
import "./App.css";

type View =
  | { name: "list" }
  | { name: "edit"; routine: Routine }
  | { name: "run"; routine: Routine };

export default function App() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [view, setView] = useState<View>({ name: "list" });

  // Load saved routines once; seed a sample on very first run.
  useEffect(() => {
    const loaded = loadRoutines();
    if (loaded.length === 0) {
      const seeded = [makeSampleRoutine()];
      saveRoutines(seeded);
      setRoutines(seeded);
    } else {
      setRoutines(loaded);
    }
  }, []);

  const handleSave = (routine: Routine) => {
    setRoutines((rs) => upsertRoutine(rs, routine));
    setView({ name: "list" });
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Delete this routine?")) return;
    setRoutines((rs) => deleteRoutineFrom(rs, id));
  };

  return (
    <main className="app">
      {view.name === "list" && (
        <RoutineList
          routines={routines}
          onRun={(r) => setView({ name: "run", routine: r })}
          onEdit={(r) => setView({ name: "edit", routine: r })}
          onDelete={handleDelete}
          onNew={() => setView({ name: "edit", routine: makeEmptyRoutine() })}
        />
      )}

      {view.name === "edit" && (
        <RoutineEditor
          initial={view.routine}
          onSave={handleSave}
          onCancel={() => setView({ name: "list" })}
        />
      )}

      {view.name === "run" && (
        <RunScreen routine={view.routine} onExit={() => setView({ name: "list" })} />
      )}
    </main>
  );
}
