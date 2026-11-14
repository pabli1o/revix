// Hand-written types mirroring supabase/migrations/*.sql.
// Kept intentionally close to the SQL so the two stay easy to reconcile.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type ClasseCycle = "college" | "lycee" | "superieur";
export type Importance = "normale" | "importante" | "tres_importante";
/** See lib/i18n/grade-scale.ts — null (profiles.echelle_note) means "use
 * the default for the student's current language" rather than a fixed
 * choice. */
export type GradeScale = "vingt" | "dix" | "pourcentage";
export type PlanningTaskType = "decouverte" | "rappel";
export type QuizDifficulty = "facile" | "moyen" | "difficile";
export type QuizStatus = "pending" | "ready" | "failed";
export type SubscriptionStatus = "inactive" | "active" | "past_due" | "canceled";
export type SubscriptionTier = "tier0" | "tier1" | "tier2" | "tier3";

export interface FicheSousPoint {
  lettre: string;
  texte: string;
}

export interface FichePlanSection {
  numero: number;
  titre: string;
  sousPoints: FicheSousPoint[];
}

export interface FicheContenu {
  plan: FichePlanSection[];
  aRetenir: string[];
}

export interface FicheSource {
  type: "texte" | "photo" | "pdf" | "word";
  nom: string;
}

export interface QuizQuestion {
  question: string;
  choix: [string, string, string, string];
  reponseIndex: number;
  explication: string;
}

export interface PlanningTaskPartie {
  numero: number;
  titre: string;
}

// ---------------------------------------------------------------------------
// Row shapes
// ---------------------------------------------------------------------------

export type ProfileRow = {
  id: string;
  prenom: string | null;
  nom: string | null;
  classe_cycle: ClasseCycle | null;
  classe_niveau: string | null;
  onboarding_completed: boolean;
  revision_jours_semaine: number;
  revision_minutes_jour: number;
  free_fiche_generated: boolean;
  /** Overall average goal, /20 — Part B's "objectif de moyenne". */
  objectif_moyenne: number;
  /** Manual grade-scale override — see the GradeScale doc comment. */
  echelle_note: GradeScale | null;
  created_at: string;
  updated_at: string;
};

export type SubjectRow = {
  id: string;
  user_id: string;
  nom: string;
  created_at: string;
};

export type ChapterRow = {
  id: string;
  subject_id: string;
  user_id: string;
  nom: string;
  created_at: string;
};

