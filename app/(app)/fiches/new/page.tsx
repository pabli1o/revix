import { createClient } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/supabase/auth";
import { getSubscriptionInfo } from "@/lib/subscription/gate";
import { CreationFlow } from "@/components/fiches/new/creation-flow";

export default async function NewFichePage(props: PageProps<"/fiches/new">) {
  const searchParams = await props.searchParams;
  const user = await getAuthedUser();

  const subscription = await getSubscriptionInfo(user?.id);

  // Known upfront for an authenticated non-subscriber, so the "fiche
  // d'essai déjà utilisée" message can show immediately instead of only
  // after a pointless round trip to /api/fiches/generate (which enforces
  // the same cap server-side regardless — see that route).
  let freeTrialExhausted = false;
  if (user && !subscription.isActive) {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("free_fiche_generated")
      .eq("id", user.id)
      .maybeSingle();
    freeTrialExhausted = profile?.free_fiche_generated ?? false;
  }

  return (
    <CreationFlow
      isSubscribed={subscription.isActive}
      isAuthenticated={Boolean(user)}
      resumeFromDraft={searchParams.resume === "1"}
      initialFreeTrialExhausted={freeTrialExhausted}
    />
  );
}
