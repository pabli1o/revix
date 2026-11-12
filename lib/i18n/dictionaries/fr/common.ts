/** Small set of generic, reused-everywhere strings — domain-specific
 * dictionaries (fiches, examen, …) still own their own copy whenever the
 * wording needs to differ in context; this is only for the handful of
 * truly generic actions repeated verbatim across many unrelated screens. */
export const common = {
  close: "Fermer",
  cancel: "Annuler",
  save: "Enregistrer",
  saving: "Enregistrement…",
  back: "Retour",
  delete: "Supprimer",
  deleting: "Suppression…",
  confirm: "Confirmer",
  loading: "Chargement…",
  genericError: "Une erreur est survenue. Réessaie dans quelques instants.",
  retry: "Réessayer",
  // Passed into lib/fetch-json.ts's fetchJson() by every caller (that
  // plain utility isn't a component, so it can't call useLocale() itself).
  network: {
    connectionFailed: "Impossible de contacter le serveur. Vérifie ta connexion internet.",
    serverTimeout:
      "Le serveur a mis trop de temps à répondre (délai dépassé). Réessaie, éventuellement avec moins de contenu à la fois.",
    payloadTooLarge:
      "Le contenu envoyé est trop volumineux pour le serveur. Retire une ou plusieurs sources (photos surtout), ou répartis-les sur plusieurs fiches.",
    invalidResponse: (status: number) => `Réponse invalide du serveur (code ${status}).`,
  },
};

export type CommonDict = typeof common;
