"use client";
import type { DossierInput, IdentifyResult, QuantifyResult } from "@/lib/types";
import { GradeChip, CiteChip, RangeBar, Meter, fmtUSD, fmtNum } from "./ui";
import EvidenceLog from "./EvidenceLog";
import type { EvidenceEvent } from "@/lib/types";

export default function RunView({
  input, sample, events, running, identify, quantify, gaps, canAssemble, onAssemble, onBack,
}: {
  input: DossierInput;
  sample: boolean;
  events: EvidenceEvent[];
  running: boolean;
  identify: IdentifyResult | null;
  quantify: QuantifyResult | null;
  gaps: string[];
  canAssemble: boolean;
  onAssemble: () => void;
  onBack: () => void;
}) {
  const f = identify?.facility;
  const headline = quantify?.headlineLiability;
  return (
    <div className="run">
      <EvidenceLog events={events} running={running} />
      <div className="stage-col">
        <div className="case-header">
          <button className="back-btn no-print" onClick={onBack}>← New search</button>
          <div className="chd__sep" />
          <div className="chd"><span className="chd__k">Site</span><span className="chd__v">{f?.primaryName ?? input.query}</span></div>
          <div className="chd__sep" />
          <div className="chd"><span className="chd__k">Registry ID</span><span className="chd__v">{f?.registryId ?? (running ? "resolving…" : "—")}</span></div>
          <div className="chd__sep" />
          <div className="chd chd--liab"><span className="chd__k">Est. Liability</span><span className="chd__v">{headline ? fmtUSD(headline.expected) : "—"}</span></div>
          <div className="chd--grow" />
          <div className="chd"><span className="chd__k">Evidence Confidence</span><Meter grade={quantify?.aggregateGrade ?? null} /></div>
        </div>

        <div className="stage">
          {sample && <div className="sample-flag" style={{ marginBottom: "1.2rem" }}>⚠ SAMPLE DATA — illustrative records, not live government sources.</div>}

          {/* IDENTIFY */}
          <div className="stage__eyebrow">Stage 1 · Identify</div>
          <h2>Responsible-party chain</h2>

          {f?.candidates && f.candidates.length > 1 && (
            <div className="card">
              <div className="card__bar"><span className="card__title">Facility candidates — confirm the match</span></div>
              <div className="card__body">
                {f.candidates.map((c, i) => (
                  <div key={i} className="line">
                    <span className="line__cat">{c.name}{c.address ? ` — ${c.address}` : ""}</span>
                    <span className="line__val conf">{(c.confidence * 100).toFixed(0)}% {c.registryId ? `· FRS ${c.registryId}` : ""}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card">
            <div className="card__bar"><span className="card__title">Actor chain — Site → Operator → Parent → Financials</span></div>
            <div className="card__body">
              {(identify?.actorChain ?? []).length === 0 && <div className="muted">{running ? "Resolving actors…" : "No actors resolved."}</div>}
              {(identify?.actorChain ?? []).map((a, i) => (
                <div key={i}>
                  {i > 0 && <div className="chain-arrow">↓</div>}
                  <div className="actor">
                    <div className="actor__role">{a.role}</div>
                    <div className={`actor__name ${/unknown|unresolved/i.test(a.name) ? "unknown" : ""}`}>{a.name}</div>
                    <div className="actor__meta">
                      {a.identifier && <span className="tag mono faint">{a.identifier}</span>}
                      <span className="conf">link {(a.linkConfidence * 100).toFixed(0)}%</span>
                      <GradeChip g={a.evidenceGrade} />
                      <CiteChip system={a.sourceSystem} url={a.sourceURL} />
                    </div>
                    {a.note && <div className="actor__note">▸ {a.note}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {identify?.financials && (
            <div className="card">
              <div className="card__bar"><span className="card__title">Corporate parent financials (SEC EDGAR)</span></div>
              <div className="card__body">
                {identify.financials.available ? (
                  <div className="compare" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
                    <div className="cmp"><div className="cmp__k">Revenue</div><div className="cmp__v">{fmtUSD(identify.financials.revenue)}</div></div>
                    <div className="cmp"><div className="cmp__k">Total assets</div><div className="cmp__v">{fmtUSD(identify.financials.totalAssets)}</div></div>
                    <div className="cmp"><div className="cmp__k">Total liabilities</div><div className="cmp__v">{fmtUSD(identify.financials.totalLiabilities)}</div></div>
                  </div>
                ) : (
                  <div className="muted">{identify.financials.note ?? "Financials not publicly available — the responsible party may be private."}</div>
                )}
              </div>
            </div>
          )}

          {identify?.disclosures && identify.disclosures.length > 0 && (
            <div className="card">
              <div className="card__bar"><span className="card__title">10-K disclosures mentioning this site</span></div>
              <div className="card__body">
                {identify.disclosures.map((d, i) => (
                  <div key={i} className="line">
                    <span className="line__cat">{d.snippet}</span>
                    <span><CiteChip system="SEC EDGAR" recordId={d.accession} url={d.sourceURL} /></span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* QUANTIFY */}
          <div className="stage__eyebrow" style={{ marginTop: "2rem" }}>Stage 2 · Quantify</div>
          <h2>Documented damage &amp; modeled liability</h2>

          <div className="card">
            <div className="card__bar"><span className="card__title">Documented records (real · A/B)</span></div>
            <div className="card__body" style={{ padding: 0 }}>
              {(quantify?.documented ?? []).length === 0 && <div className="muted" style={{ padding: "1rem" }}>{running ? "Pulling records…" : "No documented records retrieved."}</div>}
              {(quantify?.documented ?? []).map((l, i) => (
                <div key={i} className="line">
                  <span className="line__cat">{l.category}</span>
                  <span className="line__val">{fmtNum(l.value)}{l.unit ? ` ${l.unit}` : ""}</span>
                  <span className="line__meta">
                    <GradeChip g={l.evidenceGrade} />
                    <CiteChip system={l.sourceSystem} recordId={l.recordId} url={l.sourceURL} />
                    <span className="line__basis">{l.basis}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {quantify?.modeled && quantify.modeled.length > 0 && (
            <div className="card modeled-card">
              <div className="card__bar"><span className="card__title">Verity modeled estimate (Grade D)</span></div>
              <div className="card__body">
                <div className="modeled-banner">Verity modeled estimate — not a reported or adjudicated figure. Grade D. Assumptions disclosed per line.</div>
                {quantify.modeled.map((m, i) => (
                  <div key={i} style={{ marginBottom: "1rem" }}>
                    <div className="line" style={{ borderBottom: 0, padding: 0 }}>
                      <span className="line__cat" style={{ fontWeight: 600 }}>{m.category}</span>
                      <span className="line__val red">{fmtUSD(m.estimateExpected)}</span>
                    </div>
                    <RangeBar low={m.estimateLow} exp={m.estimateExpected} high={m.estimateHigh} />
                    <div className="line__basis" style={{ marginTop: ".4rem" }}>{m.basis}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {quantify && (
            <div className="card">
              <div className="card__bar"><span className="card__title">Reported profit vs truth-adjusted</span></div>
              <div className="card__body">
                {quantify.reportedVsTruth.available ? (
                  <div className="compare">
                    <div className="cmp"><div className="cmp__k">Reported (EDGAR)</div><div className="cmp__v">{fmtUSD(quantify.reportedVsTruth.reportedProfit)}</div></div>
                    <div className="cmp truth"><div className="cmp__k">Truth-adjusted</div><div className="cmp__v red">{fmtUSD(quantify.reportedVsTruth.truthAdjustedProfit)}</div></div>
                  </div>
                ) : (
                  <div className="muted">{quantify.reportedVsTruth.note}</div>
                )}
                {quantify.reportedVsTruth.available && <div className="line__basis" style={{ marginTop: ".7rem" }}>{quantify.reportedVsTruth.note}</div>}
              </div>
            </div>
          )}

          {gaps.length > 0 && (
            <div className="card">
              <div className="card__bar"><span className="card__title">Gaps &amp; validation needs</span></div>
              <div className="card__body">
                <ul className="gaps">{gaps.map((g, i) => <li key={i}>{g}</li>)}</ul>
              </div>
            </div>
          )}

          <div className="cta-row no-print">
            <button className="btn btn--red" disabled={!canAssemble} onClick={onAssemble}>
              {running ? "Assembling…" : "Assemble dossier & choose deliverable →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
