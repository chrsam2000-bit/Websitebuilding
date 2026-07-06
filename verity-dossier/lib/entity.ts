// ── Entity resolution — deterministic fuzzy matching with confidence scores ─
// The AI layer (lib/ai.ts) may re-rank these candidates, but it never invents a
// match: every candidate here comes from a fetched record.

const CORP_STOPWORDS = [
  "inc", "incorporated", "corp", "corporation", "co", "company", "llc", "llp",
  "lp", "ltd", "limited", "plc", "holdings", "holding", "group", "the",
  "international", "intl", "usa", "us", "america", "american", "&",
];

export function normalize(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/[.,/#!$%^*;:{}=\-_`~()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeCorp(s: string): string {
  const toks = normalize(s)
    .split(" ")
    .filter((t) => t && !CORP_STOPWORDS.includes(t));
  return toks.join(" ");
}

function bigrams(s: string): Map<string, number> {
  const m = new Map<string, number>();
  const clean = s.replace(/\s+/g, "");
  for (let i = 0; i < clean.length - 1; i++) {
    const g = clean.slice(i, i + 2);
    m.set(g, (m.get(g) ?? 0) + 1);
  }
  return m;
}

/** Sørensen–Dice coefficient on character bigrams → 0..1 */
export function diceSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const A = bigrams(a);
  const B = bigrams(b);
  if (A.size === 0 || B.size === 0) return 0;
  let overlap = 0;
  for (const [g, ca] of A) {
    const cb = B.get(g);
    if (cb) overlap += Math.min(ca, cb);
  }
  const total = [...A.values()].reduce((x, y) => x + y, 0) + [...B.values()].reduce((x, y) => x + y, 0);
  return (2 * overlap) / total;
}

/** Token Jaccard on normalized corp names. */
export function tokenJaccard(a: string, b: string): number {
  const A = new Set(normalizeCorp(a).split(" ").filter(Boolean));
  const B = new Set(normalizeCorp(b).split(" ").filter(Boolean));
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  return inter / (A.size + B.size - inter);
}

/** Blended confidence that two entity names refer to the same entity (0..1). */
export function nameMatchConfidence(a: string, b: string): number {
  const dice = diceSimilarity(normalizeCorp(a), normalizeCorp(b));
  const jac = tokenJaccard(a, b);
  // token overlap is more meaningful for corp names; weight it higher
  return Math.min(1, 0.45 * dice + 0.55 * jac);
}

export interface RankedCandidate<T> {
  item: T;
  confidence: number;
}

export function rankByName<T>(
  query: string,
  candidates: T[],
  nameOf: (c: T) => string,
): RankedCandidate<T>[] {
  return candidates
    .map((item) => ({ item, confidence: nameMatchConfidence(query, nameOf(item)) }))
    .sort((a, b) => b.confidence - a.confidence);
}
