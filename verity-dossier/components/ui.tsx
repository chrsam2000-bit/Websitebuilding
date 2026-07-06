"use client";
import type { EvidenceGrade } from "@/lib/types";

export function fmtUSD(n?: number | null): string {
  if (n == null || isNaN(n)) return "—";
  const a = Math.abs(n);
  if (a >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (a >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (a >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}

export function fmtNum(v: number | string): string {
  return typeof v === "number" ? v.toLocaleString() : v;
}

export function GradeChip({ g }: { g: EvidenceGrade | null | undefined }) {
  if (!g) return <span className="chip g-E">FLAG</span>;
  return <span className={`chip g-${g}`}>GRADE {g}</span>;
}

export function CiteChip({ system, recordId, url }: { system: string; recordId?: string; url?: string }) {
  const label = `${system}${recordId ? " · " + recordId : ""}`;
  if (url && url.startsWith("http") && !url.includes("example.invalid")) {
    return (
      <a className="cite" href={url} target="_blank" rel="noreferrer" title={url}>
        {label} ↗
      </a>
    );
  }
  return <span className="cite" title={url}>{label}</span>;
}

export function RangeBar({ low, exp, high }: { low: number; exp: number; high: number }) {
  const span = high - low || 1;
  const markPct = Math.max(6, Math.min(94, 6 + ((exp - low) / span) * 88));
  return (
    <div className="range">
      <div className="range__track">
        <div className="range__band" />
        <div className="range__mark" style={{ left: `${markPct}%` }} />
      </div>
      <div className="range__labels">
        <span>Low {fmtUSD(low)}</span>
        <span className="red">Expected {fmtUSD(exp)}</span>
        <span>High {fmtUSD(high)}</span>
      </div>
    </div>
  );
}

export function Meter({ grade }: { grade: EvidenceGrade | null }) {
  const val: Record<EvidenceGrade, number> = { A: 5, B: 4, C: 3, D: 2, E: 1 } as any;
  const pct = grade ? (val[grade] / 5) * 100 : 0;
  return (
    <div className="meter">
      <div className="meter__bar">
        <div className="meter__fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="meter__grade" style={{ color: grade ? "var(--signal-red)" : "var(--slate-gray)" }}>
        {grade ?? "—"}
      </span>
    </div>
  );
}

export function BrandMark() {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="30" height="30" rx="4" fill="#E10600" />
      <rect x="7" y="9" width="18" height="2.2" rx="1" fill="#fff" />
      <rect x="7" y="15" width="12" height="2.2" rx="1" fill="#0A0A0A" />
      <rect x="7" y="21" width="15" height="2.2" rx="1" fill="#fff" />
    </svg>
  );
}
