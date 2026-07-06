// ── Core domain types for The Verity Site Dossier ──────────────────────────

export type EvidenceGrade = "A" | "B" | "C" | "D" | "E";

export type SourceSystem =
  | "EPA FRS"
  | "EPA ECHO"
  | "EPA TRI"
  | "EPA SEMS"
  | "EPA RCRAInfo"
  | "SEC EDGAR"
  | "Verity Model";

/** Every displayed fact carries provenance. */
export interface Citation {
  sourceSystem: SourceSystem;
  recordId?: string; // e.g. FRS Registry ID, EDGAR accession number
  sourceURL: string; // the API URL the fact was pulled from
  fetchedAt?: string; // ISO timestamp
}

/** A single event streamed into the live Evidence Log. */
export interface EvidenceEvent {
  ts: string;
  source: SourceSystem | "orchestrator";
  status: "start" | "ok" | "empty" | "error" | "info";
  detail: string;
  url?: string;
  recordId?: string;
}

export interface Actor {
  role: string; // Site, Facility, Operator, Owner, Corporate Parent, Financials
  name: string;
  identifier?: string; // Registry ID / CIK
  sourceSystem: SourceSystem;
  sourceURL: string;
  linkConfidence: number; // 0..1
  evidenceGrade: EvidenceGrade;
  note?: string;
}

export interface DocumentedLine {
  category: string;
  value: string | number; // documented quantity / count / status
  unit?: string;
  sourceSystem: SourceSystem;
  sourceURL: string;
  recordId?: string;
  evidenceGrade: EvidenceGrade; // A/B for documented records
  basis: string;
}

export interface ModeledEstimate {
  category: string;
  estimateLow: number;
  estimateExpected: number;
  estimateHigh: number;
  unit: string; // USD
  evidenceGrade: "D"; // always D — Verity modeling
  basis: string; // assumptions / benchmarks disclosed
}

export interface Financials {
  available: boolean;
  cik?: string;
  entityName?: string;
  revenue?: number;
  totalAssets?: number;
  totalLiabilities?: number;
  fiscalYear?: number;
  sourceURL?: string;
  note?: string;
}

export interface Disclosure10K {
  accession: string;
  form: string;
  snippet: string;
  sourceURL: string;
}

export interface FacilityIdentity {
  registryId?: string;
  primaryName: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  latitude?: number;
  longitude?: number;
  candidates?: Array<{
    registryId?: string;
    name: string;
    address?: string;
    confidence: number;
    sourceURL: string;
  }>;
  sourceSystem: SourceSystem;
  sourceURL: string;
  evidenceGrade: EvidenceGrade;
}

export interface IdentifyResult {
  facility: FacilityIdentity | null;
  actorChain: Actor[];
  financials: Financials;
  disclosures: Disclosure10K[];
}

export interface QuantifyResult {
  documented: DocumentedLine[]; // real records (A/B)
  modeled: ModeledEstimate[]; // Verity estimates (D)
  headlineLiability: { low: number; expected: number; high: number } | null;
  reportedVsTruth: {
    available: boolean;
    reportedProfit?: number;
    truthAdjustedProfit?: number;
    note: string;
  };
  aggregateGrade: EvidenceGrade | null;
}

export interface Dossier {
  id: string;
  createdAt: string;
  input: DossierInput;
  sampleData: boolean; // true when built from labeled sample records (dev/testing)
  identify: IdentifyResult;
  quantify: QuantifyResult;
  citations: Citation[];
  gaps: string[]; // explicit "no record found" / unreachable notes
}

export interface DossierInput {
  query: string; // site, address, facility, or incident
  state?: string;
  operator?: string;
  contaminationType?: string;
}

export type DeliverableMode = "litigation" | "remediation";
