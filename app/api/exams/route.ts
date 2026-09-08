import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Importance } from "@/lib/supabase/database.types";

const VALID_IMPORTANCE: Importance[] = ["normale", "importante", "tres_importante"];

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

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
    return NextResponse.json({ error: "Champs manquants ou invalides" }, { status: 400 });
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
