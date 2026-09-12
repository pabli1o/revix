/**
 * Subjects don't store a color in the database. Instead every subject name
 * gets a deterministic color assigned by sorting all of the user's subject
 * names alphabetically and indexing into a fixed 6-color palette (wrapping
 * around past the 6th subject). Chapters simply inherit their subject's
 * color. Because the assignment only depends on the *set* of subject names,
 * it stays stable across reloads and re-renders without any persistence.
 */

export interface SubjectColor {
  name: string;
  /** Card / tile background — vivid, used for small badges/tags. */
  bg: string;
  /** Border accent */
  border: string;
  /** Text on the vivid `bg` surface */
  text: string;
  /** Soft tint for backgrounds behind content (e.g. fiche chrome) */
  soft: string;
}

export const SUBJECT_PALETTE: SubjectColor[] = [
  { name: "corail", bg: "#E8664D", border: "#C94E37", text: "#FFF6F3", soft: "#3A1E1B" },
  { name: "safran", bg: "#E8A33D", border: "#C7842A", text: "#241C0C", soft: "#3A2C15" },
  { name: "sauge", bg: "#6FA88B", border: "#4F8A6D", text: "#0E1F17", soft: "#1B2F26" },
  { name: "azur", bg: "#4E8FE0", border: "#3670BE", text: "#0B1B2E", soft: "#182C42" },
  { name: "lavande", bg: "#9482E0", border: "#7767C4", text: "#171130", soft: "#241D3F" },
  { name: "rose", bg: "#DB6FA6", border: "#BC5088", text: "#2B1220", soft: "#3A1E2E" },
];

/**
 * Deterministic per-name hash used only to break ties if the alphabetical
 * index ever needs to wrap; the primary assignment is the sorted index.
 */
function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/**
 * Given the full list of a user's subject names, returns a Map from subject
 * name to its assigned color. Names are sorted alphabetically (French
 * locale) and assigned palette colors in order, wrapping around when there
 * are more than 6 subjects.
 */
export function assignSubjectColors(subjectNames: string[]): Map<string, SubjectColor> {
  const unique = Array.from(new Set(subjectNames));
  const sorted = [...unique].sort((a, b) => a.localeCompare(b, "fr"));
  const map = new Map<string, SubjectColor>();
  sorted.forEach((name, index) => {
    map.set(name, SUBJECT_PALETTE[index % SUBJECT_PALETTE.length]);
  });
  return map;
}

/**
 * Convenience for a single subject when the full list is already known.
 * Falls back to a hash-based pick if `allNames` isn't supplied, so isolated
 * components can still render a stable (if not perfectly alphabetical)
 * color without fetching every subject name.
 */
export function getSubjectColor(name: string, allNames?: string[]): SubjectColor {
  if (allNames && allNames.length > 0) {
    return assignSubjectColors(allNames).get(name) ?? SUBJECT_PALETTE[0];
  }
  return SUBJECT_PALETTE[hashName(name) % SUBJECT_PALETTE.length];
}
