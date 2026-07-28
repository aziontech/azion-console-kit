# billing-api v4 — READY integration surface (authoritative handoff)

Source: billing-api → console handoff artifact (scan of `main`, wired vs 501-stub) + the real billing-api OpenAPI **v1.0.0**. **This supersedes the DRAFT-contract understanding** in `billing-api-v4-openapi.reference.yaml` / `-contract-gap-analysis.md`: those describe the full 72-op contract; most of it is a 501 stub that only populates the OpenAPI/registry.

**Stage base for testing:** `https://billing-api-stage.azion.app` (prod `https://api.azion.com`). Testing needs a bearer token — see the billing flow doc §6 for copy-paste curl recipes.

**Real-contract corrections (v1.0.0) vs our earlier DRAFT-based layers:** `ScheduledChange.id`/`subscription_id`/`change.plan_id` are **UUID strings** (not int64); the real `Subscription` has **no `service_order_id`** (required: id, created_at, last_modified, last_editor, status, cancel_at_period_end); billing-account create must **omit `owner_account_id`** (from token); `PaymentSetupSession` = `{setup_session_id, client_secret, gateway}` under `{data}`. Amounts are integer cents.

## Golden rule

**The console integrates ONLY against READY (wired) operations.** Do NOT build a screen or a network call against a 501 op until it turns READY. Of 72 mapped ops: **23 READY**, **49 still 501**.

## READY — safe to integrate (console-relevant: ~20 ops)

### Subscriptions — plan change + scheduled downgrade ONLY. **`{id}` = the service_order UUID.**
| op | method + path | notes |
|---|---|---|
| preview change | `POST /v4/account/subscriptions/{id}/change/preview` | pro-rata preview (immediate_total, line_items, windows). **Declares 202 but RESPONDS 200 — treat as 200.** read-only |
| apply change | `POST /v4/account/subscriptions/{id}/change` | idempotent, 202. upgrade & monthly→annual immediate; downgrade & annual→monthly scheduled. `pending_transition` returned ONLY on scheduled changes. `free→paid` rejected here |
| list scheduled | `GET /v4/account/subscriptions/{id}/scheduled_changes` | pending end-of-cycle changes |
| get scheduled | `GET /v4/account/subscriptions/{id}/scheduled_changes/{scid}` | any status (scheduled/applied/cancelled) |
| cancel scheduled | `DELETE /v4/account/subscriptions/{id}/scheduled_changes/{scid}` | **responds 204** (contract says 200); applied/cancelled/unknown → 404 |

### Payment methods (wallet, read live from Stripe; ENG-46528 / PR #143)
| op | method + path | notes |
|---|---|---|
| list | `GET /v4/account/payments/payment_methods` | **D1: raw ARRAY, NOT the v4 envelope**; may emit header `X-Stale:true` on degraded read |
| setup session | `POST /v4/account/payments/payment_setup_sessions` | 201 single envelope; feeds Stripe Embedded Checkout/Elements `client_secret`. **body `type` is ignored — always a card SetupIntent.** works without a subscription |
| get | `GET /v4/account/payments/payment_methods/{id}` | 200 single; `{id}` is an opaque gateway ref; 404 if no gateway/ref |
| delete | `DELETE /v4/account/payments/payment_methods/{id}` | **responds 204** (contract 200); 409 if default/in-use |
| set default | `POST /v4/account/payments/payment_methods/{id}/default` | 202 single; empty or `{}` body |
> Auth caveat: `requirePublicAuth` in payment-methods is still a no-op stub; `account_id` comes from the token context.

### Payments (public read-only Charge ledger)
| op | method + path | notes |
|---|---|---|
| list | `GET /v4/account/payments` | v4 envelope; filters `invoice`, `status`; newest first |
| get | `GET /v4/account/payments/{id}` | drill-down with `attempts[]` (attempt_no, status, error_code, created_at) = dunning timeline; 404 if not account's |

### Credits (read-only)
| op | method + path | notes |
|---|---|---|
| balance | `GET /v4/account/billing/balance` | available credit (sum of live non-expired remaining_amount), fixed currency, single |
| statement | `GET /v4/account/billing/credits` | v4 list envelope, newest first, **only `page` + `page_size`**; entry types refund/incentive/adjustment/prepay/auto_recharge |
> Credit GRANT is NOT public (server-to-server `POST /internal/v1/credits`). Applying credit against invoice/usage is deferred.

### Billing accounts (the payer; phase-1 is 1:1)
| op | method + path | notes |
|---|---|---|
| list | `GET /v4/billing_accounts` | 0 or 1 in phase 1; scoped to token owner |
| create | `POST /v4/billing_accounts` | 201 v4 envelope; `currency, country, account_type, tax_id, legal_entity_name`; `owner_account_id` from auth; **409 if already exists**; no Embedded Checkout |
| current | `GET /v4/billing_accounts/current` | 1:1 alias for the context payer; **404 if not created → offer to create** |
| get | `GET /v4/billing_accounts/{id}` | `{id}` is the RESOURCE id, **NOT the IAM account id**; 404 if not caller's |
| patch | `PATCH /v4/billing_accounts/{id}` | strict schema, **only `tax_id` + `legal_entity_name`, ≥1 field**. `billing_emails`, `address`, `default_payment_method_id` are DEFERRED (do not send) |
| cost breakdown | `GET /v4/billing_accounts/{id}/cost_breakdown` | showback: sum of billable invoices in account currency; optional `period=YYYY-MM` (invalid → 400); phase-1 one line |

### Internal (server-to-server, shared secret — the console NEVER calls; effects surface on public screens)
`POST /internal/v1/charges` (+2) READY. The produced Invoice later appears on `GET /v4/account/billing/invoices` (once that turns READY).

## NOT READY — do NOT integrate (501)

- **Subscriptions:** `GET /subscriptions` (list), **`POST /subscriptions` (create — THE paid-signup blocker)**, `/current`, `GET /{id}`, `/{id}/versions`, `/{id}/cancel`. Live current state is still read from the **legacy `service_orders`** surface.
- **Signup paid end-to-end:** blocked solely by `POST /v4/account/subscriptions` (501). Ready today: payer pre-registration + card capture. Not ready: paid signup end-to-end.
- **Invoices:** ALL (list/get/lines/pdf/settlements/pay). Live equivalent is legacy `/service_orders/billing/invoices`. `POST /invoices/{id}/pay` (501) also blocks "pay now"/retry.
- **Payments refunds:** `GET/POST /payments/{id}/refunds` (admin/internal candidate).
- **Service Orders (new-model):** 0/9 wired. Terms change via `/actions`, not PATCH/upgrade/downgrade. New `ServiceOrder` schema does NOT expose `pending_transition` (the legacy `/current` does).
- **Commitments, credit_limits, members:** phase 2.
- **Budgets (spend_alerts + spend_limits):** 0/8.
- **Webhooks:** 0/5; real inbound served by legacy `/webhooks/stripe`.

## Implications for what was already built on this branch

Layers built against the DRAFT contract that target 501 ops (thus dead/duplicate for now): `service-orders-v4/*` (0/9 READY), `invoices/*` (0/6 READY), the `create/list/current/get/versions/cancel` methods in `subscriptions/*`, `payments/*` `refunds`, `credits/*` `addCredit`. Keep only what maps to READY ops; re-map subscription change/scheduled_changes onto the **service_order UUID** semantics and the 200/204 divergences.
