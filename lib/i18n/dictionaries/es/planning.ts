import type { PlanningDict } from "../fr/planning";

export const planning: PlanningDict = {
  emptyState: "Añade fichas y una fecha de examen para generar tu planning.",
  regenerate: "Regenerar",
  regenerating: "Generando…",
  taskType: {
    decouverte: "Aprende",
    rappel: "Repasa",
  },
  formatRange: (numeros: number[]): string => {
    if (numeros.length === 0) return "Repasar todo el tema";
    if (numeros.length === 1) return `Repasar el punto ${numeros[0]}`;
    const isContiguous = numeros.every((n, i) => i === 0 || n === numeros[i - 1] + 1);
    if (isContiguous) return `Repasar del punto ${numeros[0]} al punto ${numeros[numeros.length - 1]}`;
    return `Repasar los puntos ${numeros.slice(0, -1).join(", ")} y ${numeros[numeros.length - 1]}`;
  },
  startRevisingCta: "Haz clic aquí para empezar a repasar →",
};
