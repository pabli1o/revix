import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { NavLinks } from "@/components/layout/nav-links";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("prenom, onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.onboarding_completed) {
    redirect("/onboarding");
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="flex flex-row items-center justify-between border-b border-border bg-bg-elevated px-4 py-3 md:w-64 md:flex-col md:items-stretch md:justify-start md:border-b-0 md:border-r md:px-5 md:py-6">
        <div className="flex items-center justify-between md:mb-8">
          <Link href="/fiches" className="font-heading text-xl font-semibold text-accent">
            Revix
          </Link>
        </div>
        <div className="hidden md:block">
          <NavLinks />
        </div>
        <div className="flex items-center gap-3 md:hidden">
          <NavLinks compact />
        </div>
        <div className="hidden md:mt-auto md:block">
          <p className="mb-2 truncate text-sm text-text-muted">
            {profile.prenom ? `Salut, ${profile.prenom} !` : ""}
          </p>
          <SignOutButton />
        </div>
      </aside>
      <main className="flex-1 px-4 py-6 md:px-10 md:py-10">{children}</main>
    </div>
  );
}
