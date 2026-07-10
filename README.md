# Websitebuilding

A repository for building websites, set up with Claude Code skills for design guidance.

## Sites

### ReVerity Ledger — 7-page prototype platform site ([`index.html`](index.html))

A premium, static, multi-page prototype website for **ReVerity Ledger** — *Federal
Environmental Debt Accounting and Rectification Infrastructure*. Black / Gold / White
institutional identity (BlackRock terminal × IRS authority × Bloomberg data platform).
Seven hand-authored HTML pages sharing one stylesheet and one script — no framework,
no build step (fonts from Google Fonts). Open `index.html` in any browser, or host the
folder anywhere static.

**Operating command:** Identify. Quantify. Rectify.
**System model:** Identify → Quantify → Rectify → Fund → Deploy → Restore

| Page | File | What it does |
|------|------|--------------|
| Home | [`index.html`](index.html) | Animated US dot-map liability network, Environmental Burden Monitor, the Broken Equation, six-discipline system, Primary Restoration & Transition Trust flow |
| The Crisis | [`crisis.html`](crisis.html) | The Environmental Blind Spot — seven-chapter evidence framework, balance-sheet split, crisis dashboard with 9 category filters, evidence library |
| Ledger Explorer | [`explorer.html`](explorer.html) | Searchable prototype database of fictional entities, 4 view modes, planetary-boundary debt wheel, Annual Environmental Debt Statement + waterfall, rankings, dispute process |
| Methodology | [`methodology.html`](methodology.html) | Harm→liability chain, Environmental Debt Formula, three-layer methodology, four tax pillars, upstream/downstream toggle, marginal-damage graph, evidence confidence scale, debt calculator |
| Products | [`products.html`](products.html) | Eight infrastructure modules — Federal Debt Ledger, Government Dashboard, Corporate Filing, Advisory, Legacy Register, Trust Administration, Restoration Marketplace, API |
| Pricing | [`pricing.html`](pricing.html) | Access & Engagement Models — Public Explorer (free), Professional Intelligence, Enterprise Platform, Federal Custom Contract, advisory engagements, comparison table |
| Contact | [`contact.html`](contact.html) | Seven institutional inquiry paths, full intake form with checkboxes and tier prefill, About / Mission / Vision |

- **Shared assets:** one [`assets/styles.css`](assets/styles.css) (full design system —
  palette tokens, Playfair Display / Inter / IBM Plex Mono, components) and one
  [`assets/main.js`](assets/main.js) (nav, reveals, counters, tabs, accordions, sortable
  tables, form validation, `?tier=` prefill). Page-specific charts and logic live inline
  per page — all visualizations are hand-built SVG, no chart libraries, no CDNs.
- **Prototype data rules:** every demonstration figure is labeled as prototype data;
  all companies in the ledger are fictional (Northstar Industrial Holdings, Meridian
  Chemical Systems, Dominion Resource Processing, Atlas Materials Group, Crown River
  Energy); a persistent footer disclaimer states ReVerity does not levy taxes, impose
  penalties, issue legal determinations, or control public funds.
- **Quality:** responsive 375px → 1440px with no horizontal scroll, semantic HTML,
  visible focus states, `prefers-reduced-motion` respected, zero console errors —
  verified per page in a headless browser (desktop + mobile screenshots, interaction
  checks).

### The Verity Console — [`console.html`](console.html)

> **Note:** the Console and the Site Dossier below were built under the previous
> **Terra Verity Ledger** (red/white/black) brand iteration and are kept in the repo
> as working product prototypes. The marketing site above has since been redesigned
> as **ReVerity Ledger** (black/gold/white) and no longer links to them.

The working **product** for Terra Verity Ledger — a functional, single-file React
intelligence application (not a marketing page). A user opens a *case* on a real U.S.
environmental problem and the console walks it through three stages —
**Identify → Quantify → Rectify** — using an AI model to generate structured,
evidence-graded analysis at each stage, ending in an exportable *Jurisdiction Planetary
Damage Report*.

- **Self-contained:** React + ReactDOM are inlined and the JSX is pre-transpiled, so the
  file runs with **no CDN and no build step** — open it in any browser or host it static.
- **AI integration:** on entering each stage the app calls a model (default
  `claude-opus-4-8`), browser-direct, with a **strict-JSON** system prompt and a
  bulletproof client-side parser. Your API key is held in React state only (never stored)
  — the no-storage rule is honored throughout.
- **Demo Mode (default):** realistic, clearly-labeled *modeled* analysis so the console
  works with no key; a banner and Settings let you switch to Live AI (Anthropic default,
  OpenAI selectable) and change the model.
