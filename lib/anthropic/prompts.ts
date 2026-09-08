import "server-only";

import type {
  FicheContenu,
  FicheSousPoint,
  FichePlanSection,
  QuizDifficulty,
  QuizQuestion,
} from "@/lib/supabase/database.types";

// ---------------------------------------------------------------------------
// Fiche generation
// ---------------------------------------------------------------------------

export interface FicheProposal {
  titre: string;
  contenu: FicheContenu;
}

export const FICHE_GENERATION_SYSTEM = `Tu es un assistant pédagogique qui aide des élèves français (collège, lycée, supérieur) à transformer des sources de cours (texte, photos de notes, PDF) en fiches de révision structurées.

Règles strictes :
- Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ou après, sans balises markdown ni bloc de code.
- Le contenu doit être fidèle aux sources fournies : n'invente jamais de notion absente des sources.
- Si les sources couvrent plusieurs sujets clairement distincts, propose plusieurs fiches séparées. Sinon, propose une seule fiche.
- Chaque fiche a un plan numéroté en continu ("1. Titre", "2. Titre", ...) avec des sous-points lettrés ("a.", "b.", ...) pour chaque section.
- Chaque fiche se termine par une section "À retenir" : une liste de phrases courtes et denses résumant les points clés indispensables.
- Mets en avant les notions importantes en les entourant d'astérisques doubles dans le texte, par exemple **terme important**, comme du gras Markdown.
- Le format de sortie JSON attendu est exactement :

{
  "fiches": [
    {
      "titre": "Titre court de la fiche",
      "plan": [
        {
          "numero": 1,
          "titre": "Titre de la section",
          "sousPoints": [
            { "lettre": "a", "texte": "Contenu du sous-point, avec **gras** si utile." }
          ]
        }
      ],
      "aRetenir": ["Phrase clé 1", "Phrase clé 2"]
    }
  ]
}`;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validateSousPoint(value: unknown): FicheSousPoint | null {
  if (typeof value !== "object" || value === null) return null;
  const obj = value as Record<string, unknown>;
  if (!isNonEmptyString(obj.lettre) || !isNonEmptyString(obj.texte)) return null;
  return { lettre: obj.lettre.trim(), texte: obj.texte.trim() };
}

function validatePlanSection(value: unknown): FichePlanSection | null {
  if (typeof value !== "object" || value === null) return null;
  const obj = value as Record<string, unknown>;
  if (typeof obj.numero !== "number" || !isNonEmptyString(obj.titre)) return null;
  if (!Array.isArray(obj.sousPoints) || obj.sousPoints.length === 0) return null;
  const sousPoints: FicheSousPoint[] = [];
  for (const raw of obj.sousPoints) {
    const sp = validateSousPoint(raw);
    if (!sp) return null;
    sousPoints.push(sp);
  }
  return { numero: obj.numero, titre: obj.titre.trim(), sousPoints };
}

function validateFicheContenu(value: unknown): FicheContenu | null {
  if (typeof value !== "object" || value === null) return null;
  const obj = value as Record<string, unknown>;
  if (!Array.isArray(obj.plan) || obj.plan.length === 0) return null;
  if (!Array.isArray(obj.aRetenir) || obj.aRetenir.length === 0) return null;

  const plan: FichePlanSection[] = [];
  for (const raw of obj.plan) {
    const section = validatePlanSection(raw);
    if (!section) return null;
    plan.push(section);
  }

  const aRetenir: string[] = [];
  for (const raw of obj.aRetenir) {
    if (!isNonEmptyString(raw)) return null;
    aRetenir.push(raw.trim());
  }

  return { plan, aRetenir };
}

export function validateFicheProposals(value: unknown): FicheProposal[] | null {
  if (typeof value !== "object" || value === null) return null;
  const obj = value as Record<string, unknown>;
  if (!Array.isArray(obj.fiches) || obj.fiches.length === 0) return null;

  const proposals: FicheProposal[] = [];
  for (const raw of obj.fiches) {
    if (typeof raw !== "object" || raw === null) return null;
    const fRaw = raw as Record<string, unknown>;
    if (!isNonEmptyString(fRaw.titre)) return null;
    const contenu = validateFicheContenu(fRaw);
    if (!contenu) return null;
    proposals.push({ titre: fRaw.titre.trim(), contenu });
  }
  return proposals;
}

