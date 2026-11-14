import type { HighlightKind } from "./rich-text";

const ORDER: HighlightKind[] = ["retenir", "attention", "definition", "exemple"];

/** Solid versions of the 4 highlight colors, just for the legend's small
 * dots — the in-text marks themselves stay translucent (rich-text.tsx's
 * HIGHLIGHT_COLOR_VAR) so they read as a highlighter stroke, but a pale
 * translucent tint makes a poor, hard-to-tell-apart 10px dot on white. */
const LEGEND_DOT_COLOR: Record<HighlightKind, string> = {
  retenir: "#fde047",
  attention: "var(--color-danger)",
  definition: "var(--color-accent)",
  exemple: "var(--color-success)",
};

/**
 * A small color key, shown on a fiche only when it actually uses one of
 * the 3 newer highlight colors (red/blue/green) — "retenir" (yellow)
 * alone needs no explanation, it's always been there, but the other 3
 * colors' meaning isn't obvious without one. Plain presentational
 * component (no own i18n/data fetching) so it works from both a Server
 * Component (the real fiche page) and a Client Component (FicheViewer,
 * proposal-preview.tsx) alike — the caller passes already-resolved
 * labels from its own `t`.
 */
export function HighlightLegend({
  kinds,
  labels,
}: {
  kinds: Set<HighlightKind>;
  labels: Record<HighlightKind, string>;
}) {
  const present = ORDER.filter((k) => kinds.has(k));
  if (present.length === 0) return null;

  return (
    <div className="mb-6 flex flex-wrap gap-x-4 gap-y-1.5">
      {present.map((kind) => (
        <span key={kind} className="flex items-center gap-1.5 text-xs text-text-muted">
          <span aria-hidden className="size-2.5 rounded-full" style={{ backgroundColor: LEGEND_DOT_COLOR[kind] }} />
          {labels[kind]}
        </span>
      ))}
    </div>
  );
}
