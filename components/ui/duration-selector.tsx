"use client";

import clsx from "clsx";

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h${rest}`;
}

export function DurationSelector({
  value,
  onChange,
  className,
}: {
  value: number;
  onChange: (minutes: number) => void;
  className?: string;
}) {
  return (
    <div className={clsx("flex flex-wrap gap-2", className)}>
      {DURATION_OPTIONS.map((minutes) => (
        <button
          key={minutes}
          type="button"
          onClick={() => onChange(minutes)}
          className={clsx(
            "rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-150 active:scale-[0.94]",
            value === minutes
              ? "border-accent bg-accent text-[#191A2E]"
              : "border-border bg-bg-elevated text-text hover:border-accent active:bg-bg-card",
          )}
        >
          {formatDuration(minutes)}
        </button>
      ))}
    </div>
  );
}
