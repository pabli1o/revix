import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthedUser } from "@/lib/supabase/auth";
import { getProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";
import { getSubscriptionInfo, subscriptionHasFeature } from "@/lib/subscription/gate";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { NavLinks } from "@/components/layout/nav-links";
import { SettingsMenu } from "@/components/layout/settings-menu";
import { FloatingBackButton } from "@/components/layout/floating-back-button";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { getDictionary } from "@/lib/i18n/server";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await getAuthedUser();
  const t = await getDictionary();

  // Shared with <AppHeader /> via React's cache() — same request, same
  // underlying query fires only once regardless of how many places read it.
  // Returns null for an anonymous visitor (nothing to redirect on below).
  const profile = await getProfile();

  // Only an actual account can be "mid-onboarding" — an anonymous visitor
  // already did the local-only version of it before ever reaching here
  // (see app/page.tsx → app/onboarding/page.tsx's anonymous mode).
  if (user && !profile?.onboarding_completed) {
    redirect("/onboarding");
  }

  // Not folded into getProfile()'s cached select: its revalidation tag is
  // only busted by the onboarding/prenom-nom write paths (see
  // lib/supabase/profile.ts), not by /api/planning/settings — adding these
  // two columns there would make a rhythm change invisible here for up to
  // 5 minutes. A plain, uncached read instead, same as
  // app/(app)/examen/page.tsx already does for the same fields.
  let revisionJoursSemaine = 3;
  let revisionMinutesJour = 45;
  if (user) {
    const supabase = await createClient();
    const { data: rhythm } = await supabase
      .from("profiles")
      .select("revision_jours_semaine, revision_minutes_jour")
      .eq("id", user.id)
      .maybeSingle();
    revisionJoursSemaine = rhythm?.revision_jours_semaine ?? 3;
    revisionMinutesJour = rhythm?.revision_minutes_jour ?? 45;
  }

  const subscription = await getSubscriptionInfo(user?.id);
  const lockedTabs = {
    examen: !subscriptionHasFeature(subscription, "examen"),
    planning: !subscriptionHasFeature(subscription, "planning"),
    quiz: !subscriptionHasFeature(subscription, "quiz"),
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Sticky on mobile (row 1: logo+switcher / settings, row 2: the 4
         tabs spanning the full width — see NavLinks' compact mode) so the
         app's whole nav stays reachable while `main` scrolls underneath;
         a normal, non-sticky vertical sidebar from md: up, unchanged. */}
      <aside className="sticky top-0 z-40 flex flex-col border-b border-border bg-bg-elevated md:static md:z-auto md:w-64 md:border-b-0 md:border-r md:px-5 md:py-6">
        <div className="flex items-center justify-between px-4 py-3 md:px-0 md:py-0 md:mb-8">
          <div className="flex items-center gap-2">
            <Link href="/fiches" prefetch={true}>
              <span className="font-heading text-xl font-bold tracking-tight text-accent">Reviix</span>
            </Link>
            <LanguageSwitcher />
          </div>
          {user && (
            <SettingsMenu
              revisionJoursSemaine={revisionJoursSemaine}
              revisionMinutesJour={revisionMinutesJour}
            />
          )}
        </div>
        <div className="hidden md:block">
          <NavLinks locked={lockedTabs} />
        </div>
        <div className="border-t border-border md:hidden">
          <NavLinks compact locked={lockedTabs} />
        </div>
        {user && (
          <div className="hidden md:mt-auto md:block">
            <p className="mb-2 truncate text-sm text-text-muted">
              {profile?.prenom ? t.nav.greeting(profile.prenom) : ""}
            </p>
            <SignOutButton />
          </div>
        )}
      </aside>
      <FloatingBackButton />
      <main className="flex-1 px-4 py-6 md:px-10 md:py-10">{children}</main>
    </div>
  );
}
