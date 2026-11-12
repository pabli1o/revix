import type { CorbeilleDict } from "../fr/corbeille";

export const corbeille: CorbeilleDict = {
  title: "Trash",
  empty: "The trash is empty.",
  restore: "Restore",
  deleteForever: "Delete permanently",
  confirmDeleteForever: "Permanently delete this note? This can't be undone.",
  deletedOn: (formattedDate: string) => `deleted on ${formattedDate}`,
};
