import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LandingPage } from "@/components/marketing/landing-page";

export const metadata: Metadata = {
  title: "Reviix — Tes fiches de révision en moins de 2 min",
  description:
    "Dépose ton cours, récupère une fiche de révision claire en quelques secondes — planning avant l'examen et quiz inclus.",
  openGraph: {
    title: "Reviix — Tes fiches de révision en moins de 2 min",
    description:
      "Dépose ton cours, récupère une fiche de révision claire en quelques secondes — planning avant l'examen et quiz inclus.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Reviix — Tes fiches de révision en moins de 2 min",
    description:
      "Dépose ton cours, récupère une fiche de révision claire en quelques secondes — planning avant l'examen et quiz inclus.",
  },
};

export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // No account yet: the sales landing page (the trial flow itself lives at
  // its own address, /onboarding — see app/onboarding/page.tsx's
  // anonymous mode, linked from every call to action below).
  if (!user) {
    return <LandingPage />;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.onboarding_completed) {
    redirect("/onboarding");
  }

  redirect("/fiches");
}
