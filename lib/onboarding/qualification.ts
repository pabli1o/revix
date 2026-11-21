/**
 * The 3 qualification screens added after "quelle moyenne veux-tu
 * atteindre ?" and before the analyzing animation (components/onboarding/
 * wizard.tsx) — a tester asked for the onboarding to actually use what the
 * student says is hard for them, not just their grades. Answers are
 * stored as-is in profiles.onboarding_reponses (jsonb — see supabase/
 * migrations/0018_onboarding_reponses.sql) and never feed
 * lib/examen/goal-calc.ts's minutes/day calculation: they only drive the
 * result screen's "Ce que tu as dit, et comment Reviix t'aide" box
 * (REVIIX_HELP_BY_BLOCAGE below) — saying otherwise would be dishonest.
 */

export const BLOCAGE_OPTIONS = [
  "pas_de_depart",
  "procrastination",
  "concentration",
  "comprehension",
  "methode",
  "stress",
  "temps",
] as const;
export type BlocageOption = (typeof BLOCAGE_OPTIONS)[number];

export const METHODE_REVISION_OPTIONS = ["relit", "recopie", "fiches_maison", "revise_peu"] as const;
export type MethodeRevisionOption = (typeof METHODE_REVISION_OPTIONS)[number];

export const PROCHAIN_EXAMEN_OPTIONS = ["cette_semaine", "ce_mois", "dans_2_3_mois", "pas_de_date"] as const;
export type ProchainExamenOption = (typeof PROCHAIN_EXAMEN_OPTIONS)[number];

/** The exact shape stored in profiles.onboarding_reponses. All optional —
 * each screen's answer is saved independently as it's answered (see
 * wizard.tsx's handleBlocagesContinue/handleMethodeRevisionContinue/
 * handleProchainExamenContinue), so a reload mid-flow can tell which of
 * the 3 is still missing (app/onboarding/page.tsx's resume bucket). */
export interface OnboardingReponses {
  blocages?: BlocageOption[];
  methodeRevision?: MethodeRevisionOption;
  prochainExamen?: ProchainExamenOption;
}

export function isValidBlocages(value: unknown): value is BlocageOption[] {
  return Array.isArray(value) && value.length > 0 && value.every((v) => (BLOCAGE_OPTIONS as readonly string[]).includes(v));
}

export function isValidMethodeRevision(value: unknown): value is MethodeRevisionOption {
  return typeof value === "string" && (METHODE_REVISION_OPTIONS as readonly string[]).includes(value);
}

export function isValidProchainExamen(value: unknown): value is ProchainExamenOption {
  return typeof value === "string" && (PROCHAIN_EXAMEN_OPTIONS as readonly string[]).includes(value);
}
