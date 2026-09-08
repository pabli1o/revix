"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { useSessionTimer, formatDuration } from "@/components/timer/session-timer-context";
import type { PlanningTaskPartie, PlanningTaskType } from "@/lib/supabase/database.types";
import type { SubjectColor } from "@/lib/theme/subject-colors";

export interface PlanningTaskView {
  id: string;
  type: PlanningTaskType;
  chapterNom: string;
  subjectNom: string;
  color: SubjectColor;
  parties: PlanningTaskPartie[];
  dureeMinutes: number;
  completed: boolean;
}

const TYPE_LABEL: Record<PlanningTaskType, string> = {
  decouverte: "Apprends",
  rappel: "Relis",
};

export function TaskRow({ task }: { task: PlanningTaskView }) {
  const router = useRouter();
  const { startTask, pauseActive, elapsedSeconds, isRunning } = useSessionTimer();
  const [expanded, setExpanded] = useState(false);
  const [completed, setCompleted] = useState(task.completed);
  const [, forceTick] = useState(0);

  useEffect(() => {
    if (!expanded) return;
    const id = window.setInterval(() => forceTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [expanded]);

  // Pause the chronometer whenever this row leaves the "expanded" (focused)
  // state — including when the whole planning page unmounts (navigation
  // away), so the timer is only ever ticking while this exact task is the
  // one on screen.
  useEffect(() => {
    return () => {
      if (expanded) pauseActive();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleExpand() {
    if (expanded) {
      pauseActive();
      setExpanded(false);
    } else {
      setExpanded(true);
      startTask(task.id);
    }
  }

  async function toggleCompleted() {
    const next = !completed;
    setCompleted(next);
    await fetch("/api/planning/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId: task.id, completed: next }),
    });
    router.refresh();
  }

  return (
    <div
      className="rounded-xl border border-border bg-bg-card p-4"
      style={{ borderLeftColor: task.color.bg, borderLeftWidth: 4 }}
    >
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          className="size-5 accent-[#E8A33D]"
          checked={completed}
          onChange={toggleCompleted}
        />
        <button type="button" onClick={toggleExpand} className="flex flex-1 items-center gap-3 text-left">
          <span
            className={clsx(
              "rounded-md px-2 py-0.5 font-mono text-xs font-semibold uppercase",
              task.type === "decouverte" && "bg-accent text-[#191A2E]",
            )}
            style={
              task.type === "rappel"
                ? { backgroundColor: `${task.color.bg}33`, color: task.color.bg }
                : undefined
            }
          >
            {TYPE_LABEL[task.type]}
          </span>
          <span className={clsx("flex-1", completed && "text-text-muted line-through")}>
            {task.subjectNom} · {task.chapterNom}
          </span>
          <span className="font-mono text-xs text-text-muted">{task.dureeMinutes} min</span>
        </button>
      </div>

      {expanded && (
        <div className="mt-4 border-t border-border pt-4">
          <ul className="mb-4 flex flex-col gap-1 text-sm text-text-muted">
            {task.parties.map((p) => (
              <li key={p.numero}>• {p.titre}</li>
            ))}
          </ul>
          <div className="flex items-center justify-between rounded-lg bg-bg-elevated px-4 py-3">
            <span className="font-mono text-2xl tabular-nums">
              {formatDuration(elapsedSeconds(task.id))}
            </span>
            <span className="text-xs text-text-muted">
              {isRunning(task.id) ? "En cours…" : "En pause"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
