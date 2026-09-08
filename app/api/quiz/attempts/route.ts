import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { QuizDifficulty } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

const VALID_DIFFICULTIES: QuizDifficulty[] = ["facile", "moyen", "difficile"];

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const chapterId = request.nextUrl.searchParams.get("chapterId");
  const difficulty = request.nextUrl.searchParams.get("difficulty") as QuizDifficulty | null;
  if (!chapterId || !difficulty || !VALID_DIFFICULTIES.includes(difficulty)) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  const { data: attempts, error } = await supabase
    .from("quiz_attempts")
    .select("id, score, total, created_at")
    .eq("user_id", user.id)
    .eq("chapter_id", chapterId)
    .eq("difficulty", difficulty)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ attempts: attempts ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    chapterId?: string;
    difficulty?: QuizDifficulty;
    reponses?: (number | null)[];
  } | null;

  if (
    !body?.chapterId ||
    !body.difficulty ||
    !VALID_DIFFICULTIES.includes(body.difficulty) ||
    !Array.isArray(body.reponses)
  ) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  // Use the admin client for grading so we always read the authoritative
  // quiz (RLS would also allow this for the owner, but this avoids a second
  // round trip if the row was just written by the on-demand generator).
  const admin = createAdminClient();
  const { data: quiz } = await admin
    .from("quizzes")
    .select("questions, status")
    .eq("user_id", user.id)
    .eq("chapter_id", body.chapterId)
    .eq("difficulty", body.difficulty)
    .maybeSingle();

  if (!quiz || quiz.status !== "ready" || quiz.questions.length === 0) {
    return NextResponse.json({ error: "Quiz introuvable ou non prêt" }, { status: 404 });
  }

  const total = quiz.questions.length;
  let score = 0;
  quiz.questions.forEach((q, i) => {
    if (body.reponses![i] === q.reponseIndex) score++;
  });

  const { data: previous } = await supabase
    .from("quiz_attempts")
    .select("score")
    .eq("user_id", user.id)
    .eq("chapter_id", body.chapterId)
    .eq("difficulty", body.difficulty)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error: insertError } = await supabase.from("quiz_attempts").insert({
    user_id: user.id,
    chapter_id: body.chapterId,
    difficulty: body.difficulty,
    score,
    total,
    reponses: body.reponses,
  });

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  return NextResponse.json({
    score,
    total,
    previousScore: previous?.score ?? null,
  });
}
