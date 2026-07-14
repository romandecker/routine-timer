# Routine Timers

A tiny, fully client-side web app for running a stretching/workout routine: hold
each exercise for a set time, for N sets, with rests between sets and exercises.
No server, no accounts — routines are stored in your browser's `localStorage`.

Built with **Vite + React + TypeScript**. Mobile-first (designed for Android Chrome,
on the floor, phone nearby).

## Why it works when you're not looking at the screen

A stretching timer is used face-down on a mat, not staring at a display. So:

- **Beep cues** mark every phase transition (Web Audio). Audio is unlocked by the
  Start tap, and cues are scheduled ahead on the audio clock so a throttled tab
  doesn't make them fire late. See `src/audio/beeps.ts`.
- **Wake Lock** keeps the screen on, and re-acquires after backgrounding. See
  `src/wakeLock.ts`.
- **Drift-resistant timing**: the countdown is derived from a `performance.now()`
  anchor each tick, so it self-corrects instead of drifting. See
  `src/timer/useRoutineTimer.ts`.

## Structure

| File | Role |
| --- | --- |
| `src/types.ts` | Domain types (`Exercise`, `RoutineStep`, `Routine`, `TimelinePhase`). |
| `src/catalog.ts` | Built-in exercises. **Append-only** — ids are permanent (shared links depend on them). |
| `src/timer/engine.ts` | Pure `Routine → TimelinePhase[]` expansion (unit-tested). |
| `src/timer/useRoutineTimer.ts` | The live timer controller hook. |
| `src/storage.ts` | Versioned `localStorage` persistence. |
| `src/components/` | List / Editor / Run screens. |

## Scripts

```bash
npm run dev     # dev server
npm run build   # typecheck + production build
npm test        # unit tests (Vitest)
```

## Roadmap (deliberately out of v1)

- Shareable ID-reference links (compact; relies on the append-only catalog).
- User-authored custom exercises.
- Voice cues, PWA/offline install.
