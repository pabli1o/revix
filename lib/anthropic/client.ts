import "server-only";

import { randomUUID } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { withAiLock } from "./lock";
import { assertAiUsageBudgetAvailable, recordAiUsageCost } from "@/lib/subscription/gate";
import { elapsedMs, logStep, startTimer } from "@/lib/observability/timing";

const MODEL = "claude-opus-5";
const MAX_ATTEMPTS = 3;
const DEFAULT_MAX_TOKENS = 8000;

/** USD per million tokens for MODEL above. Pricing isn't queryable from the
 * API, so this must be kept in sync by hand — computeCostUsd throws rather
 * than silently under-costing (which would quietly break the usage cap) if
 * MODEL is ever changed without updating this. */
const MODEL_PRICING_USD_PER_MTOK = { model: "claude-opus-5", input: 5, output: 25 } as const;

function computeCostUsd(usage: Anthropic.Usage): number {
  if (MODEL_PRICING_USD_PER_MTOK.model !== MODEL) {
    throw new Error(`No pricing configured for model "${MODEL}" — update MODEL_PRICING_USD_PER_MTOK.`);
  }
  return (
    (usage.input_tokens / 1_000_000) * MODEL_PRICING_USD_PER_MTOK.input +
    (usage.output_tokens / 1_000_000) * MODEL_PRICING_USD_PER_MTOK.output
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
            system,
            messages: [{ role: "user", content: toAnthropicContent(content) }],
          });
          const cost = computeCostUsd(response.usage);
          logStep(
            tag,
            `attempt ${attempt}/${MAX_ATTEMPTS} — ${elapsedMs(attemptStarted)}ms, ` +
              `stop_reason=${response.stop_reason}, in=${response.usage.input_tokens}tok, ` +
              `out=${response.usage.output_tokens}tok, cost=$${cost.toFixed(4)}`,
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