- **Stages:** Identify (actor map · nine-boundary pressure profile · evidence ledger),
  Quantify (Planetary Debt ledger with low/expected/high ranges · animated total ·
  cost-of-inaction 5/10/25 · reported-vs-truth), Rectify (ranked restoration pathways ·
  multiple qualified providers · funding routes · next steps · seven deliverable
  generators), then the 11-section Report on a bone-white surface with **Print / Export
  to PDF** and Copy.
- **Guardrails (mandatory):** every estimate carries an A–E evidence grade and uncertainty
  range; unknown actors are shown as open nodes to validate, never asserted; a persistent
  disclaimer and a TerraReFlow conflict disclosure appear where relevant. *This is not
  opinion — it is planetary accounting.*
- **State:** in-memory `useReducer`, multiple cases per session, no `localStorage`.
- **Roadmap:** live regulatory feeds (EPA ECHO/FRS, SEC EDGAR, state databases, permit /
  emissions / court records, satellite imagery) are identified in-app for wiring in;
  until connected, estimates are graded D (modeled) or E (flag).

> To iterate on the Console source, edit the JSX and re-run the inline build (React +
> ReactDOM from npm, transpiled with `@babel/preset-react`) — the published `console.html`
> is the built, dependency-free output.

### The Verity Site Dossier — [`verity-dossier/`](verity-dossier/)

The **full-stack product** (Next.js 14 + TypeScript). Enter one site and it
assembles a cited, evidence-graded dossier from **live U.S. public records** —
EPA ECHO, Envirofacts (TRI / Superfund / RCRA), and SEC EDGAR — with the
responsible-party chain, documented damage, a clearly-separated modeled
liability, and an exportable deliverable (Litigation Intake Memo or Remediation
& Redevelopment Pathway).

- **Server-side data layer:** all EPA/SEC calls run in Next.js route handlers
  (SEC `User-Agent`, CORS, per-URL caching, rate-limit backoff, retries). The
  browser never calls `.gov` directly.
- **Grounded, not generative:** the AI never invents facts — it only resolves
  messy entity names (confidence-scored), summarizes retrieved records, and
  drafts the memo. Every fact is graded A–E and cited to its source record; if a
  source returns nothing, the dossier says so — never a fabricated value.
- **Streaming Evidence Log:** each real API call streams into the console as it
  fires, so you watch the record-pull happen.
- **Sample mode** (default on) serves clearly-labeled sample records so the full
  pipeline runs anywhere; **live mode** calls the real APIs. See
  [`verity-dossier/README.md`](verity-dossier/README.md) for setup, the env vars,
  and the live acceptance test.

> Verified here: clean `next build`, boots, full sample pipeline (evidence log →
> actor chain → quantify → both memos → print), and live mode firing real
> server-side `.gov` requests that degrade to honest gaps. The **live-data
> acceptance test** (every number traces to a live record) must run where `.gov`
> egress is open — this build environment blocks those hosts by network policy.

## Installed skills

### frontend-design

Located at [`.claude/skills/frontend-design/`](.claude/skills/frontend-design/).

Guidance for distinctive, intentional visual design when building new UI or
reshaping an existing one — aesthetic direction, typography, palette, and layout
choices that don't read as templated defaults. Sourced from
[anthropics/skills](https://github.com/anthropics/skills/tree/main/skills/frontend-design)
(Apache-2.0).

Claude Code automatically discovers skills under `.claude/skills/`, so this
guidance loads for design work in any session in this repo.

### UI/UX Pro Max

Installed via the `ui-ux-pro-max-cli` npm package (`uipro init --ai claude`)
from [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
(MIT). This is a suite of design-intelligence skills under `.claude/skills/`:

| Skill | What it covers |
|-------|----------------|
| `ui-ux-pro-max` | Core design database — 67 styles, 161 palettes, 57 font pairings, UX guidelines across 21+ stacks (React, Next.js, Vue, Svelte, SwiftUI, Flutter, …) |
| `ui-styling` | Tailwind + shadcn/ui theming, components, accessibility, responsive utilities |
| `design-system` | Design tokens (primitive/semantic/component), Tailwind integration, slide data |
| `design` | Logo, icon, CIP mockup, and slide design routing |
| `brand` | Brand guidelines, voice/messaging, logo usage, color/typography specs |
| `banner-design` | Banner sizes and style references |
| `slides` | Slide layouts, copywriting formulas, HTML templates |

To update or remove the suite later: `uipro update` / `uipro uninstall`
(install the CLI with `npm install -g ui-ux-pro-max-cli`).

## Adding more skills

Drop another skill folder containing a `SKILL.md` (with `name` and `description`
frontmatter) under `.claude/skills/` and it will be picked up the same way.
