import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "@/components/onboarding/wizard";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // No account yet: this is the very first screen a new visitor sees
  // (see app/page.tsx) — answers are kept in the browser, nothing to
  // check server-side (see OnboardingWizard's "anonymous" mode).
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
