// ── Shared helpers for the Envirofacts efservice REST API ───────────────────
// efservice classic syntax:
//   {base}/{table}/{column}/{operator?}/{value}/.../rows/{a}:{b}/JSON
// operator is one of: (omitted = equals), CONTAINING, BEGINNING, "!=", "<", ">".
// NOTE: table + column names below are the documented ones as of build time;
// re-verify against the live model metadata at data.epa.gov before production.

import { BASE } from "../config";

export function efUrl(
  table: string,
  clauses: Array<[string, string] | [string, string, string]>,
  rows: [number, number] = [0, 49],
): string {
  const parts = [BASE.envirofacts, table];
  for (const c of clauses) {
    if (c.length === 3) parts.push(c[0], c[1], encodeURIComponent(c[2]));
    else parts.push(c[0], encodeURIComponent(c[1]));
  }
  parts.push("rows", `${rows[0]}:${rows[1]}`, "JSON");
  return parts.join("/");
}

/** Case-insensitive field read across the varied casing Envirofacts returns. */
export function field(row: Record<string, unknown>, ...names: string[]): string | undefined {
  if (!row) return undefined;
  const lc: Record<string, unknown> = {};
  for (const k of Object.keys(row)) lc[k.toLowerCase()] = row[k];
  for (const n of names) {
    const v = lc[n.toLowerCase()];
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
  }
  return undefined;
}

export function num(v: string | undefined): number | undefined {
  if (v === undefined) return undefined;
  const n = Number(String(v).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : undefined;
}
