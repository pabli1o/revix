import "server-only";

import { randomUUID } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { assertAiUsageBudgetAvailable, recordAiUsageCost } from "@/lib/subscription/gate";
import { elapsedMs, logStep, startTimer } from "@/lib/observability/timing";

const DEFAULT_MODEL = "claude-opus-5";
const MAX_ATTEMPTS = 3;
const DEFAULT_MAX_TOKENS = 8000;

/** Claude Opus 5 runs adaptive thinking by default when `effort` is left
 * unset, at its default of "high" — billed as output tokens ($25/Mtok)
 * even though generateJson only ever reads the final `text` block, never
 * the `thinking` one. Structured-extraction tasks (turn given sources into
 * a fixed JSON shape) don't need that much thinking per Anthropic's own
 * published cost/quality curves — this is the default for callers that
 * don't override it (currently quiz generation, see lib/quiz/generate.ts).
 * Fiche generation overrides both model and effort — see
 * lib/anthropic/fiche-split-retry.ts — after a measured side-by-side test
 * confirmed claude-sonnet-5-5 at "low" holds fiche quality for roughly a
 * third of the cost. */
const DEFAULT_EFFORT: Anthropic.OutputConfig = { effort: "medium" };

/** USD per million tokens, per model — kept in sync by hand against
 * platform.claude.com/docs/en/about-claude/pricing since pricing isn't
 * queryable from the API. computeCostUsd throws rather than silently
 * under-costing (which would quietly break the usage cap) for any model
 * not listed here. cacheReadMultiplier differs by model: 0.1x on Claude
 * Opus 5, 0.05x on Claude Sonnet 5.5 (and Claude Opus 5.5). The 5-minute
 * cache *write* multiplier (1.25x) is the same across every current model,
 * so it isn't part of this per-model table. */
const MODEL_PRICING_USD_PER_MTOK: Record<
  string,
  { input: number; output: number; cacheReadMultiplier: number }
> = {
  "claude-opus-5": { input: 5, output: 25, cacheReadMultiplier: 0.1 },
  "claude-sonnet-5-5": { input: 2, output: 10, cacheReadMultiplier: 0.05 },
};

/** Prompt-caching write multiplier off the base input price, for the
 * default 5-minute ephemeral cache_control TTL used on the system prompt
 * below (see toAnthropicSystem). Fiche/quiz generation calls share the
 * exact same (short, static) system prompt per label across every user,
 * so once any call has warmed the cache, every other call within the TTL
 * — including concurrent parallel chunks of the same fiche upload, and any
 * other user's calls shortly after — reads it cheaply instead of paying
 * full input price for it again. */
const CACHE_WRITE_MULTIPLIER = 1.25;

function computeCostUsd(model: string, usage: Anthropic.Usage): number {
  const pricing = MODEL_PRICING_USD_PER_MTOK[model];
  if (!pricing) {
    throw new Error(`No pricing configured for model "${model}" — update MODEL_PRICING_USD_PER_MTOK.`);
  }
  const { input, output, cacheReadMultiplier } = pricing;
  const cacheWriteTokens = usage.cache_creation_input_tokens ?? 0;
  const cacheReadTokens = usage.cache_read_input_tokens ?? 0;
  return (
    (usage.input_tokens / 1_000_000) * input +
    (cacheWriteTokens / 1_000_000) * input * CACHE_WRITE_MULTIPLIER +
    (cacheReadTokens / 1_000_000) * input * cacheReadMultiplier +
    (usage.output_tokens / 1_000_000) * output
  );
}

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

export type ClaudeContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; media_type: "image/jpeg" | "image/png" | "image/webp"; data: string }
  | { type: "document"; media_type: "application/pdf"; data: string };

function toAnthropicContent(blocks: ClaudeContentBlock[]): Anthropic.ContentBlockParam[] {
  return blocks.map((block) => {
    if (block.type === "text") {
      return { type: "text", text: block.text };
    }
    if (block.type === "image") {
      return {
        type: "image",
        source: { type: "base64", media_type: block.media_type, data: block.data },
      };
    }
    return {
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data: block.data },
    };
  });
}