export type FicheRow = {
  id: string;
  chapter_id: string;
  user_id: string;
  titre: string;
  contenu: FicheContenu;
  sources: FicheSource[];
  /** Position within the batch it was saved in (see POST /api/fiches) —
   * lets a multi-part fiche ("Partie 1", "Partie 2", ...) list in the
   * right order even though its rows share one created_at. 0 for a fiche
   * saved on its own. */
  ordre: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ExamRow = {
  id: string;
  user_id: string;
  nom: string;
  date: string;
  importance: Importance;
  /** Null for an exam created before the "Objectif de note" wizard —
   * everything created through it always sets this. */
  subject_id: string | null;
  coefficient: number;
  /** The goal grade set in the "Objectif de note" wizard, /20 — null for
   * an exam created before that existed, or if the wizard was skipped. */
  note_visee: number | null;
  /** The "current average in this subject" declared (or pre-filled from
   * real grades) when the goal was set, /20. */
  moyenne_declaree_depart: number | null;
  /** The actual grade obtained, /20 — null = "à venir" (upcoming), never
   * treated as a zero. */
  note_obtenue: number | null;
  date_saisie_note: string | null;
  created_at: string;
};

export type ExamChapterRow = {
  exam_id: string;
  chapter_id: string;
};

export type PlanningTaskRow = {
  id: string;
  user_id: string;
  exam_id: string | null;
  chapter_id: string;
  date: string;
  type: PlanningTaskType;
  parties: PlanningTaskPartie[];
  duree_minutes: number;
  completed: boolean;
  created_at: string;
};

export type QuizRow = {
  id: string;
  user_id: string;
  chapter_id: string;
  difficulty: QuizDifficulty;
  status: QuizStatus;
  questions: QuizQuestion[];
  source_fiches_updated_at: string | null;
  created_at: string;
  updated_at: string;
};

export type QuizAttemptRow = {
  id: string;
  user_id: string;
  chapter_id: string;
  difficulty: QuizDifficulty;
  score: number;
  total: number;
  reponses: Json;
  created_at: string;
};

export type SubscriptionRow = {
  user_id: string;
  whop_user_id: string | null;
  whop_membership_id: string | null;
  status: SubscriptionStatus;
  tier: SubscriptionTier | null;
  current_period_end: string | null;
  ai_cost_usd_period: number;
  extra_credit_usd_period: number;
  created_at: string;
  updated_at: string;
};

export type AiCreditTopupRow = {
  payment_id: string;
  user_id: string;
  amount_usd: number;
  created_at: string;
};

export interface FicheDraftItem {
  titre: string;
  contenu: FicheContenu;
}

export type FicheDraftRow = {
  id: string;
  user_id: string;
  items: FicheDraftItem[];
  sources: FicheSource[];
  created_at: string;
};

// ---------------------------------------------------------------------------
// Supabase generic-client scaffolding
// ---------------------------------------------------------------------------

type Table<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: Table<ProfileRow, Partial<ProfileRow> & { id: string }, Partial<ProfileRow>>;
      subjects: Table<
        SubjectRow,
        Partial<SubjectRow> & { user_id: string; nom: string },
        Partial<SubjectRow>
      >;
      chapters: Table<
        ChapterRow,
        Partial<ChapterRow> & { subject_id: string; user_id: string; nom: string },
        Partial<ChapterRow>
      >;
      fiches: Table<
        FicheRow,
        Partial<FicheRow> & {
          chapter_id: string;
          user_id: string;
          titre: string;
          contenu: FicheContenu;
        },
        Partial<FicheRow>
      >;
      exams: Table<
        ExamRow,
        Partial<ExamRow> & { user_id: string; nom: string; date: string; importance: Importance },
        Partial<ExamRow>
      >;
      exam_chapters: Table<ExamChapterRow, ExamChapterRow, Partial<ExamChapterRow>>;
      planning_tasks: Table<
        PlanningTaskRow,
        Partial<PlanningTaskRow> & {
          user_id: string;
          chapter_id: string;
          date: string;
          type: PlanningTaskType;
        },
        Partial<PlanningTaskRow>
      >;
      quizzes: Table<
        QuizRow,
        Partial<QuizRow> & { user_id: string; chapter_id: string; difficulty: QuizDifficulty },
        Partial<QuizRow>
      >;
      quiz_attempts: Table<
        QuizAttemptRow,
        Partial<QuizAttemptRow> & {
          user_id: string;
          chapter_id: string;
          difficulty: QuizDifficulty;
          score: number;
        },
        Partial<QuizAttemptRow>
      >;
      subscriptions: Table<
        SubscriptionRow,
        Partial<SubscriptionRow> & { user_id: string },
        Partial<SubscriptionRow>
      >;
      fiche_drafts: Table<
        FicheDraftRow,
        Partial<FicheDraftRow> & { user_id: string; items: FicheDraftItem[] },
        Partial<FicheDraftRow>
      >;
      ai_credit_topups: Table<
        AiCreditTopupRow,
        Partial<AiCreditTopupRow> & { payment_id: string; user_id: string; amount_usd: number },
        Partial<AiCreditTopupRow>
      >;
    };
    Views: Record<string, never>;
    Functions: {
      increment_ai_usage_cost: {
        Args: { p_user_id: string; p_amount: number };
        Returns: void;
      };
      increment_ai_credit: {
        Args: { p_user_id: string; p_amount: number };
        Returns: void;
      };
    };
  };
}
