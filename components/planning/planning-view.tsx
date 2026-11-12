"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { IconRefresh } from "@/components/ui/icons";
import { TaskRow, type PlanningTaskView } from "./task-row";
import { useLocale } from "@/components/i18n/locale-provider";

export interface DayTasks {
  date: string;
  label: string;
  tasks: PlanningTaskView[];
}

export function PlanningView({
  days,
  hasAnyTasks,
}: {
  days: DayTasks[];
  hasAnyTasks: boolean;
}) {
  const router = useRouter();
  const { t } = useLocale();
  const [generating, setGenerating] = useState(false);

  async function regenerate() {
    setGenerating(true);
    await fetch("/api/planning/generate", { method: "POST" });
    setGenerating(false);
    router.refresh();
  }

  if (!hasAnyTasks) {
    return <EmptyState>{t.planning.emptyState}</EmptyState>;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-end">
        <Button size="sm" variant="secondary" onClick={regenerate} disabled={generating}>
          {generating ? (
            t.planning.regenerating
          ) : (
            <>
              <IconRefresh className="mr-1.5 inline-block size-4 -translate-y-px align-middle" />
              {t.planning.regenerate}
            </>
          )}
        </Button>
      </div>

      <div className="flex flex-col gap-6">
        {days.map((day) => (
          <div key={day.date}>
            <h3 className="mb-2 font-mono text-sm uppercase tracking-wide text-text-muted">
              {day.label}
            </h3>
            <div className="flex flex-col gap-2">
              {day.tasks.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
