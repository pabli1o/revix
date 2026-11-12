import type { CommonDict } from "@/lib/i18n/dictionaries/fr/common";

/**
 * A failed `fetch()` (offline, DNS, CORS) and a response that isn't valid
 * JSON are different failures with different causes — most commonly the
 * latter means the platform killed the request before our route handler
 * could return a JSON error (e.g. a serverless function duration timeout
 * returns a plain-text/HTML gateway error, not JSON). Distinguishing them
 * turns a vague "network error" into an actionable message.
 */
export class RequestFailedError extends Error {}

/** Plain utility, not a component — can't call useLocale() itself, so
 * every caller passes its own t.common.network (see
 * lib/i18n/dictionaries/*\/common.ts). */
export async function fetchJson<T>(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  messages: CommonDict["network"],
): Promise<{ status: number; data: T | null }> {
  let res: Response;
  try {
    res = await fetch(input, init);
  } catch {
    throw new RequestFailedError(messages.connectionFailed);
  }

  try {
    const data = (await res.json()) as T;
    return { status: res.status, data };
  } catch {
    if (res.status === 504 || res.status === 502 || res.status === 503) {
      throw new RequestFailedError(messages.serverTimeout);
    }
    if (res.status === 413) {
      throw new RequestFailedError(messages.payloadTooLarge);
    }
    throw new RequestFailedError(messages.invalidResponse(res.status));
  }
}
