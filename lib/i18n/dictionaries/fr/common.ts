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
};

export type CommonDict = typeof common;
