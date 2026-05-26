# Project Index

Active board for in-flight specs. Updated on every status transition.

## Active wave — ENG-37160 Onboarding + Billing Rewrite

Branch: `refactor/ENG-37160-billing-rewrite` (single branch, no intermediate PRs to `dev`).
Final PR target: `dev` once all specs are `done`.

| # | Slug | Status | Owner | Commits | Depends on |
|---|---|---|---|---|---|
| 0 | `_scaffold-m1` | done | @HerbertJulio | d499e27e2 | — |
| 1 | `prework-services-v4-cleanup` | done | @HerbertJulio | d499e27e2 | — |
| 2 | `prework-metadata-decision` | done | @HerbertJulio | d499e27e2 | — |
| 3 | `prework-graphql-removal` | done | @HerbertJulio | pending | `prework-services-v4-cleanup` |
| 4 | `onboarding-prefetch-plans` | done | @HerbertJulio | d499e27e2 | — |
| 5 | `onboarding-flow-hobby` | done | @HerbertJulio | d499e27e2 | `prework-services-v4-cleanup`, `onboarding-prefetch-plans` |
| 6 | `onboarding-flow-pro` | done | @HerbertJulio | d499e27e2 | `prework-services-v4-cleanup`, `prework-metadata-decision`, `onboarding-prefetch-plans`, `onboarding-flow-hobby` |
| 7 | `billing-shell-rewrite` | done | @HerbertJulio | d499e27e2 | pre-work complete |
| 8 | `billing-cards-hobby` | done | @HerbertJulio | d499e27e2 | `billing-shell-rewrite`, `prework-metadata-decision` |
| 9 | `billing-cards-pro` | done | @HerbertJulio | d499e27e2 | `billing-shell-rewrite`, `prework-metadata-decision` |
| 10 | `billing-downgrade-warning` | done | @HerbertJulio | d499e27e2 | `prework-metadata-decision`, `billing-cards-pro` |
| 11 | `billing-drawer-upgrade` | done | @HerbertJulio | d499e27e2 | `prework-services-v4-cleanup`, `billing-cards-pro` |
| 12 | `billing-drawer-plans-hobby` | done | @HerbertJulio | d499e27e2 | `billing-cards-hobby` |
| 13 | `billing-drawer-plans-pro` | done | @HerbertJulio | d499e27e2 | `billing-cards-pro`, `billing-drawer-upgrade` |
| 14 | `billing-dialog-downgrade` | done | @HerbertJulio | d499e27e2 | `billing-drawer-plans-pro`, `prework-metadata-decision` |
| 15 | `billing-dialog-cancel-downgrade` | done | @HerbertJulio | d499e27e2 | `billing-dialog-downgrade`, `billing-downgrade-warning` |

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
| PR URL | — (single PR refactor/ENG-37160-billing-rewrite → dev pending) |
| Branch consolidated SHA | d499e27e2 |
| Rollback command | `git revert d499e27e2` (single bundle commit on the branch) |

## Caveats / TODO before final PR

- spec 4.5 wired (PaymentMethodSummary in DrawerPlanInfo); UX still pending staging smoke test (default card present + swap path)
- spec 4.6/4.7 wired (DrawerPlanComparison replacing PlanSelectionDrawer in BillsView); needs visual review against Figma
- spec 2.3 done: GraphQL files deleted; trial credit banner removed from `notification-payment.vue` (will not render until backend exposes trial credit in v4 REST — accepted trade-off)
- ~~pre-commit hook fails on uncaught BroadcastChannel exception~~ — FIXED in `src/tests/setup-tests.js` (disabler now runs at module top-level before any test file imports the queryClient). `--no-verify` no longer needed.

## SDD tooling available (M2 — implemented in this session)

- `/spec-new <slug>` — scaffold new spec from template + register in this index
- `/spec-task <slug>` — flip `draft → active`, brief on contracts, run RPI cycle
- `/spec-close <slug>` — verify DoD, flip `active → done`, record commits
- `/spec-amend <slug>` — append-only `## Amendment YYYY-MM-DD` block

Skills live in `.claude/skills/spec-{new,task,close,amend}/SKILL.md`.

## Retrospective

See [_retro-pilot.md](specs/_retro-pilot.md) — outcome of this wave + M2 status + recommendations for M3 (3 CI sync-guards).
