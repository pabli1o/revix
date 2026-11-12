export const root = {
  /** Document <title> (root layout default) and the landing page's own
   * title/OG/Twitter metadata — same phrase, reused by both. */
  siteTagline: "Reviix — Tes fiches de révision en moins de 2 min",
  siteDescription:
    "Dépose ton cours, récupère une fiche de révision claire en quelques secondes — planning avant l'examen et quiz inclus.",
  errorBoundary: {
    defaultMessage: "Une erreur inattendue s'est produite.",
    // Includes its own trailing separator (French puts a space before ":")
    // so the component can just concatenate the digest after it, correctly
    // punctuated per locale.
    reference: "Référence : ",
  },
  limite: {
    title: "Crédits épuisés",
    subtitle: "Tu as utilisé tous tes crédits ce mois-ci.",
    description:
      "Tes crédits se renouvellent automatiquement à ton prochain renouvellement d'abonnement. Tu peux aussi en ajouter ou passer à une offre avec plus de crédits dès maintenant.",
  },
};

export type RootDict = typeof root;
