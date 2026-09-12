import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { PROFILE_CACHE_TAG } from "@/lib/supabase/profile";
import type { ClasseCycle } from "@/lib/supabase/database.types";

interface OnboardingBody {
  prenom: string;
  classeCycle: ClasseCycle;
  classeNiveau: string;
  revisionJoursSemaine: number;
  revisionMinutesJour: number;
}

const VALID_CYCLES: ClasseCycle[] = ["college", "lycee", "superieur"];

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
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
    return NextResponse.json({ error: "Champs manquants ou invalides" }, { status: 400 });
  }

  const fields = {
    prenom: body.prenom.trim(),
    classe_cycle: body.classeCycle,
    classe_niveau: body.classeNiveau.trim(),
    revision_jours_semaine: Math.min(7, Math.max(1, Math.round(body.revisionJoursSemaine))),
    revision_minutes_jour: Math.max(5, Math.round(body.revisionMinutesJour)),
    onboarding_completed: true,
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
    return NextResponse.json({ error: describeDbError(updateError) }, { status: 500 });
  }

  // No row existed yet (trigger didn't fire, or ran before this migration
  // existed) — create it now.
  if (!updated || updated.length === 0) {
    const { error: insertError } = await supabase
      .from("profiles")
      .insert({ id: user.id, ...fields });

    if (insertError) {
      return NextResponse.json({ error: describeDbError(insertError) }, { status: 500 });
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

function describeDbError(error: { code?: string; message: string }): string {
  // 42P01 = undefined_table: the migrations in supabase/migrations/ were
  // never applied to this Supabase project (see README "Migrations SQL").
  if (error.code === "42P01") {
    return "La base de données n'est pas encore initialisée (migrations SQL manquantes). Contacte l'administrateur du site.";
  }
  // 42501 = insufficient_privilege: an RLS policy rejected the query.
  if (error.code === "42501") {
    return `Accès refusé par la base de données (policy manquante ou incorrecte). Détail : ${error.message}`;
  }
  return error.code ? `${error.message} (code ${error.code})` : error.message;
}
