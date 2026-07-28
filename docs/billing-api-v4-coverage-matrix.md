# billing-api v4 — frontend coverage matrix

Per-operationId status of `feat/plans-experience` vs the billing-api v4 DRAFT contract (ENG-46458). Companion to `docs/billing-api-v4-frontend.spec.md` and `docs/billing-api-v4-contract-gap-analysis.md`.

Legend: **built-v4** targets the new `/v4/account/**` (or `/v4/billing_accounts/**`) surface with v4 schemas · **old-contract** still on `/edge_api/**`, legacy `/v4/payments/**`, or Stripe/GraphQL shapes · **not-built** no service exists · **partial** foundation half-done.

> **⚠️ SUPERSEDED for the NEW layer — read `billing-api-v4-ready-surface.md` + `billing-flow.md` first.** This matrix was written against the full DRAFT contract. After the READY-surface pruning (Track A):
> - The NEW v4 READY layer now lives under **`src/services/v2/billing-api/`** (`subscriptions/`, `payment-methods/`, `payments/`, `credits/`, `billing-accounts/`), trimmed to **READY ops only** and re-aligned to the real OpenAPI v1.0.0. It is additive and **unwired** (do-not-rewire).
> - **Deleted** as 100% 501-dead: `service-orders-v4/` and `invoices/` (the rows below that mark them built-v4 are OBSOLETE).
> - `subscriptions/` keeps only change/preview + `scheduled_changes` (the `{id}` is the **service_order UUID**); create/list/current/get/versions/cancel were removed (501). `payments` dropped refunds; `credits` dropped add-credit; `billing-accounts` dropped members and now sends the real create/patch bodies.
> The per-op rows below are kept only as the DRAFT-era reference; the authoritative READY status is in `billing-api-v4-ready-surface.md`.

## Subscriptions — `src/services/v2/billing-api/subscriptions/subscriptions-service.js` (ALL built-v4)

| operationId                          | method + path                                                       | status   | notes                                                               |
| ------------------------------------ | ------------------------------------------------------------------- | -------- | ------------------------------------------------------------------- |
| list_subscriptions                   | GET /v4/account/subscriptions                                       | built-v4 | :13 — all 8 query params mapped; paginated envelope                 |
| create_subscription                  | POST /v4/account/subscriptions (idempotency-key)                    | built-v4 | :42 — whitelisted body, auto-UUID key, `data.payment.client_secret` |
| get_current_subscription             | GET /v4/account/subscriptions/current                               | built-v4 | :34 — 409 ambiguous-context not modeled (generic errorHandler)      |
| get_subscription                     | GET /v4/account/subscriptions/{id}                                  | built-v4 | :26                                                                 |
| list_subscription_versions           | GET /v4/account/subscriptions/{id}/versions                         | built-v4 | :80 — no request-side page/page_size forwarded                      |
| change_subscription                  | POST /v4/account/subscriptions/{id}/change (idempotency-key)        | built-v4 | :52                                                                 |
| preview_subscription_change          | POST /v4/account/subscriptions/{id}/change/preview (NO idempotency) | built-v4 | :62 — cents preserved                                               |
| cancel_subscription                  | POST /v4/account/subscriptions/{id}/cancel (NO idempotency)         | built-v4 | :71                                                                 |
| list_subscription_scheduled_changes  | GET /v4/account/subscriptions/{id}/scheduled_changes                | built-v4 | :88 — no request-side pagination forwarded                          |
| get_subscription_scheduled_change    | GET .../scheduled_changes/{scid}                                    | built-v4 | :96                                                                 |
| delete_subscription_scheduled_change | DELETE .../scheduled_changes/{scid}                                 | built-v4 | :104 — 204 handled, synthetic `{id}` return                         |

## Service Orders — v4 layer built at `src/services/v2/service-orders-v4/*` (legacy below coexists at `src/services/v2/service-orders/*`)

