import type { PlanningDict } from "../fr/planning";

export const planning: PlanningDict = {
  emptyState: "Add some notes and an exam date to generate your plan.",
  regenerate: "Regenerate",
  regenerating: "Generating…",
  taskType: {
    decouverte: "Learn",
    rappel: "Review",
  },
  formatRange: (numeros: number[]): string => {
    if (numeros.length === 0) return "Review the whole chapter";
    if (numeros.length === 1) return `Review point ${numeros[0]}`;
    const isContiguous = numeros.every((n, i) => i === 0 || n === numeros[i - 1] + 1);
    if (isContiguous) return `Review from point ${numeros[0]} to point ${numeros[numeros.length - 1]}`;
    return `Review points ${numeros.slice(0, -1).join(", ")} and ${numeros[numeros.length - 1]}`;
  },
  startRevisingCta: "Click here to start reviewing →",
};
