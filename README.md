# Websitebuilding

A repository for building websites, set up with a Claude Code skill for design guidance.

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

## Adding more skills

Drop another skill folder containing a `SKILL.md` (with `name` and `description`
frontmatter) under `.claude/skills/` and it will be picked up the same way.
