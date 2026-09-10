import { redirect } from "next/navigation";

// Not a real screen — just a safety net so the floating back button's
// generic "drop the last URL segment" fallback (used only when there's no
// real in-app navigation history to go back to) never 404s from
// /quiz/chapitre/[chapterId].
export default function QuizChapitreIndexPage() {
  redirect("/quiz");
}
