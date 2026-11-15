import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard, type Step } from "@/components/onboarding/wizard";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // No account yet: reached from a call to action on the landing page
  // (see app/page.tsx / components/marketing/landing-page.tsx), never a
  // redirect — answers are kept in the browser, nothing to check
  // server-side (see OnboardingWizard's "anonymous" mode). Those CTAs
  // always carry ?nouveau=1 so a returning visitor always restarts here;
  // the wizard itself handles that param (and the one genuine mid-flow
  // resume case) client-side.
  if (!user) {
    return <OnboardingWizard mode="anonymous" />;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed, prenom, classe_cycle, classe_niveau, moyenne_generale_depart, objectif_moyenne")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.onboarding_completed) {
    redirect("/fiches");
  }

  // Signup now happens right after the prénom step (see
  // components/onboarding/wizard.tsx's handlePrenomContinue), and the
  // flow no longer asks for a rhythm at all (see ASSUMED_DAYS_PER_WEEK),
  // so an authenticated-but-incomplete profile always falls into one of
  // two checkpoints:
  //  - classe_cycle still null: signup happened without ever doing
  //    onboarding at all (e.g. a direct visit to /signup) — start from
  //    the very first question.
  //  - classe_cycle set, moyenne_generale_depart still null: the normal
  //    case right after signup — resume at "moyenneActuelle".
  //  - moyenne_generale_depart set: only "moyenneObjectif" (and the
  //    analyzing/result screens after it) is left.
  const initialStep: Step = !profile?.classe_cycle
    ? "classe"
    : profile?.moyenne_generale_depart == null
      ? "moyenneActuelle"
      : "moyenneObjectif";

  return (
    <OnboardingWizard
      mode="authenticated"
      initialStep={initialStep}
      prefill={{
        prenom: profile?.prenom,
        classeCycle: profile?.classe_cycle,
        classeNiveau: profile?.classe_niveau,
        moyenneGeneraleDepart: profile?.moyenne_generale_depart,
        objectifMoyenne: profile?.objectif_moyenne,
      }}
    />
  );
}
