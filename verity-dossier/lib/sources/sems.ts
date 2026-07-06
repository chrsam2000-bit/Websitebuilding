// ── EPA Superfund (SEMS) via Envirofacts ────────────────────────────────────
// Severity / CERCLA-liability signal: Superfund + National Priorities List.
// NOTE: SEMS table/column names vary; verify against the live Envirofacts model
// before production. This queries a documented table and degrades to a gap.
import { fetchJson, HttpError } from "../http";
import type { DocumentedLine, EvidenceEvent } from "../types";
import { efUrl, field } from "./util";

type Row = Record<string, unknown>;

export async function superfundStatus(
  query: string,
  state: string | undefined,
  emit?: (e: EvidenceEvent) => void,
): Promise<{ lines: DocumentedLine[]; url: string; gap?: string }> {
  const clauses: Array<[string, string] | [string, string, string]> = [["site_name", "CONTAINING", query.toUpperCase()]];
  if (state) clauses.unshift(["state_code", state.toUpperCase()]);
  const url = efUrl("sems_active_sites", clauses, [0, 24]);

  try {
    const { data } = await fetchJson<Row[]>(url, {
      sourceSystem: "EPA SEMS",
      label: `Superfund/SEMS lookup "${query}"`,
      emit,
    });
    const rows = Array.isArray(data) ? data : [];
    if (!rows.length) return { lines: [], url, gap: "EPA SEMS: not listed on the Superfund inventory." };
    const r = rows[0];
    const npl = field(r, "npl_status", "npl_status_code", "npl") ?? "Listed (SEMS)";
    const siteId = field(r, "epa_id", "site_epa_id", "sems_id");
    return {
      lines: [
        {
          category: "Superfund / NPL status",
          value: npl,
          sourceSystem: "EPA SEMS",
          sourceURL: url,
          recordId: siteId,
          evidenceGrade: "B",
          basis: "SEMS Superfund inventory listing (Envirofacts).",
        },
      ],
      url,
    };
  } catch (err) {
    const e = err as HttpError;
    return { lines: [], url, gap: `EPA SEMS: ${e.message}` };
  }
}
