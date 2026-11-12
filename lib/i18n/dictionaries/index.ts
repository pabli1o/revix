import { fr } from "./fr";
import { en } from "./en";
import { es } from "./es";
import type { Locale } from "../locale";

export type Dictionary = typeof fr;

// Structural check: if en/es/index.ts ever falls out of sync with
// fr/index.ts (a domain added to one but not the other), this line fails
// to compile instead of silently serving an incomplete dictionary.
const _enShapeCheck: Dictionary = en;
const _esShapeCheck: Dictionary = es;
void _enShapeCheck;
void _esShapeCheck;

export const dictionaries: Record<Locale, Dictionary> = { fr, en, es };
