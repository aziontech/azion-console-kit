# `tests/` — versioning test-governance artifacts

Repo-level (non-`src`) artifacts of the **versioning-test-coverage** spec
(`specs/versioning-test-coverage/` in the spec workspace). The test suites
themselves live in `src/tests/**` (Vitest unit/jsdom; browser-mode functional
under `src/tests/functional/`). This directory holds the governance data that
makes "complete coverage" auditable.

## Layout

| File | Purpose |
| --- | --- |
| `coverage-matrix.json` | Journey checklist (design §3.5): 9 versioned resources × journeys J1–J10 (requirements §7). Each cell records `level` (`component` now — e2e is deferred per ADR 7.4; `n/a` when the journey doesn't apply to the class), `coveredBy` (real test files, verified — never invented), and `status` (`covered` / `partial` / `missing`). Primary coverage gate — percentage is a support metric only. |
| `ratchet-baseline.json` | Coverage ratchet cut point (ADR 7.8): merge-base SHAs with `dev` that define the "new code" bar (90% new-code coverage via Sonar); everything older is grandfathered. |
| `contracts/` | Consumer-side API contracts (yup schemas, `*.schema.ts`) — single source of truth for version-endpoint request/response shapes, used by the offline consumer tests, the fixture-validation gate, and the scheduled/pre-deploy `contract-drift` check. Created by tasks 7.x/8.x. |

## How the matrix is verified

- **Today**: the matrix is maintained by hand, with `coveredBy` filled from a
  real audit of `src/tests/**`. `summary` holds the per-journey counts.
- **Task 12.2 (coming)** adds a CI verification script: any resource plugged
  into the Version Shell (route/registry) without a matrix row **fails the
  gate**, covering the three class patterns (deployable / versioned-only /
  composite with versioned sub-resources). It also recomputes `summary`.
- Cells only move to `covered` when a test asserts the journey's observable
  behavior at the stated level (anti-placebo regime, requirements §1). E2E
  cells stay `component` until the deferred e2e phase lands.

## Editing rules

- Keep `coveredBy` paths repo-relative and pointing at files that exist.
- Never mark a cell `covered` without a real test — `missing` is the honest
  default.
- Update `summary` whenever cells change (until 12.2 automates it).

## Sonar ratchet — new-code coverage ≥ 90% (spec task 14.2)

The ratchet is enforced **server-side** (SonarCloud/SonarQube project settings);
the repo provides the inputs. To activate:

1. **New Code period**: project Settings → New Code → *Specific analysis* (or
   *Reference branch* = `dev`), anchored at the cut-point SHA recorded in
   [`ratchet-baseline.json`](./ratchet-baseline.json) (`27d1c9d8…`, the merge-base
   of `feat/versioning` and `feat/real-time-events-improvements` with `dev`).
2. **Quality Gate**: add condition *Coverage on New Code* ≥ **90%** (design Q6).
   Legacy code is grandfathered — only the diffs of the two active branches (and
   anything after the cut point) must clear the bar.
3. **Coverage input**: point the scanner at the **merged** lcov —
   `sonar.javascript.lcov.reportPaths=coverage/merged/lcov.info` — produced by
   `yarn coverage:merge` (unit + functional; see `scripts/merge-coverage.mjs`).
   Until the CI wiring for shard-merge lands, the unit-only lcov
   (`coverage/unit/lcov.info`) remains a valid fallback input.

## Promoting the gates (flip procedure — spec task 16.1)

Rollout is *reporting → required* (design ADR 7.6). Current state and flips:

| Gate | State today | Flip to enforce |
|---|---|---|
| `versioning-tests-gate` (pre-merge) | job exists, **not** a required check | GitHub → Settings → Branch protection (`dev`) → add required status check `versioning-tests-gate` — after 1–2 weeks of green/flake data |
| Contract-drift pre-deploy (stage/prod) | step runs with `continue-on-error: true`; skips cleanly while `CONTRACT_API_*_{STAGE,PROD}` secrets are absent | configure the secrets → observe → remove the `continue-on-error: true` line (stage first, then prod) |
| Mutation score (Stryker) | `thresholds.break = null` (reporting) | set `break` to the calibrated score in `stryker.config.mjs` once the survivor report stabilizes |
| Anti-placebo ESLint rules | **already `error`** (promoted by task 2.3) | — |
