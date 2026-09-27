import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/supabase/auth";
import { getSubscriptionInfo, subscriptionHasFeature } from "@/lib/subscription/gate";
import { QuizFlow } from "@/components/quiz/quiz-flow";
import { FeatureLocked } from "@/components/abonnement/feature-locked";

export default async function QuizPage(props: PageProps<"/quiz/chapitre/[chapterId]">) {
  const { chapterId } = await props.params;
  const supabase = await createClient();
  const user = await getAuthedUser();

  const [{ data: chapter }, subscription] = await Promise.all([
    supabase.from("chapters").select("id, nom").eq("id", chapterId).eq("user_id", user!.id).maybeSingle(),
    getSubscriptionInfo(user!.id),
  ]);

  if (!chapter) notFound();

  if (!subscriptionHasFeature(subscription, "quiz")) {
    return <FeatureLocked feature="quiz" currentTier={subscription.tier} />;
  }

  return <QuizFlow chapterId={chapter.id} chapterNom={chapter.nom} />;
}
