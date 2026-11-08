import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreationFlow } from "@/components/fiches/new/creation-flow";

/**
 * A logged-out visitor gets straight to work instead of a marketing
 * page or the signup form: the same "Nouvelle fiche" screen an
 * authenticated user sees, outside the (app) layout (no sidebar/nav —
 * there's nothing to navigate to yet). Clicking "Générer la fiche" is
 * what actually asks them to sign in (see CreationFlow's
 * isAuthenticated=false branch) — not landing here.
 */
export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="notebook-paper min-h-screen px-4 py-8 sm:py-12">
        <div className="mx-auto max-w-2xl">
          <h1 className="font-heading text-3xl font-bold leading-snug sm:text-4xl">
            Tes fiches de révision en{" "}
            <span className="whitespace-nowrap underline decoration-accent decoration-[3px]">
              moins de 2 min
            </span>
          </h1>
          <p className="mt-3 text-text-muted">
            Colle ton cours, ajoute des photos, un PDF ou un Word — connecte-toi seulement au
            moment d&apos;enregistrer ta fiche.
          </p>
          <div className="mt-8">
            <CreationFlow isSubscribed={false} isAuthenticated={false} />
          </div>
        </div>
      </div>
    );
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
