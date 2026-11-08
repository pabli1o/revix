import { getAuthedUser } from "@/lib/supabase/auth";
import { getSubscriptionInfo } from "@/lib/subscription/gate";
import { CreationFlow } from "@/components/fiches/new/creation-flow";

export default async function NewFichePage(props: PageProps<"/fiches/new">) {
  const searchParams = await props.searchParams;
  const user = await getAuthedUser();

  const subscription = await getSubscriptionInfo(user!.id);

  return (
    <CreationFlow
      isSubscribed={subscription.isActive}
      resumeFromDraft={searchParams.resume === "1"}
    />
  );
}
