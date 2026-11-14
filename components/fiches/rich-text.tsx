import { Fragment } from "react";

/**
 * Renders the fiche generation prompt's 4 inline markers as a real paper
 * highlighter effect (translucent color behind the text, like a
 * highlighter stroke) rather than plain styled text — used only inside
 * the notebook-paper fiche content. Each marker has one fixed meaning,
 * set in lib/anthropic/prompts.ts's FICHE_GENERATION_SYSTEM:
 *
 * - `**text**` — yellow — à retenir (unchanged since before the other 3
 *   existed; every fiche generated before this file grew the other 3
 *   markers still renders exactly as it always did).
 * - `!!text!!` — red — attention / piège.
 * - `::text::` — blue — définition.
 * - `%%text%%` — green — exemple.
 *
 * `::` and `%%` (rather than the more Markdown-ish `==`/`++`) are a
 * deliberate choice: a math or code-adjacent fiche (ratios, equality
 * operators, increment operators) is exactly the content most likely to
 * contain a stray `==` or `++` that isn't meant as a highlight marker —
 * `::` and `%%` essentially never occur naturally in French/English/
 * Spanish course content.
 *
 * The 4 delimiter characters never overlap with each other or with
 * plain punctuation a fiche would otherwise contain, so a single
 * alternation can split on all 4 at once without ambiguity.
 */
const MARKER_PATTERN = /(\*\*[^*]+\*\*|!![^!]+!!|::[^:]+::|%%[^%]+%%)/g;

export type HighlightKind = "retenir" | "attention" | "definition" | "exemple";

const HIGHLIGHT_BY_DELIMITER: Record<string, HighlightKind> = {
  "**": "retenir",
  "!!": "attention",
  "::": "definition",
  "%%": "exemple",
};

export const HIGHLIGHT_COLOR_VAR: Record<HighlightKind, string> = {
  retenir: "var(--color-highlight)",
  attention: "var(--color-highlight-red)",
  definition: "var(--color-highlight-blue)",
  exemple: "var(--color-highlight-green)",
};

/** Which of the 4 highlight kinds actually appear in a piece of fiche
 * text — drives the optional color legend (components/fiches/highlight-legend.tsx),
 * which only lists colors the fiche actually uses. */
export function detectHighlightKinds(texts: string[]): Set<HighlightKind> {
  const found = new Set<HighlightKind>();
  for (const text of texts) {
    for (const match of text.matchAll(MARKER_PATTERN)) {
      const delimiter = match[0].slice(0, 2);
      const kind = HIGHLIGHT_BY_DELIMITER[delimiter];
      if (kind) found.add(kind);
    }
  }
  return found;
}

export function RichText({ text }: { text: string }) {
  const parts = text.split(MARKER_PATTERN);
  return (
    <>
      {parts.map((part, i) => {
        const delimiter = part.slice(0, 2);
        const kind = HIGHLIGHT_BY_DELIMITER[delimiter];
        if (kind && part.endsWith(delimiter)) {
          return (
            <mark
              key={i}
              className="rounded-[2px] px-0.5 font-semibold text-inherit"
              style={{ backgroundColor: HIGHLIGHT_COLOR_VAR[kind] }}
            >
              {part.slice(2, -2)}
            </mark>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}
