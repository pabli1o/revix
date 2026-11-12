import { common } from "./common";
import { languageSwitcher } from "./language-switcher";
import { root } from "./root";
import { landing } from "./landing";
import { auth } from "./auth";
import { onboarding } from "./onboarding";
import { nav } from "./nav";
import { fiches } from "./fiches";
import { examen } from "./examen";
import { planning } from "./planning";
import { quiz } from "./quiz";
import { corbeille } from "./corbeille";
import { abonnement } from "./abonnement";
import { errors } from "./errors";

/**
 * The French dictionary is the single source of truth for shape: every
 * other locale's index.ts imports the *type* of each domain export (see
 * e.g. ../en/common.ts's `CommonDict`) and must satisfy it exactly, so a
 * missing translation is a TypeScript error, not a silent fallback.
 *
 * A new domain is added the same way: a
 * `lib/i18n/dictionaries/fr/<domain>.ts` exporting `export const X = {...}`
 * and `export type XDict = typeof X`, imported and spread in here, then
 * mirrored in ../en/index.ts and ../es/index.ts.
 */
export const fr = {
  common,
  languageSwitcher,
  root,
  landing,
  auth,
  onboarding,
  nav,
  fiches,
  examen,
  planning,
  quiz,
  corbeille,
  abonnement,
  errors,
};
