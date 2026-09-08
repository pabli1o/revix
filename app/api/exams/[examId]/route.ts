import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Importance } from "@/lib/supabase/database.types";

const VALID_IMPORTANCE: Importance[] = ["normale", "importante", "tres_importante"];

export async function PATCH(request: Request, ctx: RouteContext<"/api/exams/[examId]">) {
  const { examId } = await ctx.params;
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

  const update: { nom?: string; date?: string; importance?: Importance } = {};
  if (body?.nom?.trim()) update.nom = body.nom.trim();
  if (body?.date) update.date = body.date;
  if (body?.importance && VALID_IMPORTANCE.includes(body.importance)) {
    update.importance = body.importance;
  }

  if (Object.keys(update).length > 0) {
    const { error } = await supabase
      .from("exams")
      .update(update)
      .eq("id", examId)
      .eq("user_id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (body?.chapterIds) {
    await supabase.from("exam_chapters").delete().eq("exam_id", examId);
    if (body.chapterIds.length > 0) {
      const { error: linkError } = await supabase
        .from("exam_chapters")
        .insert(body.chapterIds.map((chapterId) => ({ exam_id: examId, chapter_id: chapterId })));
      if (linkError) return NextResponse.json({ error: linkError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/exams/[examId]">) {
  const { examId } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { error } = await supabase.from("exams").delete().eq("id", examId).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
