import { getAuthedUser } from "@/lib/supabase/auth";
import { getSubscriptionInfo } from "@/lib/subscription/gate";
import { CreationFlow } from "@/components/fiches/new/creation-flow";

export default async function NewFichePage() {
  const user = await getAuthedUser();

  const subscription = await getSubscriptionInfo(user!.id);

  return <CreationFlow isSubscribed={subscription.isActive} />;
}
