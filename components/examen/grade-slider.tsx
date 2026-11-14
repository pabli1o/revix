"use client";

import clsx from "clsx";
import { formatGradeNumber } from "@/lib/i18n/grade-scale";
import type { GradeScale } from "@/lib/supabase/database.types";
import type { Locale } from "@/lib/i18n/locale";

/**
 * Every grade slider in "Objectif de note" (moyenne actuelle, objectif,
 * note obtenue, objectif de moyenne) shares this one component. The
 * underlying <input type="range"> always operates on the canonical /20
 * domain (0-20, half-point steps — see lib/examen/goal-calc.ts's
 * GRADE_STEP) regardless of display scale, so dragging never loses
 * precision across a scale conversion; only the big number is
 * converted+formatted for display (see lib/i18n/grade-scale.ts).
 * min-h-11 on the input makes the whole row a 44px tap target, not just
 * the visible thumb. No reference markers (10/14/16 or otherwise) — kept
 * to just the big number so the slider stays easy to drag freely.
 */
export function GradeSlider({
  value,
  onChange,
  scale,
  locale,
  min = 0,
  max = 20,
  ariaLabel,
  interactive = true,
}: {
  /** Canonical /20 value. */
  value: number;
  onChange: (value: number) => void;
  scale: GradeScale;
  locale: Locale;
  min?: number;
  max?: number;
  ariaLabel: string;
  /** false for a purely decorative copy of this slider (e.g. the landing
   * page's phone preview): keeps the real styling but removes the input
   * from the tab order and blocks pointer interaction, so it never fires
   * onChange or grabs focus. */
  interactive?: boolean;
}) {
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div aria-hidden={interactive ? undefined : true}>
      <p className="text-center font-heading text-5xl font-bold text-accent" aria-hidden>
        {formatGradeNumber(value, scale, locale)}
      </p>

      <div className="relative mt-6">
        <input
          type="range"
          className={clsx("grade-slider h-11", !interactive && "pointer-events-none")}
          min={min}
          max={max}
          step={0.5}
          value={value}
          onChange={interactive ? (e) => onChange(Number(e.target.value)) : undefined}
          readOnly={!interactive}
          tabIndex={interactive ? undefined : -1}
          aria-label={ariaLabel}
          style={{ "--slider-fill": `${percent}%` } as React.CSSProperties}
        />
      </div>
    </div>
  );
}
