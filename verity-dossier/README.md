# The Verity Site Dossier

The flagship product for **Terra Verity Ledger**. Enter one site — an address,
facility, or contamination incident — and Verity assembles the fragmented public
record into a single, cited, **evidence-graded** dossier:

- **Identify** the responsible-party chain (site → operator → corporate parent),
- **Quantify** the documented damage and a clearly-separated modeled liability,
- **Rectify** with an exportable deliverable (litigation or remediation).

Every data point is graded **A–E** and linked to the government record it came
from (EPA ECHO, EPA Envirofacts/TRI/Superfund/RCRA, SEC EDGAR).

> **The one absolute rule:** the AI never generates facts. Facilities, corporate
> identities, release quantities, violations, penalties, Superfund status, and
> financials come only from retrieved government records. The AI is limited to
> three grounded jobs — resolving messy entity names (confidence-scored),
> summarizing retrieved records, and drafting the memo. If a source returns
> nothing, the dossier says so. Nothing is ever filled with a fabricated value.

This is a **full-stack** app: all EPA/SEC calls run in server route handlers
(the browser never calls `.gov` directly). SEC EDGAR requires a server-set
`User-Agent`; the server also handles CORS, caching, rate-limit backoff, and
retries.

---

## Stack

- **Next.js 14 (App Router) + TypeScript + React 18.** Server route handlers do
  the data layer; the client renders the console + dossier.
- No UI framework — hand-rolled CSS with the Terra Verity design tokens.
- `@anthropic-ai/sdk` for the optional, server-side AI layer.

## Quick start

```bash
cp .env.example .env.local      # set SEC_USER_AGENT (name + email); optional ANTHROPIC_API_KEY
npm install
npm run dev                     # http://localhost:3000
```

Enter a site and click **Assemble dossier**. Watch the Evidence Log stream each
real API call as it fires; the console fills in Identify → Quantify; then choose
a deliverable and export.

### Sample mode vs. live mode

- **Sample mode** (toggle on the search screen; default **on** so the app runs
  anywhere) serves clearly-labeled **SAMPLE** records so the full pipeline is
  demonstrable without live `.gov` access. Every dossier built from it is banner-
  labeled *"SAMPLE DATA — not live government records."* This is a dev/testing
  aid, **not** a production fallback.
- **Live mode** (toggle off) calls the real EPA + SEC APIs server-side. When a
  source returns nothing or is unreachable, the UI shows an explicit gap — never
  a fabricated value.

## Environment (`.env.local`)

| Var | Required | Purpose |
|-----|----------|---------|
| `SEC_USER_AGENT` | for live SEC | Descriptive `Name email` — SEC returns **403** without it. |
| `ANTHROPIC_API_KEY` | optional | Enables AI memo-polish + summaries. Server-side only; **never exposed to the client.** Without it, deterministic templates are used. |
| `VERITY_MODEL` | optional | AI model (default `claude-opus-4-8`). |
| `VERITY_SAMPLE_DATA` | optional | `1` to default the whole server to sample mode. |

## Live acceptance test (run where `.gov` egress is open)

The defining test — *every number traces to a live record* — must run in a
network that can reach the government APIs (your machine, Vercel, etc.). This
repo's build environment blocks them, so it was verified against the API
**contracts** + a sample pipeline instead.

1. Set a real `SEC_USER_AGENT` in `.env.local`.
2. `npm run dev`, toggle **sample mode off**, and search a well-documented
   contaminated site (e.g. a known Superfund/NPL facility).
3. Confirm the Evidence Log shows real `data.epa.gov` / `data.sec.gov` /
   `efts.sec.gov` URLs and that each displayed number links to its source record.

Or probe a single endpoint from the server’s network:

```bash
curl -H "User-Agent: $SEC_USER_AGENT" "https://data.sec.gov/api/xbrl/companyconcept/CIK0000320193/us-gaap/Liabilities.json" | head
curl "https://data.epa.gov/efservice/tri_facility/state_abbr/CA/rows/0:2/JSON"
```

## Architecture

```
app/
  page.tsx                 hero → streaming run console → dossier (client)
  api/dossier/route.ts     POST → SSE stream: Evidence Log + stage results + dossier
  api/deliverable/route.ts POST → grounded memo (deterministic; AI-polish optional)
  api/health/route.ts
components/                 EvidenceLog, RunView, DossierView, ui (chips/meters)
lib/
  http.ts                  fetch + per-URL cache + backoff + timeout + typed errors
  sources/{frs,echo,tri,sems,rcra,edgar,util}.ts   the six connectors
  entity.ts                confidence-scored fuzzy matching (Dice + token Jaccard)
  grade.ts                 A–E grading tied to provenance
  quantify.ts              documented (A/B) vs Verity modeled estimate (D), ranged
  orchestrate.ts           runs Identify → Quantify, streams events, assembles dossier
  deliverables.ts          Litigation Intake Memo / Remediation Pathway (cited)
  ai.ts                    optional Anthropic layer — grounded, never invents facts
  fixtures.ts              labeled SAMPLE records (dev/testing only)
```

## Evidence grading (tied to provenance)

- **A** — verified facility-level EPA record or audited SEC XBRL financials.
- **B** — strong regulatory/registry linkage (FRS Registry ID, NPL listing, formal action).
- **C** — company self-reported with disclosed methodology (10-K narrative).
- **D** — Verity modeled estimate (always ranged, always labeled).
- **E** — unconfirmed link / gap requiring human validation (shown, never asserted).

Retrieved facts land at A/B; Verity's derived numbers land at D and are visually
separated. That separation is the credibility of the product.

## ⚠️ Verify before production

Base URLs, SEC shapes, and the caching/backoff/User-Agent discipline are correct
as of build time. The **Envirofacts table/column names** inside
`lib/sources/{frs,tri,sems,rcra}.ts` are the documented ones but should be
re-confirmed against the live model metadata at `data.epa.gov` — they are
flagged with `NOTE:`/`verify` comments and the connectors degrade to explicit
gaps if a name is off. The `reportedVsTruth` panel uses a revenue proxy; wire
`NetIncomeLoss` for true profit. Modeling benchmarks in `lib/quantify.ts` are
disclosed placeholders — replace with sourced remediation cost benchmarks.

## Legal guardrails

No accusations of wrongdoing; unconfirmed links flagged for validation; a
persistent disclaimer on the app and every deliverable; a conflict disclosure
wherever the TerraRecore/TerraReFlow affiliate appears as a provider; and no
fabricated fallback data anywhere — if real data can't be fetched, the UI says so.