export class AiGenerationError extends Error {}

/** Thrown instead of retrying identically when a generation attempt
 * truncates (stop_reason === "max_tokens"): the content sent was too dense
 * for maxTokens, so an identical retry would very likely truncate again
 * for the same reason, wasting its full cost for nothing. Fiche generation
 * catches this specifically and retries by splitting the source content in
 * two instead — see lib/anthropic/fiche-split-retry.ts. */
export class AiOutputTruncatedError extends AiGenerationError {}

/**
 * Strips a ```json ... ``` (or bare ```...```) fence if the model wrapped
 * its JSON output in one despite instructions not to.
 */
function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

interface GenerateJsonOptions<T> {
  userId: string;
  system: string;
  content: ClaudeContentBlock[];
  maxTokens?: number;
  /** Defaults to DEFAULT_MODEL ("claude-opus-5") — quiz generation relies
   * on this default. Fiche generation overrides it to "claude-sonnet-5-5"
   * (see lib/anthropic/fiche-split-retry.ts). */
  model?: string;
  /** Defaults to DEFAULT_EFFORT ({effort: "medium"}). Fiche generation
   * overrides it to {effort: "low"}. */
  effort?: Anthropic.OutputConfig;
  /**
   * Validates AND narrows the parsed JSON. Must throw or return null when
   * the payload is missing required data (which can happen even on a
   * successful HTTP 200 response if the model truncated or hallucinated an
   * incomplete structure) — the caller only ever receives a fully valid T.
   */
  validate: (value: unknown) => T | null;
  /** Short caller-supplied name (e.g. "fiche", "quiz:facile") used only to
   * make the timing logs below legible — see lib/observability/timing.ts. */
  label?: string;
}

/**
 * Calls Claude expecting a strict JSON response, validates completeness,
 * and automatically retries (up to MAX_ATTEMPTS) when the response is
 * empty, truncated (stop_reason === "max_tokens"), not valid JSON, or fails
 * the caller's `validate` check.
 *
 * No longer serialized through a global app-wide lock (removed — see git
 * history for `lib/anthropic/lock.ts`): that lock existed to keep fiche
 * and quiz generation from ever running concurrently, but once fiche
 * generation started deliberately firing several chunks of the same
 * upload in parallel (see creation-flow.tsx), the lock just queued those
 * parallel calls back into a single-file line and started timing out the
 * ones stuck waiting behind it — the exact opposite of what
 * parallelization was for. Multiple concurrent Claude calls don't corrupt
 * any shared state here (usage cost is recorded via an atomic SQL
 * increment, see recordAiUsageCost below), so nothing but that now-
 * obsolete sequencing depended on the lock.
 *
 * Usage budget: checked once up front (an active subscriber already at
 * their cap can't start a new generation) and every attempt's real cost is
 * recorded against the user's monthly total regardless of whether that
 * attempt succeeds — a failed/retried attempt still consumed real Claude
 * tokens and must still count. Because the check only happens once before
 * the retry loop, a user sitting just under the cap can overshoot it by up
 * to MAX_ATTEMPTS-1 extra attempts' worth of cost on a single call that
 * needs retries — bounded and acceptable, same tradeoff already accepted by
 * the old fiche-count cap (see git history) for a simpler implementation.
 * Without the lock, several parallel chunks of one upload can now also all
 * pass this check before any of them has recorded its own cost, so the
 * same user could in theory overshoot by a few concurrent chunks' worth of
 * cost in one generation — still bounded (by how many chunks one upload
 * produces, typically a handful) and, for a monthly soft budget rather
 * than a hard security limit, an acceptable trade for real parallelism.
 */
