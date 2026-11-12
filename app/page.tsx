import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LandingPage } from "@/components/marketing/landing-page";
import { getDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return {
    title: t.root.siteTagline,
    description: t.root.siteDescription,
    openGraph: {
      title: t.root.siteTagline,
      description: t.root.siteDescription,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: t.root.siteTagline,
      description: t.root.siteDescription,
    },
  };
}

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
