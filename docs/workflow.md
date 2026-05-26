# Workflow — SDD + RPI + XP

This document defines how new features and non-trivial refactors are delivered in this repo. It is the procedural complement to [ARCHITECTURE.md](ARCHITECTURE.md).

## Three pillars in one line each

- **SDD (Spec-Driven Development)** — every non-trivial change lives in `docs/specs/<slug>.md` before any code.
- **RPI (Research → Plan → Implement)** — each spec is executed in a clean session: research existing code, plan reuse, implement under green tests.
- **XP (Extreme Programming)** — TDD via `src/tests/`, one commit per logical step, refactor only under green tests.

## When SDD applies

| Change type | SDD required? |
|---|---|
| New feature | Yes |
| Non-trivial refactor (>1 file, behavior change) | Yes |
| Bug fix touching ≥3 files | Yes |
| Single-file bug fix, typo, doc tweak | No |
| Hotfix in production incident | No (use `/hotfix` retroactive spec) |

Until skills `/spec-new`, `/spec-task` etc are released (M2), the workflow is **manual**: copy `specs/_template.md`, fill in, follow lifecycle.

## Spec lifecycle

```
draft ────► active ────► done
   │           │
   │           └──► abandoned
   └─► amended (append-only)
```

| State | Meaning | Allowed actions |
|---|---|---|
| `draft` | Author iterating, no commits yet | Free editing |
| `active` | Commits in progress on the branch | Amendments via append (`## Amendment YYYY-MM-DD`) only |
| `done` | All work merged, spec frozen | Read-only |
| `abandoned` | Decided not to pursue | Read-only; downstream prereqs need re-linking |

**To open a spec**: copy [specs/_template.md](specs/_template.md), name `<dominio>-<tipo?>-<assunto>.md` kebab-case (≤4 words), fill the 9 sections, set `status: draft`.

**To activate**: set `status: active`, add `branch:` and `owner:`, register in `project-index.md`.

**To amend mid-flight**: append a section `## Amendment YYYY-MM-DD` with reason + diff conceptual + impact on prereqs. Never rewrite past text.

**To close**: set `status: done`, add `completed-at: YYYY-MM-DD` and list of commit SHAs, update `project-index.md`.

## Commit conventions

- Prefix every commit with `[spec:<slug>]` for traceability (ex: `[spec:prework-graphql-removal] remove billing-gql-service`).
- Use conventional commit type after the prefix when possible (`fix:`, `feat:`, `refactor:`, `test:`, `docs:`).
- One logical step per commit. PR-final squash policy is decided per branch — keep history readable either way.

## RPI session structure

When picking up a spec:

1. **Research** (read-only) — re-read the spec, the related memories, and the code paths it touches. Note unknowns.
2. **Plan** — list the implementation steps (the spec already has them; refine if research uncovered surprises).
3. **Implement** — TDD where the surface is testable (composables, adapters, utils). Components get smoke tests + visual review.

Per CLAUDE.md, a session running `/spec-task` should produce ≤5 artefacts and ≤310 lines of spec growth.

## Definition of Done (default, per spec)

- [ ] Commits pushed on the working branch with `[spec:<slug>]` prefix
- [ ] CI green (build, lint, prettier, `lint:architecture:changed`)
- [ ] Unit tests covering new composables/adapters
- [ ] Manual smoke in staging (1 Hobby account + 1 Pro account, when applicable)
- [ ] `project-index.md` updated (status + commit SHAs)
- [ ] Related memories referenced (never duplicated)
- [ ] No code comments added (project hard rule)
- [ ] Spec marked `status: done` + `completed-at: YYYY-MM-DD`

A spec may override the DoD by appending bullets under its own `## 9. Definition of Done` section.

## Standards vs Specs vs Domain cards

| Artifact | Lifespan | Scope |
|---|---|---|
| **Spec** | Time-bounded (feature delivery) | A single change |
| **Standard** | Long-lived (cross-cutting) | A rule that applies repeatedly |
| **Domain card** | Long-lived (knowledge map) | A bounded context |

If a spec keeps re-inventing the same convention, extract it into a standard. If a spec keeps re-explaining the same concept, extract it into a domain card.

## Pilot mode (current)

We are piloting SDD on two initiatives (Onboarding + Billing rewrite, ENG-37160). During the pilot:

- All work lives on `refactor/ENG-37160-billing-rewrite`. No intermediate PRs to `dev`.
- One final PR to `dev` when the entire wave is `done`.
- Retrospective in `docs/specs/_retro-pilot.md` after closing the last spec.

Post-pilot, M2 (skills) and M3 (CI sync-guard) decisions are taken based on the retro.
