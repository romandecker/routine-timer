import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildTimeline } from "./engine";
import type { Routine, TimelinePhase } from "../types";
import {
  audioNow,
  cancelScheduledCues,
  playCueNow,
  scheduleCue,
  unlockAudio,
} from "../audio/beeps";
import { releaseWakeLock, requestWakeLock } from "../wakeLock";

export type TimerStatus = "idle" | "running" | "paused" | "finished";

export interface TimerState {
  status: TimerStatus;
  timeline: TimelinePhase[];
  index: number;
  phase: TimelinePhase | null;
  next: TimelinePhase | null;
  remainingSeconds: number;
  totalPhases: number;
  start: () => void;
  pause: () => void;
  resume: () => void;
  skip: () => void;
  reset: () => void;
}

const TICK_MS = 200;

/**
 * Drive a routine's timeline as a live timer.
 *
 * Timing is anchored to `performance.now()`: each phase records the absolute
 * timestamp at which it ends, and every tick derives the remaining time from
 * that anchor. So if the tab is throttled and a tick is skipped, the display
 * self-corrects on the next tick instead of accumulating drift. Audio cues are
 * scheduled ahead on the Web Audio clock (see beeps.ts) for the same reason.
 */
export function useRoutineTimer(routine: Routine): TimerState {
  const timeline = useMemo(() => buildTimeline(routine), [routine]);

  const [status, setStatus] = useState<TimerStatus>("idle");
  const [index, setIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(timeline[0]?.seconds ?? 0);

  // Timing source-of-truth (refs so tick reads current values, not stale closures).
  const statusRef = useRef<TimerStatus>("idle");
  const indexRef = useRef(0);
  const phaseEndAtRef = useRef(0); // performance.now() ms when current phase ends
  const remainingMsRef = useRef((timeline[0]?.seconds ?? 0) * 1000); // used while paused
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTick = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /** Schedule the current phase's countdown ticks + boundary cue on the audio clock. */
  const scheduleCurrentPhaseCues = useCallback(
    (idx: number, remainingSec: number) => {
      const base = audioNow();
      if (base === null) return;
      for (let k = 1; k <= 3; k++) {
        const t = remainingSec - k;
        if (t > 0.05) scheduleCue("tick", base + t);
      }
      const cur = timeline[idx];
      const nextPhase = timeline[idx + 1];
      const boundaryKind = !nextPhase
        ? "done"
        : nextPhase.side && nextPhase.side !== cur?.side
          ? "switch"
          : nextPhase.kind === "hold"
            ? "start"
            : "rest";
      scheduleCue(boundaryKind, base + remainingSec);
    },
    [timeline],
  );

  const finish = useCallback(() => {
    clearTick();
    statusRef.current = "finished";
    setStatus("finished");
    setRemainingSeconds(0);
    void releaseWakeLock();
  }, [clearTick]);

  const tick = useCallback(() => {
    if (statusRef.current !== "running") return;
    const now = performance.now();
    let idx = indexRef.current;
    let steps = 0;
    while (now >= phaseEndAtRef.current) {
      if (idx + 1 >= timeline.length) {
        finish();
        return;
      }
      idx += 1;
      steps += 1;
      phaseEndAtRef.current += timeline[idx].seconds * 1000;
    }
    if (steps > 0) {
      indexRef.current = idx;
      setIndex(idx);
      // >1 step means the tab was frozen and old cues are stale — clear them.
      if (steps > 1) cancelScheduledCues();
      scheduleCurrentPhaseCues(idx, (phaseEndAtRef.current - now) / 1000);
    }
    setRemainingSeconds(Math.max(0, Math.ceil((phaseEndAtRef.current - now) / 1000)));
  }, [timeline, finish, scheduleCurrentPhaseCues]);

  const ensureTick = useCallback(() => {
    if (intervalRef.current === null) {
      intervalRef.current = setInterval(tick, TICK_MS);
    }
  }, [tick]);

  const start = useCallback(() => {
    if (!timeline.length) return;
    unlockAudio();
    void requestWakeLock();
    const now = performance.now();
    indexRef.current = 0;
    setIndex(0);
    phaseEndAtRef.current = now + timeline[0].seconds * 1000;
    statusRef.current = "running";
    setStatus("running");
    playCueNow(timeline[0].kind === "hold" ? "start" : "rest");
    scheduleCurrentPhaseCues(0, timeline[0].seconds);
    setRemainingSeconds(timeline[0].seconds);
    ensureTick();
  }, [timeline, scheduleCurrentPhaseCues, ensureTick]);

  const pause = useCallback(() => {
    if (statusRef.current !== "running") return;
    remainingMsRef.current = Math.max(0, phaseEndAtRef.current - performance.now());
    statusRef.current = "paused";
    setStatus("paused");
    cancelScheduledCues();
    clearTick();
    void releaseWakeLock();
    setRemainingSeconds(Math.max(0, Math.ceil(remainingMsRef.current / 1000)));
  }, [clearTick]);

  const resume = useCallback(() => {
    if (statusRef.current !== "paused") return;
    unlockAudio();
    void requestWakeLock();
    phaseEndAtRef.current = performance.now() + remainingMsRef.current;
    statusRef.current = "running";
    setStatus("running");
    scheduleCurrentPhaseCues(indexRef.current, remainingMsRef.current / 1000);
    ensureTick();
  }, [scheduleCurrentPhaseCues, ensureTick]);

  const skip = useCallback(() => {
    const wasRunning = statusRef.current === "running";
    if (!wasRunning && statusRef.current !== "paused") return;
    cancelScheduledCues();
    const idx = indexRef.current;
    if (idx + 1 >= timeline.length) {
      playCueNow("done");
      finish();
      return;
    }
    const nextIdx = idx + 1;
    indexRef.current = nextIdx;
    setIndex(nextIdx);
    const target = timeline[nextIdx];
    const durSec = target.seconds;
    if (wasRunning) {
      phaseEndAtRef.current = performance.now() + durSec * 1000;
      const isSwitch = target.side && target.side !== timeline[idx]?.side;
      playCueNow(isSwitch ? "switch" : target.kind === "hold" ? "start" : "rest");
      scheduleCurrentPhaseCues(nextIdx, durSec);
    } else {
      remainingMsRef.current = durSec * 1000;
    }
    setRemainingSeconds(durSec);
  }, [timeline, scheduleCurrentPhaseCues, finish]);

  const reset = useCallback(() => {
    cancelScheduledCues();
    clearTick();
    void releaseWakeLock();
    statusRef.current = "idle";
    setStatus("idle");
    indexRef.current = 0;
    setIndex(0);
    remainingMsRef.current = (timeline[0]?.seconds ?? 0) * 1000;
    setRemainingSeconds(timeline[0]?.seconds ?? 0);
  }, [timeline, clearTick]);

  // Resync immediately when returning to the foreground (interval may be throttled).
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [tick]);

  // Clean up timers, audio and wake lock if the component unmounts mid-run.
  useEffect(() => {
    return () => {
      clearTick();
      cancelScheduledCues();
      void releaseWakeLock();
    };
  }, [clearTick]);

  return {
    status,
    timeline,
    index,
    phase: timeline[index] ?? null,
    next: timeline[index + 1] ?? null,
    remainingSeconds,
    totalPhases: timeline.length,
    start,
    pause,
    resume,
    skip,
    reset,
  };
}
