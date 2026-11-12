export const landing = {
  header: {
    connexion: "Connexion",
    openMenu: "Ouvrir le menu",
    closeMenu: "Fermer le menu",
    navComment: "Comment ça marche",
    navFonctionnalites: "Fonctionnalités",
    navFaq: "FAQ",
    essayerGratuitement: "Essayer gratuitement",
  },
  hero: {
    badge: "Pour les étudiants",
    titlePrefix: "Tes",
    titleHighlight: "fiches",
    titleSuffix: "de révision en moins de 2 min",
    subtitle: "Dépose ton cours — PDF, photos ou Word — et récupère une fiche claire et organisée, prête à réviser.",
    dropCourse: "Dépose ton cours",
    essayerGratuitement: "Essayer gratuitement",
    tagline: "Fiches • Planning avant examen • Quiz",
  },
  howItWorks: {
    title: "Comment ça marche",
    steps: [
      { titre: "Dépose ton cours", description: "Une photo, un PDF ou un fichier Word — pas besoin de le retaper." },
      { titre: "Reçois tes fiches", description: "Une fiche claire et structurée, prête en quelques secondes." },
      { titre: "Révise avec ton planning", description: "Réparti automatiquement jusqu'à la date de ton examen." },
    ],
  },
  featureTabs: {
    title: "Une app, quatre outils",
    tabsAriaLabel: "Fonctionnalités",
    tabs: {
      fiches: {
        label: "Fiches",
        description:
          "Dépose un cours (PDF, photos ou Word), Reviix le transforme en fiche structurée : un plan, des sous-points, et un encart « À retenir ».",
      },
      examen: {
        label: "Examen",
        description:
          "Ajoute la date de ton examen et les chapitres concernés : Reviix sait combien de temps il te reste pour tout réviser.",
      },
      planning: {
        label: "Planning",
        description:
          "Un planning quotidien généré automatiquement, qui répartit ce qu'il reste à réviser jusqu'à la date de l'examen.",
      },
      quiz: {
        label: "Quiz",
        description: "Teste-toi avec des questions générées à partir de tes propres fiches, pas d'un contenu générique.",
      },
    },
  },
  benefits: {
    title: "Pourquoi Reviix",
    items: [
      {
        titre: "Fiches prêtes en quelques secondes",
        description: "Dépose ton cours, récupère une fiche structurée sans tout retaper.",
      },
      {
        titre: "Un planning qui suit ton examen",
        description: "Donne la date de ton examen, le planning répartit automatiquement ce qu'il reste à réviser.",
      },
      {
        titre: "Quiz à partir de tes propres fiches",
        description: "Teste-toi sur ce que tu as vraiment étudié, pas sur un contenu générique.",
      },
      {
        titre: "Rien n'est perdu par erreur",
        description: "Une fiche supprimée part dans la corbeille, jamais effacée sur un simple clic.",
      },
      {
        titre: "Pensé pour le téléphone",
        description: "Dépose un cours et révise une fiche entre deux cours, sur mobile comme sur tablette.",
      },
      {
        titre: "Des crédits simples à comprendre",
        description: "Un seul compteur par mois, affiché en crédits, sans surprise à la fin.",
      },
    ],
  },
  faq: {
    title: "Questions fréquentes",
    items: [
      {
        q: "Comment ça marche ?",
        a: "Tu déposes ton cours, Reviix génère une fiche de révision structurée en quelques secondes. Tu peux ensuite suivre un planning et t'entraîner avec des quiz construits à partir de cette fiche.",
      },
      {
        q: "Quels fichiers puis-je déposer ?",
        a: "Des photos de cours, des PDF, et des fichiers Word (.doc, .docx).",
      },
      {
        q: "C'est quoi les crédits ?",
        a: "Chaque génération de fiche ou de quiz consomme des crédits. Chaque offre donne un nombre de crédits par mois, qui ne se cumulent pas d'un mois à l'autre.",
      },
      {
        q: "Je peux résilier à tout moment ?",
        a: "Oui, en un clic depuis ton compte. L'accès reste actif jusqu'à la fin de la période déjà payée.",
      },
      {
        q: "Mes cours sont-ils privés ?",
        a: "Oui. Tes cours et tes fiches sont liés à ton compte et ne sont visibles par personne d'autre.",
      },
    ],
  },
  finalCta: {
    title: "Prêt à réviser plus vite ?",
    button: "Essayer gratuitement",
  },
  footer: {
    copyright: (year: number) => `© ${year} Reviix. Tous droits réservés.`,
  },
  demo: {
    ficheLabel: "Fiche de révision",
    ficheTitre: "Le cœur et la circulation sanguine",
    sections: [
      {
        titre: "Anatomie du cœur",
        sousPoints: [
          "Le cœur est un muscle creux, le **myocarde**, divisé en 4 cavités : 2 oreillettes et 2 ventricules.",
          "Les **valves cardiaques** empêchent le sang de revenir en arrière entre deux battements.",
        ],
      },
      {
        titre: "La circulation sanguine",
        sousPoints: [
          "La **grande circulation** envoie le sang oxygéné du cœur vers tous les organes.",
          "La **petite circulation** envoie le sang vers les poumons pour s'oxygéner.",
        ],
      },
    ],
    aRetenirLabel: "À retenir",
    aRetenirPoint: "**Systole** = contraction du cœur, **diastole** = relâchement.",
    examenLabel: "Tes examens",
    examenSubject1: "SVT — Anatomie",
    examenIn1: "Dans 12 jours",
    examenSubject2: "Histoire",
    examenIn2: "Dans 25 jours",
    planningLabel: "Aujourd'hui",
    planningTasks: ["Le cœur et la circulation", "Révolution française — partie 2", "Vocabulaire espagnol"],
    quizLabel: "Quiz — Anatomie",
    quizQuestion: "Quel rôle a la petite circulation ?",
    quizOptionCorrect: "Oxygéner le sang dans les poumons",
    quizOptionWrong: "Transporter le sang vers les muscles",
    floatingPlanningLabel: "Planning",
    floatingPlanningTask: "Le cœur — fait",
    floatingQuizLabel: "Quiz",
    floatingQuizQuestion: "Quel rôle a la petite circulation ?",
  },
};

export type LandingDict = typeof landing;
