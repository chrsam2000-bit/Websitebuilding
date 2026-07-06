// ── SAMPLE DATA (dev / testing only) ────────────────────────────────────────
// Serves clearly-labeled sample records so the full pipeline is demonstrable
// without live .gov access. This is NOT a production fallback: it only runs when
// sample mode is explicitly requested, and the UI labels every dossier built
// from it as "SAMPLE DATA — not live government records".
import type { EvidenceEvent, IdentifyResult, QuantifyResult, DossierInput } from "./types";
import { aggregateGrade } from "./grade";

const SAMPLE_URL = "https://example.invalid/sample-record"; // never a real record

export function sampleIdentify(input: DossierInput): IdentifyResult {
  const q = input.query || "Sample Facility";
  const state = input.state || "IL";
  const rid = "1100" + String(Math.abs(hash(q)) % 100000).padStart(6, "0");
  return {
    facility: {
      registryId: rid,
      primaryName: `${titleCase(q)} (SAMPLE)`,
      address: `100 Industrial Rd, Sample City, ${state} 60000`,
      city: "Sample City",
      state,
      zip: "60000",
      sourceSystem: "EPA FRS",
      sourceURL: SAMPLE_URL,
      evidenceGrade: "B",
      candidates: [
        { registryId: rid, name: `${titleCase(q)} (SAMPLE)`, address: `Sample City, ${state}`, confidence: 0.94, sourceURL: SAMPLE_URL },
        { registryId: rid + "1", name: `${titleCase(q)} West (SAMPLE)`, address: `Sample City, ${state}`, confidence: 0.71, sourceURL: SAMPLE_URL },
      ],
    },
    actorChain: [
      { role: "Facility", name: `${titleCase(q)} (SAMPLE)`, identifier: `FRS ${rid}`, sourceSystem: "EPA FRS", sourceURL: SAMPLE_URL, linkConfidence: 0.94, evidenceGrade: "B", note: "Canonical facility resolved from FRS." },
      { role: "Operator", name: "Sample Operating Co. (SAMPLE)", sourceSystem: "EPA ECHO", sourceURL: SAMPLE_URL, linkConfidence: 0.82, evidenceGrade: "C", note: "Operator named on ECHO facility record." },
      { role: "Corporate Parent", name: "Sample Industries Inc. (SAMPLE)", identifier: "CIK 0000001750", sourceSystem: "SEC EDGAR", sourceURL: SAMPLE_URL, linkConfidence: 0.88, evidenceGrade: "B", note: "Public filer matched via company_tickers.json and 10-K full-text." },
      { role: "Financials", name: "Sample Industries Inc. — FY2024 (SAMPLE)", identifier: "CIK 0000001750", sourceSystem: "SEC EDGAR", sourceURL: SAMPLE_URL, linkConfidence: 0.88, evidenceGrade: "A", note: "XBRL CompanyFacts." },
    ],
    financials: {
      available: true,
      cik: "0000001750",
      entityName: "Sample Industries Inc. (SAMPLE)",
      revenue: 4_820_000_000,
      totalAssets: 9_140_000_000,
      totalLiabilities: 5_600_000_000,
      fiscalYear: 2024,
      sourceURL: SAMPLE_URL,
    },
    disclosures: [
      { accession: "0000001750-25-000012", form: "10-K", snippet: "Sample Industries Inc. — 10-K, Item 3 Legal Proceedings references environmental remediation at the Sample City site (SAMPLE).", sourceURL: SAMPLE_URL },
    ],
  };
}

export function sampleQuantify(): QuantifyResult {
  const documented = [
    { category: "TRI reported releases (total)", value: 486_200, unit: "lbs", sourceSystem: "EPA TRI" as const, sourceURL: SAMPLE_URL, evidenceGrade: "A" as const, basis: "Sum of reported release quantities 2016–2024 (SAMPLE)." },
    { category: "TRI release — Trichloroethylene", value: 142_800, unit: "lbs", sourceSystem: "EPA TRI" as const, sourceURL: SAMPLE_URL, evidenceGrade: "A" as const, basis: "Reported quantity (SAMPLE)." },
    { category: "Assessed penalties", value: 1_240_000, unit: "USD", sourceSystem: "EPA ECHO" as const, sourceURL: SAMPLE_URL, evidenceGrade: "A" as const, basis: "ECHO dollar penalties on record (SAMPLE)." },
    { category: "Formal enforcement actions", value: 4, sourceSystem: "EPA ECHO" as const, sourceURL: SAMPLE_URL, evidenceGrade: "B" as const, basis: "ECHO formal action count (SAMPLE)." },
    { category: "Superfund / NPL status", value: "Final NPL (SAMPLE)", sourceSystem: "EPA SEMS" as const, sourceURL: SAMPLE_URL, evidenceGrade: "B" as const, basis: "SEMS Superfund listing (SAMPLE)." },
    { category: "RCRA hazardous-waste status", value: "Large Quantity Generator (SAMPLE)", sourceSystem: "EPA RCRAInfo" as const, sourceURL: SAMPLE_URL, evidenceGrade: "A" as const, basis: "RCRAInfo handler record (SAMPLE)." },
  ];
  const modeled = [
    { category: "Estimated remediation / cleanup cost", estimateLow: 8_500_000, estimateExpected: 21_000_000, estimateHigh: 47_000_000, unit: "USD", evidenceGrade: "D" as const, basis: "Modeled from documented TRI volumes + NPL status against published per-unit remediation benchmarks. SAMPLE assumptions." },
    { category: "Estimated total financial liability", estimateLow: 12_000_000, estimateExpected: 34_000_000, estimateHigh: 78_000_000, unit: "USD", evidenceGrade: "D" as const, basis: "Remediation + projected third-party and oversight liability. SAMPLE assumptions." },
  ];
  const grades = [...documented.map((d) => d.evidenceGrade), ...modeled.map((m) => m.evidenceGrade)];
  return {
    documented,
    modeled,
    headlineLiability: { low: 12_000_000, expected: 34_000_000, high: 78_000_000 },
    reportedVsTruth: { available: true, reportedProfit: 612_000_000, truthAdjustedProfit: 578_000_000, note: "Reported net income less expected modeled liability (SAMPLE)." },
    aggregateGrade: aggregateGrade(grades),
  };
}

export function sampleEvents(input: DossierInput, emit: (e: EvidenceEvent) => void) {
  const rows: Array<[EvidenceEvent["source"], EvidenceEvent["status"], string]> = [
    ["orchestrator", "info", "SAMPLE DATA MODE — records below are illustrative, not live government records."],
    ["EPA FRS", "ok", `Registry ID resolved for "${input.query}" (SAMPLE)`],
    ["EPA ECHO", "ok", "Compliance profile: 4 formal actions, $1.24M penalties (SAMPLE)"],
    ["EPA TRI", "ok", "2016–2024 releases: 486,200 lbs (SAMPLE)"],
    ["EPA SEMS", "ok", "Superfund: Final NPL (SAMPLE)"],
    ["EPA RCRAInfo", "ok", "RCRA: Large Quantity Generator (SAMPLE)"],
    ["SEC EDGAR", "ok", "Parent CIK matched: Sample Industries Inc. conf 0.88 (SAMPLE)"],
  ];
  for (const [source, status, detail] of rows) emit({ ts: new Date().toISOString(), source, status, detail });
}

function titleCase(s: string): string {
  return s.replace(/\w\S*/g, (t) => t[0].toUpperCase() + t.slice(1).toLowerCase());
}
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}
