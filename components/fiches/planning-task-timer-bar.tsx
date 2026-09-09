"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import { useSessionTimer, formatDuration } from "@/components/timer/session-timer-context";

/**
 * Shown only when arriving from the planning flow (?planningTask=<id> in
 * the URL, set exclusively by the link built in app/(app)/planning/page.tsx)
 * — per spec, the session timer must never appear during normal
 * navigation, only within the planning flow. The planned duration for the
 * task (?duree=<minutes>, also set by that same link) turns this into a
 * countdown instead of a plain stopwatch: it starts at the planned time and
 * counts down to 0, then flips into a "+MM:SS" overtime display.
 *
 * Rendered as a small floating pill (bottom-right), not a full-width bar,
 * so it never gets in the way of the fiche/chapter content underneath.
 */
export function PlanningTaskTimerBar() {
  const searchParams = useSearchParams();
  const taskId = searchParams.get("planningTask");
  const plannedMinutes = Number(searchParams.get("duree"));
  const plannedSeconds = Number.isFinite(plannedMinutes) && plannedMinutes > 0 ? plannedMinutes * 60 : null;
  const { startTask, pauseActive, elapsedSeconds, isRunning, activeTaskId } = useSessionTimer();

  // Kept in a ref (rather than read directly in the effect below) so the
  // unmount cleanup always sees the LATEST activeTaskId. The effect itself
  // only re-runs when `taskId` changes (i.e. essentially never, for the
  // lifetime of this component), so without the ref its cleanup closure
  // would keep whatever `activeTaskId` was at mount time — typically still
  // `null`, since the timer is usually started by a click *after* mount.
  // That stale value meant leaving the page after starting the chrono never
  // actually paused it, so time kept accumulating in the background and the
  // task didn't resume from where it was really left off.
  const activeTaskIdRef = useRef(activeTaskId);
  useEffect(() => {
    activeTaskIdRef.current = activeTaskId;
  }, [activeTaskId]);

  useEffect(() => {
    return () => {
      if (taskId && activeTaskIdRef.current === taskId) pauseActive();
    };
  }, [taskId, pauseActive]);

  if (!taskId) return null;

  const running = isRunning(taskId);
  const elapsed = elapsedSeconds(taskId);
  const isOvertime = plannedSeconds !== null && elapsed >= plannedSeconds;
  const displaySeconds = plannedSeconds === null ? elapsed : isOvertime ? elapsed - plannedSeconds : plannedSeconds - elapsed;

  return (
    <div className="fixed bottom-5 right-5 z-30 flex items-center gap-2.5 rounded-full border border-accent/50 bg-bg-card py-1.5 pl-1.5 pr-4 shadow-xl">
      <button
        type="button"
        onClick={() => (running ? pauseActive() : startTask(taskId))}
        aria-label={running ? "Mettre en pause" : "Démarrer le chrono"}
        className={clsx(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base transition-transform active:scale-90",
          running
            ? "border-2 border-accent bg-bg-elevated text-accent"
            : "bg-accent text-[#191A2E] hover:bg-accent-strong",
        )}
      >
        {running ? "⏸" : "▶"}
      </button>
      <div className="flex flex-col leading-tight">
        <span
          className={clsx(
            "font-mono text-sm font-semibold tabular-nums",
            isOvertime ? "text-danger" : "text-text",
          )}
        >
          {isOvertime && "+"}
          {formatDuration(displaySeconds)}
        </span>
        <span
          className={clsx(
            "text-[10px] uppercase tracking-wide",
            isOvertime ? "text-danger" : "text-text-muted",
          )}
        >
          {plannedSeconds === null ? "Écoulé" : isOvertime ? "Dépassé" : "Restant"}
        </span>
      </div>
    </div>
  );
}
