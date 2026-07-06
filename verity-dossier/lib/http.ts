// ── Server-side HTTP: cache + backoff + timeout + typed errors ──────────────
// Every fetched record is cached keyed by its source URL with a timestamp, so
// the dossier stays fully traceable and we don't hammer throttled .gov APIs.

import { HTTP } from "./config";
import type { EvidenceEvent, SourceSystem } from "./types";

export type HttpErrorKind =
  | "blocked" // 403/407 — missing/blocked (SEC User-Agent or egress policy)
  | "ratelimited" // 429/503 after retries
  | "timeout"
  | "network"
  | "badstatus"
  | "parse";

export class HttpError extends Error {
  kind: HttpErrorKind;
  status?: number;
  url: string;
  constructor(kind: HttpErrorKind, message: string, url: string, status?: number) {
    super(message);
    this.name = "HttpError";
    this.kind = kind;
    this.status = status;
    this.url = url;
  }
}

interface CacheEntry {
  data: unknown;
  fetchedAt: string;
  expires: number;
}
const cache = new Map<string, CacheEntry>();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface FetchResult<T> {
  data: T;
  url: string;
  fetchedAt: string;
  fromCache: boolean;
}

export interface FetchOptions {
  headers?: Record<string, string>;
  ttlMs?: number;
  sourceSystem?: SourceSystem;
  emit?: (e: EvidenceEvent) => void;
  /** label used in the evidence log instead of the raw URL */
  label?: string;
  /** treat these HTTP statuses as "empty" (no record) rather than error */
  emptyStatuses?: number[];
  expectText?: boolean;
}

function ev(
  emit: FetchOptions["emit"],
  source: SourceSystem | "orchestrator",
  status: EvidenceEvent["status"],
  detail: string,
  url?: string,
  recordId?: string,
) {
  emit?.({ ts: new Date().toISOString(), source, status, detail, url, recordId });
}

/**
 * GET JSON (or text) with retry/backoff, timeout, and a per-URL cache.
 * Throws a typed HttpError; callers decide how to render the gap.
 */
export async function fetchJson<T = unknown>(
  url: string,
  opts: FetchOptions = {},
): Promise<FetchResult<T>> {
  const source = opts.sourceSystem ?? "orchestrator";
  const label = opts.label ?? url;
  const ttl = opts.ttlMs ?? HTTP.cacheTtlMs;

  const cached = cache.get(url);
  if (cached && cached.expires > Date.now()) {
    ev(opts.emit, source, "ok", `${label} (cached)`, url);
    return { data: cached.data as T, url, fetchedAt: cached.fetchedAt, fromCache: true };
  }

  ev(opts.emit, source, "start", `Requesting ${label}`, url);

  let lastErr: HttpError | null = null;
  for (let attempt = 0; attempt <= HTTP.maxRetries; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), HTTP.timeoutMs);
    try {
      const res = await fetch(url, {
        headers: { accept: "application/json", ...(opts.headers ?? {}) },
        signal: ctrl.signal,
        cache: "no-store",
      });
      clearTimeout(timer);

      if (opts.emptyStatuses?.includes(res.status)) {
        ev(opts.emit, source, "empty", `${label}: no record (HTTP ${res.status})`, url);
        throw new HttpError("badstatus", `no record (${res.status})`, url, res.status);
      }
      if (res.status === 403 || res.status === 407) {
        ev(opts.emit, source, "error", `${label}: blocked (HTTP ${res.status})`, url);
        throw new HttpError(
          "blocked",
          `Blocked (HTTP ${res.status}). For SEC, a descriptive User-Agent is required; otherwise the host is not permitted by network egress policy.`,
          url,
          res.status,
        );
      }
      if (res.status === 429 || res.status === 503) {
        lastErr = new HttpError("ratelimited", `Throttled (HTTP ${res.status})`, url, res.status);
        const retryAfter = Number(res.headers.get("retry-after")) || 0;
        const wait = Math.max(retryAfter * 1000, HTTP.backoffBaseMs * 2 ** attempt);
        ev(opts.emit, source, "info", `${label}: throttled, backing off ${Math.round(wait)}ms`, url);
        await sleep(wait);
        continue;
      }
      if (!res.ok) {
        throw new HttpError("badstatus", `HTTP ${res.status}`, url, res.status);
      }

      const text = await res.text();
      if (!text || text.trim() === "" || text.trim() === "[]" || text.trim() === "{}") {
        ev(opts.emit, source, "empty", `${label}: no record on file`, url);
        throw new HttpError("badstatus", "no record on file", url, res.status);
      }

      let data: unknown = text;
      if (!opts.expectText) {
        try {
          data = JSON.parse(text);
        } catch {
          throw new HttpError("parse", "response was not valid JSON", url, res.status);
        }
      }
      const fetchedAt = new Date().toISOString();
      cache.set(url, { data, fetchedAt, expires: Date.now() + ttl });
      ev(opts.emit, source, "ok", `${label}: retrieved`, url);
      return { data: data as T, url, fetchedAt, fromCache: false };
    } catch (err: unknown) {
      clearTimeout(timer);
      if (err instanceof HttpError) {
        if (err.kind === "ratelimited") {
          lastErr = err;
          continue;
        }
        throw err;
      }
      const aborted = err instanceof Error && err.name === "AbortError";
      lastErr = new HttpError(
        aborted ? "timeout" : "network",
        aborted ? "request timed out" : `network error: ${(err as Error).message}`,
        url,
      );
      if (aborted) {
        ev(opts.emit, source, "error", `${label}: timed out`, url);
        throw lastErr;
      }
      // network error — brief backoff then retry
      await sleep(HTTP.backoffBaseMs * 2 ** attempt);
    }
  }
  ev(opts.emit, source, "error", `${label}: ${lastErr?.message ?? "failed"}`, url);
  throw lastErr ?? new HttpError("network", "request failed", url);
}

/** Convenience: swallow the throw and return null + a gap message. */
export async function tryFetchJson<T = unknown>(
  url: string,
  opts: FetchOptions = {},
): Promise<{ result: FetchResult<T> | null; error: HttpError | null }> {
  try {
    return { result: await fetchJson<T>(url, opts), error: null };
  } catch (err) {
    if (err instanceof HttpError) return { result: null, error: err };
    throw err;
  }
}

export function humanGap(system: SourceSystem, err: HttpError | null): string {
  if (!err) return `${system}: no record found.`;
  switch (err.kind) {
    case "blocked":
      return `${system}: source blocked (HTTP ${err.status}). ${
        system === "SEC EDGAR"
          ? "Set a descriptive SEC_USER_AGENT."
          : "Host not permitted by this environment's network egress policy."
      }`;
    case "ratelimited":
      return `${system}: throttled after retries — try again shortly.`;
    case "timeout":
      return `${system}: request timed out.`;
    default:
      return `${system}: no record found or source unreachable.`;
  }
}
