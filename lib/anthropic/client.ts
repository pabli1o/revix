import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { withAiLock } from "./lock";

const MODEL = "claude-opus-5";
const MAX_ATTEMPTS = 3;
const DEFAULT_MAX_TOKENS = 8000;

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
}

/**
 * Calls Claude expecting a strict JSON response, validates completeness,
 * and automatically retries (up to MAX_ATTEMPTS) when the response is
 * empty, truncated (stop_reason === "max_tokens"), not valid JSON, or fails
 * the caller's `validate` check. Every call is serialized through the
 * app-wide AI lock so fiche generation and quiz generation never run
 * concurrently.
 */
export async function generateJson<T>({
  system,
  content,
  maxTokens = DEFAULT_MAX_TOKENS,
  validate,
}: GenerateJsonOptions<T>): Promise<T> {
  return withAiLock(async () => {
    const anthropic = getClient();
    let lastError: string = "Erreur inconnue";

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: toAnthropicContent(content) }],
      });

      const textBlock = response.content.find((block) => block.type === "text");
      const rawText = textBlock && textBlock.type === "text" ? textBlock.text : "";

      if (!rawText.trim()) {
        lastError = "Réponse vide reçue";
        continue;
      }

      if (response.stop_reason === "max_tokens") {
        lastError = "Réponse tronquée (limite de longueur atteinte)";
        continue;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(stripCodeFence(rawText));
      } catch {
        lastError = "Format de réponse invalide";
        continue;
      }

      const validated = validate(parsed);
      if (validated === null) {
        lastError = "Réponse incomplète reçue";
        continue;
      }

      return validated;
    }

    throw new AiGenerationError(
      `Échec de la génération après ${MAX_ATTEMPTS} tentatives : ${lastError}`,
    );
  });
}
