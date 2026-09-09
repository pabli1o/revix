"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSessionTimer, formatDuration } from "@/components/timer/session-timer-context";

/**
 * Shown only when arriving from the planning flow (?planningTask=<id> in
 * the URL, set exclusively by the link built in app/(app)/planning/page.tsx)
 * — per spec, the session timer must never appear during normal
 * navigation, only within the planning flow.
 */
export function PlanningTaskTimerBar() {
  const searchParams = useSearchParams();
  const taskId = searchParams.get("planningTask");
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

  return (
    <div className="sticky top-2 z-20 mb-4 flex items-center justify-between gap-3 rounded-xl border border-accent/50 bg-bg-card p-3 shadow-lg">
      <Link href="/planning" className="text-sm text-text-muted hover:text-accent">
        ← Retour au planning
      </Link>
      <div className="flex items-center gap-3">
        <span className="font-mono text-xl tabular-nums">{formatDuration(elapsedSeconds(taskId))}</span>
        <button
          type="button"
          onClick={() => (running ? pauseActive() : startTask(taskId))}
          className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-[#191A2E] transition-transform active:scale-[0.96]"
        >
          {running ? "⏸ Pause" : "▶ Démarrer le chrono"}
        </button>
      </div>
    </div>
  );
}
