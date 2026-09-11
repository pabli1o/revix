import { getProfile } from "@/lib/supabase/profile";

/** Shared header shown at the top of every main tab (Fiches / Examen /
 * Planning / Quiz), per the validated design spec: an ambre pill badge,
 * a huge pale "Revix" watermark, and a one-line intro. Deliberately
 * identical across the four tabs — which tab you're on is communicated by
 * the active pill in the nav, not by a per-page title.
 *
 * Once the user's prenom is known (set during onboarding), the intro line
 * is personalized as "Salut [Prénom] 👋 — …", exactly per spec — this is
 * the app's one canonical greeting pattern, reused wherever it addresses
 * the user directly. */
export async function AppHeader() {
  const profile = await getProfile();
  const prenom = profile?.prenom?.trim();

  return (
    <div className="mb-8">
      <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-[#191A2E]">
        <span aria-hidden>🎓</span>
        <span>Réviser malin, sans y passer la nuit</span>
      </div>
      <h1
        aria-hidden
        className="select-none font-heading text-6xl font-bold leading-[0.9] text-text/[0.06] md:text-8xl"
      >
        Revix
      </h1>
      <p className="mt-2 text-text-muted">
        {prenom ? (
          <>
            Salut {prenom} 👋 — tes fiches, réparties automatiquement jusqu&apos;à l&apos;examen.
          </>
        ) : (
          <>Tes fiches, réparties automatiquement jusqu&apos;à l&apos;examen.</>
        )}
      </p>
    </div>
  );
}
