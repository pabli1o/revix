import { createClient } from "@/lib/supabase/server";
import { getSubscriptionInfo } from "@/lib/subscription/gate";
import { CreationFlow } from "@/components/fiches/new/creation-flow";

export default async function NewFichePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: subjects }, { data: chapters }, subscription] = await Promise.all([
    supabase.from("subjects").select("id, nom").eq("user_id", user!.id).order("nom"),
    supabase.from("chapters").select("id, nom, subject_id").eq("user_id", user!.id).order("nom"),
    getSubscriptionInfo(user!.id),
  ]);

  return (
    <CreationFlow
      subjects={subjects ?? []}
      chapters={chapters ?? []}
      isSubscribed={subscription.isActive}
    />
  );
}
