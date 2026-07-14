/**
 * Screen Wake Lock helper.
 *
 * The Wake Lock is automatically released by the browser whenever the tab is
 * backgrounded (or the device is locked). So keeping the screen awake across a
 * whole workout requires RE-acquiring it on `visibilitychange` when the page
 * returns to the foreground. This helper manages that lifecycle.
 */

type WakeLockSentinelLike = { release: () => Promise<void>; released: boolean };

let sentinel: WakeLockSentinelLike | null = null;
let wanted = false; // whether we currently want the lock held
let listenerAttached = false;

function isSupported(): boolean {
  return typeof navigator !== "undefined" && "wakeLock" in navigator;
}

async function acquire(): Promise<void> {
  if (!wanted || !isSupported() || sentinel) return;
  try {
    const wl = (navigator as Navigator & {
      wakeLock: { request: (t: "screen") => Promise<WakeLockSentinelLike> };
    }).wakeLock;
    sentinel = await wl.request("screen");
    sentinel &&
      (sentinel as unknown as { addEventListener?: (e: string, cb: () => void) => void })
        .addEventListener?.("release", () => {
        sentinel = null;
      });
  } catch {
    // Denied or unsupported context — silently continue without wake lock.
    sentinel = null;
  }
}

function onVisibilityChange(): void {
  if (document.visibilityState === "visible") void acquire();
}

/** Begin keeping the screen awake; re-acquires automatically after backgrounding. */
export async function requestWakeLock(): Promise<void> {
  wanted = true;
  if (!listenerAttached) {
    document.addEventListener("visibilitychange", onVisibilityChange);
    listenerAttached = true;
  }
  await acquire();
}

/** Stop keeping the screen awake and release any held lock. */
export async function releaseWakeLock(): Promise<void> {
  wanted = false;
  if (listenerAttached) {
    document.removeEventListener("visibilitychange", onVisibilityChange);
    listenerAttached = false;
  }
  if (sentinel && !sentinel.released) {
    try {
      await sentinel.release();
    } catch {
      // ignore
    }
  }
  sentinel = null;
}