| operationId                        | method + path                                                  | status       | notes                                                                                                               |
| ---------------------------------- | -------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------- |
| list_service_orders                | GET /v4/account/service_orders                                 | old-contract | on `/edge_api/v4/service_orders`; envelope already v4-shaped (base-path swap)                                       |
| create_service_order               | POST /v4/account/service_orders                                | old-contract | sends `plan_pricing_id` (gone in v4), no `tos_acceptance`, no idempotency-key; self-service moves to /subscriptions |
| get_current_service_order          | GET /v4/account/service_orders/current                         | old-contract | 409 ambiguous-context not handled                                                                                   |
| get_service_order                  | GET /v4/account/service_orders/{id}                            | old-contract | adapter emits priceId/downgradePending/clientSecret with no v4 SO counterpart                                       |
| update_service_order               | PATCH /v4/account/service_orders/{id}                          | old-contract | HARD semantics break — v4 accepts only `order_number`; impl PATCHes plan fields                                     |
| list_service_order_actions         | GET /v4/account/service_orders/{id}/actions                    | not-built    | net-new                                                                                                             |
| create_service_order_action        | POST /v4/account/service_orders/{id}/actions (Idempotency-Key) | not-built    | net-new; strategy→action_type mapping absent                                                                        |
| list_service_order_subscriptions   | GET /v4/account/service_orders/{id}/subscriptions              | not-built    | net-new                                                                                                             |
| cancel_service_order               | POST /v4/account/service_orders/{id}/cancel                    | old-contract | legacy transition response                                                                                          |
| _list_plans (legacy)_              | GET /edge_api/.../plans                                        | old-contract | NO v4 equivalent — catalog is billing-engine PriceTable                                                             |
| _get_current_plan (legacy)_        | GET /edge_api/.../plans/current                                | old-contract | NO v4 equivalent                                                                                                    |
| _prepare_signup_checkout (legacy)_ | POST /edge_api/.../signup/checkout/prepare                     | old-contract | superseded by POST /v4/account/subscriptions                                                                        |
| _upgrade (legacy)_                 | POST /edge_api/.../{id}/upgrade                                | old-contract | relocates to /subscriptions/{id}/change                                                                             |
| _downgrade (legacy)_               | POST /edge_api/.../{id}/downgrade                              | old-contract | relocates to /subscriptions/{id}/change when=period_end                                                             |
| _cancel_downgrade (legacy)_        | POST /edge_api/.../{id}/cancel_downgrade                       | old-contract | relocates to DELETE /subscriptions/{id}/scheduled_changes/{scid}                                                    |

## Invoices + Payments + Credits — v4 layers built at `invoices/*`, `payments/*`, `credits/*` (legacy Stripe/GraphQL/`payment` coexist below)

| operationId              | method + path                                       | status       | notes                                                                                          |
| ------------------------ | --------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------- |
| list_invoices            | GET /v4/account/billing/invoices                    | old-contract | `src/services/v2/billing/invoices-service.js` — `/edge_api` Stripe-list (limit/starting_after) |
| get_invoice              | GET /v4/account/billing/invoices/{id}               | old-contract | GraphQL billDetail                                                                             |
| list_invoice_lines       | GET .../invoices/{id}/lines                         | old-contract | GraphQL                                                                                        |
| get_invoice_pdf          | GET .../invoices/{id}/pdf                           | old-contract | client-built URL + Stripe `invoice_pdf`                                                        |
| list_invoice_settlements | GET .../invoices/{id}/settlements                   | not-built    | net-new                                                                                        |
| pay_invoice              | POST .../invoices/{id}/pay (idempotent)             | not-built    | net-new                                                                                        |
| list_payments            | GET /v4/account/payments                            | old-contract | legacy `v4/payments/history` + GraphQL accountingDetail                                        |
| get_payment              | GET /v4/account/payments/{id}                       | not-built    | net-new                                                                                        |
| list_payment_refunds     | GET /v4/account/payments/{id}/refunds               | not-built    | net-new                                                                                        |
| create_payment_refund    | POST /v4/account/payments/{id}/refunds (idempotent) | not-built    | net-new                                                                                        |
| get_credit_balance       | GET /v4/account/billing/balance                     | not-built    | net-new                                                                                        |
| list_credits             | GET /v4/account/billing/credits                     | not-built    | net-new                                                                                        |
| add_credit               | POST /v4/account/billing/credits                    | old-contract | legacy `v4/payments/credits`, body only `{amount}`                                             |

