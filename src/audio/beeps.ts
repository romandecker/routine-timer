/**
 * Beep cues via the Web Audio API.
 *
 * Two things make this reliable when you're NOT looking at the screen:
 *  1. Audio must be "unlocked" from a user gesture (the Start tap) — browsers
 *     block sound until then. Call `unlockAudio()` inside the Start handler.
 *  2. Cues are SCHEDULED on the AudioContext clock (`currentTime`) at absolute
 *     times, not fired from setTimeout. Even if the JS timer is throttled in a
 *     backgrounded tab, the audio hardware still plays the tone on time.
 */

export type CueKind = "start" | "rest" | "tick" | "done";

let ctx: AudioContext | null = null;
/** Oscillators scheduled but not yet finished, so we can cancel on pause/skip. */
let scheduled: OscillatorNode[] = [];

type Note = { freq: number; durationMs: number; type?: OscillatorType; gain?: number };

/** Cue definitions as short note sequences (delayMs is offset from cue start). */
const CUES: Record<CueKind, Array<Note & { delayMs?: number }>> = {
  start: [
    { freq: 660, durationMs: 90 },
    { freq: 880, durationMs: 120, delayMs: 110 },
  ],
  rest: [{ freq: 392, durationMs: 220, gain: 0.18 }],
  tick: [{ freq: 720, durationMs: 60, gain: 0.12 }],
  done: [
    { freq: 523, durationMs: 130 },
    { freq: 659, durationMs: 130, delayMs: 150 },
    { freq: 784, durationMs: 260, delayMs: 300 },
  ],
};

/**
 * Create/resume the AudioContext. MUST be called from a user gesture handler.
 * Safe to call repeatedly.
 */
export function unlockAudio(): void {
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return; // Web Audio unsupported; app still works silently.
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
}

/** Current AudioContext time in seconds, or null if audio is unavailable. */
export function audioNow(): number | null {
  return ctx ? ctx.currentTime : null;
}

function scheduleNote(at: number, note: Note): void {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = note.type ?? "sine";
  osc.frequency.value = note.freq;

  const peak = note.gain ?? 0.22;
  const dur = note.durationMs / 1000;
  // Tiny attack/release envelope so tones don't click.
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(peak, at + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);

  osc.connect(gain).connect(ctx.destination);
  osc.start(at);
  osc.stop(at + dur + 0.02);
  scheduled.push(osc);
  osc.onended = () => {
    scheduled = scheduled.filter((o) => o !== osc);
  };
}

/**
 * Schedule a cue at an absolute AudioContext time (use `audioNow()` as base).
 * If audio is unavailable this is a no-op.
 */
export function scheduleCue(kind: CueKind, at: number): void {
  if (!ctx) return;
  const startAt = Math.max(at, ctx.currentTime);
  for (const note of CUES[kind]) {
    scheduleNote(startAt + (note.delayMs ?? 0) / 1000, note);
  }
}

/** Play a cue immediately (e.g. the moment Start is pressed). */
export function playCueNow(kind: CueKind): void {
  if (!ctx) return;
  scheduleCue(kind, ctx.currentTime);
}

/** Cancel all scheduled-but-not-yet-played cues (on pause / skip / stop). */
export function cancelScheduledCues(): void {
  for (const osc of scheduled) {
    try {
      osc.stop();
    } catch {
      // already stopped
    }
  }
  scheduled = [];
}
