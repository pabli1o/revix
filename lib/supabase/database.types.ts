// Hand-written types mirroring supabase/migrations/*.sql.
// Kept intentionally close to the SQL so the two stay easy to reconcile.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type ClasseCycle = "college" | "lycee" | "superieur";
export type Importance = "normale" | "importante" | "tres_importante";
export type PlanningTaskType = "decouverte" | "rappel";
export type QuizDifficulty = "facile" | "moyen" | "difficile";
export type QuizStatus = "pending" | "ready" | "failed";
export type SubscriptionStatus = "inactive" | "active" | "past_due" | "canceled";

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
  classe_cycle: ClasseCycle | null;
  classe_niveau: string | null;
  onboarding_completed: boolean;
  revision_jours_semaine: number;
  revision_minutes_jour: number;
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
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: SubscriptionStatus;
  current_period_end: string | null;
  fiches_generated_period: number;
  period_start: string | null;
  created_at: string;
  updated_at: string;
};

export type AiLockRow = {
  id: boolean;
  locked_at: string | null;
  locked_by: string | null;
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
      ai_lock: Table<AiLockRow, Partial<AiLockRow>, Partial<AiLockRow>>;
      fiche_drafts: Table<
        FicheDraftRow,
        Partial<FicheDraftRow> & { user_id: string; items: FicheDraftItem[] },
        Partial<FicheDraftRow>
      >;
    };
    Views: Record<string, never>;
    Functions: {
      try_acquire_ai_lock: {
        Args: { holder: string; stale_after_seconds?: number };
        Returns: boolean;
      };
      release_ai_lock: {
        Args: { holder: string };
        Returns: boolean;
      };
    };
  };
}
