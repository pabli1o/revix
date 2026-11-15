import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { PROFILE_CACHE_TAG } from "@/lib/supabase/profile";
import type { ClasseCycle } from "@/lib/supabase/database.types";
import { getDictionary } from "@/lib/i18n/server";
import type { Dictionary } from "@/lib/i18n/dictionaries";

interface OnboardingBody {
  prenom?: string;
  classeCycle?: ClasseCycle;
  classeNiveau?: string;
  /** Onboarding itself never asks "combien de jours/minutes" anymore (see
   * wizard.tsx's ASSUMED_DAYS_PER_WEEK) — these two only ever arrive
   * together, from handleFinish, as a *proposed default* computed from
   * the result screen. Applied below only if the profile's rhythm is
   * still untouched, so this never overwrites a real choice made through
   * the actual rhythm editor (/api/planning/settings). */
  revisionJoursSemaine?: number;
  revisionMinutesJour?: number;
  /** The "moyenne générale" onboarding screens — /20 scale. */
  moyenneGeneraleDepart?: number;
  objectifMoyenne?: number;
  /** Only true on the final "Terminer" (see wizard.tsx's handleFinish) —
   * every other call from the wizard saves one or two fields "au fil des
   * écrans" as each screen is answered (see handlePrenomContinue,
   * handleMoyenneActuelleContinue, handleObjectifValidate) without
   * flipping onboarding_completed, so a reload mid-flow resumes at the
   * right step (app/onboarding/page.tsx) instead of either restarting or
   * being bounced out of onboarding entirely by app/(app)/layout.tsx's
   * completed-profile redirect. */
  complete?: boolean;
}

function isValidGrade20(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 20;
}

const VALID_CYCLES: ClasseCycle[] = ["college", "lycee", "superieur"];

/** supabase/migrations/0001_init.sql's column defaults — the only signal
 * available (no DB change for this feature) that a profile's rhythm has
 * never been touched, used below to decide whether handleFinish's
 * proposed default may be applied. */
const UNTOUCHED_REVISION_JOURS_SEMAINE = 4;
const UNTOUCHED_REVISION_MINUTES_JOUR = 30;

