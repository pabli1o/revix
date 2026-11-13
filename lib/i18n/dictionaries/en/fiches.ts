import type { FichesDict } from "../fr/fiches";

export const fiches: FichesDict = {
  clickSubjectHint: "Tap a subject to see its chapters.",
  emptySubjects: "No notes yet. Tap “+ New note” to get started.",
  deleteSubjectWarning:
    "Delete the subject “{nom}”? All its chapters and notes will be permanently deleted (skipping the trash).",
  welcomeFirstFiche: (prenom: string) => `Welcome, ${prenom}! Create your first note to get started.`,
  createFiche: "+ New note",
  emptyStateTitle: "Start here",
  emptyStateBody: (prenom: string | null) =>
    prenom ? `Welcome, ${prenom}! Drop in your first course to create your note.` : "Drop in your first course to create your note.",
  createFicheCta: "New note",

  mySubjects: "My subjects",
  chapterCount: (n: number) => `${n} chapter${n !== 1 ? "s" : ""}`,
  clickChapterHint: "Tap a chapter to see its notes.",
  emptyChapters: "No chapters for this subject yet.",
  deleteChapterWarning:
    "Delete the chapter “{nom}”? All its notes will be permanently deleted (skipping the trash).",

  ficheCount: (n: number) => `${n} note${n !== 1 ? "s" : ""}`,
  newFiche: "+ New note",
  emptyFichesInChapter: "No notes in this chapter yet.",

  ficheLabel: "Study note",
  preparing: "Preparing…",
  downloadAsImage: "Download as image",
  corbeille: "Trash",
  exportFailed: "Couldn't generate an image of this note.",
  downloadFailed: "The download failed. Take a screenshot for now, or try again.",
  previewLimited: (pct: number) => `You only have access to ${pct}% of this note.`,
  unlockFull: "Unlock the full note",
  aRetenir: "Key takeaways",

  rename: "Rename",
  deleteAction: "Delete",
  confirmDeleteGeneric: (nom: string) => `Delete “${nom}”? This can't be undone.`,
  renameFailed: "Renaming failed.",
  renameNetworkError: "Network error — renaming failed.",
  deleteFailed: "Deletion failed.",
  deleteNetworkError: "Network error — deletion failed.",
  ok: "OK",

  savedToast: "Your notes have been saved",

  newFicheLabel: "New note",
  proposedCount: (n: number) => `${n} note${n > 1 ? "s" : ""} proposed`,
  freeTrialUsedTitle: "You've already generated your free trial note.",
  freeTrialUsedBody: "Subscribe to keep creating notes.",
  seeSubscriptions: "See subscription plans",
  generateFiche: "Generate the note",
  generatingTitle: "Your notes are taking shape…",
  generatingProgress: (done: number, total: number) => `${done} / ${total} ready`,
  keep: "keep",
  oneInstant: "One moment…",
  saveFiches: "Save the notes",
  droppedSources: (names: string[]) => {
    const list = names.map((n) => `"${n}"`).join(", ");
    return names.length > 1
      ? `${list} couldn't be kept (empty or unreadable in this browser) — remove them and add them again.`
      : `${list} couldn't be kept (empty or unreadable in this browser) — remove it and add it again.`;
  },
  sourceFailure: (name: string, message: string) => `"${name}": ${message}`,
  draftNotFoundOnDevice: "Your draft couldn't be found on this device — add your course again.",
  draftSaveFailedBeforeSignup:
    "Your draft couldn't be saved in this browser (storage full or blocked). Try again with fewer files, or log in first.",
  draftSaveFailedMidFlow:
    "Your draft can't be kept in this browser (storage full or blocked) — log in before adding more files, or you risk losing them when you change page.",
  payloadTooLarge:
    "The total content is more than the server can receive at once. Remove one or more sources (photos especially), or split them across several notes.",
  generationFailed: "Generation failed.",
  unexpectedGenerationError: "Something unexpected happened during generation.",
  selectAtLeastOne: "Select at least one note to save.",
  cannotPrepareSave: "Couldn't prepare the save.",
  networkError: "Network error.",

  draftNotFoundOrExpired: "Draft not found or expired.",
  draftLoadFailed: "Couldn't load the draft.",
  restartFiche: "Start a new note",
  checkoutCancelled: "Payment cancelled — your note is still ready to be saved.",
  enjoyTitle: "Get the most out of your notes",
  enjoyBody: "An active subscription is needed to save and read your notes in full.",
  subscriptionDelayed: "Your payment went through, but activation is taking longer than expected.",
  subscriptionActivated: "Subscription activated — you now have access to your notes.",
  editFiches: "Edit the notes",
  whereToFile: (n: number) => `Where should these ${n} note${n > 1 ? "s" : ""} go?`,
  subjectLabel: "Subject",
  change: "change",
  newSubjectPlaceholder: "Subject name",
  valider: "Confirm",
  newSubjectAction: "+ New",
  chapterLabel: "Chapter",
  newChapterPlaceholder: "Chapter name",
  newChapterNamed: (nom: string) => `New: ${nom}`,
  newChapterAction: "+ New",
  confirmAndFile: "Confirm and file",
  saveFailed: "The save failed.",

  pasteNotesLabel: "Paste or type your notes",
  pasteNotesPlaceholder: "Paste your course content here…",
  addThisText: "+ Add this text",
  typedNotesName: "Typed notes",
  addPhotos: "Add photos",
  addPdf: "Add a PDF",
  addWord: "Add a Word file",
  processingFiles: "Processing files…",
  tooHeavyCompressed: (nom: string) => `${nom} (too heavy even compressed)`,
  totalLimitReached: (nom: string) => `${nom} (total limit reached)`,
  rejectedSummary: (list: string) =>
    `Not added, too large to send at once: ${list}. Reduce how many or how large they are, or create a separate note for the rest.`,
  tooHeavyMax: (nom: string, max: string) => `${nom} (too heavy: max ${max})`,
  tooManyPages: (nom: string, pages: number, max: number) => `${nom} (too many pages: ${pages}, max ${max})`,
  uploadFailed: (nom: string) => `${nom} (upload failed)`,
  removeAction: "Remove",
  megabyteUnit: "MB",

  fileNotSurvivedDraft: "This file didn't survive the draft saved in this browser — add it again.",
  fileEmptyAfterStorage: (nom: string) =>
    `"${nom}" is empty (0 bytes) — it didn't survive this browser's local storage. Remove it and add it again.`,
  sessionNotFound: (nom: string, message: string) => `No session found to send "${nom}": ${message}`,
  notSignedInYet: (nom: string) => `Not signed in yet — can't send "${nom}". Try again in a moment or log back in.`,
  uploadRejectedByStorage: (nom: string, message: string) => `Sending "${nom}" was rejected by storage: ${message}`,

  pauseTimer: "Pause",
  startTimer: "Start the timer",
  timerElapsed: "Elapsed",
  timerOvertime: "Over",
  timerRemaining: "Remaining",
};
