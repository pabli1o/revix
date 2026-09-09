import type { FicheContenu, FicheSource } from "@/lib/supabase/database.types";

/** One fiche proposed by the AI, before the user validates/edits it and
 * chooses where to save it. Shared between server (generation route) and
 * client (validation screen) — no server-only imports here. */
export interface FicheProposal {
  titre: string;
  contenu: FicheContenu;
}

export type SourceInputType = "texte" | "photo" | "pdf" | "word";

export interface GenerateSourceInput {
  type: SourceInputType;
  nom: string;
  /** Plain text content, for type "texte". */
  texte?: string;
  /** Base64-encoded bytes (no "data:" prefix), for photo/pdf/word. */
  data?: string;
  /** Required for type "photo": image/jpeg | image/png | image/webp. */
  mediaType?: string;
}

export interface GenerateFichesRequest {
  sources: GenerateSourceInput[];
}

export interface GenerateFichesResponse {
  proposals: FicheProposal[];
}

/** One fiche the user has validated and is ready to save, with its
 * destination subject/chapter (existing or newly named). */
export interface SaveFicheItem {
  titre: string;
  contenu: FicheContenu;
  sources: FicheSource[];
  subjectId?: string;
  newSubjectNom?: string;
  chapterId?: string;
  newChapterNom?: string;
}

export interface SaveFichesRequest {
  items: SaveFicheItem[];
}

export interface SaveFichesResponse {
  saved: number;
  total: number;
  error?: string;
}

/** Created right after the review step (title/selection, no matière yet) —
 * see components/fiches/new/creation-flow.tsx and app/api/fiches/drafts. */
export interface CreateDraftRequest {
  items: FicheProposal[];
  sources: FicheSource[];
}

export interface CreateDraftResponse {
  draftId: string;
}

export interface FicheDraftResponse {
  id: string;
  items: FicheProposal[];
  sources: FicheSource[];
}
