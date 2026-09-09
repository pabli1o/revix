"use client";

import clsx from "clsx";

const DAYS = [1, 2, 3, 4, 5, 6, 7];

export function DaysPerWeekSelector({
  value,
  onChange,
  className,
}: {
  value: number;
  onChange: (days: number) => void;
  className?: string;
}) {
  return (
    <div className={clsx("flex flex-wrap gap-2", className)}>
      {DAYS.map((days) => (
        <button
          key={days}
          type="button"
          onClick={() => onChange(days)}
          className={clsx(
            "size-10 rounded-lg border text-sm font-medium transition-all duration-150 active:scale-[0.94]",
            value === days
              ? "border-accent bg-accent text-[#191A2E]"
              : "border-border bg-bg-elevated text-text hover:border-accent active:bg-bg-card",
          )}
        >
          {days}
        </button>
      ))}
    </div>
  );
}
