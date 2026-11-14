import { daysUntil } from "./goal-calc";

/**
 * Pure, framework-free math for Part B of "Objectif de note": the weighted
 * average across graded exams, and the grade still needed on the
 * remaining ones to hit an overall average goal. Same spirit as
 * goal-calc.ts — no Supabase, no React, every input a plain number/string
 * (see components/examen/moyenne-block.tsx and app/api/exams/*), so it's
 * directly unit-testable (see average-calc.test.ts).
 *
 * Every grade/average here is on the canonical /20 scale (see
 * lib/i18n/grade-scale.ts) — this module never does scale conversion.
 */

/** Grades are entered in half-point steps throughout the feature — any
 * computed "needed average" is rounded to the same grid, same as
 * goal-calc.ts's GRADE_STEP (not re-exported from there to keep the two
 * calculation modules independent of each other). */
const GRADE_STEP = 0.5;

function roundToGradeStep(value: number): number {
  return Math.round(value / GRADE_STEP) * GRADE_STEP;
}

export interface GradedExam {
  coefficient: number;
  /** /20 — a graded exam always has one; an ungraded exam doesn't belong
   * in this array (see examGradeStatus below). */
  noteObtenue: number;
}

/** The overall average weighted by each exam's coefficient — null when
 * there isn't a single graded exam yet, never silently 0 (an ungraded
 * exam is "à venir", not a zero — see the module doc comment and the
 * spec's explicit requirement). */
export function computeWeightedAverage(gradedExams: GradedExam[]): number | null {
  const totalCoefficient = gradedExams.reduce((sum, e) => sum + e.coefficient, 0);
  if (totalCoefficient <= 0) return null;
  const pointsEarned = gradedExams.reduce((sum, e) => sum + e.coefficient * e.noteObtenue, 0);
  return pointsEarned / totalCoefficient;
}

export type NeededAverageKind = "normal" | "already-achieved" | "out-of-reach" | "no-remaining-exams";

export interface NeededAverageResult {
  kind: NeededAverageKind;
  /** The average still needed on the remaining exams to hit the goal,
   * /20 — only set for "normal". */
  neededAverage20?: number;
  /** The best overall average still achievable (remaining exams all at
   * 20/20) — only set for "out-of-reach". */
  maxAchievableAverage20?: number;
}

/**
 * "Note à obtenir pour remonter" — (objectif de moyenne x total des
 * coefficients - points déjà acquis) / coefficients restants, exactly per
 * spec, with its three edge cases:
 * - no ungraded exam left at all -> "no-remaining-exams" (don't show the
 *   calculation).
 * - the goal is already mathematically locked in, even scoring 0 on every
 *   remaining exam -> "already-achieved".
 * - the goal would need more than 20/20 on average on what's left ->
 *   "out-of-reach", with the best achievable average instead.
 */
export function computeNeededAverage(
  gradedExams: GradedExam[],
  remainingExamCoefficients: number[],
  averageGoal20: number,
): NeededAverageResult {
  const remainingCoefficient = remainingExamCoefficients.reduce((sum, c) => sum + c, 0);
  if (remainingExamCoefficients.length === 0 || remainingCoefficient <= 0) {
    return { kind: "no-remaining-exams" };
  }

  const gradedCoefficient = gradedExams.reduce((sum, e) => sum + e.coefficient, 0);
  const pointsEarned = gradedExams.reduce((sum, e) => sum + e.coefficient * e.noteObtenue, 0);
  const totalCoefficient = gradedCoefficient + remainingCoefficient;

  const neededAverage20 = (averageGoal20 * totalCoefficient - pointsEarned) / remainingCoefficient;

  if (neededAverage20 <= 0) {
    return { kind: "already-achieved" };
  }
  if (neededAverage20 > 20) {
    const maxAchievableAverage20 = (pointsEarned + 20 * remainingCoefficient) / totalCoefficient;
    return { kind: "out-of-reach", maxAchievableAverage20: roundToGradeStep(maxAchievableAverage20) };
  }
  return { kind: "normal", neededAverage20: roundToGradeStep(neededAverage20) };
}

export type ExamGradeStatus = "graded" | "awaiting-grade-entry" | "upcoming";

/** Drives the grade-entry banner and the "Ma moyenne" list's own per-exam
 * status (Part B, step 1-2): a graded exam already has note_obtenue; an
 * exam whose date is in the past but still has no grade needs the
 * banner; anything else is simply upcoming. */
export function examGradeStatus(
  dateIso: string,
  noteObtenue: number | null,
  today: Date = new Date(),
): ExamGradeStatus {
  if (noteObtenue != null) return "graded";
  return daysUntil(dateIso, today) < 0 ? "awaiting-grade-entry" : "upcoming";
}
