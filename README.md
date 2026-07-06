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
