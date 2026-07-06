// ── EPA Toxics Release Inventory (TRI) via Envirofacts ──────────────────────
// The real contamination numbers: reported release quantities by chemical/year.
import { fetchJson, HttpError } from "../http";
import type { DocumentedLine, EvidenceEvent } from "../types";
import { efUrl, field, num } from "./util";

type Row = Record<string, unknown>;

export interface TriRelease {
  year?: number;
  chemical?: string;
  amountLbs?: number;
  medium?: string;
  triFacilityId?: string;
}

export async function triReleases(
  query: string,
  state: string | undefined,
  registryId: string | undefined,
  emit?: (e: EvidenceEvent) => void,
): Promise<{ lines: DocumentedLine[]; releases: TriRelease[]; url: string; gap?: string }> {
  // Prefer joining on the FRS registry id where TRI exposes it; otherwise match
  // by facility name within the state. tri_facility → release quantities.
  const clauses: Array<[string, string] | [string, string, string]> = registryId
    ? [["registry_id", registryId]]
    : [["facility_name", "CONTAINING", query.toUpperCase()]];
  if (state && !registryId) clauses.unshift(["state_abbr", state.toUpperCase()]);
  const url = efUrl("tri_facility", clauses, [0, 199]);

  try {
    const { data } = await fetchJson<Row[]>(url, {
      sourceSystem: "EPA TRI",
      label: `TRI releases for "${query}"`,
      emit,
    });
    const rows = Array.isArray(data) ? data : [];
    if (!rows.length) {
      return { lines: [], releases: [], url, gap: "EPA TRI: no TRI filings on record for this facility." };
    }

    const releases: TriRelease[] = rows.map((r) => ({
      year: num(field(r, "reporting_year", "year")),
      chemical: field(r, "chem_name", "chemical_name", "chemical"),
      amountLbs: num(field(r, "total_releases", "total_release", "release_qty", "fugitive_air", "on_site_release_total")),
      medium: field(r, "media", "medium"),
      triFacilityId: field(r, "tri_facility_id", "trifid"),
    }));

    const withAmt = releases.filter((r) => r.amountLbs !== undefined);
    const total = withAmt.reduce((a, r) => a + (r.amountLbs ?? 0), 0);
    const years = withAmt.map((r) => r.year).filter(Boolean) as number[];
    const yspan = years.length ? `${Math.min(...years)}–${Math.max(...years)}` : "on record";

    const lines: DocumentedLine[] = [];
    if (withAmt.length) {
      lines.push({
        category: "TRI reported releases (total)",
        value: Math.round(total),
        unit: "lbs",
        sourceSystem: "EPA TRI",
        sourceURL: url,
        evidenceGrade: "A",
        basis: `Sum of reported release quantities across ${withAmt.length} TRI records (${yspan}), Envirofacts.`,
      });
      // top chemicals
      const byChem = new Map<string, number>();
      for (const r of withAmt) byChem.set(r.chemical ?? "(chemical)", (byChem.get(r.chemical ?? "(chemical)") ?? 0) + (r.amountLbs ?? 0));
      [...byChem.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([chem, amt]) =>
          lines.push({
            category: `TRI release — ${chem}`,
            value: Math.round(amt),
            unit: "lbs",
            sourceSystem: "EPA TRI",
            sourceURL: url,
            evidenceGrade: "A",
            basis: "Reported quantity, TRI reporting form (Envirofacts).",
          }),
        );
    } else {
      return { lines: [], releases, url, gap: "EPA TRI: facility found but no release quantities parsed — verify tri_facility columns against the live model." };
    }
    return { lines, releases, url };
  } catch (err) {
    const e = err as HttpError;
    return { lines: [], releases: [], url, gap: `EPA TRI: ${e.message}` };
  }
}
