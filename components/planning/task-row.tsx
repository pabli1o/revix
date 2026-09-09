"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
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
  /** Where clicking this task leads — the chapter's one fiche directly, or
   * its fiche list if it has several — with ?planningTask=<id> appended so
   * that screen shows the session timer for this task (see
   * components/fiches/planning-task-timer-bar.tsx). Computed server-side
   * in app/(app)/planning/page.tsx. */
  href: string;
}

const TYPE_LABEL: Record<PlanningTaskType, string> = {
  decouverte: "Apprends",
  rappel: "Relis",
};

export function TaskRow({ task }: { task: PlanningTaskView }) {
  const router = useRouter();
  const [completed, setCompleted] = useState(task.completed);

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
      className="relative flex items-center gap-3 rounded-xl border border-border bg-bg-card p-4 transition-transform hover:-translate-y-0.5"
      style={{ borderLeftColor: task.color.bg, borderLeftWidth: 4 }}
    >
      <input
        type="checkbox"
        className="relative z-10 size-5 accent-[#E8A33D]"
        checked={completed}
        onChange={toggleCompleted}
      />
      <Link href={task.href} className="absolute inset-0" aria-label={`${task.subjectNom} · ${task.chapterNom}`} />
      <span
        className={clsx(
          "relative z-10 rounded-md px-2 py-0.5 font-mono text-xs font-semibold uppercase",
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
      <span className={clsx("relative z-10 flex-1", completed && "text-text-muted line-through")}>
        {task.subjectNom} · {task.chapterNom}
      </span>
      <span className="relative z-10 font-mono text-xs text-text-muted">{task.dureeMinutes} min</span>
    </div>
  );
}
