import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSubscriptionInfo } from "@/lib/subscription/gate";
import { PROFILE_CACHE_TAG } from "@/lib/supabase/profile";
import { getDictionary } from "@/lib/i18n/server";
import { GRADE_SCALES } from "@/lib/i18n/grade-scale";
import type { GradeScale } from "@/lib/supabase/database.types";

export async function GET() {
  const supabase = await createClient();
  const t = await getDictionary();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: t.errors.common.unauthenticated }, { status: 401 });

  const [{ data: profile }, subscription] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    getSubscriptionInfo(user.id),
  ]);

  return NextResponse.json({
    user: { id: user.id, email: user.email },
    profile,
    subscription,
  });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const t = await getDictionary();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: t.errors.common.unauthenticated }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    prenom?: string;
    nom?: string;
    /** Part B's "Ma moyenne" block — the overall average goal, /20. */
    objectifMoyenne?: number;
    /** The manual grade-scale override from Settings — see
     * lib/i18n/grade-scale.ts's GradeScale doc comment. null resets to
     * "follow the current language" instead of a fixed choice. */
    echelleNote?: GradeScale | null;
  } | null;
  if (
    !body ||
    (body.prenom === undefined &&
      body.nom === undefined &&
      body.objectifMoyenne === undefined &&
      body.echelleNote === undefined)
  ) {
    return NextResponse.json({ error: t.errors.profile.noFieldsToUpdate }, { status: 400 });
  }

  const fields: {
    prenom?: string;
    nom?: string | null;
    objectif_moyenne?: number;
    echelle_note?: GradeScale | null;
  } = {};
  if (body.prenom !== undefined) {
    const trimmed = body.prenom.trim();
    if (!trimmed) return NextResponse.json({ error: t.errors.profile.emptyFirstName }, { status: 400 });
    fields.prenom = trimmed;
  }
  if (body.nom !== undefined) {
    fields.nom = body.nom.trim() || null;
  }
  if (body.objectifMoyenne !== undefined) {
    if (typeof body.objectifMoyenne !== "number" || body.objectifMoyenne < 0 || body.objectifMoyenne > 20) {
      return NextResponse.json({ error: t.errors.examen.invalidGrade }, { status: 400 });
    }
    fields.objectif_moyenne = body.objectifMoyenne;
  }
  if (body.echelleNote !== undefined) {
    if (body.echelleNote !== null && !GRADE_SCALES.includes(body.echelleNote)) {
      return NextResponse.json({ error: t.errors.common.missingOrInvalidFields }, { status: 400 });
    }
    fields.echelle_note = body.echelleNote;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .update(fields)
    .eq("id", user.id)
    .select("prenom, nom, objectif_moyenne, echelle_note")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // { expire: 0 }, not the recommended "max" profile — see the comment in
  // app/api/onboarding/route.ts: "max" would let the very next read (e.g.
  // <AppHeader />'s greeting right after this save) still show the old
  // name while revalidating in the background.
  revalidateTag(PROFILE_CACHE_TAG, { expire: 0 });
  return NextResponse.json({ profile });
}
