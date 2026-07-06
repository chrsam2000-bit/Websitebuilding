// ── Orchestrator — runs Identify → Quantify, streaming the Evidence Log ──────
// Yields evidence events + partial stage results as records arrive, then a final
// assembled dossier. Every fact traces to a fetched record (or a sample record
// in sample mode); gaps are recorded explicitly, never filled with fabrications.
import type {
  Actor, Citation, Dossier, DossierInput, EvidenceEvent, IdentifyResult, QuantifyResult,
} from "./types";
import { resolveFacility } from "./sources/frs";
import { echoProfile } from "./sources/echo";
import { triReleases } from "./sources/tri";
import { superfundStatus } from "./sources/sems";
import { rcraStatus } from "./sources/rcra";
import { companyFinancials, fullTextDisclosures, resolveParentCik } from "./sources/edgar";
import { buildQuantify } from "./quantify";
import { confidenceToGrade } from "./grade";
import { sampleEvents, sampleIdentify, sampleQuantify } from "./fixtures";

export type Yield =
  | { t: "event"; event: EvidenceEvent }
  | { t: "identify"; data: IdentifyResult }
  | { t: "quantify"; data: QuantifyResult }
  | { t: "done"; dossier: Dossier };

function newId(): string {
  return "SD-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
}

export async function* orchestrate(input: DossierInput, sample: boolean): AsyncGenerator<Yield> {
  const events: EvidenceEvent[] = [];
  const buffer: EvidenceEvent[] = [];
  const emit = (e: EvidenceEvent) => { events.push(e); buffer.push(e); };
  const drain = function* (): Generator<Yield> { while (buffer.length) yield { t: "event", event: buffer.shift()! }; };

  const gaps: string[] = [];
  const citations: Citation[] = [];
  const addCite = (c: Citation | null | undefined) => {
    if (c && c.sourceURL && !citations.some((x) => x.sourceURL === c.sourceURL && x.recordId === c.recordId)) citations.push(c);
  };

  // ── SAMPLE MODE ───────────────────────────────────────────────────────────
  if (sample) {
    sampleEvents(input, emit);
    yield* drain();
    const identify = sampleIdentify(input);
    yield { t: "identify", data: identify };
    const quantify = sampleQuantify();
    yield { t: "quantify", data: quantify };
    identify.actorChain.forEach((a) => addCite({ sourceSystem: a.sourceSystem, recordId: a.identifier, sourceURL: a.sourceURL }));
    quantify.documented.forEach((l) => addCite({ sourceSystem: l.sourceSystem, sourceURL: l.sourceURL, recordId: l.recordId }));
    const dossier: Dossier = { id: newId(), createdAt: new Date().toISOString().slice(0, 10), input, sampleData: true, identify, quantify, citations, gaps: ["SAMPLE DATA — records are illustrative, not live government records."] };
    yield { t: "done", dossier };
    return;
  }

  // ── LIVE MODE ─────────────────────────────────────────────────────────────
  emit({ ts: new Date().toISOString(), source: "orchestrator", status: "info", detail: `Assembling dossier for "${input.query}"` });
  yield* drain();

  // 1) IDENTIFY — FRS facility
  const { facility, gap: frsGap } = await resolveFacility(input.query, input.state, emit);
  if (frsGap) gaps.push(frsGap);
  if (facility) addCite({ sourceSystem: "EPA FRS", recordId: facility.registryId, sourceURL: facility.sourceURL });
  yield* drain();

  // ECHO compliance profile
  const echo = await echoProfile(input.query, input.state, facility?.registryId, emit);
  if (echo.gap) gaps.push(echo.gap);
  echo.lines.forEach((l) => addCite({ sourceSystem: l.sourceSystem, sourceURL: l.sourceURL }));
  yield* drain();

  // EDGAR — disclosures (by site name) + parent CIK (by operator name)
  const operatorName = echo.profile?.name || facility?.primaryName || input.operator || input.query;
  const disc = await fullTextDisclosures(operatorName, emit);
  if (disc.gap) gaps.push(disc.gap);
  yield* drain();
  const parent = await resolveParentCik(input.operator || operatorName, emit);
  yield* drain();
  const chosenCik = parent?.cik || disc.topCik;
  const chosenName = parent?.name || disc.topName || operatorName;
  const financials = chosenCik
    ? await companyFinancials(chosenCik, chosenName, emit)
    : { available: false as const, note: "No public filer matched — party may be private." };
  if (financials.sourceURL) addCite({ sourceSystem: "SEC EDGAR", recordId: financials.cik, sourceURL: financials.sourceURL });
  disc.disclosures.forEach((x) => addCite({ sourceSystem: "SEC EDGAR", recordId: x.accession, sourceURL: x.sourceURL }));
  yield* drain();

  // Build actor chain from what resolved
  const actorChain: Actor[] = [];
  if (facility) actorChain.push({ role: "Facility", name: facility.primaryName, identifier: facility.registryId ? `FRS ${facility.registryId}` : undefined, sourceSystem: "EPA FRS", sourceURL: facility.sourceURL, linkConfidence: 0.9, evidenceGrade: facility.evidenceGrade, note: "Canonical facility resolved from FRS." });
  if (echo.profile?.name) actorChain.push({ role: "Operator", name: echo.profile.name, sourceSystem: "EPA ECHO", sourceURL: echo.url, linkConfidence: 0.8, evidenceGrade: "C", note: "Operator named on the ECHO facility record." });
  if (chosenCik) {
    const conf = parent?.confidence ?? 0.6;
    actorChain.push({ role: "Corporate Parent", name: chosenName, identifier: `CIK ${chosenCik}`, sourceSystem: "SEC EDGAR", sourceURL: parent?.sourceURL || disc.url, linkConfidence: conf, evidenceGrade: confidenceToGrade(conf), note: parent ? "Public filer matched via company_tickers.json." : "Filer surfaced via 10-K full-text search — validate the link." });
    if (financials.available) actorChain.push({ role: "Financials", name: `${financials.entityName} (FY ${financials.fiscalYear ?? "—"})`, identifier: `CIK ${financials.cik}`, sourceSystem: "SEC EDGAR", sourceURL: financials.sourceURL!, linkConfidence: conf, evidenceGrade: "A", note: "XBRL CompanyFacts." });
  }
  const identify: IdentifyResult = { facility, actorChain, financials, disclosures: disc.disclosures };
  yield { t: "identify", data: identify };

  // 2) QUANTIFY — documented records
  const documented = [...echo.lines];
  const tri = await triReleases(input.query, input.state, facility?.registryId, emit);
  if (tri.gap) gaps.push(tri.gap);
  documented.push(...tri.lines);
  tri.lines.forEach((l) => addCite({ sourceSystem: l.sourceSystem, sourceURL: l.sourceURL }));
  yield* drain();

  const sems = await superfundStatus(input.query, input.state, emit);
  if (sems.gap) gaps.push(sems.gap);
  documented.push(...sems.lines);
  sems.lines.forEach((l) => addCite({ sourceSystem: l.sourceSystem, sourceURL: l.sourceURL, recordId: l.recordId }));
  yield* drain();

  const rcra = await rcraStatus(input.query, input.state, emit);
  if (rcra.gap) gaps.push(rcra.gap);
  documented.push(...rcra.lines);
  rcra.lines.forEach((l) => addCite({ sourceSystem: l.sourceSystem, sourceURL: l.sourceURL, recordId: l.recordId }));
  yield* drain();

  const quantify = buildQuantify(documented, financials);
  yield { t: "quantify", data: quantify };

  emit({ ts: new Date().toISOString(), source: "orchestrator", status: quantify.headlineLiability ? "ok" : "info", detail: quantify.headlineLiability ? "Dossier assembled." : "Dossier assembled — limited records retrieved; see gaps." });
  yield* drain();

  const dossier: Dossier = { id: newId(), createdAt: new Date().toISOString().slice(0, 10), input, sampleData: false, identify, quantify, citations, gaps };
  yield { t: "done", dossier };
}
