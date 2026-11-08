"use client";

import clsx from "clsx";

/**
 * Shared "big card" selection pattern used everywhere the user picks one
 * option among several (classe, niveau, rythme, matière, chapitre,
 * importance, difficulté du quiz) or toggles one in a multi-select list
 * (chapitres d'un examen) — bold title, optional short description, a
 * round check indicator on the right that fills with the accent color
 * when selected. Full-width and stacked by the caller (flex flex-col
 * gap-3) rather than a grid, so it stays easy to tap on mobile.
 *
 * `compact` shrinks padding/typography for a long list (e.g. chapters
 * grouped by subject on the exam form) without changing the visual
 * language — still a bordered card with a round check, just denser.
 */
export function ChoiceCard({
  title,
  description,
  selected = false,
  onClick,
  disabled,
  compact = false,
  className,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={clsx(
        "flex w-full items-start gap-3 rounded-2xl border text-left transition-colors",
        compact ? "px-3 py-2.5" : "px-4 py-4",
        selected ? "border-accent bg-accent/10" : "border-border bg-bg-elevated hover:border-accent/60",
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
    >
      <span className="min-w-0 flex-1">
        <span className={clsx("block font-semibold", compact ? "text-sm" : "font-heading text-base")}>
          {title}
        </span>
        {description && (
          <span className={clsx("mt-0.5 block text-text-muted", compact ? "text-xs" : "text-sm")}>
            {description}
          </span>
        )}
        {children}
      </span>
      <span
        aria-hidden
        className={clsx(
          "mt-0.5 flex shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          compact ? "size-4" : "size-5",
          selected ? "border-accent bg-accent" : "border-border bg-transparent",
        )}
      >
        {selected && (
          <svg viewBox="0 0 24 24" fill="none" className={compact ? "size-2.5" : "size-3"}>
            <path
              d="M5 13l4 4L19 7"
              stroke="#1A1A1A"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
    </button>
  );
}
