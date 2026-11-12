import type { LandingDict } from "../fr/landing";

export const landing: LandingDict = {
  header: {
    connexion: "Log in",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    navComment: "How it works",
    navFonctionnalites: "Features",
    navFaq: "FAQ",
    essayerGratuitement: "Try it for free",
  },
  hero: {
    badge: "For students",
    titlePrefix: "Your",
    titleHighlight: "study notes",
    titleSuffix: "in under 2 minutes",
    subtitle: "Drop in your course — PDF, photos, or Word — and get a clear, organized study note, ready to review.",
    dropCourse: "Drop in your course",
    essayerGratuitement: "Try it for free",
    tagline: "Notes • Pre-exam planning • Quizzes",
  },
  howItWorks: {
    title: "How it works",
    steps: [
      { titre: "Drop in your course", description: "A photo, a PDF, or a Word file — no need to retype anything." },
      { titre: "Get your study notes", description: "A clear, structured note, ready in seconds." },
      { titre: "Review with your planning", description: "Spread out automatically until your exam date." },
    ],
  },
  featureTabs: {
    title: "One app, four tools",
    tabsAriaLabel: "Features",
    tabs: {
      fiches: {
        label: "Notes",
        description:
          "Drop in a course (PDF, photos, or Word) and Reviix turns it into a structured note: an outline, sub-points, and a \"Key takeaways\" box.",
      },
      examen: {
        label: "Exams",
        description: "Add your exam date and the chapters it covers: Reviix knows exactly how much time you have left to review.",
      },
      planning: {
        label: "Planning",
        description: "A daily plan generated automatically, spreading out what's left to review until your exam date.",
      },
      quiz: {
        label: "Quizzes",
        description: "Test yourself with questions generated from your own notes, not generic content.",
      },
    },
  },
  benefits: {
    title: "Why Reviix",
    items: [
      {
        titre: "Study notes ready in seconds",
        description: "Drop in your course, get a structured note back without retyping a thing.",
      },
      {
        titre: "A plan that follows your exam",
        description: "Give it your exam date, the plan spreads out what's left to review automatically.",
      },
      {
        titre: "Quizzes from your own notes",
        description: "Test yourself on what you actually studied, not on generic content.",
      },
      {
        titre: "Nothing gets lost by accident",
        description: "A deleted note goes to the trash — it's never wiped out by a single tap.",
      },
      {
        titre: "Built for your phone",
        description: "Drop in a course and review a note between two classes, on mobile or tablet alike.",
      },
      {
        titre: "Credits that are easy to follow",
        description: "One simple counter per month, shown in credits, with no surprises at the end.",
      },
    ],
  },
  faq: {
    title: "Frequently asked questions",
    items: [
      {
        q: "How does it work?",
        a: "You drop in your course, Reviix generates a structured study note in seconds. You can then follow a plan and train with quizzes built from that note.",
      },
      {
        q: "What files can I drop in?",
        a: "Photos of your course, PDFs, and Word files (.doc, .docx).",
      },
      {
        q: "What are credits?",
        a: "Every note or quiz generation uses up credits. Each plan gives you a number of credits per month, which don't carry over to the next one.",
      },
      {
        q: "Can I cancel anytime?",
        a: "Yes, in one click from your account. Access stays active until the end of the period you've already paid for.",
      },
      {
        q: "Are my courses private?",
        a: "Yes. Your courses and notes are tied to your account and no one else can see them.",
      },
    ],
  },
  finalCta: {
    title: "Ready to review faster?",
    button: "Try it for free",
  },
  footer: {
    copyright: (year: number) => `© ${year} Reviix. All rights reserved.`,
  },
  demo: {
    ficheLabel: "Study note",
    ficheTitre: "The heart and blood circulation",
    sections: [
      {
        titre: "Heart anatomy",
        sousPoints: [
          "The heart is a hollow muscle, the **myocardium**, split into 4 chambers: 2 atria and 2 ventricles.",
          "The **heart valves** stop blood from flowing backward between two beats.",
        ],
      },
      {
        titre: "Blood circulation",
        sousPoints: [
          "The **systemic circulation** sends oxygen-rich blood from the heart to every organ.",
          "The **pulmonary circulation** sends blood to the lungs to pick up oxygen.",
        ],
      },
    ],
    aRetenirLabel: "Key takeaways",
    aRetenirPoint: "**Systole** = the heart contracting, **diastole** = it relaxing.",
    examenLabel: "Your exams",
    examenSubject1: "Biology — Anatomy",
    examenIn1: "In 12 days",
    examenSubject2: "History",
    examenIn2: "In 25 days",
    planningLabel: "Today",
    planningTasks: ["The heart and circulation", "French Revolution — part 2", "Spanish vocabulary"],
    quizLabel: "Quiz — Anatomy",
    quizQuestion: "What is the role of the pulmonary circulation?",
    quizOptionCorrect: "Oxygenate the blood in the lungs",
    quizOptionWrong: "Carry blood to the muscles",
    floatingPlanningLabel: "Planning",
    floatingPlanningTask: "The heart — done",
    floatingQuizLabel: "Quiz",
    floatingQuizQuestion: "What is the role of the pulmonary circulation?",
  },
};
