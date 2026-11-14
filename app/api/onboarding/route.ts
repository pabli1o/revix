import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { PROFILE_CACHE_TAG } from "@/lib/supabase/profile";
import type { ClasseCycle } from "@/lib/supabase/database.types";
import { getDictionary } from "@/lib/i18n/server";
import type { Dictionary } from "@/lib/i18n/dictionaries";

interface OnboardingBody {
  prenom: string;
  classeCycle: ClasseCycle;
  classeNiveau: string;
  revisionJoursSemaine: number;
  revisionMinutesJour: number;
  /** The new "moyenne générale" onboarding screens — optional since an
   * anonymous draft saved before they existed won't carry them, and the
   * student could in principle skip them (see wizard.tsx). /20 scale. */
  moyenneGeneraleDepart?: number;
  objectifMoyenne?: number;
}

function isValidGrade20(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 20;
}

const VALID_CYCLES: ClasseCycle[] = ["college", "lycee", "superieur"];

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

  if (
    !body.prenom?.trim() ||
    !body.classeCycle ||
    !VALID_CYCLES.includes(body.classeCycle) ||
    !body.classeNiveau?.trim() ||
    !body.revisionJoursSemaine ||
    !body.revisionMinutesJour
  ) {
    return NextResponse.json({ error: t.errors.common.missingOrInvalidFields }, { status: 400 });
  }
  if (body.moyenneGeneraleDepart !== undefined && !isValidGrade20(body.moyenneGeneraleDepart)) {
    return NextResponse.json({ error: t.errors.examen.invalidGrade }, { status: 400 });
  }
  if (body.objectifMoyenne !== undefined && !isValidGrade20(body.objectifMoyenne)) {
    return NextResponse.json({ error: t.errors.examen.invalidGrade }, { status: 400 });
  }

  const fields = {
    prenom: body.prenom.trim(),
    classe_cycle: body.classeCycle,
    classe_niveau: body.classeNiveau.trim(),
    revision_jours_semaine: Math.min(7, Math.max(1, Math.round(body.revisionJoursSemaine))),
    revision_minutes_jour: Math.max(5, Math.round(body.revisionMinutesJour)),
    onboarding_completed: true,
    ...(body.moyenneGeneraleDepart !== undefined ? { moyenne_generale_depart: body.moyenneGeneraleDepart } : {}),
    ...(body.objectifMoyenne !== undefined ? { objectif_moyenne: body.objectifMoyenne } : {}),
  };

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

  // Both branches above just flipped onboarding_completed to true.
  // { expire: 0 } is deliberate, not the recommended "max" profile:
  // "max" serves stale content during background revalidation, so the
  // very next read (the layout's redirect check, hit immediately after
  // this by the client's router.replace("/fiches")) could still see the
  // old "false" and bounce the user right back to /onboarding. expire: 0
  // forces that next read to block on a genuine fresh fetch instead.
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
