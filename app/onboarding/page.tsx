import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard, type Step } from "@/components/onboarding/wizard";
import type { OnboardingReponses } from "@/lib/onboarding/qualification";

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
    .select(
      "onboarding_completed, prenom, classe_cycle, classe_niveau, moyenne_generale_depart, objectif_moyenne, onboarding_reponses",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.onboarding_completed) {
    redirect("/fiches");
  }

  const reponses: OnboardingReponses = (profile?.onboarding_reponses as OnboardingReponses | null) ?? {};

  // Signup now happens right after the prénom step (see
  // components/onboarding/wizard.tsx's handlePrenomContinue), and the
  // flow no longer asks for a rhythm at all (see ASSUMED_DAYS_PER_WEEK),
  // so an authenticated-but-incomplete profile falls into one of these
  // checkpoints:
  //  - classe_cycle still null: signup happened without ever doing
  //    onboarding at all (e.g. a direct visit to /signup) — start from
  //    the very first question.
  //  - classe_cycle set, moyenne_generale_depart still null: the normal
  //    case right after signup — resume at "moyenneActuelle".
  //  - moyenne_generale_depart set, no "blocages" answer yet: resume at
  //    "moyenneObjectif". Not a precise checkpoint — objectif_moyenne is
  //    NOT NULL DEFAULT 10 (migration 0016), so it can never distinguish
  //    "never touched" from "touched, then moved on" the way the nullable
  //    moyenne_generale_depart can. Re-confirming a quick slider pick is
  //    the accepted cost (this mirrors a pre-existing gap: analyzing/
  //    result were never separately resumable either).
  //  - "blocages" answered, no "methodeRevision" yet: resume there — the
  //    jsonb's own keys ARE a precise signal, unlike objectif_moyenne.
  //  - "methodeRevision" answered too: resume at "prochainExamen" — the
  //    last rung, whether its own answer is missing or (a reload right
  //    after answering it, before the client-only analyzing/result
  //    screens finish) already present.
  const initialStep: Step = !profile?.classe_cycle
    ? "classe"
    : profile?.moyenne_generale_depart == null
      ? "moyenneActuelle"
      : !reponses.blocages
        ? "moyenneObjectif"
        : !reponses.methodeRevision
          ? "methodeRevision"
          : "prochainExamen";

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
        blocages: reponses.blocages,
        methodeRevision: reponses.methodeRevision,
        prochainExamen: reponses.prochainExamen,
      }}
    />
  );
}
