import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSubscriptionInfo, subscriptionHasFeature } from "@/lib/subscription/gate";
import { importanceFromCoefficient } from "@/lib/examen/goal-calc";
import { getDictionary } from "@/lib/i18n/server";

/**
 * Creates an exam from the "Objectif de note" wizard
 * (components/examen/goal-wizard.tsx) — picks a whole subject (not
 * individual chapters like the old ExamForm/exam-form.tsx, now removed),
 * so this links every one of that subject's chapters automatically and
 * names the exam after the subject. `importance` (still required by
 * lib/planning/scheduler.ts, unchanged) is derived from the coefficient
 * instead of asked for directly — see importanceFromCoefficient's doc
 * comment.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const t = await getDictionary();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: t.errors.common.unauthenticated }, { status: 401 });

  const subscription = await getSubscriptionInfo(user.id);
  if (!subscriptionHasFeature(subscription, "examen")) {
    return NextResponse.json({ error: t.errors.subscription.examenLocked }, { status: 402 });
  }

  const body = (await request.json().catch(() => null)) as {
    subjectId?: string;
    date?: string;
    coefficient?: number;
    noteVisee?: number | null;
    moyenneDeclareeDepart?: number | null;
  } | null;

  if (!body?.subjectId || !body.date || !body.coefficient || body.coefficient < 1) {
    return NextResponse.json({ error: t.errors.common.missingOrInvalidFields }, { status: 400 });
  }

  const { data: subject, error: subjectError } = await supabase
    .from("subjects")
    .select("id, nom")
    .eq("id", body.subjectId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (subjectError) return NextResponse.json({ error: subjectError.message }, { status: 500 });
  if (!subject) return NextResponse.json({ error: t.errors.examen.subjectNotFound }, { status: 404 });

  const { data: exam, error } = await supabase
    .from("exams")
    .insert({
      user_id: user.id,
      nom: subject.nom,
      date: body.date,
      importance: importanceFromCoefficient(body.coefficient),
      subject_id: subject.id,
      coefficient: body.coefficient,
      note_visee: body.noteVisee ?? null,
      moyenne_declaree_depart: body.moyenneDeclareeDepart ?? null,
    })
    .select("id, nom, date, importance, subject_id, coefficient, note_visee, moyenne_declaree_depart")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: chapters, error: chaptersError } = await supabase
    .from("chapters")
    .select("id")
    .eq("subject_id", subject.id)
    .eq("user_id", user.id);
  if (chaptersError) return NextResponse.json({ error: chaptersError.message }, { status: 500 });

  if (chapters && chapters.length > 0) {
    const { error: linkError } = await supabase
      .from("exam_chapters")
      .insert(chapters.map((c) => ({ exam_id: exam.id, chapter_id: c.id })));
    if (linkError) return NextResponse.json({ error: linkError.message }, { status: 500 });
  }

  return NextResponse.json({ exam }, { status: 201 });
}
