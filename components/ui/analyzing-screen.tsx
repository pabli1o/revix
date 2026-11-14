"use client";

import { useEffect, useState } from "react";

/** Phase 1: a spinner alone at the center for 3-4s, per the spec — long
 * enough to read as real analysis, never so long it feels stuck. */
const SPINNER_PHASE_MS = 3500;
/** Phase 2: the 3 characteristics reveal about a second apart. */
const ITEM_REVEAL_DELAY_MS = 1000;
const ITEM_COUNT = 3;
/** Beat held after the last item appears before calling onDone, so the
 * final item doesn't get cut off the instant it fades in. */
const HOLD_AFTER_LAST_ITEM_MS = 700;

/**
 * The shared "analysis" animation for every "Objectif de note" goal
 * calculation (the exam wizard, the onboarding flow's general estimate,
 * and the landing page's live demo): a spinner alone, then the 3 real
 * inputs the calculation used appearing one by one with a checkmark
 * (never invented filler steps — `items` must be exactly the 3 real
 * ones), then `onDone` fires once so the caller can show the result.
 * Purely presentational/timing — the real computation already happened
 * synchronously before this mounts.
 */
export function AnalyzingScreen({
  spinnerLabel,
  items,
  onDone,
}: {
  /** Shown only during the spinner phase — e.g. "Analyse en cours…". */
  spinnerLabel: string;
  /** Exactly the 3 real inputs the calculation used, in order. */
  items: [string, string, string];
  onDone: () => void;
}) {
  const [phase, setPhase] = useState<"spinner" | "items">("spinner");
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const timers: number[] = [];
    timers.push(window.setTimeout(() => setPhase("items"), SPINNER_PHASE_MS));
    for (let i = 1; i <= ITEM_COUNT; i++) {
      timers.push(window.setTimeout(() => setVisibleCount(i), SPINNER_PHASE_MS + i * ITEM_REVEAL_DELAY_MS));
    }
    timers.push(
      window.setTimeout(onDone, SPINNER_PHASE_MS + ITEM_COUNT * ITEM_REVEAL_DELAY_MS + HOLD_AFTER_LAST_ITEM_MS),
    );
    return () => timers.forEach(clearTimeout);
    // Deliberately mount-once: a fresh AnalyzingScreen instance is
    // exactly one analysis run (callers key/remount it per run).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      {phase === "spinner" ? (
        <div className="flex flex-col items-center gap-4">
          <div className="size-10 animate-spin rounded-full border-4 border-border border-t-accent" aria-hidden />
          <p className="text-sm text-text-muted">{spinnerLabel}</p>
        </div>
      ) : (
        <div className="flex w-full flex-col gap-4">
          {items.map((label, i) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-xl border border-border bg-bg-card px-4 py-3 transition-opacity duration-500"
              style={{ opacity: visibleCount > i ? 1 : 0 }}
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-white">
                <svg viewBox="0 0 24 24" fill="none" className="size-3.5" aria-hidden="true">
                  <path
                    d="M5 13l4 4L19 7"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="text-sm text-text">{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
