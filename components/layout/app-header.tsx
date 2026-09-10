/** Shared header shown at the top of every main tab (Fiches / Examen /
 * Planning / Quiz), per the validated design spec: an ambre pill badge,
 * a huge pale "Revix" watermark, and a one-line intro. Deliberately
 * identical across the four tabs — which tab you're on is communicated by
 * the active pill in the nav, not by a per-page title. */
export function AppHeader() {
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
        Tes fiches, réparties automatiquement jusqu&apos;à l&apos;examen.
      </p>
    </div>
  );
}
