# Websitebuilding

A repository for building websites, set up with Claude Code skills for design guidance.

## Sites

### Terra Verity Ledger — multi-page marketing site ([`index.html`](index.html))

A complete, static multi-page institutional marketing site for **Terra Verity Ledger**
("Verity") — *Planetary Boundary Truth Infrastructure*. Eight hand-authored HTML pages
sharing one stylesheet and one script — no framework, no build step, no bundler (fonts
from Google Fonts). Open `index.html` in any browser, or host the folder anywhere static.

**Pages** (static nav + footer on every page, `aria-current` active states):

| Page | File | What it does |
|------|------|--------------|
| Home | [`index.html`](index.html) | Hero, live planetary-boundary status terminal (6 of 9 transgressed), positioning stats, explore teasers |
| The Problem | [`problem.html`](problem.html) | Reported-vs-truth profit compare with animated count-up to $1B, unpriced planetary-debt grid |
| How It Works | [`how-it-works.html`](how-it-works.html) | The Identify → Quantify → Rectify framework, three discipline cards, the A–E evidence-grade scale |
| Product | [`product.html`](product.html) | The flagship Jurisdiction Planetary Damage Report (11-section table of contents, is/is-not), links to both working products, deliverables grid |
| Who It's For | [`audiences.html`](audiences.html) | B2G / B2B / B2C audiences (government named as first serious buyer) |
| Pricing | [`pricing.html`](pricing.html) | Four engagement tiers; each "Request this" carries its tier into the intake form |
| About | [`about.html`](about.html) | Mission and the disclosed TerraReFlow PBC relationship / independence |
| Request a Report | [`contact.html`](contact.html) | Full intake form with client-side validation, tier prefill, and a success state |

- **Shared assets:** one [`assets/styles.css`](assets/styles.css) (the full design system —
  palette tokens, type scale, components) and one [`assets/main.js`](assets/main.js)
  (all interactions). Every page links the same two files, so the look and behavior stay
  identical and edits propagate everywhere.
- **Identity:** bold Red / White / Black, dark canvas with bone-white "clarity" breaks.
- **Type:** Inter Tight (display) · Inter (body) · IBM Plex Mono (data / ledger).
- **Interactions:** condensing sticky nav, full-screen scroll-locked mobile menu, scroll
  reveals, animated count-up, pricing→contact tier prefill (`?tier=` query param), and a
  client-side-validated intake form with a `VRT-` reference success state. The form's
  submit handler has a clear hook for wiring a real backend later.
- **Quality:** mobile-first responsive (verified 375px → 1440px, no horizontal scroll on
  any page), semantic HTML, visible focus states, `prefers-reduced-motion` respected, and
  zero console errors. Verified in a headless browser across all eight pages: loads, active
  nav, count-up, form validation (empty blocked, bad email rejected, valid submit succeeds),
  tier prefill, and the mobile menu.

### The Verity Console — [`console.html`](console.html)

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
