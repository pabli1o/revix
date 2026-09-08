/** Shared, import-safe constants for the subscription gate — no
 * "server-only" import here so client components (e.g. the fiche viewer's
 * progressive-blur rendering) can import `FREE_PREVIEW_SENTENCES` without
 * pulling in server-only/admin-client code transitively. */

/** Fiche generation itself is unlimited and free; this cap only bites at
 * SAVE time, and only for active subscribers (see spec: "business model"). */
export const MONTHLY_FICHE_CAP = 20;

/** Sentences shown in clear before the progressive blur kicks in for
 * non-subscribers. */
export const FREE_PREVIEW_SENTENCES = 2;
