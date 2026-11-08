/**
 * Thin ambre progress bar shown at the top of a multi-screen flow
 * (onboarding, création de fiche) — `step` is 1-indexed ("écran 2 sur 4"),
 * so a fresh flow still shows a sliver of progress on its very first
 * screen instead of an empty track.
 */
export function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = Math.min(100, Math.max(0, (step / total) * 100));
  return (
    <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-bg-elevated" aria-hidden>
      <div
        className="h-full rounded-full bg-accent transition-all duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
