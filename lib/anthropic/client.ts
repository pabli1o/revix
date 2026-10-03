import "server-only";

import { randomUUID } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { withAiLock } from "./lock";
import { assertAiUsageBudgetAvailable, recordAiUsageCost } from "@/lib/subscription/gate";
import { elapsedMs, logStep, startTimer } from "@/lib/observability/timing";

const MODEL = "claude-opus-5";
const MAX_ATTEMPTS = 3;
const DEFAULT_MAX_TOKENS = 8000;

/** Claude Opus 5 runs adaptive thinking by default when `effort` is left
 * unset, at its default of "high" — billed as output tokens ($25/Mtok)
 * even though generateJson only ever reads the final `text` block, never
 * the `thinking` one. Fiche/quiz generation is a structured-extraction
 * task (turn given sources into a fixed JSON shape), not open-ended
 * reasoning, so it's a good candidate for a lower effort level per
 * Anthropic's own published cost/quality curves for that kind of workload.
 * "medium" first, as the safer step down from the implicit "high" — drop
 * to "low" only after medium is confirmed to hold fiche quality. */
const EFFORT: Anthropic.OutputConfig = { effort: "medium" };

/** USD per million tokens for MODEL above. Pricing isn't queryable from the
 * API, so this must be kept in sync by hand — computeCostUsd throws rather
 * than silently under-costing (which would quietly break the usage cap) if
 * MODEL is ever changed without updating this. */
const MODEL_PRICING_USD_PER_MTOK = { model: "claude-opus-5", input: 5, output: 25 } as const;

/** Prompt-caching billing multipliers off the base input price, for the
 * default 5-minute ephemeral cache_control TTL used on the system prompt
 * below (see toAnthropicSystem) — writing to the cache costs 1.25x a
 * normal input token, reading from it costs 0.1x. Fiche/quiz generation
 * calls share the exact same (short, static) system prompt per label
 * across every user, so once any call has warmed the cache, every other
 * call within the TTL — including concurrent parallel chunks of the same
 * fiche upload, and any other user's calls shortly after — reads it
 * cheaply instead of paying full input price for it again. */
const CACHE_WRITE_MULTIPLIER = 1.25;
const CACHE_READ_MULTIPLIER = 0.1;

function computeCostUsd(usage: Anthropic.Usage): number {
  if (MODEL_PRICING_USD_PER_MTOK.model !== MODEL) {
    throw new Error(`No pricing configured for model "${MODEL}" — update MODEL_PRICING_USD_PER_MTOK.`);
  }
  const { input, output } = MODEL_PRICING_USD_PER_MTOK;
  const cacheWriteTokens = usage.cache_creation_input_tokens ?? 0;
  const cacheReadTokens = usage.cache_read_input_tokens ?? 0;
  return (
    (usage.input_tokens / 1_000_000) * input +
    (cacheWriteTokens / 1_000_000) * input * CACHE_WRITE_MULTIPLIER +
    (cacheReadTokens / 1_000_000) * input * CACHE_READ_MULTIPLIER +
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
 * the caller's `validate` check. Every call is serialized through the
 * app-wide AI lock so fiche generation and quiz generation never run
 * concurrently.
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
 */
export async function generateJson<T>({
  userId,
  system,
  content,
  maxTokens = DEFAULT_MAX_TOKENS,
  validate,
  label = "generate",
}: GenerateJsonOptions<T>): Promise<T> {
  const tag = `${label}:${randomUUID().slice(0, 8)}`;
  const totalStarted = startTimer();
  logStep(tag, `start — ${content.length} content block(s): ${content.map((b) => b.type).join(", ")}`);

  try {
    const result = await withAiLock(
      async () => {
        await assertAiUsageBudgetAvailable(userId);

        const anthropic = getClient();
        let lastError: string = "Erreur inconnue";

        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
          const attemptStarted = startTimer();
          const response = await anthropic.messages.create({
            model: MODEL,
            max_tokens: maxTokens,
            // Cached (ephemeral, 5-minute TTL): every fiche/quiz call under
            // one `label` sends this exact same static string, so after the
            // first call warms the cache, every other call within the TTL —
            // including concurrent parallel chunks of the same upload, and
            // any other user's calls shortly after — reads it at 0.1x
            // instead of paying full input price for it again. Below the
            // model's minimum cacheable prefix (~512 tokens on this model)
            // this silently just doesn't cache — harmless, not an error.
            system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
            messages: [{ role: "user", content: toAnthropicContent(content) }],
            output_config: EFFORT,
          });
          const cost = computeCostUsd(response.usage);
          // thinking_tokens is logged on its own: it's the exact lever
          // EFFORT above targets, so this line is what shows in Vercel
          // logs whether dropping to "medium" (and later "low") actually
          // moved it, rather than inferring that from the cost total alone.
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
            lastError = "Réponse tronquée (limite de longueur atteinte)";
            logStep(tag, `attempt ${attempt} rejected: ${lastError}`);
            continue;
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

          return validated;
        }

        throw new AiGenerationError(
          `Échec de la génération après ${MAX_ATTEMPTS} tentatives : ${lastError}`,
        );
      },
      { label: tag },
    );

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
