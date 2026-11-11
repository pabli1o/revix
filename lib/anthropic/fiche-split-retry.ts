import "server-only";

import { generateJson, AiOutputTruncatedError, type ClaudeContentBlock } from "./client";
import { FICHE_GENERATION_SYSTEM, validateFicheProposals, type FicheProposal } from "./prompts";
import { splitPdfBase64InHalf } from "@/lib/files/pdf-split-server";
import { logStep } from "@/lib/observability/timing";

/** claude-sonnet-5-5 at "low" effort, confirmed by a measured side-by-side
 * test (same course, same system prompt + the concision suffix in
 * prompts.ts) to hold fiche quality for roughly a third of claude-opus-5's
 * cost at "medium". "low" specifically — the model's own default effort
 * ("high", recalibrated) spent too much of maxTokens on thinking and
 * truncated on 2 of 3 test chunks before writing any fiche content. */
const FICHE_MODEL = "claude-sonnet-5-5";
const FICHE_EFFORT = { effort: "low" as const };
const FICHE_MAX_TOKENS = 8000;

/** How many times a truncated chunk may be split in half and retried
 * before giving up and surfacing the truncation as-is. 2 levels bounds
 * the worst case at 4 calls for one original chunk, which — starting from
 * an already ≤8-page/≤1MB chunk — comfortably covers any source dense
 * enough to still truncate after one split. */
const MAX_SPLIT_DEPTH = 2;

/**
 * Splits one content block list in two, for retrying a truncated
 * generation with less content per call (see AiOutputTruncatedError's doc
 * comment in client.ts). Returns null when nothing can usefully be split —
 * a single photo, or a single-page PDF — so the caller has no choice but
 * to surface the truncation to the user.
 */
async function splitContentInHalf(
  content: ClaudeContentBlock[],
): Promise<[ClaudeContentBlock[], ClaudeContentBlock[]] | null> {
  if (content.length > 1) {
    const mid = Math.ceil(content.length / 2);
    return [content.slice(0, mid), content.slice(mid)];
  }

  const [block] = content;
  if (!block) return null;

  if (block.type === "document") {
    const halves = await splitPdfBase64InHalf(block.data);
    if (!halves) return null;
    return [
      [{ type: "document", media_type: block.media_type, data: halves[0] }],
      [{ type: "document", media_type: block.media_type, data: halves[1] }],
    ];
  }

  if (block.type === "text") {
    const text = block.text;
    if (text.length < 200) return null; // nothing meaningful left to split
    const mid = Math.floor(text.length / 2);
    const nearestBreak = text.lastIndexOf("\n", mid);
    // Snap to the nearest paragraph break near the midpoint when there is
    // one close by, so neither half starts or ends mid-sentence more than
    // necessary — otherwise just split at the exact midpoint.
    const splitAt = nearestBreak > text.length * 0.25 ? nearestBreak : mid;
    return [
      [{ type: "text", text: text.slice(0, splitAt) }],
      [{ type: "text", text: text.slice(splitAt) }],
    ];
  }

  // A single photo can't be meaningfully split in two.
  return null;
}

/**
 * Generates fiches from one source chunk on claude-sonnet-5-5, retrying a
 * truncated attempt by splitting its content in two instead of retrying it
 * identically (see AiOutputTruncatedError) — up to MAX_SPLIT_DEPTH levels,
 * after which the truncation is surfaced as-is rather than splitting
 * indefinitely. Used in place of a direct generateJson call by
 * app/api/fiches/generate/route.ts.
 */
export async function generateFichesWithSplitRetry(
  userId: string,
  content: ClaudeContentBlock[],
  depth = 0,
): Promise<FicheProposal[]> {
  try {
    return await generateJson({
      userId,
      label: "fiche",
      system: FICHE_GENERATION_SYSTEM,
      content,
      maxTokens: FICHE_MAX_TOKENS,
      model: FICHE_MODEL,
      effort: FICHE_EFFORT,
      validate: validateFicheProposals,
    });
  } catch (err) {
    if (!(err instanceof AiOutputTruncatedError) || depth >= MAX_SPLIT_DEPTH) {
      throw err;
    }

    const halves = await splitContentInHalf(content);
    if (!halves) {
      throw err;
    }

    logStep(
      `fiche-split:${userId.slice(0, 8)}`,
      `truncated at depth ${depth} — splitting into 2 and retrying ` +
        `(${content.length} block(s) -> ${halves[0].length}+${halves[1].length})`,
    );

    const [first, second] = await Promise.all([
      generateFichesWithSplitRetry(userId, halves[0], depth + 1),
      generateFichesWithSplitRetry(userId, halves[1], depth + 1),
    ]);
    return [...first, ...second];
  }
}
