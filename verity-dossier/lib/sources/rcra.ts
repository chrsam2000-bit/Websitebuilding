// ── EPA RCRAInfo (hazardous waste) via Envirofacts ──────────────────────────
// Hazardous-waste handler/generator status and violations.
// NOTE: verify rcra table/column names against the live Envirofacts model.
import { fetchJson, HttpError } from "../http";
import type { DocumentedLine, EvidenceEvent } from "../types";
import { efUrl, field } from "./util";

type Row = Record<string, unknown>;

export async function rcraStatus(
  query: string,
  state: string | undefined,
  emit?: (e: EvidenceEvent) => void,
): Promise<{ lines: DocumentedLine[]; url: string; gap?: string }> {
  const clauses: Array<[string, string] | [string, string, string]> = [["handler_name", "CONTAINING", query.toUpperCase()]];
  if (state) clauses.unshift(["state_code", state.toUpperCase()]);
  const url = efUrl("rcra_handler", clauses, [0, 24]);

  try {
    const { data } = await fetchJson<Row[]>(url, {
      sourceSystem: "EPA RCRAInfo",
      label: `RCRA handler lookup "${query}"`,
      emit,
    });
    const rows = Array.isArray(data) ? data : [];
    if (!rows.length) return { lines: [], url, gap: "EPA RCRAInfo: no hazardous-waste handler record found." };
    const r = rows[0];
    const gen = field(r, "fed_waste_generator", "generator_status", "hazwaste_generator_status") ?? "Handler on record";
    const id = field(r, "handler_id", "epa_handler_id");
    return {
      lines: [
        {
          category: "RCRA hazardous-waste status",
          value: gen,
          sourceSystem: "EPA RCRAInfo",
          sourceURL: url,
          recordId: id,
          evidenceGrade: "A",
          basis: "RCRAInfo handler/generator record (Envirofacts).",
        },
      ],
      url,
    };
  } catch (err) {
    const e = err as HttpError;
    return { lines: [], url, gap: `EPA RCRAInfo: ${e.message}` };
  }
}
