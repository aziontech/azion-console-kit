# Rule: testing-versioning — real tests only, no placebo

**Scope:** versioning (VersionShell) test paths — `src/tests/**/*version*`,
`src/tests/**/versioning/**`, `src/tests/**/v6/**`, `src/tests/functional/**`,
`tests/**`. Legacy tests outside these paths are grandfathered (ratchet — design
ADR 7.8 of `specs/versioning-test-coverage`). Spec: `specs/versioning-test-coverage/`.

Every test must be able to **fail for a real reason**. A test that stays green
while the behavior it claims to cover is broken is a **placebo** and gets
rejected — by lint where the machine can see it, by review where it can't.

## The core bar (all layers)

- **Assert observable behavior**: emitted events (with exact payload), rendered
  DOM/text, attributes/ARIA/`data-*`, navigation, returned values. Never internal
  component state (`wrapper.vm.*`) and never class-string lists (`.classes()`).
  _Enforced: `azion-architecture/no-internal-state-assert`._
- **Mock only external boundaries** — HTTP client (`AxiosHttpClientAdapter` /
  `httpService`), `vue-router`, toast, storage, clock. **Never mock the
  versioning code under test** (machine, bus, adapters, composables, services).
  _Enforced: `azion-architecture/no-versioning-module-mock`._
- **No committed escape hatches**: `.only`, `.skip`, `xit`, `test.fixme`,
  `describe.skip`. A test that exposes a real defect gets `it.skip` **with a
  one-line reason and a note in the PR** — never a faked pass, never an
  assertion weakened into meaninglessness (e.g. `toEqual` → `toBeDefined`).
  _Enforced: `vitest/no-focused-tests`, `vitest/no-disabled-tests`._
- **Every test asserts**: `vitest/expect-expect`, `vitest/no-standalone-expect`.
- **Assert only what you read in the source — on THIS branch.** Never invent
  props, events, testids, labels or ARIA from memory or from another branch.
- **If a test only passes when the implementation is written one specific way,
  delete it** — it traps refactors and adds no signal.
- A tautological assert (verifying only that a stub returned its configured
  value, or passing even when the collaborator is never invoked) is placebo.

## Per-layer mechanism (what makes each layer honest)

| Layer                                                                       | Runner                                                                   | Anti-placebo mechanism                                                                                                                                                                                                                                                                |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Unit** (`src/tests/**`, jsdom)                                            | `yarn test:unit:headless` · mutation: `yarn test:mutation`               | Stryker (mutation — proves tests catch broken code; config `stryker.config.mjs`, scoped to the pure versioning logic modules; thresholds are **reporting-only** until the gate is calibrated per ADR/Q8) + fast-check (property-based — kills happy-path-only) + the lint rules above |
| **Functional** (`src/tests/functional/**/*.browser.test.js`, real Chromium) | `yarn test:functional`                                                   | Real browser (no jsdom no-ops for focus/layout/Teleport) + mandatory floor: every test drives a **real user action** AND asserts an **observable consequence**                                                                                                                        |
| **Contract** (`tests/contracts/**`)                                         | consumer: Vitest · drift: `npx playwright test --project=contract-drift` | yup schema is the single source of truth; every fixture must validate against it (a lying fixture fails the gate); drift validates the PUBLISHED OpenAPI spec (open `/schema/` URL, no secrets) — engine unit-tested against a local fixture so detection is provably real            |
| **E2E**                                                                     | —                                                                        | **Deferred** (design ADR 7.4). Do not add e2e specs until that phase is approved.                                                                                                                                                                                                     |

## Functional (browser mode) specifics

- Config: `vitest.functional.config.js` — **separate from** `vitest.config.js`
  on purpose: the unit CI job runs in `node:22-alpine` (no Chromium); the
  browser project must never be picked up by the default config.
