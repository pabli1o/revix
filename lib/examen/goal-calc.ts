import type { Importance } from "@/lib/supabase/database.types";

/**
 * Pure, framework-free "how much should I revise to hit my goal" estimate
 * for one exam — the entire "Objectif de note" feature's math lives here,
 * nowhere else. No Supabase, no fetch, no React: every input is a plain
 * number/string passed in by the caller (see
 * components/examen/goal-wizard.tsx and app/api/exams/route.ts), which is
 * what makes this directly unit-testable (see goal-calc.test.ts).
 *
 * Always an ESTIMATE, never a promise — every UI string built from this
 * result must say so (see lib/i18n/dictionaries/*\/examen.ts's goalResult
 * keys), and this module itself never phrases anything as a guarantee.
 *
 * All grades/averages here are on the canonical /20 scale (see
 * lib/i18n/grade-scale.ts) — this module never does scale conversion
 * itself, only /20 arithmetic.
 */

// ---------------------------------------------------------------------------
// Tunable constants — change these, not the formulas below, to retune the
// estimate. Each one documents what it controls and why this value.
// ---------------------------------------------------------------------------

/** Minutes of focused review a single fiche needs for one solid first pass
 * — roughly matches the planning scheduler's own "decouverte" pass
 * duration (lib/planning/scheduler.ts's estimateDuration: ~15min base +
 * 5min per section) plus room for the "rappel" passes a real goal push
 * needs beyond a single read-through. This is the content-base unit the
 * whole estimate scales from. */
export const MINUTES_PER_FICHE_BASE = 45;

/** Used when the subject has no fiches yet, so the real content base can't
 * be measured — a plausible subject's worth of material (e.g. 4-5
 * chapters' first fiches) to estimate against instead of defaulting to
 * zero hours for a subject that in practice still needs real work. */
export const DEFAULT_FICHE_COUNT_FALLBACK = 6;

/** Convexity exponent applied to the grade gap (objectif - moyenne
 * actuelle): each additional point costs progressively more effort than
 * the last, so this must be > 1. 1.6 makes an 8-point push (say 8 -> 16)
 * cost noticeably more than twice a 4-point push (12 -> 16), which
 * matches how revision actually gets harder near the top rather than
 * scaling in a straight line. */
export const GAP_CONVEXITY_EXPONENT = 1.6;

/** Scales (gap ^ exponent) down to a believable hours multiplier — the
 * one knob to turn if every estimate in the app feels globally too high
 * or too low, without changing the shape of the curve. Tuned so a
 * middling 4-point gap (e.g. 10 -> 14) over a 6-fiche subject lands
 * around 7-8 total hours — a few weeks of modest, sustainable sessions,
 * not a cram. */
export const GAP_FACTOR_SCALE = 0.35;

/** Floor under the gap factor so even a goal only marginally above (or at
 * or below) the current average still implies some real revision time,
 * never literally zero. Also what "maintenance" mode (goal <= average)
 * uses directly, since there's no positive gap to raise to a power. */
export const MIN_GAP_FACTOR = 0.4;

/** Revision days/week used when the caller doesn't have a real value from
 * the student's profile yet (profiles.revision_jours_semaine is NOT NULL
 * with its own DB default of 4 in practice, so this is a defensive
 * fallback, not the normal path). */
export const DEFAULT_REVISION_JOURS_SEMAINE = 5;

/** Above this many hours/day, the plan reads as unsustainable rather than
 * a real study rhythm — triggers the "excessive load" case (which also
 * naturally covers a too-close exam date: compressing the same total
 * hours into fewer weeks drives hours/day up past this same threshold,
 * so there's no separate "exam is too soon" check). Picked as the
 * midpoint of the spec's "3 to 4h/day" range. */
export const MAX_REASONABLE_HOURS_PER_DAY = 3.5;

/** However close the exam, never divide the total hours by less than one
 * week of runway — avoids an absurd "47h this week" readout for an exam
 * that's tomorrow; the excessive-load case (above) is what actually
 * communicates that crunch to the student. */
export const MIN_WEEKS_BEFORE_EXAM = 1;

/** objectif >= this is flagged "très ambitieux" (still encouraging, with
 * an intermediate milestone offered) rather than treated as an ordinary
 * goal. */
export const AMBITIOUS_GOAL_THRESHOLD = 18;

/** How far below a "très ambitieux" goal the suggested intermediate
 * milestone sits (e.g. aiming for 19 first suggests 17 as a checkpoint). */
export const AMBITIOUS_INTERMEDIATE_STEP = 2;

/** Grades are entered/stored in half-point steps throughout the feature
 * (sliders included) — every suggested goal this module proposes is
 * rounded to the same grid so it's always a value the slider can land on
 * exactly. */
export const GRADE_STEP = 0.5;

// ---------------------------------------------------------------------------

export type GoalCalcKind = "already-there" | "very-ambitious" | "excessive-load" | "normal";

export interface GoalCalcInput {
  /** The student's current average in this subject, /20. */
  currentAverage20: number;
  /** The grade they're aiming for, /20. */
  goal20: number;
  /** Number of (non-deleted) fiches in the subject this exam covers. */
  ficheCount: number;
  /** Calendar days from today to the exam date — may be fractional if
   * callers pass sub-day precision, but is normally a whole number. */
  daysUntilExam: number;
  /** The student's revision_jours_semaine (1-7). */
  revisionJoursSemaine: number;
}

