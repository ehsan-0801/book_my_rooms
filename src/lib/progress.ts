/**
 * Tiny store for the navigation/activity bar under the navbar.
 *
 * Kept outside React so both route changes and server-action submissions can
 * drive the same bar, and so `useSyncExternalStore` can read it without an
 * effect. Reference-counted, because a route change and an action can overlap.
 */
type Listener = () => void;

let active = 0;
let value = 0;
const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l();
}

function set(next: number) {
  value = next;
  emit();
}

let creepTimer: ReturnType<typeof setInterval> | null = null;
let doneTimer: ReturnType<typeof setTimeout> | null = null;

function creep() {
  if (creepTimer) return;
  creepTimer = setInterval(() => {
    // Ease toward 90% and wait there — the bar must never imply completion
    // before the work actually finishes.
    if (value < 90) set(value + Math.max(0.5, (90 - value) * 0.08));
  }, 200);
}

function stopCreep() {
  if (creepTimer) {
    clearInterval(creepTimer);
    creepTimer = null;
  }
}

export const progress = {
  start() {
    if (doneTimer) {
      clearTimeout(doneTimer);
      doneTimer = null;
    }
    active += 1;
    if (active === 1) {
      set(8);
      creep();
    }
  },

  done() {
    if (active === 0) return;
    active -= 1;
    if (active > 0) return;

    stopCreep();
    set(100);
    // Hold the full bar briefly so the completion is visible, then reset.
    doneTimer = setTimeout(() => {
      set(0);
      doneTimer = null;
    }, 260);
  },

  /** Drops everything — used when a route change lands. */
  reset() {
    active = 0;
    stopCreep();
    set(100);
    if (doneTimer) clearTimeout(doneTimer);
    doneTimer = setTimeout(() => {
      set(0);
      doneTimer = null;
    }, 260);
  },

  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  get() {
    return value;
  },
};
