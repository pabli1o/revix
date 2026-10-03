import type {
  FicheContenu,
  FicheGenerationJobStatus,
  FicheSource,
} from "@/lib/supabase/database.types";

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
  /** Base64-encoded bytes (no "data:" prefix) — used for "photo" (always)
   * and as a fallback path for "pdf"/"word" when not uploaded to storage. */
  data?: string;
  /** Required for type "photo": image/jpeg | image/png | image/webp. */
  mediaType?: string;
  /**
   * "pdf"/"word" only: path of the file in the `source-uploads` Supabase
   * Storage bucket, used instead of `data` — the file went straight from
   * the browser to Storage rather than through this request body, so
   * generation works regardless of file size despite Vercel's 4.5 MB
   * request limit. The server downloads it server-to-server and deletes
   * it once processed (see app/api/fiches/generate/route.ts).
   */
  storagePath?: string;
}

export interface GenerateFichesRequest {
  sources: GenerateSourceInput[];
}

/**
 * Submitting a chunk no longer returns its proposals directly — generation
 * now runs as an Anthropic Message Batch, fully decoupled from this
 * request's own duration (see app/api/fiches/generate/route.ts). `jobId`
 * is what the client then polls via GET /api/fiches/generate/[jobId] (see
 * FicheGenerationJobStatusResponse below) until it's ready or failed.
 */
export interface GenerateFichesResponse {
  jobId?: string;
  error?: string;
  /** Set (with a 402 status) when an active subscriber has hit their
   * monthly AI usage budget — the client uses this to offer the credit
   * top-up instead of treating it as a generic error. */
  aiUsageCapExceeded?: boolean;
}

/** Response shape for GET /api/fiches/generate/[jobId], polled by
 * creation-flow.tsx while a submitted batch is still 'pending'. */
export interface FicheGenerationJobStatusResponse {
  status: FicheGenerationJobStatus;
  proposals?: FicheProposal[];
  error?: string;
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