export async function generateJson<T>({
  userId,
  system,
  content,
  maxTokens = DEFAULT_MAX_TOKENS,
  model = DEFAULT_MODEL,
  effort = DEFAULT_EFFORT,
  validate,
  label = "generate",
}: GenerateJsonOptions<T>): Promise<T> {
  const tag = `${label}:${randomUUID().slice(0, 8)}`;
  const totalStarted = startTimer();
  logStep(tag, `start — ${content.length} content block(s): ${content.map((b) => b.type).join(", ")}`);

  try {
    await assertAiUsageBudgetAvailable(userId);

    const anthropic = getClient();
    let lastError: string = "Erreur inconnue";
    let result: T | null = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const attemptStarted = startTimer();
      const response = await anthropic.messages.create({
        model,
        max_tokens: maxTokens,
        // Cached (ephemeral, 5-minute TTL): every fiche/quiz call under
        // one `label` sends this exact same static string, so after the
        // first call warms the cache, every other call within the TTL —
        // including concurrent parallel chunks of the same upload, and
        // any other user's calls shortly after — reads it cheaply instead
        // of paying full input price for it again. Below the model's
        // minimum cacheable prefix this silently just doesn't cache —
        // harmless, not an error.
        system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: toAnthropicContent(content) }],
        output_config: effort,
      });
      const cost = computeCostUsd(model, response.usage);
      // thinking_tokens is logged on its own: it's the exact lever the
      // `effort` param targets, so this line is what shows in Vercel logs
      // whether a given effort level actually moved it, rather than
      // inferring that from the cost total alone.
      // cache_write/cache_read are logged for the same reason, to
      // verify in Vercel logs that prompt caching is actually hitting
      // rather than silently no-op'ing (see the comment above).
      logStep(
        tag,
        `attempt ${attempt}/${MAX_ATTEMPTS} — ${elapsedMs(attemptStarted)}ms, ` +
          `stop_reason=${response.stop_reason}, in=${response.usage.input_tokens}tok, ` +
          `cache_write=${response.usage.cache_creation_input_tokens ?? 0}tok, ` +
          `cache_read=${response.usage.cache_read_input_tokens ?? 0}tok, ` +
          `out=${response.usage.output_tokens}tok ` +
          `(thinking=${response.usage.output_tokens_details?.thinking_tokens ?? "n/a"}tok), ` +
          `cost=$${cost.toFixed(4)}`,
      );

      await recordAiUsageCost(userId, cost);

      const textBlock = response.content.find((block) => block.type === "text");
      const rawText = textBlock && textBlock.type === "text" ? textBlock.text : "";

      if (!rawText.trim()) {
        lastError = "Réponse vide reçue";
        logStep(tag, `attempt ${attempt} rejected: ${lastError}`);
        continue;
      }

      if (response.stop_reason === "max_tokens") {
        // No identical retry here, unlike the other rejection causes below:
        // the content sent was too dense for maxTokens, so another attempt
        // with the exact same input would very likely truncate again for
        // the same reason, wasting its full cost for nothing. Thrown
        // immediately so the caller can split the source and retry with
        // less content per call instead — see AiOutputTruncatedError.
        logStep(tag, `attempt ${attempt} truncated (max_tokens) — surfacing for split-retry`);
        throw new AiOutputTruncatedError(
          "Réponse tronquée : contenu trop dense pour une seule génération.",
        );
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(stripCodeFence(rawText));
      } catch {
        lastError = "Format de réponse invalide";
        logStep(tag, `attempt ${attempt} rejected: ${lastError}`);
        continue;
      }

      const validated = validate(parsed);
      if (validated === null) {
        lastError = "Réponse incomplète reçue";
        logStep(tag, `attempt ${attempt} rejected: ${lastError}`);
        continue;
      }

      result = validated;
      break;
    }

    if (result === null) {
      throw new AiGenerationError(
        `Échec de la génération après ${MAX_ATTEMPTS} tentatives : ${lastError}`,
      );
    }

    logStep(tag, `done — total ${elapsedMs(totalStarted)}ms`);
    return result;
  } catch (err) {
    logStep(
      tag,
      `FAILED after ${elapsedMs(totalStarted)}ms — ${err instanceof Error ? err.message : String(err)}`,
    );
    throw err;
  }
}
