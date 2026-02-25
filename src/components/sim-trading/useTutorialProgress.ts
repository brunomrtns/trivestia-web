import { useCallback, useMemo, useSyncExternalStore } from 'react';

// ─── Storage key ──────────────────────────────────────────────────────────────

const STORAGE_KEY = 'trivestia:sim-tutorial';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TutorialState {
  completed: boolean;
  currentStep: number;
  dismissed: boolean;
}

const DEFAULT_STATE: TutorialState = {
  completed: false,
  currentStep: 0,
  dismissed: false
};

// ─── External store for cross-component reactivity ────────────────────────────

let listeners: Array<() => void> = [];
let cachedRaw: string | null = null;
let cachedState: TutorialState = DEFAULT_STATE;

function emitChange() {
  // bust the cache so next getSnapshot returns fresh object
  cachedRaw = null;
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getSnapshot(): TutorialState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    // Return the cached object when the serialised value hasn't changed.
    // useSyncExternalStore compares by reference (===), so returning a
    // new object every time causes an infinite re-render loop.
    if (raw === cachedRaw) return cachedState;
    cachedRaw = raw;
    cachedState = raw ? (JSON.parse(raw) as TutorialState) : DEFAULT_STATE;
    return cachedState;
  } catch {
    return DEFAULT_STATE;
  }
}

function setState(next: Partial<TutorialState>) {
  const current = getSnapshot();
  const updated = { ...current, ...next };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  emitChange();
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTutorialProgress() {
  const state = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => DEFAULT_STATE
  );

  const setStep = useCallback((step: number) => {
    setState({ currentStep: step });
  }, []);

  const nextStep = useCallback(() => {
    const current = getSnapshot();
    setState({ currentStep: current.currentStep + 1 });
  }, []);

  const complete = useCallback(() => {
    setState({ completed: true, dismissed: true });
  }, []);

  const dismiss = useCallback(() => {
    setState({ dismissed: true });
  }, []);

  const restart = useCallback(() => {
    setState({ completed: false, currentStep: 0, dismissed: false });
  }, []);

  return useMemo(
    () => ({
      ...state,
      setStep,
      nextStep,
      complete,
      dismiss,
      restart
    }),
    [state, setStep, nextStep, complete, dismiss, restart]
  );
}
