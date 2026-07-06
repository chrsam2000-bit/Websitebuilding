"use client";
import { useEffect, useState, useCallback } from "react";
import type { Dossier, DeliverableMode } from "@/lib/types";
import { fmtUSD } from "./ui";

export default function DossierView({ dossier, onBack }: { dossier: Dossier; onBack: () => void }) {
  const [mode, setMode] = useState<DeliverableMode>("litigation");
  const [aiPolish, setAiPolish] = useState(false);
  const [body, setBody] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [polished, setPolished] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/deliverable", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ dossier, mode, aiPolish }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setBody(data.body);
      setPolished(Boolean(data.polished));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [dossier, mode, aiPolish]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="dossier-shell">
      <div className="dossier-controls no-print">
        <button className="back-btn" onClick={onBack}>← Back to console</button>
        <div className="chd__sep" />
        <div className="modeseg">
          <button className={mode === "litigation" ? "active" : ""} onClick={() => setMode("litigation")}>Litigation Intake Memo</button>
          <button className={mode === "remediation" ? "active" : ""} onClick={() => setMode("remediation")}>Remediation Pathway</button>
        </div>
        <label className="samptog" style={{ marginTop: 0 }}>
          <input type="checkbox" checked={aiPolish} onChange={(e) => setAiPolish(e.target.checked)} /> AI-polish prose
        </label>
        <div style={{ flex: 1 }} />
        <button className="btn btn--ghost btn--sm" onClick={() => navigator.clipboard?.writeText(body)}>Copy</button>
        <button className="btn btn--red btn--sm" onClick={() => window.print()}>Print / Export PDF</button>
      </div>

      <div className="dossier">
        <div className="dossier__cover">
          <div className="k">TERRA VERITY LEDGER · SITE DOSSIER {dossier.sampleData ? "· SAMPLE DATA" : ""}</div>
          <h2>{mode === "litigation" ? "Litigation Intake Memo" : "Remediation & Redevelopment Pathway"}</h2>
          <div className="dossier__meta">
            <div><span className="k">SITE</span><b>{dossier.identify.facility?.primaryName ?? dossier.input.query}</b></div>
            <div><span className="k">REGISTRY ID</span><b>{dossier.identify.facility?.registryId ?? "unresolved"}</b></div>
            <div><span className="k">DATE</span><b>{dossier.createdAt}</b></div>
            <div><span className="k">OVERALL GRADE</span><b>{dossier.quantify.aggregateGrade ?? "—"} · est. liability {fmtUSD(dossier.quantify.headlineLiability?.expected)}</b></div>
          </div>
        </div>
        <div className="dossier__body">
          {loading && <div className="muted mono">Generating {mode} deliverable…</div>}
          {err && <div className="mono" style={{ color: "var(--signal-red)" }}>Error: {err}</div>}
          {!loading && !err && <pre>{body}</pre>}
          {polished && <div className="mono faint" style={{ marginTop: "1rem", fontSize: ".66rem" }}>Prose polished by the model from cited data; facts, numbers, and citations unchanged.</div>}
        </div>
        <div className="dossier__foot">
          This dossier compiles publicly available government records and evidence-graded estimates with disclosed methodology and uncertainty. It is not a legal determination, an accusation of wrongdoing, or professional legal/financial advice. All modeled figures are Verity estimates, not reported or adjudicated values.
          <br /><br />© Terra Verity Ledger · Planetary Boundary Truth Infrastructure.
        </div>
      </div>
    </div>
  );
}
