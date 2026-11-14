"use client";

import { formatGradeNumber } from "@/lib/i18n/grade-scale";
import type { GradeScale } from "@/lib/supabase/database.types";
import type { Locale } from "@/lib/i18n/locale";

/**
 * Every grade slider in "Objectif de note" (moyenne actuelle, objectif,
 * note obtenue, objectif de moyenne) shares this one component. The
 * underlying <input type="range"> always operates on the canonical /20
 * domain (0-20, half-point steps — see lib/examen/goal-calc.ts's
 * GRADE_STEP) regardless of display scale, so dragging never loses
 * precision across a scale conversion; only the big number and the
 * markers are converted+formatted for display (see
 * lib/i18n/grade-scale.ts). min-h-11 on the input makes the whole row a
 * 44px tap target, not just the visible thumb.
 */
export function GradeSlider({
  value,
  onChange,
  scale,
  locale,
  markers = [],
  min = 0,
  max = 20,
  ariaLabel,
}: {
  /** Canonical /20 value. */
  value: number;
  onChange: (value: number) => void;
  scale: GradeScale;
  locale: Locale;
  /** Canonical /20 positions to show a tick + label under, e.g. [10, 14, 16]. */
  markers?: number[];
  min?: number;
  max?: number;
  ariaLabel: string;
}) {
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div>
      <p className="text-center font-heading text-5xl font-bold text-accent" aria-hidden>
        {formatGradeNumber(value, scale, locale)}
      </p>

      <div className="relative mt-6">
        <input
          type="range"
          className="grade-slider h-11"
          min={min}
          max={max}
          step={0.5}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={ariaLabel}
          style={{ "--slider-fill": `${percent}%` } as React.CSSProperties}
        />

        {markers.length > 0 && (
          <div className="relative mt-1 h-5">
            {markers.map((m) => (
              <span
                key={m}
                className="absolute top-0 flex -translate-x-1/2 flex-col items-center text-[11px] font-medium text-text-muted"
                style={{ left: `${((m - min) / (max - min)) * 100}%` }}
              >
                <span aria-hidden className="mb-0.5 h-1.5 w-px bg-border" />
                {formatGradeNumber(m, scale, locale)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
