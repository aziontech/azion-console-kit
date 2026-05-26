# Project Index

Active board for in-flight specs. Updated on every status transition.

## Active wave — ENG-37160 Onboarding + Billing Rewrite

Branch: `refactor/ENG-37160-billing-rewrite` (single branch, no intermediate PRs to `dev`).
Final PR target: `dev` once all specs are `done`.

| # | Slug | Status | Owner | Commits | Depends on |
|---|---|---|---|---|---|
| 0 | `_scaffold-m1` | active | @HerbertJulio | — | — |
| 1 | `prework-services-v4-cleanup` | draft | — | — | — |
| 2 | `prework-metadata-decision` | draft | — | — | — |
| 3 | `prework-graphql-removal` | draft | — | — | `prework-services-v4-cleanup` |
| 4 | `onboarding-prefetch-plans` | draft | — | — | — |
| 5 | `onboarding-flow-hobby` | draft | — | — | `prework-services-v4-cleanup`, `onboarding-prefetch-plans` |
| 6 | `onboarding-flow-pro` | draft | — | — | `prework-services-v4-cleanup`, `prework-metadata-decision`, `onboarding-prefetch-plans`, `onboarding-flow-hobby` |
| 7 | `billing-shell-rewrite` | draft | — | — | pre-work complete |
| 8 | `billing-cards-hobby` | draft | — | — | `billing-shell-rewrite`, `prework-metadata-decision` |
| 9 | `billing-cards-pro` | draft | — | — | `billing-shell-rewrite`, `prework-metadata-decision` |
| 10 | `billing-downgrade-warning` | draft | — | — | `prework-metadata-decision`, `billing-cards-pro` |
| 11 | `billing-drawer-upgrade` | draft | — | — | `prework-services-v4-cleanup`, `billing-cards-pro` |
| 12 | `billing-drawer-plans-hobby` | draft | — | — | `billing-cards-hobby` |
| 13 | `billing-drawer-plans-pro` | draft | — | — | `billing-cards-pro`, `billing-drawer-upgrade` |
| 14 | `billing-dialog-downgrade` | draft | — | — | `billing-drawer-plans-pro`, `prework-metadata-decision` |
| 15 | `billing-dialog-cancel-downgrade` | draft | — | — | `billing-dialog-downgrade`, `billing-downgrade-warning` |

## DAG (text)

```
WAVE 0
  _scaffold-m1

WAVE 1 — Pre-work
  prework-services-v4-cleanup ──┐
  prework-metadata-decision     ├─► prework-graphql-removal
                                │
                                └─► (unlocks Wave 2 and Wave 3)

WAVE 2 — Onboarding
  onboarding-prefetch-plans (standalone)
  onboarding-flow-hobby     (depends on cleanup + prefetch)
  onboarding-flow-pro       (depends on cleanup + metadata + hobby)

WAVE 3 — Billing
  billing-shell-rewrite
    ├─ billing-cards-hobby
    │    └─ billing-drawer-plans-hobby
    └─ billing-cards-pro
         ├─ billing-drawer-upgrade
         ├─ billing-drawer-plans-pro
         │    └─ billing-dialog-downgrade
         │         └─ billing-dialog-cancel-downgrade
         └─ billing-downgrade-warning
              └─ billing-dialog-cancel-downgrade
```

## Final PR (filled when ready)

| Field | Value |
|---|---|
| PR URL | — |
| Merge commit SHA | — |
| Rollback command | `git revert <merge-sha>` |

## Retrospective

After spec 15 closes, create `docs/specs/_retro-pilot.md` with outcomes for M2/M3 decisions.
