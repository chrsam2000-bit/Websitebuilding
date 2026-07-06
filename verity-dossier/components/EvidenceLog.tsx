"use client";
import { useEffect, useRef } from "react";
import type { EvidenceEvent } from "@/lib/types";

const ICON: Record<EvidenceEvent["status"], string> = {
  ok: "✓",
  error: "✕",
  empty: "∅",
  info: "•",
  start: "→",
};

export default function EvidenceLog({ events, running }: { events: EvidenceEvent[]; running: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollTo(0, ref.current.scrollHeight);
  }, [events.length]);
  return (
    <aside className="log">
      <div className="log__head">
        <b>Evidence Log</b>
        {running && <span className="loading-dot" />}
      </div>
      <div className="log__stream" ref={ref}>
        {events.length === 0 && <div className="log__detail" style={{ padding: ".6rem" }}>Awaiting record pull…</div>}
        {events.map((e, i) => (
          <div key={i} className={`log__row ${e.status}`}>
            <span className="ic">{ICON[e.status]}</span>
            <span>
              <span className="log__src">{e.source}</span> <span className="log__detail">{e.detail}</span>
              {e.url && !e.url.includes("example.invalid") && <span className="log__url">{e.url}</span>}
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
}
