/**
 * A failed `fetch()` (offline, DNS, CORS) and a response that isn't valid
 * JSON are different failures with different causes — most commonly the
 * latter means the platform killed the request before our route handler
 * could return a JSON error (e.g. a serverless function duration timeout
 * returns a plain-text/HTML gateway error, not JSON). Distinguishing them
 * turns a vague "erreur réseau" into an actionable message.
 */
export class RequestFailedError extends Error {}

export async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<{ status: number; data: T | null }> {
  let res: Response;
  try {
    res = await fetch(input, init);
  } catch {
    throw new RequestFailedError(
      "Impossible de contacter le serveur. Vérifie ta connexion internet.",
    );
  }

  try {
    const data = (await res.json()) as T;
    return { status: res.status, data };
  } catch {
    if (res.status === 504 || res.status === 502 || res.status === 503) {
      throw new RequestFailedError(
        "Le serveur a mis trop de temps à répondre (délai dépassé). Réessaie, éventuellement avec moins de contenu à la fois.",
      );
    }
    throw new RequestFailedError(`Réponse invalide du serveur (code ${res.status}).`);
  }
}
