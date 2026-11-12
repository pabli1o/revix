import { getProfile } from "@/lib/supabase/profile";

/**
 * Shown at the top of every main tab (Fiches / Examen / Planning / Quiz).
 * Two variants:
 *
 * - `"hero"` (Fiches only — the app's actual home screen; the public sales
 *   landing page at `/` for signed-out visitors is a separate component,
 *   components/marketing/landing-page.tsx) reads as a real page headline: two
 *   bold lines ("Tes fiches de révision" in near-black, "en moins de 2
 *   min." in navy), a short gray explanation line, then a pale "Reviix"
 *   text watermark (plain text, not the image logo — see app/(app)/layout.tsx
 *   for where the real logo lives). Sized with explicit breakpoints (not open-ended padding)
 *   so it stays well short of the viewport height on a small phone —
 *   the "+ Créer une fiche" button is a `fixed` bottom bar regardless
 *   (see floating-bottom-bar.tsx) and is never actually hidden by page
 *   height, but a hero that eats the whole first screen would still
 *   feel wrong before any real content shows.
 * - `"compact"` (Examen/Planning/Quiz) drops the big headline entirely —
 *   just the existing small one-line reminder, so the tab's own content
 *   starts right away instead of repeating the home screen's title on
 *   every tab.
 *
 * Once the user's prenom is known (set during onboarding), the small
 * line is personalized as "Salut [Prénom] — …", exactly per spec —
 * the app's one canonical greeting pattern, reused wherever it addresses
 * the user directly.
 */
export async function AppHeader({ variant = "compact" }: { variant?: "hero" | "compact" }) {
  const profile = await getProfile();
  const prenom = profile?.prenom?.trim();

  const intro = prenom ? (
    <>Salut {prenom} — tes fiches, réparties automatiquement jusqu&apos;à l&apos;examen.</>
  ) : (
    <>Tes fiches, réparties automatiquement jusqu&apos;à l&apos;examen.</>
  );

  if (variant === "compact") {
    return (
      <div className="mb-6">
        <p className="text-sm text-text-muted">{intro}</p>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h1 className="text-[2.5rem] leading-[1.08] font-extrabold tracking-tight sm:text-6xl">
        <span className="block text-text">Tes fiches de révision</span>
        <span className="block text-accent">en moins de 2 min.</span>
      </h1>
      <p className="mt-3 text-base text-text-muted">Colle ton cours, ta fiche est prête.</p>
      <span
        aria-hidden
        className="mt-4 block font-heading text-4xl font-bold tracking-tight text-accent opacity-[0.06] md:text-6xl"
      >
        Reviix
      </span>
    </div>
  );
}
