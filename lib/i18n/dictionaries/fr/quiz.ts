export const quiz = {
  testYourself: "Se tester",
  chooseSubjectThenChapter:
    "Choisis une matière puis un chapitre : une dizaine de questions sont préparées à partir du contenu exact de tes fiches.",
  createFicheFirst: "Crée d'abord une fiche pour pouvoir te tester dessus.",
  generateQuizButton: "Générer le quiz",
  clickSubjectForChapters: "Clique sur une matière pour voir ses chapitres.",
  noSubjectsWithFiches: "Aucune matière avec des fiches pour l'instant.",
  chapterCount: (n: number) => `${n} chapitre${n > 1 ? "s" : ""}`,
  clickChapterToStart: "Clique sur un chapitre pour lancer un quiz.",
  noChaptersWithFichesInSubject: "Aucun chapitre avec des fiches pour l'instant dans cette matière.",
  lastScore: (score: number, total: number) => `Dernier score : ${score}/${total}`,
  notAttempted: "Pas encore tenté",
  quizTitle: (chapterNom: string) => `Quiz — ${chapterNom}`,
  chooseDifficulty: "Choisis un niveau de difficulté.",
  // Labels only — the value sent to /api/quiz/[chapterId] stays the French
  // literal "facile"/"moyen"/"difficile" (see components/quiz/quiz-flow.tsx
  // and lib/anthropic/prompts.ts's DIFFICULTY_LABEL), unrelated to UI locale.
  difficulties: {
    facile: "Facile",
    moyen: "Moyen",
    difficile: "Difficile",
  },
  retryToTrain: "refaire pour t'entraîner",
  clickToRetry: "clique pour refaire",
  notAttemptedClickToStart: "Pas encore tenté — clique pour commencer",
  questionProgress: (current: number, total: number) => `Question ${current} / ${total}`,
  confirmButton: "Confirmer",
  correctAnswer: "Bonne réponse !",
  wrongAnswer: "Pas tout à fait.",
  nextQuestion: "Question suivante",
  seeScore: "Voir mon score",
  changeDifficulty: "Changer de niveau",
  retryQuiz: "Refaire",
  backToFiches: "Retour à mes fiches",
  scoreDelta: (delta: number) => `${delta > 0 ? `+${delta}` : delta} par rapport à la dernière tentative`,
  unableToLoadQuiz: "Impossible de charger le quiz.",
  networkError: "Erreur réseau.",
  unableToSaveResult: "Impossible d'enregistrer le résultat du quiz.",
};

export type QuizDict = typeof quiz;
