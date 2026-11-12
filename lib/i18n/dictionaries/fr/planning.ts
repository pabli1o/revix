export const planning = {
  emptyState: "Ajoute des fiches et une date d'examen pour générer ton planning.",
  regenerate: "Régénérer",
  regenerating: "Génération…",
  taskType: {
    decouverte: "Apprends",
    rappel: "Relis",
  },
  /** Mirrors components/planning/task-row.tsx's formatRange — same
   * branching (one point / a contiguous range / a scattered list), just
   * phrased per language. */
  formatRange: (numeros: number[]): string => {
    if (numeros.length === 0) return "Réviser tout le chapitre";
    if (numeros.length === 1) return `Réviser le point ${numeros[0]}`;
    const isContiguous = numeros.every((n, i) => i === 0 || n === numeros[i - 1] + 1);
    if (isContiguous) return `Réviser du point ${numeros[0]} au point ${numeros[numeros.length - 1]} inclus`;
    return `Réviser les points ${numeros.slice(0, -1).join(", ")} et ${numeros[numeros.length - 1]}`;
  },
  startRevisingCta: "Cliquer ici pour commencer à réviser →",
};

export type PlanningDict = typeof planning;
