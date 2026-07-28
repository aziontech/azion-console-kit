# billing-api v4 — frontend migration spec (AI orientation)

**Issue:** ENG-46458 · **Branch:** `feat/plans-experience` · **Contract:** `docs/billing-api-v4-openapi.reference.yaml` (endpoint surface) + `docs/billing-api-v4-contract-gap-analysis.md` (current→v4 deltas).

This document orients a fresh session to **continue** the billing-api v4 frontend migration safely. It is the companion to the gap analysis: the gap analysis says _what changes_; this spec says _what is already done, what to do next, and how to do it without breaking the live app_.

---

## 1. Purpose & scope

- **In scope:** build the new `services/v2/**` service + adapter + constants layer for each billing resource against the `/v4/account/**` (and `/v4/billing_accounts/**`) surface, with tests.
- **Out of scope (do NOT do without an explicit, separate request):**
  - Rewiring views/composables to the new layer. The API is a **501 DRAFT skeleton** — cutting consumers over now would break the app.
  - The server-side skeleton itself.
  - `/internal/**` (server-to-server, `x-internal-secret`) and `POST /webhooks/{provider}` (gateway ingest) — never frontend concerns.
- **Guardrails:** additive only; keep edits comment-free; no commits/PRs without explicit approval; retire a legacy `/edge_api` or `/v4/payments` service **only after** its v4 replacement exists AND consumers are cut over (a later, separate change).

---

## 2. Current state — built vs pending

All the v4 layers below are **built but not wired** — no view/composable consumes them; only their test suites do (do-not-rewire rule, §9). The legacy services stay live until a future, separate cutover.

| Layer                                                                      | Status          | Where                                                                                                    |
| -------------------------------------------------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------- |
| **Subscriptions** (11 ops)                                                 | ✅ built-v4     | `src/services/v2/billing-api/subscriptions/*` — the reference pattern                                                |
| **Service Orders** (9 ops)                                                 | ✅ built-v4     | `src/services/v2/service-orders-v4/*` (legacy `service-orders/*` coexists on `/edge_api`, retire later)  |
| **Payment Methods** (5 ops, bare-array list)                               | ✅ built-v4     | `src/services/v2/billing-api/payment-methods/*` (legacy `payment/*` + SO billing-PM coexist)                         |
| **Payments** ledger (4 ops)                                                | ✅ built-v4     | `src/services/v2/billing-api/payments/*`                                                                             |
| **Invoices** (6 ops, Azion schema)                                         | ✅ built-v4     | `src/services/v2/invoices/*` (legacy `billing/invoices-*.js` Stripe-list coexists)                       |
| **Credits** (balance/ledger/add, 3 ops)                                    | ✅ built-v4     | `src/services/v2/billing-api/credits/*`                                                                              |
| **Billing Accounts** (payer, 9 ops)                                        | ✅ built-v4     | `src/services/v2/billing-api/billing-accounts/*` (base `/v4/billing_accounts`)                                       |
| JSON:API error normalizer                                                  | ❌ not built    | deferred until error UX is wired; the app's generic error handler stays in use |
| Idempotency-key helper                                                     | ✅ foundation   | `src/services/v2/utils/idempotency-key.js` (import by direct path)                                       |
| v4 queryKeys (all 7 domains)                                               | ✅              | `src/services/v2/base/query/queryKeys.js`                                                                |
| `/v4/account` + `/v4/billing_accounts` base surface                        | ✅              | resolves via the vite `/v4 → api.azion.com` proxy — no base-URL helper                                   |
| `/edge_api` + GraphQL retirement                                           | ⚠️ pending      | legacy services still live because consumers are NOT cut over (a separate future change)                 |
| Budget Alerts, Spend Limits, Webhook Endpoints, Commitments, Credit Limits | ❌ not-built    | Phase 2 / Future                                                                                         |
| Webhook ingest (`/webhooks/*`), Internal (`/internal/*`)                   | ⛔ out of scope | server-side / server-to-server — never a frontend concern                                                |

**Against the gap-analysis 8-step order:** Step 1 (foundation: idempotency-key + base surface) done; the v4 layers for Steps 3–7 are built (subscriptions, service-orders, payment-methods, invoices/payments/credits, billing-accounts payer). What remains: **wiring consumers + retiring legacy** (the deferred cutover), the Phase-2 resources above, and Step 8 cents/enum work is consumer-side (adapters already keep cents/enums correct).