// ---------------------------------------------------------------------------
// Quiz generation
// ---------------------------------------------------------------------------

const DIFFICULTY_LABEL: Record<QuizDifficulty, string> = {
  facile: "facile (questions directes sur des connaissances de base)",
  moyen: "moyen (questions demandant de croiser plusieurs informations)",
  difficile: "difficile (questions fines, nuances, pièges probables)",
};

export function buildQuizSystemPrompt(difficulty: QuizDifficulty): string {
  return `Tu crées un quiz de 10 questions à choix multiples pour un élève, à partir du contenu de cours fourni (une ou plusieurs fiches de révision).

Niveau de difficulté demandé : ${DIFFICULTY_LABEL[difficulty]}.

Règles strictes :
- Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ou après, sans bloc de code.
- Toutes les questions et réponses doivent être strictement basées sur le contenu fourni. N'invente aucune information absente du contenu.
- Formule chaque question et son explication comme des faits autonomes et vrais. N'écris jamais "selon la fiche", "d'après le cours", "comme vu précédemment" ou toute formulation qui fait référence au support : énonce directement le fait.
- Pour chaque question, fournis exactement une bonne réponse ("reponseCorrecte") et exactement 3 mauvaises réponses plausibles ("distracteurs"), toutes de longueur et de style similaires pour ne pas trahir la bonne réponse par sa forme.
- L'explication doit être courte (1 à 2 phrases) et justifier pourquoi la réponse est correcte.
- Génère exactement 10 questions.
- Le format de sortie JSON attendu est exactement :

{
  "questions": [
    {
      "question": "Texte de la question",
      "reponseCorrecte": "Bonne réponse",
      "distracteurs": ["Mauvaise réponse 1", "Mauvaise réponse 2", "Mauvaise réponse 3"],
      "explication": "Explication courte et autonome."
    }
  ]
}`;
}

interface RawQuizQuestion {
  question: string;
  reponseCorrecte: string;
  distracteurs: [string, string, string];
  explication: string;
}

function validateRawQuizQuestions(value: unknown): RawQuizQuestion[] | null {
  if (typeof value !== "object" || value === null) return null;
  const obj = value as Record<string, unknown>;
  if (!Array.isArray(obj.questions) || obj.questions.length !== 10) return null;

  const questions: RawQuizQuestion[] = [];
  for (const raw of obj.questions) {
    if (typeof raw !== "object" || raw === null) return null;
    const q = raw as Record<string, unknown>;
    if (!isNonEmptyString(q.question)) return null;
    if (!isNonEmptyString(q.reponseCorrecte)) return null;
    if (!isNonEmptyString(q.explication)) return null;
    if (
      !Array.isArray(q.distracteurs) ||
      q.distracteurs.length !== 3 ||
      !q.distracteurs.every(isNonEmptyString)
    ) {
      return null;
    }
    questions.push({
      question: q.question.trim(),
      reponseCorrecte: q.reponseCorrecte.trim(),
      distracteurs: q.distracteurs.map((d) => (d as string).trim()) as [string, string, string],
      explication: q.explication.trim(),
    });
  }
  return questions;
}

/** Validates the raw model output shape (before shuffling). */
export function validateQuizGeneration(value: unknown): RawQuizQuestion[] | null {
  return validateRawQuizQuestions(value);
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Turns the model's { reponseCorrecte, distracteurs } shape into the
 * persisted { choix, reponseIndex } shape, shuffling the 4 options
 * server-side so the correct answer's position is never predictable from
 * (and never merely requested of) the model's own ordering.
 */
export function shuffleQuizQuestions(raw: RawQuizQuestion[]): QuizQuestion[] {
  return raw.map((q) => {
    const choix = shuffle([q.reponseCorrecte, ...q.distracteurs]);
    const reponseIndex = choix.indexOf(q.reponseCorrecte);
    return {
      question: q.question,
      choix: choix as [string, string, string, string],
      reponseIndex,
      explication: q.explication,
    };
  });
}
