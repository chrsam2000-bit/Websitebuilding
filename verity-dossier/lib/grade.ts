// ── Evidence grading — tied to provenance, not to how confident prose sounds ─
import type { EvidenceGrade } from "./types";

export const GRADE_MEANING: Record<EvidenceGrade, string> = {
  A: "Verified facility-level data direct from an EPA program record, or audited SEC XBRL financials.",
  B: "Strong regulatory/registry linkage (FRS Registry ID match, Superfund/NPL listing, formal enforcement action).",
  C: "Company self-reported with disclosed methodology (e.g. a 10-K narrative disclosure).",
  D: "Verity modeled estimate (remediation cost, projected liability). Always ranged, always labeled.",
  E: "Unconfirmed link or gap requiring human validation (a low-confidence entity match). Shown as open, never asserted.",
};

const VAL: Record<EvidenceGrade, number> = { A: 5, B: 4, C: 3, D: 2, E: 1 };
const INV: Record<number, EvidenceGrade> = { 5: "A", 4: "B", 3: "C", 2: "D", 1: "E" };

export function aggregateGrade(grades: (EvidenceGrade | null | undefined)[]): EvidenceGrade | null {
  const vals = grades.filter(Boolean).map((g) => VAL[g as EvidenceGrade]);
  if (!vals.length) return null;
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  return INV[Math.max(1, Math.min(5, Math.round(avg)))];
}

export function gradePct(g: EvidenceGrade | null): number {
  return g ? (VAL[g] / 5) * 100 : 0;
}

/** Map an entity-resolution confidence to a link grade. */
export function confidenceToGrade(conf: number): EvidenceGrade {
  if (conf >= 0.85) return "B"; // strong registry/name linkage
  if (conf >= 0.65) return "C"; // plausible, self-reported-strength
  return "E"; // requires human validation — never asserted
}
