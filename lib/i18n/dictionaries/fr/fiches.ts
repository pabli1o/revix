export const fiches = {
  // app/(app)/fiches/page.tsx
  clickSubjectHint: "Clique sur une matière pour voir ses chapitres.",
  emptySubjects: "Aucune fiche pour l'instant. Appuie sur « + Créer une fiche » pour commencer.",
  deleteSubjectWarning:
    "Supprimer la matière « {nom} » ? Tous ses chapitres et toutes ses fiches seront définitivement supprimés (sans passer par la corbeille).",
  welcomeFirstFiche: (prenom: string) => `Bienvenue, ${prenom} ! Crée ta première fiche pour commencer.`,
  createFiche: "+ Créer une fiche",

  // app/(app)/fiches/[subjectId]/page.tsx
  mySubjects: "Mes matières",
  chapterCount: (n: number) => `${n} chapitre${n !== 1 ? "s" : ""}`,
  clickChapterHint: "Clique sur un chapitre pour voir ses fiches.",
  emptyChapters: "Aucun chapitre pour cette matière pour l'instant.",
  deleteChapterWarning:
    "Supprimer le chapitre « {nom} » ? Toutes ses fiches seront définitivement supprimées (sans passer par la corbeille).",

  // app/(app)/fiches/[subjectId]/[chapterId]/page.tsx
  ficheCount: (n: number) => `${n} fiche${n !== 1 ? "s" : ""}`,
  newFiche: "+ Nouvelle fiche",
  emptyFichesInChapter: "Aucune fiche dans ce chapitre pour l'instant.",

  // components/fiches/fiche-viewer.tsx
  ficheLabel: "Fiche de révision",
  preparing: "Préparation…",
  downloadAsImage: "Télécharger en image",
  corbeille: "Corbeille",
  exportFailed: "Impossible de générer l'image de cette fiche.",
  downloadFailed: "Le téléchargement a échoué. Fais une capture d'écran en attendant, ou réessaie.",
  previewLimited: (pct: number) => `Tu n'as accès qu'à ${pct}% de la fiche.`,
  unlockFull: "Débloquer la fiche complète",
  aRetenir: "À retenir",

  // components/fiches/tile-grid.tsx
  rename: "Renommer",
  deleteAction: "Supprimer",
  confirmDeleteGeneric: (nom: string) => `Supprimer « ${nom} » ? Cette action est définitive.`,
  renameFailed: "Le renommage a échoué.",
  renameNetworkError: "Erreur réseau — le renommage a échoué.",
  deleteFailed: "La suppression a échoué.",
  deleteNetworkError: "Erreur réseau — la suppression a échoué.",
  ok: "OK",

  // components/fiches/fiche-saved-toast.tsx
  savedToast: "Tes fiches ont bien été enregistrées",

  // components/fiches/new/creation-flow.tsx
  newFicheLabel: "Nouvelle fiche",
  proposedCount: (n: number) => `${n} fiche${n > 1 ? "s" : ""} proposée${n > 1 ? "s" : ""}`,
  freeTrialUsedTitle: "Tu as déjà généré ta fiche d'essai.",
  freeTrialUsedBody: "Abonne-toi pour continuer à créer des fiches.",
  seeSubscriptions: "Voir les abonnements",
  generateFiche: "Générer la fiche",
  generatingTitle: "Tes fiches prennent forme…",
  generatingProgress: (done: number, total: number) => `${done} / ${total} prêtes`,
  keep: "garder",
  oneInstant: "Un instant…",
  saveFiches: "Enregistrer les fiches",
  droppedSources: (names: string[]) => {
    const list = names.map((n) => `« ${n} »`).join(", ");
    return names.length > 1
      ? `${list} n'ont pas pu être conservés (vides ou illisibles dans ce navigateur) — retire-les et rajoute-les.`
      : `${list} n'a pas pu être conservé (vide ou illisible dans ce navigateur) — retire-le et rajoute-le.`;
  },
  sourceFailure: (name: string, message: string) => `« ${name} » : ${message}`,
  draftNotFoundOnDevice: "Ton brouillon n'a pas été retrouvé sur cet appareil — ajoute à nouveau ton cours.",
  draftSaveFailedBeforeSignup:
    "Impossible d'enregistrer ton brouillon dans ce navigateur (stockage plein ou bloqué). Réessaie avec moins de fichiers, ou connecte-toi d'abord.",
  draftSaveFailedMidFlow:
    "Ton brouillon ne peut pas être conservé dans ce navigateur (stockage plein ou bloqué) — connecte-toi avant d'ajouter d'autres fichiers, au risque de les perdre en changeant de page.",
  payloadTooLarge:
    "Le contenu total dépasse ce que le serveur peut recevoir en une fois. Retire une ou plusieurs sources (photos surtout), ou répartis-les sur plusieurs fiches.",
  generationFailed: "La génération a échoué.",
  unexpectedGenerationError: "Une erreur inattendue est survenue pendant la génération.",
  selectAtLeastOne: "Sélectionne au moins une fiche à enregistrer.",
  cannotPrepareSave: "Impossible de préparer l'enregistrement.",
  networkError: "Erreur réseau.",

  // components/fiches/new/assign-flow.tsx
  draftNotFoundOrExpired: "Brouillon introuvable ou expiré.",
  draftLoadFailed: "Impossible de charger le brouillon.",
  restartFiche: "Recommencer une fiche",
  checkoutCancelled: "Paiement annulé — ta fiche est toujours prête à être enregistrée.",
  enjoyTitle: "Profite pleinement de tes fiches",
  enjoyBody: "Un abonnement actif est nécessaire pour enregistrer et relire tes fiches en entier.",
  subscriptionDelayed: "Ton paiement a été reçu mais l'activation prend plus de temps que prévu.",
  subscriptionActivated: "Abonnement activé — tu as maintenant accès à tes fiches.",
  editFiches: "Modifier les fiches",
  whereToFile: (n: number) => `Où ranger ces ${n} fiche${n > 1 ? "s" : ""} ?`,
  subjectLabel: "Matière",
  change: "changer",
  newSubjectPlaceholder: "Nom de la matière",
  valider: "Valider",
  newSubjectAction: "+ Nouvelle",
  chapterLabel: "Chapitre",
  newChapterPlaceholder: "Nom du chapitre",
  newChapterNamed: (nom: string) => `Nouveau : ${nom}`,
  newChapterAction: "+ Nouveau",
  confirmAndFile: "Confirmer et ranger",
  saveFailed: "Échec de l'enregistrement.",

  // components/fiches/new/source-picker.tsx
  pasteNotesLabel: "Colle ou tape tes notes",
  pasteNotesPlaceholder: "Colle ici le contenu de ton cours…",
  addThisText: "+ Ajouter ce texte",
  typedNotesName: "Notes tapées",
  addPhotos: "Ajouter des photos",
  addPdf: "Ajouter un PDF",
  addWord: "Ajouter un Word",
  processingFiles: "Traitement des fichiers…",
  tooHeavyCompressed: (nom: string) => `${nom} (trop lourd même compressé)`,
  totalLimitReached: (nom: string) => `${nom} (limite totale atteinte)`,
  rejectedSummary: (list: string) =>
    `Non ajouté(s) car trop volumineux pour être envoyés en une fois : ${list}. Réduis leur nombre ou leur taille, ou crée une fiche séparée pour le reste.`,
  tooHeavyMax: (nom: string, max: string) => `${nom} (trop lourd : max ${max})`,
  tooManyPages: (nom: string, pages: number, max: number) => `${nom} (trop de pages : ${pages}, max ${max})`,
  uploadFailed: (nom: string) => `${nom} (échec de l'envoi)`,
  removeAction: "Retirer",
  megabyteUnit: "Mo",

  // components/fiches/new/upload-source.ts (thrown errors that reach the
  // UI via creation-flow.tsx's resolvePendingUploads / source-picker.tsx)
  fileNotSurvivedDraft: "Le fichier n'a pas survécu au brouillon enregistré dans ce navigateur — ajoute-le à nouveau.",
  fileEmptyAfterStorage: (nom: string) =>
    `« ${nom} » est vide (0 octet) — il n'a pas survécu au stockage local de ce navigateur. Retire-le et rajoute-le.`,
  sessionNotFound: (nom: string, message: string) => `Session introuvable pour envoyer « ${nom} » : ${message}`,
  notSignedInYet: (nom: string) =>
    `Pas encore connecté — impossible d'envoyer « ${nom} ». Réessaie dans un instant ou reconnecte-toi.`,
  uploadRejectedByStorage: (nom: string, message: string) => `Envoi de « ${nom} » refusé par le stockage : ${message}`,

  // components/fiches/planning-task-timer-bar.tsx
  pauseTimer: "Mettre en pause",
  startTimer: "Démarrer le chrono",
  timerElapsed: "Écoulé",
  timerOvertime: "Dépassé",
  timerRemaining: "Restant",
};

export type FichesDict = typeof fiches;
