import { useEffect, useState } from "react";
import { RoutineList } from "./components/RoutineList";
import { RoutineEditor } from "./components/RoutineEditor";
import { RunScreen } from "./components/RunScreen";
import { makeEmptyRoutine, makeSampleRoutine } from "./defaults";
import {
  addRoutine,
  deleteRoutine as deleteRoutineFrom,
  loadRoutines,
  saveRoutines,
  upsertRoutine,
} from "./storage";
import { buildShareUrl, decodeRoutine } from "./share";
import type { Routine } from "./types";
import "./App.css";

type View =
  | { name: "list" }
  // `original` is the live routine being edited (null for a brand-new one),
  // used as the referential handle when saving.
  | { name: "edit"; original: Routine | null; draft: Routine }
  | { name: "run"; routine: Routine };

export default function App() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [view, setView] = useState<View>({ name: "list" });
  const [flash, setFlash] = useState<string | null>(null);

  // Load saved routines once, seed a sample on first run, then handle an
  // incoming share link from the hash fragment.
  useEffect(() => {
    const loaded = loadRoutines();
    if (loaded.length === 0) {
      const seeded = [makeSampleRoutine()];
      saveRoutines(seeded);
      setRoutines(seeded);
    } else {
      setRoutines(loaded);
    }

    const payload = window.location.hash.slice(1);
    if (!payload) return;
    // Clear the hash right away (without a reload) so a refresh never
    // re-triggers the import prompt.
    window.history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search,
    );
    void handleIncoming(payload);
  }, []);

  const showFlash = (msg: string) => {
    setFlash(msg);
    window.setTimeout(() => setFlash(null), 2500);
  };

  const handleIncoming = async (payload: string) => {
    const routine = await decodeRoutine(payload);
    if (!routine) {
      window.alert("This share link is invalid or unsupported.");
      return;
    }
    if (!window.confirm(`Import "${routine.name}" into your library?`)) return;
    setRoutines((rs) => addRoutine(rs, routine));
    showFlash(`Imported "${routine.name}"`);
  };

  const handleSave = (draft: Routine) => {
    const original = view.name === "edit" ? view.original : null;
    setRoutines((rs) => upsertRoutine(rs, original, draft));
    setView({ name: "list" });
  };

  const handleDelete = (routine: Routine) => {
    if (!window.confirm("Delete this routine?")) return;
    setRoutines((rs) => deleteRoutineFrom(rs, routine));
  };

  const handleShare = async (routine: Routine) => {
    try {
      const url = await buildShareUrl(routine);
      try {
        await navigator.clipboard.writeText(url);
        showFlash("Share link copied to clipboard");
      } catch {
        // Clipboard blocked (e.g. insecure context) — let the user copy manually.
        window.prompt("Copy this share link:", url);
      }
    } catch {
      window.alert("Couldn't create a share link.");
    }
  };

  return (
    <main className="app">
      {flash && <div className="flash">{flash}</div>}

      {view.name === "list" && (
        <RoutineList
          routines={routines}
          onRun={(r) => setView({ name: "run", routine: r })}
          onEdit={(r) => setView({ name: "edit", original: r, draft: r })}
          onDelete={handleDelete}
          onShare={handleShare}
          onNew={() =>
            setView({ name: "edit", original: null, draft: makeEmptyRoutine() })
          }
        />
      )}

      {view.name === "edit" && (
        <RoutineEditor
          initial={view.draft}
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
