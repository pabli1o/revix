"use client";

import { useEffect } from "react";
import Link from "next/link";
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
 */
export function PlanningTaskTimerBar() {
  const searchParams = useSearchParams();
  const taskId = searchParams.get("planningTask");
  const plannedMinutes = Number(searchParams.get("duree"));
  const plannedSeconds = Number.isFinite(plannedMinutes) && plannedMinutes > 0 ? plannedMinutes * 60 : null;
  const { startTask, pauseActive, elapsedSeconds, isRunning, activeTaskId } = useSessionTimer();

  // Pause (never fully stop) if this screen is left without an explicit
  // pause click — mirrors the planning list's own row-collapse behavior.
  useEffect(() => {
    return () => {
      if (taskId && activeTaskId === taskId) pauseActive();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  if (!taskId) return null;

  const running = isRunning(taskId);
  const elapsed = elapsedSeconds(taskId);
  const isOvertime = plannedSeconds !== null && elapsed >= plannedSeconds;
  const displaySeconds = plannedSeconds === null ? elapsed : isOvertime ? elapsed - plannedSeconds : plannedSeconds - elapsed;
  const progress = plannedSeconds !== null ? Math.min(elapsed / plannedSeconds, 1) : 0;

  return (
    <div className="sticky top-2 z-20 mb-4 overflow-hidden rounded-2xl border border-accent/40 bg-bg-card shadow-xl">
      <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-2">
        <Link href="/planning" className="text-sm text-text-muted transition-colors hover:text-accent">
          ← Retour au planning
        </Link>
        <span
          className={clsx(
            "font-mono text-[11px] uppercase tracking-wide",
            isOvertime ? "text-danger" : "text-text-muted",
          )}
        >
          {plannedSeconds === null ? "Temps écoulé" : isOvertime ? "Temps prévu dépassé" : "Temps restant"}
        </span>
      </div>

      <div className="flex flex-col items-center gap-4 px-6 py-6">
        <span
          className={clsx(
            "font-mono text-5xl font-bold tabular-nums tracking-tight transition-colors",
            isOvertime ? "text-danger" : "text-accent",
          )}
        >
          {isOvertime && "+"}
          {formatDuration(displaySeconds)}
        </span>

        {plannedSeconds !== null && (
          <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-border/50">
            <div
              className={clsx(
                "h-full rounded-full transition-[width] duration-1000 ease-linear",
                isOvertime ? "bg-danger" : "bg-accent",
              )}
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        )}

        <button
          type="button"
          onClick={() => (running ? pauseActive() : startTask(taskId))}
          aria-label={running ? "Mettre en pause" : "Démarrer le chrono"}
          className={clsx(
            "flex h-14 w-14 items-center justify-center rounded-full text-xl shadow-lg transition-transform active:scale-90",
            running
              ? "border-2 border-accent bg-bg-elevated text-accent"
              : "bg-accent text-[#191A2E] hover:bg-accent-strong",
          )}
        >
          {running ? "⏸" : "▶"}
        </button>
      </div>
    </div>
  );
}
