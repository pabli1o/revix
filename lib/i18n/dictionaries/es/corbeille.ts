import type { CorbeilleDict } from "../fr/corbeille";

export const corbeille: CorbeilleDict = {
  title: "Papelera",
  empty: "La papelera está vacía.",
  restore: "Restaurar",
  deleteForever: "Eliminar definitivamente",
  confirmDeleteForever: "¿Eliminar definitivamente esta ficha? Esta acción no se puede deshacer.",
  deletedOn: (formattedDate: string) => `eliminada el ${formattedDate}`,
};
