# Websitebuilding

A repository for building websites, set up with Claude Code skills for design guidance.

## Sites

### Terra Verity Ledger — [`index.html`](index.html)

A single-page, self-contained institutional marketing site for **Terra Verity Ledger**
("Verity") — *Planetary Boundary Truth Infrastructure*. One file, no build step, no
dependencies (all CSS + JS inline; fonts from Google Fonts). Open `index.html` in any
browser, or host the file anywhere static.

- **Identity:** bold Red / White / Black, dark canvas with bone-white "clarity" breaks.
- **Type:** Inter Tight (display) · Inter (body) · IBM Plex Mono (data / ledger).
- **Sections:** sticky nav → hero → problem → is/is-not → Identify·Quantify·Rectify →
  planetary debt → audiences → flagship report → evidence grades (A–E) → deliverables →
  pricing → intake form → about → final CTA → footer.
- **Interactions:** condensing sticky nav, mobile menu, smooth-scroll, scroll reveals,
  animated count-up, and a client-side-validated intake form with a success state.
  The form's submit handler has a clear hook for wiring a real backend later.
- **Quality:** mobile-first responsive (verified 375px → 1440px, no horizontal scroll),
  semantic HTML, visible focus states, and `prefers-reduced-motion` respected.

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
