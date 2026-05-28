# Real-Time Events V2 — Feature Summary

Audience: engineers picking up Real-Time Events V2 after this spec
shipped. Read alongside `requirements.md`, `design.md`, and `tasks.md`
in this folder.

---

## What shipped

Four user-visible improvements over Real-Time Events V1:

| # | Feature | One-liner |
|---|---|---|
| 1 | **Query sharing** | A Share button serializes `filters + dataset + pageSize + selectedFields` into `?shareState=…` and copies the resulting URL to the clipboard. Pasting that URL into another tab restores the exact view. |
| 2 | **Saved searches** | A Save button persists a named search (filters, columns, dataset, page size) to `localStorage` scoped per account+tenant. Re-applies on click; survives reload. |
| 3 | **GraphQL `groupBy` whitelist** | Five datasets (Function, Function Console, Data Stream, Edge DNS, Activity History) only support `groupBy: [ts]`. A `DATASET_SUPPORTS_GROUPBY` map in `load-events-aggregation.js` prevents the V1 crash on those tabs. |
| 4 | **Add Filter modal width stability** | Modal width is locked via responsive CSS (`min(35rem, 90vw)` desktop, `calc(100vw - 1rem)` mobile). Switching the filter field or operator no longer causes the modal to jump. |

All four are covered end-to-end by automated tests under
`src/views/RealTimeEventsV2/**/__tests__/` and Cypress specs under
`cypress/e2e/real-time-events/`. Manual companions live in
`manual-stories.md`.

---

## Where it lives

```
src/views/RealTimeEventsV2/
├── TabsView.vue                          ← dataset tabs, hosts session manager
├── Blocks/
│   └── tab-panel-block.vue               ← per-tab orchestrator
├── components/
│   └── FallbackCopyDialog.vue            ← legacy clipboard fallback (Safari, insecure context)
└── composables/
    ├── useSessionManager.js              ← Share URL build + clipboard write (N.9 logs)
    ├── useSavedSearches.js               ← localStorage CRUD with quota fallback (N.10 logs)
    ├── useViewSync.js                    ← reads ?shareState on mount, hydrates filters
    ├── useChartBuilder.js                ← chart data + dataset capability guard
    └── utils/load-events-aggregation.js  ← DATASET_SUPPORTS_GROUPBY whitelist
```

Persistence keys (account-scoped, see `useSavedSearches.js`):
- `azion.rte.v2.savedSearches.<accountId>.<tenantId>`
- Legacy unscoped key is dropped on first load (one-time migration).

URL shape:
- `?shareState=<base64url-encoded JSON>`
- JSON schema: `{ v: 1, dataset, filterData, pageSize, selectedFields }`
- Versioned for forward-compat — bump `v` and add a migrator if shape changes.

---

## Observability hooks

Structured `console.info` / `console.error` logs are intentional, not
debug leftovers. They are required by requirements N.9 (share metrics)
and N.10 (saved-search CRUD audit) and each has an
`eslint-disable-next-line no-console` next to it with a justification
comment. Do **not** strip them — downstream sinks (browser-console
forwarder, Sentry breadcrumbs) depend on them.

Event names you can grep for:
- `share_url_copied` — Share button success (includes URL length, no PII)
- `useSavedSearches: save | delete | apply` — CRUD audit
- `[real-time-events] GraphQL query failed` — error path

---

## Guardrails enforced by tooling

| Mechanism | What it stops |
|---|---|
| ESLint rule `azion-architecture/no-unawaited-clipboard` (`error`) | `navigator.clipboard.writeText(...)` without `await` or explicit `.then/.catch`. Regression-proofs the bug fixed in this spec. |
| `DATASET_SUPPORTS_GROUPBY` in `load-events-aggregation.js` | Sending unsupported `groupBy` fields to the five datasets that only accept `groupBy: [ts]`. Falls back to time-only aggregation. |
| Unit + Cypress tests under `__tests__/` and `cypress/e2e/real-time-events/` | URL round-trip, quota-exceeded fallback, modal width stability, touch-target sizes, focus management. |

The ESLint rule lives at
`eslint/plugin/lib/rules/no-unawaited-clipboard.js` with tests at
`eslint/plugin/tests/no-unawaited-clipboard.test.js`. It is wired in
both `.eslintrc.cjs` and `eslint/plugin/lib/configs/recommended.js`.

---

## Feature flags

None. The four features are unconditionally on. No `FEATURE_SHARE_URL`
or `FEATURE_SAVED_SEARCHES` flags were introduced — the V1/V2 split is
controlled at the route level (see commit `22c37d16b`).

If you need to dark-launch a future change, follow the same route-guard
pattern rather than introducing per-feature booleans.

---

## Known limitations (intentional, not bugs)

- **Saved searches are per-browser.** No cross-device sync. Documented
  in the user-facing tooltip and in `docs/real-time-events-improvement-plan.md`.
- **Share URLs do not embed time range expansion.** A URL captures the
  exact `tsRange` at the moment Share was clicked — recipients see the
  same window, not "last 15 minutes" relative to when they open the link.
- **Fallback dialog uses `document.execCommand('copy')`.** Deprecated in
  the spec but still implemented in every shipping browser. We will
  revisit when a real successor lands.

---

## Where to look when something breaks

| Symptom | First file to read |
|---|---|
| Share button silently fails | `composables/useSessionManager.js` (clipboard path + fallback) |
| Saved search disappears after reload | `composables/useSavedSearches.js` `load()` + check `storageKey` formation |
| One tab errors on GraphQL | `composables/utils/load-events-aggregation.js` — verify dataset in whitelist |
| Modal width jumps | `Blocks/tab-panel-block.vue` — search for `add-filter` modal class + tokens |
| Shared URL doesn't restore filters | `composables/useViewSync.js` — `parseShareState` + `applyShareState` |

---

## Requirements coverage

All 31 requirements are mapped to tasks in `tasks.md` under the
"Requirements Coverage Checklist" section. Each task references its
requirement IDs as `_Requirements: X.Y, X.Z_`.
