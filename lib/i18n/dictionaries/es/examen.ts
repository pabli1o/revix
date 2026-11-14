import type { ExamenDict } from "../fr/examen";

const nf = new Intl.NumberFormat("es-ES");

export const examen: ExamenDict = {
  noChapter: "Ningún tema",
  addExam: "+ Añadir un examen",
  distributionNote:
    "Cada examen se reparte en el tiempo que queda hasta él, priorizando las fichas más urgentes y los temas que aún no has repasado.",
  editRhythm: "Cambiar mi ritmo de estudio",
  yourExams: "Tus exámenes",
  generatePlanning: "Generar el planning",
  generatingPlanning: "Generando…",
  confirmDeleteExam: "¿Eliminar este examen y su planning asociado?",
  noExamsYet: "Todavía no has añadido ningún examen.",
  coefficientBadge: (coefficient: number) => `Coef. ${coefficient}`,
  goalBadge: (goal: string, obtained: string | null) =>
    obtained ? `Objetivo ${goal} · obtenida ${obtained}` : `Objetivo ${goal}`,
  importance: {
    normale: { label: "Normal", description: "Un examen como otro cualquiera" },
    importante: { label: "Importante", description: "Cuenta más en la nota media" },
    tresImportante: { label: "Muy importante", description: "Examen decisivo, tipo selectividad o final" },
  },
  examNameLabel: "Nombre del examen",
  examNamePlaceholder: "Ej.: Examen de matemáticas",
  dateLabel: "Fecha",
  importanceLabel: "Importancia",
  chaptersCoveredLabel: "Temas incluidos",
  createChaptersFirst: "Crea primero algunas fichas para tener temas.",
  addExamButton: "Añadir el examen",
  creatingExam: "Creando…",
  nameAndDateRequired: "El nombre y la fecha son obligatorios.",
  createExamError: "Ha ocurrido un error al crear el examen.",
  calendar: {
    previousMonth: "Mes anterior",
    nextMonth: "Mes siguiente",
    weekdays: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
    months: [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ],
  },
  wizard: {
    title: "Objetivo de nota",
    closeAria: "Cerrar",
    estimateDisclaimer: "Siempre es una estimación, nunca una promesa de nota.",
    progressStep: (step: number, total: number) => `Paso ${step} de ${total}`,
    back: "Volver",
    info: {
      title: "¿Qué examen?",
      subtitle: "Elige la asignatura, la fecha y el coeficiente de este examen.",
      subjectLabel: "Asignatura",
      noSubjects: "Crea primero una asignatura en Fichas para poder añadir un examen.",
      dateLabel: "Fecha del examen",
      coefficientLabel: "Coeficiente",
      coefficientHint: "Un examen que pesa más en tu nota recibe más tiempo de repaso.",
      continueButton: "Continuar",
      missingFields: "Elige una asignatura y una fecha.",
      pastDateError: "La fecha del examen debe ser futura.",
    },
    average: {
      title: (subject: string) => `Tu media actual en ${subject}`,
      subtitleWithGrades: "Rellenada a partir de tus exámenes ya calificados en esta asignatura.",
      subtitleNoGrades:
        "Todavía no tienes ninguna nota registrada en esta asignatura. Ajusta el control si tienes una idea de tu nivel.",
      noGradeLink: "Todavía no tengo ninguna nota",
      continueButton: "Continuar",
    },
    goal: {
      title: (subject: string) => `Tu objetivo en ${subject}`,
      subtitle: "Fija la nota que quieres alcanzar. No se calcula nada hasta que confirmes.",
      markerNote: "Referencias: 10, 14 y 16.",
      validateButton: "Confirmar mi objetivo",
    },
    analyzing: {
      title: "Analizando…",
      step1: "Diferencia entre tu media actual y tu objetivo",
      step2: "Teniendo en cuenta la fecha de tu examen",
      step3: "Construyendo tu ritmo de estudio",
    },
    result: {
      hours: (h: number) => `${nf.format(h)} h`,
      minutes: (m: number) => `${nf.format(m)} minuto${m === 1 ? "" : "s"}`,
      inWeeks: (n: number) => (n <= 0 ? "esta semana" : n === 1 ? "en 1 semana" : `en ${nf.format(n)} semanas`),
      normalHeadline: (goal: string, hoursPerWeek: string, minutesPerDay: string) =>
        `Para alcanzar ${goal}, tienes que estudiar ${hoursPerWeek} a la semana, unos ${minutesPerDay} al día.`,
      examDateInfo: (dateLabel: string, weeksLabel: string) =>
        `Examen el ${dateLabel}, ${weeksLabel}. Estimación basada en tu media y tu objetivo.`,
      alreadyThere: (hoursPerWeek: string) =>
        `Ya estás en ese nivel. Para mantenerlo, unos ${hoursPerWeek} a la semana son suficientes.`,
      veryAmbitious: (goal: string, hoursPerWeek: string, milestone: string) =>
        `${goal} es un objetivo muy ambicioso, pero alcanzable si te lo tomas en serio: unos ${hoursPerWeek} a la semana. Para avanzar por etapas, apunta primero a ${milestone}.`,
      aimForMilestoneButton: (milestone: string) => `Apuntar primero a ${milestone}`,
      excessiveLoad: (goal: string, dailyLoad: string, suggestedGoal: string) =>
        `Para alcanzar ${goal} tendrías que estudiar unos ${dailyLoad} al día antes del examen — no es realista en este plazo. Un objetivo más alcanzable: ${suggestedGoal}.`,
      aimForSuggestedButton: (suggestedGoal: string) => `Apuntar a ${suggestedGoal} en su lugar`,
      generatePlanningButton: "Generar mi planning",
      changeGoalButton: "Cambiar mi objetivo",
      generationError: "Ha ocurrido un error al crear el examen.",
    },
    generating: {
      title: "Generando tu planning…",
      doneTitle: "Tu planning está listo",
      doneSubtitle: "Tiene en cuenta este objetivo y todos tus demás exámenes.",
      openPlanningButton: "Abrir mi planning",
      addAnotherButton: "Añadir otro examen",
      error: "Ha ocurrido un error al generar el planning.",
    },
  },
  gradeEntry: {
    question: (subject: string) => `¿Cómo te fue en tu examen de ${subject}? Introduce tu nota.`,
    submitButton: "Guardar la nota",
    savingButton: "Guardando…",
    goalGap: (goal: string, obtained: string) => `Tu objetivo era ${goal} y has obtenido ${obtained}.`,
    saveError: "Ha ocurrido un error al guardar la nota.",
    editButton: "Modificar",
  },
  moyenne: {
    title: "Mi media",
    noGradesYet: "Todavía no hay ningún examen calificado.",
    source: "Según los exámenes registrados en Reviix.",
    upcomingBadge: "Próximo",
    goalLabel: "Objetivo de media",
    goalSaveButton: "Confirmar",
    goalSaving: "Guardando…",
    goalSaveError: "Ha ocurrido un error al guardar el objetivo.",
    remainingExamsLabel: (count: number) => (count === 1 ? "tu examen restante" : `tus ${nf.format(count)} exámenes restantes`),
    neededNormal: (avg: string, goal: string, needed: string, remaining: string) =>
      `Tu media es de ${avg}. Para llegar a ${goal}, necesitas una media de ${needed} en ${remaining}.`,
    neededAlreadyAchieved: (avg: string, goal: string) =>
      `Tu media es de ${avg}. ¡Tu objetivo de ${goal} ya está asegurado!`,
    neededOutOfReach: (avg: string, goal: string, max: string) =>
      `Tu media es de ${avg}. Tu objetivo de ${goal} ya está fuera de alcance — lo máximo que puedes lograr ahora es ${max}.`,
    prefillCta: (needed: string) => `Para subir tu media, apunta a ${needed} en el próximo examen.`,
    prefillButton: (needed: string) => `Añadir un examen con el objetivo ${needed}`,
  },
};
