import { createClient } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/supabase/auth";
import { getSubscriptionInfo } from "@/lib/subscription/gate";
import { AssignFlow } from "@/components/fiches/new/assign-flow";

export default async function AssignFichePage(props: PageProps<"/fiches/new/assign">) {
  const searchParams = await props.searchParams;
  const draftId = typeof searchParams.draft === "string" ? searchParams.draft : "";
  const checkout = typeof searchParams.checkout === "string" ? searchParams.checkout : undefined;

  const supabase = await createClient();
  const user = await getAuthedUser();

  const [{ data: subjects }, { data: chapters }, subscription] = await Promise.all([
    supabase.from("subjects").select("id, nom").eq("user_id", user!.id).order("nom"),
    supabase.from("chapters").select("id, nom, subject_id").eq("user_id", user!.id).order("nom"),
    getSubscriptionInfo(user!.id),
  ]);

  return (
    <AssignFlow
      draftId={draftId}
      checkoutStatus={checkout === "success" || checkout === "cancel" ? checkout : null}
      subjects={subjects ?? []}
      chapters={chapters ?? []}
      initialIsSubscribed={subscription.isActive}
    />
  );
}
