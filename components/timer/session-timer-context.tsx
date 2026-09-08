"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "revix:session-timer";

interface PersistedState {
  activeTaskId: string | null;
  /** Accumulated seconds per task while paused (or resting, for the
   * inactive tasks). */
  elapsedByTask: Record<string, number>;
  /** epoch ms the active task started/resumed running at; null if the
   * active task is currently paused. */
  runningSince: number | null;
}

function loadState(): PersistedState {
  if (typeof window === "undefined") {
    return { activeTaskId: null, elapsedByTask: {}, runningSince: null };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { activeTaskId: null, elapsedByTask: {}, runningSince: null };
    const parsed = JSON.parse(raw) as PersistedState;
    return {
      activeTaskId: parsed.activeTaskId ?? null,
      elapsedByTask: parsed.elapsedByTask ?? {},
      runningSince: parsed.runningSince ?? null,
    };
  } catch {
    return { activeTaskId: null, elapsedByTask: {}, runningSince: null };
  }
}

function saveState(state: PersistedState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable (private mode, etc.) — timer just won't persist.
  }
}

interface SessionTimerContextValue {
  /** The task currently running (or paused mid-session), if any. */
  activeTaskId: string | null;
  isRunning: (taskId: string) => boolean;
  /** Live elapsed seconds for a task (updates every second while running). */
  elapsedSeconds: (taskId: string) => number;
  /** Starts (or resumes) the chronometer for this task. Pauses any other
   * task that was running. */
  startTask: (taskId: string) => void;
  /** Pauses the currently active task's chronometer (its time is kept). */
  pauseActive: () => void;
  /** Clears a task's accumulated time (e.g. after marking it complete). */
  resetTask: (taskId: string) => void;
}

const SessionTimerContext = createContext<SessionTimerContextValue | null>(null);

export function SessionTimerProvider({ children }: { children: React.ReactNode }) {
  // Lazy-initialized from localStorage on the client; on the server (first
  // SSR pass of this "use client" component) `loadState` short-circuits to
  // the empty default since `window` isn't defined yet.
  const [state, setState] = useState<PersistedState>(() => loadState());
  // Forces a re-render once per second while a task is running, without
  // storing "now" in state (and re-triggering the persistence effect).
  const [, forceTick] = useState(0);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    if (state.runningSince === null) return;
    const id = window.setInterval(() => forceTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [state.runningSince]);

  const startTask = useCallback((taskId: string) => {
    setState((prev) => {
      const elapsedByTask = { ...prev.elapsedByTask };
      // Pause whatever was running before switching tasks.
      if (prev.activeTaskId && prev.runningSince !== null) {
        const ranFor = Math.floor((Date.now() - prev.runningSince) / 1000);
        elapsedByTask[prev.activeTaskId] = (elapsedByTask[prev.activeTaskId] ?? 0) + ranFor;
      }
      return { activeTaskId: taskId, elapsedByTask, runningSince: Date.now() };
    });
  }, []);

  const pauseActive = useCallback(() => {
    setState((prev) => {
      if (!prev.activeTaskId || prev.runningSince === null) return prev;
      const ranFor = Math.floor((Date.now() - prev.runningSince) / 1000);
      const elapsedByTask = {
        ...prev.elapsedByTask,
        [prev.activeTaskId]: (prev.elapsedByTask[prev.activeTaskId] ?? 0) + ranFor,
      };
      return { ...prev, elapsedByTask, runningSince: null };
    });
  }, []);

  const resetTask = useCallback((taskId: string) => {
    setState((prev) => {
      const elapsedByTask = { ...prev.elapsedByTask };
      delete elapsedByTask[taskId];
      const isActive = prev.activeTaskId === taskId;
      return {
        activeTaskId: isActive ? null : prev.activeTaskId,
        elapsedByTask,
        runningSince: isActive ? null : prev.runningSince,
      };
    });
  }, []);

  const isRunning = useCallback(
    (taskId: string) => state.activeTaskId === taskId && state.runningSince !== null,
    [state.activeTaskId, state.runningSince],
  );

  const elapsedSeconds = useCallback(
    (taskId: string) => {
      const base = state.elapsedByTask[taskId] ?? 0;
      if (state.activeTaskId === taskId && state.runningSince !== null) {
        return base + Math.floor((Date.now() - state.runningSince) / 1000);
      }
      return base;
    },
    [state.activeTaskId, state.elapsedByTask, state.runningSince],
  );

  const value = useMemo<SessionTimerContextValue>(
    () => ({ activeTaskId: state.activeTaskId, isRunning, elapsedSeconds, startTask, pauseActive, resetTask }),
    [state.activeTaskId, isRunning, elapsedSeconds, startTask, pauseActive, resetTask],
  );

  return <SessionTimerContext.Provider value={value}>{children}</SessionTimerContext.Provider>;
}

export function useSessionTimer(): SessionTimerContextValue {
  const ctx = useContext(SessionTimerContext);
  if (!ctx) {
    throw new Error("useSessionTimer must be used within a SessionTimerProvider");
  }
  return ctx;
}

export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
