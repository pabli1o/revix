export const root = {
  /** Document <title> (root layout default) and the landing page's own
   * title/OG/Twitter metadata — same phrase, reused by both. */
  siteTagline: "Reviix — Passe de 6 à 14 de moyenne",
  siteDescription:
    "Reviix calcule combien réviser pour atteindre ton objectif de moyenne, et prépare tes fiches, ton planning et tes quiz.",
  errorBoundary: {
    defaultMessage: "Une erreur inattendue s'est produite.",
    // Includes its own trailing separator (French puts a space before ":")
    // so the component can just concatenate the digest after it, correctly
    // punctuated per locale.
    reference: "Référence : ",
    // Used only by app/(app)/error.tsx (the in-app error boundary, shown
    // without replacing the whole page) — app/error.tsx (the root one,
    // full-page) uses the Reviix wordmark instead of a title string.
    title: "Un problème est survenu",
    backHome: "Retour à l'accueil",
  },
  limite: {
    title: "Crédits épuisés",
    subtitle: "Tu as utilisé tous tes crédits ce mois-ci.",
    description:
      "Tes crédits se renouvellent automatiquement à ton prochain renouvellement d'abonnement. Tu peux aussi en ajouter ou passer à une offre avec plus de crédits dès maintenant.",
  },
};

export type RootDict = typeof root;
