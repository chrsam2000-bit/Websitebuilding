// ── EPA ECHO (Enforcement & Compliance History Online) ──────────────────────
// Facility compliance profile across media: status, inspections, violations,
// formal enforcement actions, dollar penalties.
import { fetchJson, HttpError } from "../http";
import { BASE } from "../config";
import type { DocumentedLine, EvidenceEvent } from "../types";
import { field, num } from "./util";

type Row = Record<string, unknown>;

export interface EchoProfile {
  registryId?: string;
  name?: string;
  complianceStatus?: string;
  inspections?: number;
  violations?: number;
  formalActions?: number;
  totalPenalties?: number;
  nplStatus?: string;
}

export async function echoProfile(
  query: string,
  state: string | undefined,
  registryId: string | undefined,
  emit?: (e: EvidenceEvent) => void,
): Promise<{ profile: EchoProfile | null; lines: DocumentedLine[]; url: string; gap?: string }> {
  const params = new URLSearchParams({ output: "JSON", responseset: "1" });
  if (registryId) params.set("p_reg_id", registryId);
  else {
    params.set("p_fn", query);
    if (state) params.set("p_st", state.toUpperCase());
  }
  const url = `${BASE.echo}/echo_rest_services.get_facilities?${params.toString()}`;

  try {
    const { data } = await fetchJson<Record<string, unknown>>(url, {
      sourceSystem: "EPA ECHO",
      label: `ECHO facility profile "${query}"`,
      emit,
    });
    // ECHO wraps results as { Results: { Facilities: [ {..} ] } } (shape varies by service version)
    const results = (data as any)?.Results ?? data;
    const facilities: Row[] =
      results?.Facilities ?? results?.facilities ?? (Array.isArray(results) ? results : []);
    if (!facilities.length) {
      return { profile: null, lines: [], url, gap: "EPA ECHO: no compliance record found for this facility." };
    }
    const f = facilities[0];
    const profile: EchoProfile = {
      registryId: field(f, "RegistryID", "registry_id"),
      name: field(f, "FacName", "facility_name", "primary_name"),
      complianceStatus: field(f, "FacComplianceStatus", "compliance_status", "CurrVioFlag"),
      inspections: num(field(f, "Insp5yr", "inspections", "FacInspectionCount")),
      violations: num(field(f, "CurrViols", "violations", "FacViolationCount", "Viol3yr")),
      formalActions: num(field(f, "FormalActionCount", "FacFormalActionCount", "Fea5yr")),
      totalPenalties: num(field(f, "TotalPenalties", "FacPenaltyAmount", "Penalties")),
      nplStatus: field(f, "NPLStatus", "npl_status"),
    };

    const lines: DocumentedLine[] = [];
    if (profile.complianceStatus)
      lines.push({ category: "Compliance status", value: profile.complianceStatus, sourceSystem: "EPA ECHO", sourceURL: url, evidenceGrade: "B", basis: "ECHO facility compliance summary across CAA/CWA/RCRA/SDWA." });
    if (profile.violations !== undefined)
      lines.push({ category: "Violations (recent)", value: profile.violations, sourceSystem: "EPA ECHO", sourceURL: url, evidenceGrade: "A", basis: "ECHO violation count." });
    if (profile.formalActions !== undefined)
      lines.push({ category: "Formal enforcement actions", value: profile.formalActions, sourceSystem: "EPA ECHO", sourceURL: url, evidenceGrade: "B", basis: "ECHO formal action count." });
    if (profile.totalPenalties !== undefined)
      lines.push({ category: "Assessed penalties", value: profile.totalPenalties, unit: "USD", sourceSystem: "EPA ECHO", sourceURL: url, evidenceGrade: "A", basis: "ECHO dollar penalties on record." });
    if (profile.inspections !== undefined)
      lines.push({ category: "Inspections (5yr)", value: profile.inspections, sourceSystem: "EPA ECHO", sourceURL: url, evidenceGrade: "A", basis: "ECHO inspection count." });

    return { profile, lines, url };
  } catch (err) {
    const e = err as HttpError;
    return { profile: null, lines: [], url, gap: `EPA ECHO: ${e.message}` };
  }
}