## Payment Methods — v4 layer built at `src/services/v2/billing-api/payment-methods/*` (legacy below coexists at `payment/*` + SO billing-PM)

| operationId                  | method + path                                         | status       | notes                                                                                                    |
| ---------------------------- | ----------------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------- |
| list_payment_methods         | GET /v4/account/payments/payment_methods (bare array) | old-contract | legacy `v4/payments/credit_cards` (paginated) + service-orders `.../billing/payment_methods` (enveloped) |
| get_payment_method           | GET .../payment_methods/{id}                          | old-contract | payment-service `getCreditCard`                                                                          |
| delete_payment_method        | DELETE .../payment_methods/{id}                       | old-contract | payment-service `deleteCreditCard`                                                                       |
| set_default_payment_method   | POST .../payment_methods/{id}/default                 | old-contract | service-orders `setDefaultPaymentMethod` → `.../set_default` (wrong path+name)                           |
| create_payment_setup_session | POST /v4/account/payments/payment_setup_sessions      | old-contract | service-orders `createPaymentMethodSetupIntent` → `.../setup_intents`; returns only `{client_secret}`    |

## Billing Accounts (payer) — v4 layer built at `src/services/v2/billing-api/billing-accounts/*` (base `/v4/billing_accounts`)

built-v4: `list/create/get_current/get/update_billing_account`, `list_billing_account_members` (bare array), `add/remove_billing_account_member`, `get_cost_breakdown`. `updateBillingAccount` carries the nested `address{...}` + `tax_id`. Not wired — legacy address still `PATCH /v4/iam/account` in consumers until cutover.

## Budget Alerts / Spend Limits (net-new) — all not-built

`/v4/account/billing/budget_alerts[/{id}]`, `/v4/account/billing/spend_limits[/{id}]` — zero grep hits.

## Webhooks / Commitments / Credit Limits / Internal — not-built

`ingest_webhook` (POST /webhooks/{provider}) and `intake_charge`/`intake_overage_notice` (/internal/**) are **out of frontend scope** (server-side / server-to-server). `webhook_endpoints`, `commitments`, `credit_limits` are Phase 2.

## Foundation & conventions (gap-analysis §5 step 1)

| item                                                             | status      | notes                                                                                                                                                                           |
| ---------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BaseService query primitives (`useQuery` + `useEnsureQueryData`) | built-v4    | baseService.js                                                                                                                                                                  |
| request body convention (`body` → axios `data`)                  | built-v4    | httpService.js                                                                                                                                                                  |
| custom headers (`config.headers`)                                | built-v4    | httpService.js / httpClient.js                                                                                                                                                  |
| idempotency-key helper                                           | built-v4    | utils/idempotency-key.js (not re-exported from utils/index.js)                                                                                                                  |
| JSON:API `vnd.api+json` error normalizer                         | **partial** | utils/errorHandler.js — generic `{errors:[]}` only; no code/title/status, no request_id, no content-type branch, pointer assumes `/data/<field>` not `/data/attributes/<field>` |
| `/v4/account` base surface                                       | built-v4    | vite proxy `/v4 → api.azion.com`; relative baseURLs resolve                                                                                                                     |
| retire `/edge_api` + GraphQL                                     | **partial** | GraphQL billing deleted; service-orders/invoices/payment REST still legacy                                                                                                      |
