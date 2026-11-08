import { getProfile } from "@/lib/supabase/profile";

/** Shared header shown at the top of every main tab (Fiches / Examen /
 * Planning / Quiz), per the validated design spec: a big ambre badge, a
 * huge pale Reviix logo watermark, and a one-line intro. Deliberately
 * identical across the four tabs — which tab you're on is communicated by
 * the active pill in the nav, not by a per-page title.
 *
 * The badge itself is sized to read as a real headline, not a small tag —
 * `rounded-2xl` (not `rounded-full`, which stops looking like a badge once
 * its content wraps) and no `whitespace-nowrap` on the outer text, so a
 * narrow phone wraps it to 2 lines instead of shrinking or overflowing;
 * "moins de 2 min" alone stays on one line (its own `whitespace-nowrap`)
 * so the number is never split across the wrap. `max-w-full` on the badge
 * keeps it inside the viewport on a small phone. It stays in normal block
 * flow (no absolute positioning) so a taller, wrapped badge simply pushes
 * the logo watermark and intro line below it down — never overlaps them.
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
      <div className="mb-3 inline-flex max-w-full items-start gap-2.5 rounded-2xl bg-accent px-4 py-3 text-[#1A1A1A] sm:px-5 sm:py-3.5">
        <span aria-hidden className="text-2xl leading-tight">
          🎓
        </span>
        <span className="font-heading text-xl font-bold leading-snug sm:text-2xl">
          Tes fiches de révision en{" "}
          <span className="whitespace-nowrap underline decoration-[3px] decoration-[#1A1A1A]/50">
            moins de 2 min
          </span>
        </span>
      </div>
      <img
        src="/reviix-wordmark.png"
        alt=""
        aria-hidden
        className="h-12 w-auto opacity-[0.06] md:h-20"
      />
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
