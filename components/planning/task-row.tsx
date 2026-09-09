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

/** Turns the task's covered fiche sections into a readable range, e.g.
 * "Réviser le point 2", "Réviser du point 1 au point 3 inclus", or
 * "Réviser les points 1, 2 et 4" when they aren't contiguous. */
function formatRange(parties: PlanningTaskPartie[]): string {
  if (parties.length === 0) return "Réviser tout le chapitre";
  const numeros = [...new Set(parties.map((p) => p.numero))].sort((a, b) => a - b);
  if (numeros.length === 1) return `Réviser le point ${numeros[0]}`;
  const isContiguous = numeros.every((n, i) => i === 0 || n === numeros[i - 1] + 1);
  if (isContiguous) return `Réviser du point ${numeros[0]} au point ${numeros[numeros.length - 1]} inclus`;
  return `Réviser les points ${numeros.slice(0, -1).join(", ")} et ${numeros[numeros.length - 1]}`;
}

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
    <Link
      href={task.href}
      className="flex flex-col gap-3 rounded-xl border border-border bg-bg-card p-4 transition-transform hover:-translate-y-0.5"
      style={{ borderLeftColor: task.color.bg, borderLeftWidth: 4 }}
    >
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          className="size-5 shrink-0 accent-[#E8A33D]"
          checked={completed}
          onClick={(e) => e.stopPropagation()}
          onChange={toggleCompleted}
        />
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
      </div>
      <p className="text-sm text-text-muted">{formatRange(task.parties)}</p>
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1.5 text-sm font-medium text-accent">
        Cliquer ici pour commencer à réviser →
      </span>
    </Link>
  );
}
