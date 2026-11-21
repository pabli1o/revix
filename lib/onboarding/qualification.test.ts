import { describe, expect, it } from "vitest";
import { isValidBlocages, isValidMethodeRevision, isValidProchainExamen } from "./qualification";

describe("isValidBlocages", () => {
  it("accepts a non-empty array of known options", () => {
    expect(isValidBlocages(["procrastination", "temps"])).toBe(true);
  });

  it("rejects an empty array", () => {
    expect(isValidBlocages([])).toBe(false);
  });

  it("rejects an unknown option", () => {
    expect(isValidBlocages(["procrastination", "paresse"])).toBe(false);
  });

  it("rejects non-array values", () => {
    expect(isValidBlocages("procrastination")).toBe(false);
    expect(isValidBlocages(null)).toBe(false);
    expect(isValidBlocages(undefined)).toBe(false);
  });
});

describe("isValidMethodeRevision", () => {
  it("accepts a known option", () => {
    expect(isValidMethodeRevision("fiches_maison")).toBe(true);
  });

  it("rejects an unknown or non-string value", () => {
    expect(isValidMethodeRevision("autre")).toBe(false);
    expect(isValidMethodeRevision(42)).toBe(false);
  });
});

describe("isValidProchainExamen", () => {
  it("accepts a known option", () => {
    expect(isValidProchainExamen("dans_2_3_mois")).toBe(true);
  });

  it("rejects an unknown or non-string value", () => {
    expect(isValidProchainExamen("jamais")).toBe(false);
    expect(isValidProchainExamen(null)).toBe(false);
  });
});
