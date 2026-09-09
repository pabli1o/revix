import { createClient } from "@/lib/supabase/server";
import { getSubscriptionInfo } from "@/lib/subscription/gate";
import { CreationFlow } from "@/components/fiches/new/creation-flow";

export default async function NewFichePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const subscription = await getSubscriptionInfo(user!.id);

  return <CreationFlow isSubscribed={subscription.isActive} />;
}