export async function POST(request: Request) {
  const supabase = await createClient();
  const t = await getDictionary();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: t.errors.common.unauthenticated }, { status: 401 });
  }

  const body = (await request.json()) as Partial<OnboardingBody>;

  // "complete" (the final "Terminer") still requires the full set, exactly
  // as this route always has — every other call is a deliberately partial,
  // one-or-two-field save and skips this check entirely.
  if (
    body.complete &&
    (!body.prenom?.trim() ||
      !body.classeCycle ||
      !VALID_CYCLES.includes(body.classeCycle) ||
      !body.classeNiveau?.trim() ||
      !body.revisionJoursSemaine ||
      !body.revisionMinutesJour)
  ) {
    return NextResponse.json({ error: t.errors.common.missingOrInvalidFields }, { status: 400 });
  }
  if (body.classeCycle !== undefined && !VALID_CYCLES.includes(body.classeCycle)) {
    return NextResponse.json({ error: t.errors.common.missingOrInvalidFields }, { status: 400 });
  }
  if (body.prenom !== undefined && !body.prenom.trim()) {
    return NextResponse.json({ error: t.errors.common.missingOrInvalidFields }, { status: 400 });
  }
  if (body.classeNiveau !== undefined && !body.classeNiveau.trim()) {
    return NextResponse.json({ error: t.errors.common.missingOrInvalidFields }, { status: 400 });
  }
  if (body.moyenneGeneraleDepart !== undefined && !isValidGrade20(body.moyenneGeneraleDepart)) {
    return NextResponse.json({ error: t.errors.examen.invalidGrade }, { status: 400 });
  }
  if (body.objectifMoyenne !== undefined && !isValidGrade20(body.objectifMoyenne)) {
    return NextResponse.json({ error: t.errors.examen.invalidGrade }, { status: 400 });
  }

  const fields: {
    prenom?: string;
    classe_cycle?: ClasseCycle;
    classe_niveau?: string;
    revision_jours_semaine?: number;
    revision_minutes_jour?: number;
    moyenne_generale_depart?: number;
    objectif_moyenne?: number;
    onboarding_completed?: boolean;
  } = {};
  if (body.prenom !== undefined) fields.prenom = body.prenom.trim();
  if (body.classeCycle !== undefined) fields.classe_cycle = body.classeCycle;
  if (body.classeNiveau !== undefined) fields.classe_niveau = body.classeNiveau.trim();

  if (body.revisionJoursSemaine !== undefined || body.revisionMinutesJour !== undefined) {
    const { data: current } = await supabase
      .from("profiles")
      .select("revision_jours_semaine, revision_minutes_jour")
      .eq("id", user.id)
      .maybeSingle();
    const rhythmStillUntouched =
      !current ||
      (current.revision_jours_semaine === UNTOUCHED_REVISION_JOURS_SEMAINE &&
        current.revision_minutes_jour === UNTOUCHED_REVISION_MINUTES_JOUR);

    if (rhythmStillUntouched) {
      if (body.revisionJoursSemaine !== undefined) {
        fields.revision_jours_semaine = Math.min(7, Math.max(1, Math.round(body.revisionJoursSemaine)));
      }
      if (body.revisionMinutesJour !== undefined) {
        fields.revision_minutes_jour = Math.max(5, Math.round(body.revisionMinutesJour));
      }
    }
  }

  if (body.moyenneGeneraleDepart !== undefined) fields.moyenne_generale_depart = body.moyenneGeneraleDepart;
  if (body.objectifMoyenne !== undefined) fields.objectif_moyenne = body.objectifMoyenne;
  if (body.complete) fields.onboarding_completed = true;

  if (Object.keys(fields).length === 0) {
    return NextResponse.json({ error: t.errors.common.missingOrInvalidFields }, { status: 400 });
  }

  // Plain UPDATE first: the `handle_new_user` trigger already created this
  // row at signup, and only requires the UPDATE RLS policy. We deliberately
  // avoid `.upsert()` here — it compiles to INSERT ... ON CONFLICT DO UPDATE,
  // which Postgres RLS evaluates against the INSERT policy even when the row
  // already exists, so it can fail in setups where UPDATE otherwise works.
  const { error: updateError, data: updated } = await supabase
    .from("profiles")
    .update(fields)
    .eq("id", user.id)
    .select("id");

  if (updateError) {
    return NextResponse.json({ error: describeDbError(updateError, t) }, { status: 500 });
  }

  // No row existed yet (trigger didn't fire, or ran before this migration
  // existed) — create it now.
  if (!updated || updated.length === 0) {
    const { error: insertError } = await supabase
      .from("profiles")
      .insert({ id: user.id, ...fields });

    if (insertError) {
      return NextResponse.json({ error: describeDbError(insertError, t) }, { status: 500 });
    }
  }

  // Every save here — partial or complete — can change something the
  // cached getProfile() read serves (prenom, onboarding_completed).
  // { expire: 0 } is deliberate, not the recommended "max" profile: "max"
  // serves stale content during background revalidation, so the very next
  // read (app/(app)/layout.tsx's or app/onboarding/page.tsx's own redirect
  // check, hit immediately after this by the client's router navigation)
  // could still see stale data and bounce the user to the wrong place.
  // expire: 0 forces that next read to block on a genuine fresh fetch.
  revalidateTag(PROFILE_CACHE_TAG, { expire: 0 });

  return NextResponse.json({ ok: true });
}

function describeDbError(error: { code?: string; message: string }, t: Dictionary): string {
  // 42P01 = undefined_table: the migrations in supabase/migrations/ were
  // never applied to this Supabase project (see README "Migrations SQL").
  if (error.code === "42P01") {
    return t.errors.onboarding.dbNotInitialized;
  }
  // 42501 = insufficient_privilege: an RLS policy rejected the query.
  if (error.code === "42501") {
    return t.errors.onboarding.dbAccessDenied(error.message);
  }
  return error.code ? `${error.message} (code ${error.code})` : error.message;
}
