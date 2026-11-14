import type { ErrorsDict } from "../fr/errors";

export const errors: ErrorsDict = {
  common: {
    unauthenticated: "Not authenticated",
    missingFields: "Missing fields",
    missingOrInvalidFields: "Missing or invalid fields",
    missingName: "Missing name",
    unknownError: "Unknown error",
  },
  subscription: {
    examenLocked: "Your plan doesn't include access to exams.",
    planningLocked: "Your plan doesn't include access to planning.",
    quizLocked: "Your plan doesn't include access to quizzes.",
    activeRequiredToSaveFiche: "An active subscription is required to save a note.",
    activeRequiredForCreditTopup: "An active subscription is required to buy extra credits.",
    checkFailed: (message: string) => `Couldn't check your subscription: ${message}`,
  },
  fiches: {
    missingTitle: "Missing title",
    noFicheToSave: "No note to save",
    invalidFiche: "Invalid note (missing title or content)",
    missingSubject: "Missing subject for a note",
    missingChapter: "Missing chapter for a note",
    saveFailed: "Something went wrong while saving",
    draftNotFound: "Draft not found or expired",
    noSourceProvided: "No source provided",
    tooManySources: (max: number) => `Too many sources (max ${max})`,
    emptyOrUnreadableSources: "Sources are empty or unreadable",
    sourceReadError: "Error reading a source",
    fileNotFound: "File not found",
    fileDownloadFailed: "Couldn't retrieve the uploaded file",
  },
  subjects: {
    missingSubjectName: "Missing subject name",
  },
  profile: {
    noFieldsToUpdate: "No field to update",
    emptyFirstName: "First name can't be empty",
  },
  onboarding: {
    dbNotInitialized: "The database isn't set up yet (missing SQL migrations). Contact the site administrator.",
    dbAccessDenied: (detail: string) => `Database access denied (missing or incorrect policy). Detail: ${detail}`,
  },
  quiz: {
    invalidDifficulty: "Invalid difficulty",
    chapterNotFound: "Chapter not found",
    invalidParams: "Invalid parameters",
    quizNotFound: "Quiz not found or not ready",
    noFicheContent: "This chapter has no note to generate a quiz from yet.",
  },
  examen: {
    subjectNotFound: "Subject not found",
    examNotFound: "Exam not found",
    invalidGrade: "Invalid grade",
  },
  whop: {
    noSubscriptionToManage: "No subscription to manage",
    invalidOffer: "Invalid plan",
    missingConfig: "Missing Whop configuration",
    checkoutCreationFailed: "Couldn't create the checkout session",
  },
  generation: {
    truncatedResponse: "Truncated response: content too dense for a single generation.",
    emptyResponse: "Empty response received",
    invalidResponseFormat: "Invalid response format",
    incompleteResponse: "Incomplete response received",
    failedAfterAttempts: (attempts: number, lastError: string) =>
      `Generation failed after ${attempts} attempts: ${lastError}`,
  },
};
