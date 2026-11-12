import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "@/components/onboarding/wizard";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // No account yet: reached from a call to action on the landing page
  // (see app/page.tsx / components/marketing/landing-page.tsx), never a
  // redirect — answers are kept in the browser, nothing to check
  // server-side (see OnboardingWizard's "anonymous" mode).
  if (!user) {
    return <OnboardingWizard mode="anonymous" />;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.onboarding_completed) {
    redirect("/fiches");
  }

  return <OnboardingWizard mode="authenticated" />;
}
