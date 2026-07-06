// ── SEC EDGAR ───────────────────────────────────────────────────────────────
// Corporate parent (deep pockets), XBRL financials, and which public filer
// disclosed the site. A descriptive User-Agent is MANDATORY on every request.
import { fetchJson, HttpError } from "../http";
import { BASE, SEC_USER_AGENT, HTTP } from "../config";
import type { Disclosure10K, EvidenceEvent, Financials } from "../types";
import { nameMatchConfidence } from "../entity";

const secHeaders = { "User-Agent": SEC_USER_AGENT, accept: "application/json" };

interface TickerRow { cik_str: number; ticker: string; title: string; }

export async function tickerMap(emit?: (e: EvidenceEvent) => void): Promise<TickerRow[]> {
  const url = `${BASE.secWww}/files/company_tickers.json`;
  const { data } = await fetchJson<Record<string, TickerRow>>(url, {
    sourceSystem: "SEC EDGAR",
    label: "EDGAR company tickers",
    headers: secHeaders,
    ttlMs: HTTP.tickersTtlMs,
    emit,
  });
  return Object.values(data);
}

export function cikPad(cik: string | number): string {
  return String(cik).replace(/\D/g, "").padStart(10, "0");
}

function latestAnnual(facts: any, tags: string[]): { val?: number; fy?: number; accn?: string } {
  const gaap = facts?.facts?.["us-gaap"] ?? {};
  for (const tag of tags) {
    const usd = gaap?.[tag]?.units?.USD;
    if (Array.isArray(usd) && usd.length) {
      const annual = usd
        .filter((x: any) => x.form === "10-K" || x.fp === "FY")
        .sort((a: any, b: any) => String(b.end).localeCompare(String(a.end)));
      const pick = annual[0] ?? usd[usd.length - 1];
      if (pick && typeof pick.val === "number") return { val: pick.val, fy: pick.fy, accn: pick.accn };
    }
  }
  return {};
}

export async function companyFinancials(
  cik: string | number,
  entityHint: string,
  emit?: (e: EvidenceEvent) => void,
): Promise<Financials> {
  const padded = cikPad(cik);
  const url = `${BASE.secData}/api/xbrl/companyfacts/CIK${padded}.json`;
  try {
    const { data } = await fetchJson<any>(url, {
      sourceSystem: "SEC EDGAR",
      label: `EDGAR XBRL financials CIK ${padded}`,
      headers: secHeaders,
      emit,
    });
    const revenue = latestAnnual(data, [
      "Revenues",
      "RevenueFromContractWithCustomerExcludingAssessedTax",
      "SalesRevenueNet",
      "RevenueFromContractWithCustomerIncludingAssessedTax",
    ]);
    const assets = latestAnnual(data, ["Assets"]);
    const liabilities = latestAnnual(data, ["Liabilities"]);
    return {
      available: true,
      cik: padded,
      entityName: data?.entityName ?? entityHint,
      revenue: revenue.val,
      totalAssets: assets.val,
      totalLiabilities: liabilities.val,
      fiscalYear: revenue.fy ?? assets.fy ?? liabilities.fy,
      sourceURL: url,
    };
  } catch (err) {
    const e = err as HttpError;
    return { available: false, cik: padded, entityName: entityHint, note: `SEC EDGAR financials: ${e.message}`, sourceURL: url };
  }
}

export async function fullTextDisclosures(
  siteName: string,
  emit?: (e: EvidenceEvent) => void,
): Promise<{ disclosures: Disclosure10K[]; topCik?: string; topName?: string; url: string; gap?: string }> {
  const q = `"${siteName}"`;
  const url = `${BASE.secFts}/search-index?q=${encodeURIComponent(q)}&forms=10-K`;
  try {
    const { data } = await fetchJson<any>(url, {
      sourceSystem: "SEC EDGAR",
      label: `EDGAR 10-K full-text search for "${siteName}"`,
      headers: secHeaders,
      emit,
    });
    const hits: any[] = data?.hits?.hits ?? [];
    if (!hits.length) return { disclosures: [], url, gap: `SEC EDGAR: no 10-K filing mentions "${siteName}".` };
    const disclosures: Disclosure10K[] = hits.slice(0, 5).map((h) => {
      const id: string = h?._id ?? "";
      const accession = id.split(":")[0] || h?._source?.accession_no || "";
      const names: string[] = h?._source?.display_names ?? [];
      return {
        accession,
        form: h?._source?.form ?? "10-K",
        snippet: names[0] ? `${names[0]} — 10-K (${h?._source?.file_date ?? ""})` : `10-K ${accession}`,
        sourceURL: `${BASE.secWww}/cgi-bin/browse-edgar?action=getcompany&filenum=&type=10-K`,
      };
    });
    const src0 = hits[0]?._source ?? {};
    const cikRaw = Array.isArray(src0.cik) ? src0.cik[0] : src0.cik;
    const topName = (src0.display_names?.[0] ?? "").replace(/\s*\(.*$/, "").trim() || undefined;
    return { disclosures, topCik: cikRaw ? cikPad(cikRaw) : undefined, topName, url };
  } catch (err) {
    const e = err as HttpError;
    return { disclosures: [], url, gap: `SEC EDGAR full-text: ${e.message}` };
  }
}

/** Resolve an operator/owner name to the best-matching public filer CIK. */
export async function resolveParentCik(
  operatorName: string,
  emit?: (e: EvidenceEvent) => void,
): Promise<{ cik?: string; name?: string; confidence: number; sourceURL: string } | null> {
  try {
    const rows = await tickerMap(emit);
    let best: { row: TickerRow; c: number } | null = null;
    for (const row of rows) {
      const c = nameMatchConfidence(operatorName, row.title);
      if (!best || c > best.c) best = { row, c };
    }
    if (!best) return null;
    return {
      cik: cikPad(best.row.cik_str),
      name: best.row.title,
      confidence: best.c,
      sourceURL: `${BASE.secWww}/files/company_tickers.json`,
    };
  } catch {
    return null;
  }
}
