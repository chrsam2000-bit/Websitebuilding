// ── EPA Facility Registry Service (FRS) via Envirofacts ─────────────────────
// Entity backbone: resolve the input to a canonical facility + Registry ID.
import { fetchJson, HttpError } from "../http";
import type { EvidenceEvent, FacilityIdentity } from "../types";
import { efUrl, field, num } from "./util";
import { nameMatchConfidence } from "../entity";
import { confidenceToGrade } from "../grade";

type Row = Record<string, unknown>;

export async function resolveFacility(
  query: string,
  state: string | undefined,
  emit?: (e: EvidenceEvent) => void,
): Promise<{ facility: FacilityIdentity | null; gap?: string }> {
  // Table frs_facility_site, column primary_name CONTAINING <query>, scoped by state.
  const clauses: Array<[string, string] | [string, string, string]> = [
    ["primary_name", "CONTAINING", query.toUpperCase()],
  ];
  if (state) clauses.unshift(["state_code", state.toUpperCase()]);
  const url = efUrl("frs_facility_site", clauses, [0, 24]);

  try {
    const { data, fetchedAt } = await fetchJson<Row[]>(url, {
      sourceSystem: "EPA FRS",
      label: `FRS facility search "${query}"`,
      emit,
    });
    const rows = Array.isArray(data) ? data : [];
    if (!rows.length) return { facility: null, gap: "EPA FRS: no facility on record for this query." };

    const candidates = rows.map((r) => {
      const name = field(r, "primary_name", "facility_name") ?? "(unnamed facility)";
      return {
        registryId: field(r, "registry_id", "registry_id_number"),
        name,
        address: [field(r, "location_address", "street_address"), field(r, "city_name", "city"), field(r, "state_code", "state_abbr"), field(r, "postal_code", "zip_code")]
          .filter(Boolean)
          .join(", "),
        city: field(r, "city_name", "city"),
        state: field(r, "state_code", "state_abbr"),
        zip: field(r, "postal_code", "zip_code"),
        latitude: num(field(r, "latitude83", "latitude", "fac_lat")),
        longitude: num(field(r, "longitude83", "longitude", "fac_long")),
        confidence: nameMatchConfidence(query, name),
        sourceURL: url,
      };
    });
    candidates.sort((a, b) => b.confidence - a.confidence);
    const top = candidates[0];

    const facility: FacilityIdentity = {
      registryId: top.registryId,
      primaryName: top.name,
      address: top.address,
      city: top.city,
      state: top.state,
      zip: top.zip,
      latitude: top.latitude,
      longitude: top.longitude,
      candidates: candidates.slice(0, 6).map((c) => ({
        registryId: c.registryId,
        name: c.name,
        address: c.address,
        confidence: c.confidence,
        sourceURL: c.sourceURL,
      })),
      sourceSystem: "EPA FRS",
      sourceURL: url,
      // A Registry ID match is strong linkage (B); ambiguous top match falls to E.
      evidenceGrade: top.registryId ? confidenceToGrade(Math.max(top.confidence, 0.85)) : confidenceToGrade(top.confidence),
    };
    void fetchedAt;
    return { facility };
  } catch (err) {
    const e = err as HttpError;
    return { facility: null, gap: `EPA FRS: ${e.message}` };
  }
}
