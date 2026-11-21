import type { BlocageOption } from "@/lib/onboarding/qualification";

export const onboarding = {
  classe: {
    title: "Tu es en quelle classe ?",
    subtitle: "Pour adapter un peu l'expérience.",
    options: {
      college: { label: "Collège", description: "De la 6e à la 3e" },
      lycee: { label: "Lycée", description: "Seconde, Première, Terminale" },
      superieur: { label: "Supérieur", description: "Licence, BTS, prépa…" },
    },
  },
  niveau: {
    title: "Quel niveau ?",
    superieurPlaceholder: "Ex : Licence 2 Économie, BTS, prépa…",
    continuer: "Continuer",
    collegeNiveaux: ["6e", "5e", "4e", "3e"],
    lyceeNiveaux: ["Seconde", "Première", "Terminale"],
  },
  prenom: {
    title: "Comment on t'appelle ?",
    subtitle: "Ton prénom ou un pseudo, comme tu préfères.",
    placeholder: "Ex : Léa, ou un pseudo…",
    continuer: "Continuer",
  },
  /** 3 screens added after "objectif" and before "analyzing" (a tester
   * asked the onboarding to use what's actually hard for the student, not
   * just their grades) — see lib/onboarding/qualification.ts for the
   * option keys. blocages is multi-select, the other two are single-select,
   * all rendered with the same ChoiceCard component. */
  blocages: {
    title: "Qu'est-ce qui te bloque le plus pour avoir de meilleures notes ?",
    subtitle: "Plusieurs réponses possibles.",
    continuer: "Continuer",
    options: {
      pas_de_depart: "Je ne sais pas par où commencer",
      procrastination: "Je remets tout à la veille",
      concentration: "Je n'arrive pas à me concentrer",
      comprehension: "Je ne comprends pas bien mes cours",
      methode: "Je n'ai pas de méthode pour réviser",
      stress: "Je stresse pendant les examens",
      temps: "Je n'ai pas assez de temps",
    } satisfies Record<BlocageOption, string>,
  },
  methodeRevision: {
    title: "Comment tu révises aujourd'hui ?",
    options: {
      relit: "Je relis mes cours",
      recopie: "Je recopie mes cours",
      fiches_maison: "Je fais mes fiches moi-même",
      revise_peu: "Je ne révise presque pas",
    },
  },
  prochainExamen: {
    title: "Pour quand est ton prochain examen important ?",
    options: {
      cette_semaine: "Cette semaine",
      ce_mois: "Ce mois-ci",
      dans_2_3_mois: "Dans 2 ou 3 mois",
      pas_de_date: "Pas encore de date",
    },
  },
  /** The "quelle est ta moyenne générale / que veux-tu atteindre ?"
   * screens, right after signup (see components/onboarding/wizard.tsx) —
   * no rhythm question anymore (ASSUMED_DAYS_PER_WEEK), just a general
   * starting point and goal fed to lib/examen/goal-calc.ts's
   * computeGeneralStudyPlan. */
  moyenne: {
    actuelle: {
      title: "Quelle est ta moyenne générale ?",
      subtitle: "Une estimation suffit, tu pourras l'affiner plus tard.",
      continuer: "Continuer",
    },
    objectif: {
      title: "Quelle moyenne veux-tu atteindre ?",
      subtitle: "Fixe-toi un objectif réaliste, tu pourras le changer à tout moment.",
      valider: "Valider mon objectif",
    },
    analyzing: {
      title: "Analyse en cours…",
      step1: "Écart entre ta moyenne actuelle et ton objectif",
      step2: "Prise en compte de ton niveau d'études",
      step3: "Construction de ton rythme de révision",
    },
    result: {
      // Short intro line above the big number — see fr/examen.ts's
      // wizard.result.normalHeadline, which this mirrors (the numbers
      // render separately: minutes/day big, hours/week small underneath).
      headline: (from: string, to: string) => `Pour passer de ${from} à ${to} :`,
      disclaimer: "Estimation générale, on l'affinera avec tes examens.",
      // "Terminer" read like the end of a form, not what actually happens
      // next (the CTA always goes on to generate the first fiche — see
      // the brief's single "Générer mes fiches" CTA used everywhere else).
      finish: "Générer mes fiches",
      finishing: "Un instant…",
      // Shown under the big number only when at least one blocage was
      // selected. One honest sentence per difficulty, naming an actual
      // feature (fiches/planning/quiz) — never the minutes calculation,
      // which does NOT use these answers (see lib/onboarding/
      // qualification.ts's doc comment).
      commentReviixAide: {
        title: "Ce que tu as dit, et comment Reviix t'aide",
        parBlocage: {
          pas_de_depart: "Tu ne sais pas par où commencer : Reviix te dit quoi réviser chaque jour.",
          procrastination: "Tu remets tout à la veille : ton planning répartit tes révisions jour après jour.",
          concentration: "Tu as du mal à te concentrer : tes fiches sont courtes et ciblées, pour réviser par petites sessions.",
          comprehension: "Tu comprends mal tes cours : tes fiches simplifient chaque chapitre et les quiz t'entraînent.",
          methode: "Tu n'as pas de méthode pour réviser : le planning te dit quoi faire, et quand.",
          stress: "Tu stresses pendant les examens : les quiz te permettent de t'entraîner avant le jour J.",
          temps: "Tu manques de temps : tes fiches sont prêtes en 2 minutes.",
        } satisfies Record<BlocageOption, string>,
      },
    },
  },
  genericError: "Une erreur est survenue.",
};

export type OnboardingDict = typeof onboarding;
