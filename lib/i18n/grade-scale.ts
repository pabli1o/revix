import { formatNumber } from "./format";
import type { Locale } from "./locale";
import type { GradeScale } from "@/lib/supabase/database.types";

export type { GradeScale };

export const GRADE_SCALES: GradeScale[] = ["vingt", "dix", "pourcentage"];

/** The scale a language shows grades in when the student hasn't manually
 * picked one (profiles.echelle_note) — matches what's actually taught
 * in each place: /20 in France, /10 in Spain and most of Latin America,
 * percentages for English-speaking systems. */
export const DEFAULT_GRADE_SCALE_BY_LOCALE: Record<Locale, GradeScale> = {
  fr: "vingt",
  en: "pourcentage",
  es: "dix",
};

export function resolveGradeScale(locale: Locale, override: GradeScale | null | undefined): GradeScale {
  return override ?? DEFAULT_GRADE_SCALE_BY_LOCALE[locale];
}

/** Every grade/average is stored canonically on /20 (see the 0016
 * migration) — this is the single conversion point to a scale's own
 * numeric domain. Never round-tripped back to /20 from a converted value;
 * always convert fresh from the canonical /20 number. */
export function toScaleValue(valueOn20: number, scale: GradeScale): number {
  switch (scale) {
    case "vingt":
      return valueOn20;
    case "dix":
      return valueOn20 / 2;
    case "pourcentage":
      return valueOn20 * 5;
  }
}

/** Inverse of toScaleValue — only used where the student directly enters a
 * number in their own scale (e.g. a manual grade-scale picker preview);
 * the sliders themselves stay on the canonical /20 domain and never need
 * this (see components/examen/grade-slider.tsx). */
export function fromScaleValue(scaledValue: number, scale: GradeScale): number {
  switch (scale) {
    case "vingt":
      return scaledValue;
    case "dix":
      return scaledValue * 2;
    case "pourcentage":
      return scaledValue / 5;
  }
}

/** Percentages read oddly with a decimal (72.5 %); /20 and /10 keep one
 * decimal so a half-point goal (14.5, 7.25) doesn't silently round away. */
function roundForScale(value: number, scale: GradeScale): number {
  return scale === "pourcentage" ? Math.round(value) : Math.round(value * 10) / 10;
}

/** The bare, locale-formatted number only (no "/20" or "%" suffix) — for
 * contexts that build their own surrounding text (e.g. a dictionary
 * function interpolating it into a full sentence). */
export function formatGradeNumber(valueOn20: number, scale: GradeScale, locale: Locale): string {
  const scaled = roundForScale(toScaleValue(valueOn20, scale), scale);
  return formatNumber(scaled, locale);
}

/** The number with its scale's own unit suffix, e.g. "14/20", "7/10",
 * "70 %" — for standalone display (slider labels, table cells). */
export function formatGrade(valueOn20: number, scale: GradeScale, locale: Locale): string {
  const number = formatGradeNumber(valueOn20, scale, locale);
  switch (scale) {
    case "vingt":
      return `${number}/20`;
    case "dix":
      return `${number}/10`;
    case "pourcentage":
      return `${number} %`;
  }
}