- Name tests `*.browser.test.js` under `src/tests/functional/`.
- **No mocks for layout, positioning, focus or `<Teleport>` — ever.** If a test
  "needs" one, the test is wrong; the browser makes them real.
- Query teleported content from `document.body`, not the render container.
- Local run needs the browser once: `npx playwright install chromium`.

## Registry-driven architecture

The suite mirrors the production shell: production plugs a resource with one
registry entry, so the tests do the same — **one descriptor × N shared behavioral
suites**, never a copy-pasted file per resource. Full rationale and target design
live in `TEST-ARCHITECTURE.md` (the `Versionamento/` workspace) — read it before
touching the kit.

**Plugging a new resource** (the only steps):

1. Add a descriptor to `RESOURCE_TEST_REGISTRY`
   (`src/tests/support/versioning/registry.js`): `service`, `adapter`, `schemas`,
   `capabilityClass`, `baseURL`, `configMarkers`, build fixtures, and any declared
   divergences (`envelope`, `saveStrategy`, `extraMutations`, `subresources`).
2. Add a thin instantiator
   `src/tests/services/v2/<resource>/<resource>-version.test.js` that calls
   `describeVersionServiceContract(d)` + `describeVersionAdapterContract(d)` and
   holds only genuinely bespoke `it`s.

Every shared suite then runs for the resource automatically.

**Where the kit lives:**

- `src/tests/support/versioning/` — the ONE canonical seam (`spyHttpRequest`,
  `stubVersionQueryCache` in `boundaries.js`), `mount.js`, `builders.js`, and the
  test `registry.js`.
- `src/tests/shared/versioning/` — the parametrized behavioral contracts
  (`version-service`, `version-adapter`, `subresource-crud`, capability surfaces).

**Rules:**

- **Never re-implement a seam.** Consume `@/tests/support/versioning/boundaries`;
  do not hand-roll `vi.spyOn(httpService, 'request')` + `queryClient` stubs in a
  test file.
- Sub-resource data (`path`/`idKey`/`queryKeyGroup`/`buildPayload`) lives in the
  descriptor's `subresources`, not in the instantiation file. Sub-resources whose
  service diverges from the generic factory are flagged `bespoke: true` and covered
  by hand.
- The **registry-guard**
  (`src/tests/composables/versioning/registry-completeness-guard.test.js`) fails if
  a plugged resource has no descriptor, a descriptor lacks a mandatory field, its
  class disagrees with `RESOURCE_CAPABILITY`, or it has no thin instantiator —
  completeness is **structural**, not a chore.
- The coverage matrix (`tests/coverage-matrix.json`) is verified by
  `scripts/check-coverage-matrix.mjs`, which also greps each covered/partial cell's
  `coveredBy` files for the journey's command — a "stale coverage claim" fails CI.

## Current rollout state (keep this section updated)

- `no-internal-state-assert` and `no-versioning-module-mock` are **`error`**
  (promoted by spec task 2.3). Enabling them as `warn` surfaced **19 real
  placebo violations reachable by the scoped gate** (17 module mocks, 2
  vm-asserts); all were fixed and the scoped lint
  (`src/tests/**/*version*`, `**/versioning/**`, `**/v6/**`) is clean. The fixes:
  version services/composables now run for REAL against the HTTP boundary
  (`vi.spyOn(httpService, 'request')` + `queryClient.ensureQueryData`/`removeQueries`
  stubs), or their query hooks are stubbed via `vi.spyOn` on the real service
  (never `vi.mock` of the module); vm-asserts became DOM/attribute assertions.
- The vitest rules (`no-focused/disabled-tests`, `expect-expect`,
  `no-standalone-expect`) are already **`error`** (zero violations found).
- Binary test artifacts (`**/__screenshots__/**`, `**/*.png`,
  `.vitest-attachments/**`) are excluded via `ignorePatterns` so the scoped
  globs don't parse-error on non-JS files.
- Ratchet baseline: see `tests/ratchet-baseline.json`.
