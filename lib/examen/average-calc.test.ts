import { describe, expect, it } from "vitest";
import { computeWeightedAverage, computeNeededAverage, examGradeStatus } from "./average-calc";

describe("computeWeightedAverage", () => {
  it("returns null when there are no graded exams", () => {
    expect(computeWeightedAverage([])).toBeNull();
  });

  it("weights by coefficient, not a plain mean", () => {
    // 12/20 at coeff 1, 16/20 at coeff 3 -> (12 + 48) / 4 = 15.
    const avg = computeWeightedAverage([
      { coefficient: 1, noteObtenue: 12 },
      { coefficient: 3, noteObtenue: 16 },
    ]);
    expect(avg).toBeCloseTo(15, 5);
  });

  it("is a plain mean when every coefficient is equal", () => {
    const avg = computeWeightedAverage([
      { coefficient: 2, noteObtenue: 10 },
      { coefficient: 2, noteObtenue: 14 },
    ]);
    expect(avg).toBeCloseTo(12, 5);
  });
});

describe("computeNeededAverage", () => {
  it("returns no-remaining-exams when nothing is left to grade", () => {
    const result = computeNeededAverage([{ coefficient: 1, noteObtenue: 14 }], [], 10);
    expect(result.kind).toBe("no-remaining-exams");
  });

  it("computes the average still needed on what's left, per the spec formula", () => {
    // 2 graded exams at 8/20 (coeff 1 each) = 16 points over coeff 2.
    // Goal 10 over 4 total coeff (2 remaining, coeff 1 each) -> needed
    // = (10*4 - 16) / 2 = 12.
    const result = computeNeededAverage(
      [
        { coefficient: 1, noteObtenue: 8 },
        { coefficient: 1, noteObtenue: 8 },
      ],
      [1, 1],
      10,
    );
    expect(result.kind).toBe("normal");
    expect(result.neededAverage20).toBeCloseTo(12, 5);
  });

  it("flags already-achieved when the goal is locked in even at 0 on what's left", () => {
    // 18/20 at coeff 3 vs a goal of 10 over a total coeff of 4 (1
    // remaining) -> needed = (10*4 - 54) / 1 = -14, i.e. already covered.
    const result = computeNeededAverage([{ coefficient: 3, noteObtenue: 18 }], [1], 10);
    expect(result.kind).toBe("already-achieved");
  });

  it("flags out-of-reach and gives the best achievable average when the goal needs more than 20/20", () => {
    // 4/20 at coeff 3 vs a goal of 18 over a total coeff of 4 (1
    // remaining) -> needed = (18*4 - 12) / 1 = 60, impossible.
    // Best case (20/20 on the last one): (12 + 20) / 4 = 8.
    const result = computeNeededAverage([{ coefficient: 3, noteObtenue: 4 }], [1], 18);
    expect(result.kind).toBe("out-of-reach");
    expect(result.maxAchievableAverage20).toBeCloseTo(8, 5);
  });

  it("splits the needed average across several remaining exams by their own coefficients", () => {
    const result = computeNeededAverage([{ coefficient: 1, noteObtenue: 10 }], [1, 2], 12);
    // total coeff = 4, needed = (12*4 - 10) / 3 = 12.666...
    expect(result.kind).toBe("normal");
    expect(result.neededAverage20).toBeCloseTo(12.5, 5); // rounded to the 0.5 grid
  });
});

describe("examGradeStatus", () => {
  const today = new Date(Date.UTC(2026, 10, 14)); // 2026-11-14

  it("is graded whenever a grade is present, regardless of date", () => {
    expect(examGradeStatus("2026-12-01", 14, today)).toBe("graded");
    expect(examGradeStatus("2026-01-01", 14, today)).toBe("graded");
  });

  it("awaits grade entry once the date has passed with no grade", () => {
    expect(examGradeStatus("2026-11-01", null, today)).toBe("awaiting-grade-entry");
    expect(examGradeStatus("2026-11-13", null, today)).toBe("awaiting-grade-entry");
  });

  it("is upcoming for a future, ungraded exam — including today itself", () => {
    expect(examGradeStatus("2026-11-14", null, today)).toBe("upcoming");
    expect(examGradeStatus("2026-12-25", null, today)).toBe("upcoming");
  });
});
