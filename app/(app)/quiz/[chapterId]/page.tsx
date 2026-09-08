import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { QuizFlow } from "@/components/quiz/quiz-flow";

export default async function QuizPage(props: PageProps<"/quiz/[chapterId]">) {
  const { chapterId } = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: chapter } = await supabase
    .from("chapters")
    .select("id, nom")
    .eq("id", chapterId)
    .eq("user_id", user!.id)
    .maybeSingle();

  if (!chapter) notFound();

  return <QuizFlow chapterId={chapter.id} chapterNom={chapter.nom} />;
}
