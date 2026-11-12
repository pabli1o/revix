export const corbeille = {
  title: "Corbeille",
  empty: "La corbeille est vide.",
  restore: "Restaurer",
  deleteForever: "Supprimer définitivement",
  confirmDeleteForever: "Supprimer définitivement cette fiche ? Cette action est irréversible.",
  /** `formattedDate` is already locale-formatted (see trash-list.tsx's own
   * Intl.DateTimeFormat, untouched here) — this only wraps it in words. */
  deletedOn: (formattedDate: string) => `supprimée le ${formattedDate}`,
};

export type CorbeilleDict = typeof corbeille;