Full per-operationId matrix: see `docs/billing-api-v4-coverage-matrix.md`.

---

## 3. The `/v4/account` surface & house conventions

- **Request flow:** `this.http.request({ method, url, params, body, config })`. `HttpService` maps `body` → axios `data`; custom headers go through `config: { headers: {...} }`. `BaseService` exposes both `useQuery` and `useEnsureQueryData`.
- **Base URLs are relative** (`/v4/account/subscriptions`) and resolve through the vite proxy `/v4 → api.azion.com`. Do **not** reintroduce the `/edge_api` hop or a `make-*-base-url` helper for v4.
- **Four response shapes — do not assume, check per endpoint:**
  1. Single resource: `{ state: "executed", data: <Resource> }`.
  2. Azion paginated list: `{ count, total_pages, page, page_size, next, previous, results: [...] }`.
  3. **Bare array** (no envelope): `payment_methods` list, invoice `lines`, `settlements`, `refunds`, `budget_alerts`, `spend_limits`, billing-account `members`.
  4. Composite `data` sub-objects: create → `data.subscription` + `data.payment`; preview → the `SubscriptionChangePreview` fields.
- **Money is integer minor units (cents) everywhere.** Never `/100`. Keep cents in the adapter; convert only at the render layer.
- **Wire is snake_case; app contract is camelCase.** Adapters translate both directions.

---

## 4. The Subscriptions layer — the reference pattern (copy this)

Every new resource must mirror this shape:

