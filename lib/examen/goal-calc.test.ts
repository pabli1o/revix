import { describe, expect, it } from "vitest";
import {
  computeContentBaseHours,
  computeGapFactor,
  computeStudyPlan,
  daysUntil,
  importanceFromCoefficient,
  DEFAULT_FICHE_COUNT_FALLBACK,
  MAX_REASONABLE_HOURS_PER_DAY,
  MIN_GAP_FACTOR,
  MINUTES_PER_FICHE_BASE,
} from "./goal-calc";

describe("computeContentBaseHours", () => {
  it("uses the real fiche count when there is one", () => {
    expect(computeContentBaseHours(4)).toBeCloseTo((4 * MINUTES_PER_FICHE_BASE) / 60, 5);
  });

  it("falls back to a plausible default when the subject has no fiches yet", () => {
    expect(computeContentBaseHours(0)).toBeCloseTo(
      (DEFAULT_FICHE_COUNT_FALLBACK * MINUTES_PER_FICHE_BASE) / 60,
      5,
    );
  });

  it("scales linearly with fiche count", () => {
    expect(computeContentBaseHours(10)).toBeCloseTo(2 * computeContentBaseHours(5), 5);
  });
});

describe("computeGapFactor", () => {
  it("floors at MIN_GAP_FACTOR for a zero or negative gap", () => {
    expect(computeGapFactor(0)).toBe(MIN_GAP_FACTOR);
    expect(computeGapFactor(-3)).toBe(MIN_GAP_FACTOR);
  });

  it("is convex: each extra point costs more than the last", () => {
    const f4 = computeGapFactor(4);
    const f8 = computeGapFactor(8);
    const f12 = computeGapFactor(12);
    // Convexity: the jump from 8->12 must exceed the jump from 4->8.
    expect(f12 - f8).toBeGreaterThan(f8 - f4);
  });

  it("is monotonically increasing with the gap, once past the MIN_GAP_FACTOR floor", () => {
    // Below ~1.1, the raw convex value is still under MIN_GAP_FACTOR, so
    // several small gaps floor to the same number by design (see
    // computeGapFactor's doc comment) — monotonicity is only meaningful
    // once the curve has risen past that floor.
    const gaps = [2, 4, 6, 8, 10, 12];
    for (let i = 1; i < gaps.length; i++) {
      expect(computeGapFactor(gaps[i])).toBeGreaterThan(computeGapFactor(gaps[i - 1]));
    }
  });
});

describe("computeStudyPlan", () => {
  const baseInput = {
    currentAverage20: 10,
    goal20: 14,
    ficheCount: 6,
    daysUntilExam: 35, // 5 weeks
    revisionJoursSemaine: 5,
  };

  it("returns a normal result for a reasonable goal and timeframe", () => {
    const result = computeStudyPlan(baseInput);
    expect(result.kind).toBe("normal");
    expect(result.gap).toBe(4);
    expect(result.totalHours).toBeGreaterThan(0);
    expect(result.hoursPerWeek).toBeCloseTo(result.totalHours / 5, 5);
    expect(result.minutesPerDay).toBeCloseTo((result.hoursPerWeek * 60) / 5, 5);
    expect(result.suggestedGoal20).toBeUndefined();
  });

  it("flags already-there when the goal is at or below the current average", () => {
    const atLevel = computeStudyPlan({ ...baseInput, goal20: 10 });
    expect(atLevel.kind).toBe("already-there");
    expect(atLevel.gap).toBe(0);
    expect(atLevel.totalHours).toBeGreaterThan(0); // maintenance, not zero

    const below = computeStudyPlan({ ...baseInput, goal20: 8 });
    expect(below.kind).toBe("already-there");
  });

  it("flags very-ambitious for a goal of 18+ under a normal load, with a lower intermediate milestone", () => {
    const result = computeStudyPlan({
      ...baseInput,
      currentAverage20: 15,
      goal20: 19,
      daysUntilExam: 70, // give it enough runway to not also trip excessive-load
    });
    expect(result.kind).toBe("very-ambitious");
    expect(result.suggestedGoal20).toBeDefined();
    expect(result.suggestedGoal20!).toBeLessThan(19);
    expect(result.suggestedGoal20!).toBeGreaterThan(15);
  });

  it("flags excessive-load for a huge gap, and proposes a lower, achievable goal", () => {
    const result = computeStudyPlan({ ...baseInput, currentAverage20: 4, goal20: 19 });
    expect(result.kind).toBe("excessive-load");
    expect(result.minutesPerDay / 60).toBeGreaterThan(MAX_REASONABLE_HOURS_PER_DAY);
    expect(result.suggestedGoal20).toBeDefined();
    expect(result.suggestedGoal20!).toBeLessThan(19);
    expect(result.suggestedGoal20!).toBeGreaterThanOrEqual(4);
  });

  it("flags excessive-load for an exam that's too close, given a real gap to close", () => {
    // Same mechanism as a huge gap: compressing the same total hours into
    // MIN_WEEKS_BEFORE_EXAM's single week drives hours/day over the
    // threshold on its own — no separate "too close" branch needed. A
    // genuinely tight timeline (1 day) with a real gap (8 points) is what
    // should trip it; a trivial gap over the same single day legitimately
    // might not (a couple of focused hours is plausible), so this isn't
    // testing "any gap", just a realistic one.
    const result = computeStudyPlan({
      ...baseInput,
      currentAverage20: 9,
      goal20: 17,
      daysUntilExam: 1,
    });
    expect(result.kind).toBe("excessive-load");
    expect(result.minutesPerDay / 60).toBeGreaterThan(MAX_REASONABLE_HOURS_PER_DAY);
  });

  it("never divides by fewer than MIN_WEEKS_BEFORE_EXAM weeks, even for a same-day exam", () => {
    const today = computeStudyPlan({ ...baseInput, daysUntilExam: 0 });
    const oneWeekOut = computeStudyPlan({ ...baseInput, daysUntilExam: 7 });
    expect(today.hoursPerWeek).toBeCloseTo(oneWeekOut.hoursPerWeek, 5);
  });

  it("falls back to the default days/week when revisionJoursSemaine is not positive", () => {
    const result = computeStudyPlan({ ...baseInput, revisionJoursSemaine: 0 });
    expect(Number.isFinite(result.minutesPerDay)).toBe(true);
    expect(result.minutesPerDay).toBeGreaterThan(0);
  });
});

describe("importanceFromCoefficient", () => {
  it("maps low coefficients to normale", () => {
    expect(importanceFromCoefficient(1)).toBe("normale");
  });

  it("maps a coefficient of 2 to importante", () => {
    expect(importanceFromCoefficient(2)).toBe("importante");
  });

  it("maps 3 and above to tres_importante", () => {
    expect(importanceFromCoefficient(3)).toBe("tres_importante");
    expect(importanceFromCoefficient(7)).toBe("tres_importante");
  });
});

describe("daysUntil", () => {
  it("computes whole calendar days between two ISO dates", () => {
    const today = new Date(Date.UTC(2026, 10, 7)); // 2026-11-07
    expect(daysUntil("2026-12-12", today)).toBe(35);
    expect(daysUntil("2026-11-07", today)).toBe(0);
    expect(daysUntil("2026-11-01", today)).toBe(-6);
  });
});
