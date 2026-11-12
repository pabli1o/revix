import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSubscriptionInfo, subscriptionHasFeature } from "@/lib/subscription/gate";
import type { Importance } from "@/lib/supabase/database.types";
import { getDictionary } from "@/lib/i18n/server";

const VALID_IMPORTANCE: Importance[] = ["normale", "importante", "tres_importante"];

export async function POST(request: Request) {
  const supabase = await createClient();
  const t = await getDictionary();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: t.errors.common.unauthenticated }, { status: 401 });

  // Previously ungated server-side (only app/(app)/examen/page.tsx checked
  // access) — tier0 (fiches-only) is now active-but-examen-excluded, so an
  // active-subscription-only check here would wrongly let it through.
  const subscription = await getSubscriptionInfo(user.id);
  if (!subscriptionHasFeature(subscription, "examen")) {
    return NextResponse.json({ error: t.errors.subscription.examenLocked }, { status: 402 });
  }

  const body = (await request.json().catch(() => null)) as {
    nom?: string;
    date?: string;
    importance?: Importance;
    chapterIds?: string[];
  } | null;

  if (
    !body?.nom?.trim() ||
    !body.date ||
    !body.importance ||
    !VALID_IMPORTANCE.includes(body.importance)
  ) {
    return NextResponse.json({ error: t.errors.common.missingOrInvalidFields }, { status: 400 });
  }

  const { data: exam, error } = await supabase
    .from("exams")
    .insert({
      user_id: user.id,
      nom: body.nom.trim(),
      date: body.date,
      importance: body.importance,
    })
    .select("id, nom, date, importance")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const chapterIds = body.chapterIds ?? [];
  if (chapterIds.length > 0) {
    const { error: linkError } = await supabase
      .from("exam_chapters")
      .insert(chapterIds.map((chapterId) => ({ exam_id: exam.id, chapter_id: chapterId })));
    if (linkError) return NextResponse.json({ error: linkError.message }, { status: 500 });
  }

  return NextResponse.json({ exam }, { status: 201 });
}