export interface GoalCalcResult {
  kind: GoalCalcKind;
  /** Total estimated hours between now and the exam. */
  totalHours: number;
  hoursPerWeek: number;
  minutesPerDay: number;
  /** goal20 - currentAverage20 (can be <= 0 for "already-there"). */
  gap: number;
  /** A more realistic goal to offer instead, only set for "excessive-load"
   * (the highest goal that fits under MAX_REASONABLE_HOURS_PER_DAY) or
   * "very-ambitious" (an intermediate milestone below the stated goal). */
  suggestedGoal20?: number;
}

function roundToGradeStep(value: number): number {
  return Math.round(value / GRADE_STEP) * GRADE_STEP;
}

function clampGrade(value: number): number {
  return Math.min(20, Math.max(0, value));
}

/** Hours of revision time the subject's content alone represents, before
 * the gap factor scales it to the specific goal being chased. */
export function computeContentBaseHours(ficheCount: number): number {
  const effectiveCount = ficheCount > 0 ? ficheCount : DEFAULT_FICHE_COUNT_FALLBACK;
  return (effectiveCount * MINUTES_PER_FICHE_BASE) / 60;
}

/** The convex multiplier applied to the content base for a given grade
 * gap — never below MIN_GAP_FACTOR, grows faster than linear above it. */
export function computeGapFactor(gap: number): number {
  if (gap <= 0) return MIN_GAP_FACTOR;
  const raw = GAP_FACTOR_SCALE * Math.pow(gap, GAP_CONVEXITY_EXPONENT);
  return Math.max(MIN_GAP_FACTOR, raw);
}

/** Inverts computeGapFactor to find the gap that lands on a target hours
 * figure — used only to propose a more realistic goal in the
 * excessive-load case. Assumes the target is above MIN_GAP_FACTOR's own
 * floor (true whenever this is actually called, since it's only reached
 * once the load is already over the threshold). */
function gapForTargetFactor(targetFactor: number): number {
  return Math.pow(targetFactor / GAP_FACTOR_SCALE, 1 / GAP_CONVEXITY_EXPONENT);
}

export function computeStudyPlan(input: GoalCalcInput): GoalCalcResult {
  const currentAverage20 = clampGrade(input.currentAverage20);
  const goal20 = clampGrade(input.goal20);
  const gap = goal20 - currentAverage20;

  const contentBaseHours = computeContentBaseHours(input.ficheCount);
  const gapFactor = computeGapFactor(gap);
  const totalHours = contentBaseHours * gapFactor;

  const weeks = Math.max(MIN_WEEKS_BEFORE_EXAM, input.daysUntilExam / 7);
  const hoursPerWeek = totalHours / weeks;
  const daysPerWeek =
    input.revisionJoursSemaine > 0 ? input.revisionJoursSemaine : DEFAULT_REVISION_JOURS_SEMAINE;
  const minutesPerDay = (hoursPerWeek * 60) / daysPerWeek;

  const base: GoalCalcResult = { kind: "normal", totalHours, hoursPerWeek, minutesPerDay, gap };

  if (gap <= 0) {
    return { ...base, kind: "already-there" };
  }

  if (minutesPerDay / 60 > MAX_REASONABLE_HOURS_PER_DAY) {
    // Find the gap (and so the goal) that fits the reasonable-load
    // ceiling under this same exam date and rhythm, then re-derive hours
    // from it so the displayed numbers for the *suggested* goal are
    // internally consistent (not just the original, over-budget ones).
    const targetMinutesPerDay = MAX_REASONABLE_HOURS_PER_DAY * 60;
    const targetHoursPerWeek = (targetMinutesPerDay * daysPerWeek) / 60;
    const targetTotalHours = targetHoursPerWeek * weeks;
    const targetGapFactor = Math.max(MIN_GAP_FACTOR, targetTotalHours / contentBaseHours);
    const suggestedGap = gapForTargetFactor(targetGapFactor);
    const suggestedGoal20 = roundToGradeStep(clampGrade(currentAverage20 + suggestedGap));

    return {
      kind: "excessive-load",
      totalHours,
      hoursPerWeek,
      minutesPerDay,
      gap,
      suggestedGoal20: Math.min(suggestedGoal20, goal20 - GRADE_STEP),
    };
  }

  if (goal20 >= AMBITIOUS_GOAL_THRESHOLD) {
    const suggestedGoal20 = roundToGradeStep(clampGrade(goal20 - AMBITIOUS_INTERMEDIATE_STEP));
    return { ...base, kind: "very-ambitious", suggestedGoal20 };
  }

  return base;
}

/** The "Objectif de note" wizard asks for a coefficient, not the old
 * ExamForm's direct "importance" pick — but lib/planning/scheduler.ts
 * still weighs/prioritizes exams by Importance, and isn't being rewritten
 * (see this module's own doc comment). This derives one from the other so
 * an exam weighted more heavily in the final grade also gets
 * proportionally more rappel passes/scheduling priority, unchanged from
 * how the scheduler already treats a manually-picked "très importante"
 * exam today. */
export function importanceFromCoefficient(coefficient: number): Importance {
  if (coefficient >= 3) return "tres_importante";
  if (coefficient === 2) return "importante";
  return "normale";
}

/** Calendar days between two ISO (yyyy-mm-dd) dates, "today" first —
 * negative if `examDateIso` is in the past. Whole calendar days, not
 * study days, since the result is only used for the human-readable "dans
 * N semaines" framing and the weeks-remaining divisor above. */
export function daysUntil(examDateIso: string, today: Date = new Date()): number {
  const todayStart = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const [y, m, d] = examDateIso.split("-").map(Number);
  const examStart = Date.UTC(y, m - 1, d);
  return Math.round((examStart - todayStart) / 86_400_000);
}