- **`*-service.js`** — a `BaseService` subclass with a private `#baseURL`, arrow-function methods (one per operationId), a `useXQuery` wrapper via `this.useQuery(queryKeys...)`, and `#idempotencyConfig` for `x-idempotent` ops only. Delegates all shaping to the adapter. Exports a singleton.
- **`*-adapter.js`** — pure functions only: `transformX` (wire→app, snake→camel, `?? null` for nullable) and `toXPayload` (app→wire) using **conditional spread** so unknown/undefined fields never reach the body (honors the contract's `additionalProperties:false`). Exposed as one frozen object.
- **`*-constants.js`** — `Object.freeze`d enum maps mirroring the contract enums, plus any derived sets (e.g. entitled/terminal status).
- **queryKeys** — add a domain with `list(params)`, detail, `current`, and sub-collection keys.

Idempotency is applied on **exactly** the `x-idempotent` ops. For subscriptions that is `create` and `change` — **not** `preview` or `cancel`.

---

## 5. Idempotency & errors

- **Idempotency-key** — lowercase header `idempotency-key`. The helper auto-mints a UUID when the caller omits one, so the header is always present on `x-idempotent` ops. **The key must be STABLE across retries**: when wiring a consumer, generate the key once per logical user action and thread the same value on retry, or double-charge protection is defeated. Other x-idempotent ops that will need it: `pay_invoice`, `create_payment_refund`, `create_service_order_action`.
- **Errors — normalizer NOT built (deferred).** v4 uses `application/vnd.api+json` JSON:API: `{ errors: [{ status, code, title, detail, source: { pointer }, meta: { request_id } }] }`. The app's generic error handler does not parse this shape (no `request_id`, pointer assumes `/data/<field>` not `/data/attributes/<field>`). A dedicated normalizer was intentionally **not kept** (it was unwired scaffolding). Build one at wiring time and route v4 consumers' error UX through it — including the **409 "ambiguous context"** (ADR-13) on `/current` endpoints (subscriptions + billing accounts) as a typed signal rather than a generic error.

---

## 6. Breaking-change cheatsheet

- **Enum spellings (silent killers):** `cancelled` (double-l), period `monthly|annual` (**not** `yearly`), `proration_behavior` `[create_prorations|none|always_invoice]`, `when` `[now|period_end]`, `billing_mode` `[prepaid|postpaid]`. Entitlement gating uses `SUBSCRIPTION_ENTITLED_STATUSES=[active,past_due]` / terminal `[cancelled]`.
- **Cents, not decimals.** `amount`, `total`, `immediate_total`, `recurring_fee_snapshot`, `committed_amount`, `available_amount`, `threshold_amount`, line-item `amount`.
- **`plan_pricing_id` is gone.** v4 identifies a plan by `plan_id` + `period`; recurring price is a server snapshot (`recurring_fee_snapshot` + `price_table_ref`). Dead adapter fields with no v4 home: `priceId`, `downgradePending`, `invoiceAmountCharged`, `clientSecret` (on SO).
- **Service Orders `update` = `order_number` only.** Do NOT port the old PATCH that sends plan fields.
- **Flows relocate across resources (map by capability, not URL):**
  - upgrade / downgrade → `POST /v4/account/subscriptions/{id}/change` (+ `/change/preview`).
  - cancel_downgrade → `DELETE /v4/account/subscriptions/{id}/scheduled_changes/{scid}`.
  - signup/checkout/prepare → `POST /v4/account/subscriptions` (read `data.payment.client_secret`; the multi-key `stripe-payment-resolver` hunt collapses to one field).
  - billing payment-methods → `/v4/account/payments/**` (`set_default` → `/{id}/default`, `setup_intents` → `payment_setup_sessions`).
  - plans catalog → gone (billing-engine PriceTable; source metadata elsewhere).
  - downgrade-pending state → Subscription `scheduled_changes`, not a `pending_transition` heuristic.
- **Envelope → bare array conversions** where legacy read `data.<thing>[]` inside an envelope.

---

## 7. Migration order & next task

The service/adapter/constants **layers** for the whole self-service surface are now built (all ✅ in §2). What remains is the **cutover**, done later as separate, gated changes:

1. Foundation — JSON:API error normalizer: **not built** (deferred to wiring time; the generic error handler stays in use).
2. Plans/pricing — `plan_id` + `period`; no `/plans` catalog endpoint (metadata sourced elsewhere). Still open at wiring time.
3. ~~Subscriptions~~ ✅ layer built (reference pattern).
4. ~~Create/checkout~~ — covered by the subscriptions `create` op (read `data.payment.client_secret`).
5. ~~Payment Methods~~ ✅ layer built (`payment-methods/*`).
6. ~~Invoices / Payments / Credits~~ ✅ layers built (`invoices/*`, `payments/*`, `credits/*`).
7. ~~Payer + address~~ ✅ layer built (`billing-accounts/*`).
8. Cross-cutting — adapters already keep cents + correct enums; remaining cents/enum work is **consumer-side** at wiring time.

**Next real task = the CUTOVER, per consuming flow (not per resource):** for one flow at a time (e.g. the plan-change drawer, the billing invoices list), point the composable/view at the v4 service, map the new contract into the component, route errors through a JSON:API error normalizer (to be built then), thread a stable idempotency key per user action, and retire the legacy call — **only after the API leaves 501 for that endpoint**. One flow = one commit under green tests. Phase-2 resources (budget alerts, spend limits, webhook endpoints, commitments, credit limits) remain unbuilt until scoped.

---

## 8. Testing conventions

- Tests live under `src/tests/services/v2/<resource>/`.
- Mock the http client as `service.http = { request: vi.fn().mockResolvedValue({ data: <envelope> }) }` (axios shape: the service reads `response.data`).
- Assert the **exact** request shape with `toHaveBeenCalledWith({ method, url, body, config })` — this is how you prove idempotency is present on `x-idempotent` ops and absent elsewhere, and that payloads are correct snake_case.
- **Mandatory per-resource checklist** (the Subscriptions suite is the bar):
  - Enum constants module is imported and its values asserted (catches `cancelled`→`canceled`, `annual`→`yearly`).
  - Every operation, including the _detail_ transforms (not just list/URL).
  - List transforms fed a **populated** envelope (assert mapped results + pagination), not just an empty one.
  - Nullable/`?? null` branches exercised with a null-heavy fixture.
  - `additionalProperties:false` defended: pass a stray field, assert it is stripped from the body.
  - Money asserted as raw cents.
  - Idempotency: header present on create/change (incl. auto-generated when omitted), absent on preview/cancel.

---

## 9. Do-not-rewire-consumers rule

Build and test the v4 layer only. Leave views/composables on the old contract. The `/edge_api` and `/v4/payments/**` services stay live because their v4 replacements do not exist yet. Consumer cutover + legacy retirement is a separate, later change, gated on the replacement being built and verified.
