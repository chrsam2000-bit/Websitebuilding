"use client";
import { useCallback, useRef, useState } from "react";
import type { Dossier, DossierInput, EvidenceEvent, IdentifyResult, QuantifyResult } from "@/lib/types";
import { BrandMark } from "@/components/ui";
import RunView from "@/components/RunView";
import DossierView from "@/components/DossierView";

type View = "hero" | "run" | "dossier";
const PROBLEM_TYPES = ["Landfill", "Contaminated water", "Illegal dumping", "Air quality", "Hazardous waste", "Degraded land", "PFAS", "Methane", "Other"];
const DISCLAIMER = "This dossier compiles publicly available government records and evidence-graded estimates with disclosed methodology and uncertainty. It is not a legal determination, an accusation of wrongdoing, or professional legal/financial advice. All modeled figures are Verity estimates, not reported or adjudicated values.";

export default function Page() {
  const [view, setView] = useState<View>("hero");
  const [query, setQuery] = useState("");
  const [state, setStateAbbr] = useState("");
  const [operator, setOperator] = useState("");
  const [contamination, setContamination] = useState("");
  const [sample, setSample] = useState(true); // default sample so it runs anywhere; live calls .gov

  const [events, setEvents] = useState<EvidenceEvent[]>([]);
  const [identify, setIdentify] = useState<IdentifyResult | null>(null);
  const [quantify, setQuantify] = useState<QuantifyResult | null>(null);
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [running, setRunning] = useState(false);
  const [saved, setSaved] = useState<Dossier[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(async (input: DossierInput) => {
    setView("run");
    setEvents([]); setIdentify(null); setQuantify(null); setDossier(null); setRunning(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch("/api/dossier", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...input, sample }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const msg = await res.text().catch(() => `HTTP ${res.status}`);
        setEvents((e) => [...e, { ts: new Date().toISOString(), source: "orchestrator", status: "error", detail: `Request failed: ${msg.slice(0, 200)}` }]);
        setRunning(false);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const chunks = buf.split("\n\n");
        buf = chunks.pop() ?? "";
        for (const chunk of chunks) {
          const line = chunk.split("\n").find((l) => l.startsWith("data: "));
          if (!line) continue;
          let msg: any;
          try { msg = JSON.parse(line.slice(6)); } catch { continue; }
          if (msg.t === "event") setEvents((e) => [...e, msg.event as EvidenceEvent]);
          else if (msg.t === "identify") setIdentify(msg.data);
          else if (msg.t === "quantify") setQuantify(msg.data);
          else if (msg.t === "done") { setDossier(msg.dossier); setSaved((s) => [msg.dossier, ...s].slice(0, 12)); }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError")
        setEvents((e) => [...e, { ts: new Date().toISOString(), source: "orchestrator", status: "error", detail: `Stream error: ${(err as Error).message}` }]);
    } finally {
      setRunning(false);
    }
  }, [sample]);

  const submit = () => {
    if (!query.trim()) return;
    run({ query: query.trim(), state: state.trim() || undefined, operator: operator.trim() || undefined, contaminationType: contamination || undefined });
  };

  if (view === "dossier" && dossier) return <DossierView dossier={dossier} onBack={() => setView("run")} />;

  if (view === "run") {
    return (
      <>
        <RunView
          input={{ query, state: state || undefined, operator: operator || undefined, contaminationType: contamination || undefined }}
          sample={sample}
          events={events}
          running={running}
          identify={identify}
          quantify={quantify}
          gaps={dossier?.gaps ?? []}
          canAssemble={Boolean(dossier)}
          onAssemble={() => setView("dossier")}
          onBack={() => { abortRef.current?.abort(); setView("hero"); }}
        />
      </>
    );
  }

  // HERO
  return (
    <div className="hero">
      <div className="topbar">
        <BrandMark />
        <div><b>THE VERITY SITE DOSSIER</b><small>PLANETARY BOUNDARY TRUTH INFRASTRUCTURE</small></div>
        <div className="spacer" />
        <a className="mono" style={{ fontSize: ".72rem", color: "var(--ash-gray)" }} href="/api/health" target="_blank" rel="noreferrer">status</a>
      </div>
      <div className="hero__body">
        <div className="eyebrow">Identify → Quantify → Rectify · on real records</div>
        <h1>Enter one site. Get the whole public record, cited.</h1>
        <p className="hero__sub">Verity assembles the fragmented public record — EPA ECHO, Envirofacts (TRI, Superfund, RCRA), and SEC EDGAR — into a single, defensible dossier: the responsible-party chain, the documented damage and modeled liability, and an exportable deliverable. Every fact graded A–E and linked to the government record it came from.</p>

        <div className="searchbar">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            placeholder="Enter a site, address, facility, or contamination incident"
            aria-label="Site search"
          />
          <button onClick={submit} disabled={!query.trim()}>Assemble dossier</button>
        </div>
        <div className="adv">
          <input value={state} onChange={(e) => setStateAbbr(e.target.value)} placeholder="State (e.g. IL)" style={{ width: 130 }} maxLength={2} />
          <input value={operator} onChange={(e) => setOperator(e.target.value)} placeholder="Known operator (optional)" style={{ width: 220 }} />
          <select value={contamination} onChange={(e) => setContamination(e.target.value)}>
            <option value="">Contamination type (optional)</option>
            {PROBLEM_TYPES.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
        <label className="samptog">
          <input type="checkbox" checked={sample} onChange={(e) => setSample(e.target.checked)} />
          Sample data mode {sample ? "(ON — illustrative records, runs anywhere)" : "(OFF — live EPA/SEC calls; requires .gov network egress)"}
        </label>

        {saved.length > 0 && (
          <div className="hero__recent">
            <h4>Saved dossiers (this session)</h4>
            {saved.map((d) => (
              <button key={d.id} className="recent-item" onClick={() => { setDossier(d); setIdentify(d.identify); setQuantify(d.quantify); setView("dossier"); }}>
                <span>{d.identify.facility?.primaryName ?? d.input.query}</span>
                <span className="mono faint">{d.id} · grade {d.quantify.aggregateGrade ?? "—"}{d.sampleData ? " · SAMPLE" : ""}</span>
              </button>
            ))}
          </div>
        )}

        <div className="disclaimer-bar" style={{ maxWidth: 720 }}>{DISCLAIMER}</div>
      </div>
    </div>
  );
}
