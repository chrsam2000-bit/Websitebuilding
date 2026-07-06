// ── Runtime config (server-only). Never import into client components. ──────

export const SEC_USER_AGENT =
  process.env.SEC_USER_AGENT?.trim() ||
  "Terra Verity Ledger contact@example.com";

export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY?.trim() || "";
export const VERITY_MODEL = process.env.VERITY_MODEL?.trim() || "claude-opus-4-8";

/** Global default for sample-data mode; a request may also opt in per-run. */
export const SAMPLE_DATA_DEFAULT =
  process.env.VERITY_SAMPLE_DATA === "1" ||
  process.env.VERITY_SAMPLE_DATA === "true";

// Base URLs — confirmed correct as of build time. Table/column names inside
// the Envirofacts connectors should be re-verified against each system's live
// model/metadata page (data.epa.gov/efservice model docs) before production.
export const BASE = {
  envirofacts: "https://data.epa.gov/efservice",
  echo: "https://echodata.epa.gov/echo",
  secData: "https://data.sec.gov",
  secWww: "https://www.sec.gov",
  secFts: "https://efts.sec.gov/LATEST",
} as const;

// Access discipline: EPA is throttled; SEC asks for < ~10 req/s + backoff.
export const HTTP = {
  timeoutMs: 20_000,
  maxRetries: 3,
  backoffBaseMs: 800,
  cacheTtlMs: 6 * 60 * 60 * 1000, // 6h record cache
  tickersTtlMs: 24 * 60 * 60 * 1000, // 24h for company_tickers.json
} as const;
