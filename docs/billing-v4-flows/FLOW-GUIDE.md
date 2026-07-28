# Billing v4 — Flow Guide (login → billing screen)

> **Scope.** How the console *should* talk to `billing-api` (v4) and to the identity/catalogue
> surfaces around it, designed from the contracts and from what is actually deployed — **not**
> from what the console does today. Today's console wiring is deliberately out of scope.
>
> **Sources of truth.** (1) *Spec — High Level Plans/Subscription/Billing* (Architecture
> Committee). (2) `billing-api (DRAFT skeleton)` OpenAPI — summaries/descriptions quoted below
> are verbatim from it. (3) `billing-api → console · handoff` (READY vs 501 per operation).
> (4) Live probe of the deployed hosts, **2026-07-27** (§9).

---

## 0. Status taxonomy

Every endpoint in this guide carries a flag. **A route answering `401` only proves it is
mounted — not that it is implemented.** The two axes are independent:

| Flag | Meaning | May the console call it? |
|---|---|---|
| 🟢 **READY** | Wired handler, real behaviour | Yes — build UI on it |
| 🟡 **STUB-501** | Route mounted, returns `501 Not Implemented` (exists only to populate the OpenAPI/contract registry) | No — but **use it in the design** and flag the dependency |
| 🔴 **ABSENT** | `404` on that host — not deployed there | No |

Rule of thumb from the handoff: *the console only integrates against READY operations.*
Where a flow **needs** a 501/absent operation, this guide still models it (the target design must
not be bent around a temporary gap) and marks it `⛔ BLOCKER` with the interim fallback, if any.

---

## 1. The layer map

```
┌─ identity / authorization ─────────────────────────────────────────────┐
│  Manager API        GET /api/account/info        who am I, account     │
│  (stage-api.azion.com)  GET /api/v3/contract/{client_id}/products      │
│                                                   support tier         │
└────────────────────────────────────────────────────────────────────────┘
┌─ catalogue (what is sellable) ─────────────────────────────────────────┐
│  products-api       GET /plans                   plan_id, sku, prices  │
└────────────────────────────────────────────────────────────────────────┘
┌─ billing-api (payer · entitlement · money) ────────────────────────────┐
│  /v4/billing_accounts…            the payer                            │
│  /v4/account/subscriptions…       the entitlement + lifecycle          │
│  /v4/account/payments…            charge ledger + card wallet          │
│  /v4/account/billing/…            balance, credits, invoices           │
└────────────────────────────────────────────────────────────────────────┘
┌─ gateway (executor only) ──────────────────────────────────────────────┐
│  Stripe Embedded Checkout / Elements — consumes client_secret only     │
└────────────────────────────────────────────────────────────────────────┘
```

Three invariants that drive every decision below:

1. **The gateway is an executor, not a source of truth.** Plan, price, subscription, invoice,
   charge and history are local to billing-api. Only the card PAN lives in the gateway vault; we
   hold a reference. The front-end never sees a PAN — it only ever receives a `client_secret`.
2. **Money is integer minor units (cents).** `amount: 2500` is `$25.00`. Never format server-side.
3. **The wire is `snake_case`; the app is `camelCase`.** Translation belongs in the adapter layer.

---

## 2. The conditionals — "does this account have a plan, and what kind of account is it?"

This is the question the whole post-login routing hangs on, and it is the **weakest point of the
current contract**: billing-api has no implemented endpoint that answers it.

### 2.1 Target design (one call, one answer)

```http
GET /v4/account/subscriptions/current
```
> *"Get the active subscription of the self-service context. ADR-13: 409 when the context
> resolves to more than one subscription."*

| Response | Meaning for the console |
|---|---|
| `200` + `Subscription` | Account **has** an entitlement → read `status`, `plan_id`, period, anniversary |
| `404` | No subscription → account never contracted → onboarding / plan picker |
| `409` | Ambiguous context (multi-subscription) → must filter via `GET /v4/account/subscriptions?...` |

Status flag: 🟡 **STUB-501** — mounted on stage (probe: `401` unauthenticated), absent on prod.
⛔ **BLOCKER.** Until it is wired, *nothing in billing-api* tells the console the current plan.

### 2.2 Interim answer (identity surface, not billing-api)

`GET /api/account/info` (Manager) carries the routing fields. **These are the only conditionals
available today.**

| Field | Values | What it decides |
|---|---|---|
| `kind` | `client` · `reseller` · `group` · `brand` | Only `client` is a self-service billable account. Everything else has no plan UI at all. |
| `billing_type` | `plan` · `internal` · `custom` · `null` | Which billing *experience* the account gets (§2.3) |
| `has_service_order_plan` | `true` / `false` | "Already contracted a plan" — the plan gate |
| `status` | `REGULAR` · `TRIAL` · `ONLINE` · `DEFAULTING` · `BLOCKED` | Account lifecycle / dunning state |
| `first_login` | `true` / `false` / absent | Whether onboarding still owes a step |
| `client_flags[]` | e.g. `allow_console`, `allow_only_metrics_on_console` | Feature gating (UI hiding only; authorization is 100% backend) |

**Do not confuse two different "account types":**

- `billing_type` (`plan`/`internal`/`custom`) — *how the account is billed.* This is the billing
  split. `internal` and `custom` are **managed** accounts: billing is operated by Azion, so the
  account must not see self-service plan changes.
- **Support/service tier** — `Developer` · `Business` · `Enterprise` · `Mission Critical`, derived
  from `GET /api/v3/contract/{client_id}/products` by inspecting product slugs
  (`plan_*`, `support_*`, `contract_*`). This is the **support** contract, *not* the commercial
  plan. It must never be used to answer "which plan is this account on". 🟢 live (Manager v3).
  ⚠️ This route needs a **versioned Accept header** — `Accept: application/json; version=3`.
  Plain `application/json` answers `406` (measured). `client_id` comes from `GET /api/user/me`.
- **Catalogue plan** — `hobby` · `pro` · `scale` · `enterprise`, from products-api `sku`. This is
  the commercial plan. `Enterprise` exists in *both* vocabularies with different meanings — keep
  them separate in code.

### 2.3 Decision matrix (post-login)

| `kind` | `billing_type` | has plan | Destination | Billing screen |
|---|---|---|---|---|
| `client` | `null` | – | Onboarding (plan picker) | Plans experience |
| `client` | `plan` | `false` | Onboarding (plan picker) | Plans experience |
| `client` | `plan` | `true` | Home | Plans experience |
| `client` | `internal` / `custom` | any | Home (managed onboarding: profile only, no plan picker, no checkout) | Managed/legacy screen — **no** self-service change |
| `reseller` / `group` / `brand` | any | any | Home | No plan UI |
| any | any | any + `status ∈ {BLOCKED, DEFAULTING}` | Dunning gate first | Payment-review state |

### 2.4 Gap to close in billing-api

The contract should expose the conditionals in the billing domain instead of leaning on Manager:

- Wire `GET /v4/account/subscriptions/current` (returns `status`, `plan_id`, period, anniversary,
  `cancel_at_period_end`) — replaces `has_service_order_plan`.
- Add `account_mode` / `billing_mode` to that payload — replaces `billing_type` for the
  managed-vs-self-service split. The high-level spec already models
  `Subscription.account_mode: plan|custom` and `billing_mode: prepaid|postpaid`; the DRAFT
  skeleton's `Subscription` schema **omits both**. That omission is why the console still needs
  Manager's `billing_type`.
- `pending_transition` (scheduled downgrade) is exposed by `POST …/change` but is **not** a field
  of the `Subscription` / `ServiceOrder` schema — so it cannot be read back on page load without
  `GET …/scheduled_changes`. Either add it to the subscription payload or accept the extra call
  (this guide accepts the extra call, §6.4).

---

## 3. Stage A — session

All calls carry the same credential. billing-api derives `account_id` from the token context —
never pass it in the body.

| Mode | Header | Notes |
|---|---|---|
| Browser / console | `Cookie: azsid=…` (prod) · `azsid_stg=…` (stage) | What the console uses; also what the `.http` files use |
| Machine / CI | `Authorization: Bearer <token>` | Contract security scheme `bearerAuth` |

Error envelope is JSON:API (`content-type: application/vnd.api+json`), **not** the v4 success
envelope:

```json
{ "errors": [ { "status": "401", "code": "10002", "title": "Not Authenticated",
  "detail": "Authentication credentials were not provided",
  "meta": { "request_id": "21004a5f-…" } } ] }
```

Always surface `meta.request_id` in error UI/logs — it is the only handle for support.

---

## 4. Stage B — the payer (billing account)

One payer per account in phase 1 (1:1). Create it **before** any money moves.

| # | Call | Flag | Contract description |
|---|---|---|---|
| B1 | `GET /v4/billing_accounts/current` | 🟢 READY | *"ADR-13: current is a self-service 1:1 alias; return 409 when the context resolves to more than one payer."* |
| B2 | `POST /v4/billing_accounts` | 🟢 READY | Creates the payer. `409` if one already exists |
| B3 | `GET /v4/billing_accounts` | 🟢 READY | List — phase 1 returns 0 or 1, scoped to the token owner |
| B4 | `GET /v4/billing_accounts/{id}` | 🟢 READY | `{id}` is the **resource id**, *not* the IAM account id |
| B5 | `PATCH /v4/billing_accounts/{id}` | 🟢 READY | Only `tax_id` and `legal_entity_name`. Strict schema, ≥1 field |
| B6 | `GET /v4/billing_accounts/{id}/cost_breakdown` | 🟢 READY | Showback per period `YYYY-MM`; invalid format → `400` |

**Usage rule.** Read with B1; on `404`, offer creation and call B2. Never call B2 speculatively —
it `409`s. `owner_account_id` comes from auth; sending a different one is not a supported path.

```http
POST /v4/billing_accounts
Content-Type: application/json

{ "owner_account_id": 9784, "currency": "USD", "country": "BR",
  "account_type": "self_serve", "tax_id": "…", "legal_entity_name": "…" }
```
`account_type`: `self_serve` (card/self-service) · `invoiced` (contract/NET, phase 2).

> `billing_emails`, `address` and `default_payment_method_id` are in the PATCH contract but
> deferred server-side — do not build forms for them yet.

---

## 5. Stage C — the catalogue

```http
GET https://stage-products-api.azion.net/plans      # prod: products-api.azion.net
```
🟡 Not publicly reachable yet (probe: `403` at the edge) — the console consumes a mock of the same
shape. Do **not** hardcode plan ids in UI logic; resolve by `sku`.

| Field | Use |
|---|---|
| `plan_id` | **UUID string** — the id you send to billing-api |
| `sku` | `hobby` · `pro` · `scale` · `enterprise` — the stable key for UI logic |
| `type` | `free` · `fixed_fee` — drives whether checkout is needed |
| `pricings[].periodicity` | **`monthly` · `yearly`** |
| `pricings[].price_value` | **major units** (e.g. `25`, `240`) |
| `fallback_plan_id` | The downgrade target (Pro → Hobby) — use it instead of hardcoding |
| `allow_self_service` · `is_public_catalog` | Only show plans where both are `true` |
| `requires_manual_approval` · `req_contract` · `whitelist_only` | Route to "talk to sales" instead of checkout |

### ⚠️ Two boundary translations (mandatory, and easy to get wrong)

1. **Period vocabulary.** products-api says `yearly`; billing-api says **`annual`**. Translate at
   the adapter boundary — do not rename either side.
   `monthly → monthly` · `yearly → annual`.
2. **Id type clash.** products-api `plan_id` is a **UUID string**. The billing-api DRAFT skeleton
   types `plan_id` as **`integer` int64**. These cannot both be right. Until resolved, treat
   `plan_id` as an **opaque token** — pass through what the catalogue gave you, never parse or
   `Number()` it. ⛔ Flag for the API owners.
3. **Money unit.** Catalogue prices are major units; billing-api amounts are cents. Multiply once,
   at the boundary.

---

## 6. Stage D — entitlement and lifecycle

### 6.1 Signup / first contract

| # | Call | Flag | Contract description |
|---|---|---|---|
| D1 | `POST /v4/account/subscriptions` | 🟡 STUB-501 ⛔ **BLOCKER** | *"Create a self-service subscription (implicit SO 1:1)"* — creates it `incomplete` and returns `payment.client_secret` on first payment |

```http
POST /v4/account/subscriptions
Idempotency-Key: <uuid>
Content-Type: application/json

{ "plan_id": "<catalogue plan_id>", "period": "monthly",
  "payment_method_id": 123, "tos_acceptance": { "version": "2026-01-01" } }
```
Response `201`: `{ "state": "executed", "data": { "subscription": {…},
"payment": { "client_secret": "…", "gateway": "stripe" } | null } }`

**This single 501 is what blocks paid signup end-to-end.** Everything around it is READY: the
payer creates (B2) and the card captures (E1). Free (Hobby) signup has the same blocker — there is
no other implemented way to mint a subscription in the new model.

Flow when it lands:

```
POST /v4/billing_accounts                    (if 404 on current)
POST /v4/account/payments/payment_setup_sessions   → client_secret  [paid only]
  → Stripe Embedded Checkout confirms the SetupIntent
POST /v4/account/subscriptions {plan_id, period, payment_method_id}
  → 201 subscription(incomplete) [+ payment.client_secret]
  → gateway webhook → billing-api activates → outbox → IAM provisioning
GET  /v4/account/subscriptions/current       → poll until status=active
```
Endpoints depending on async gateway confirmation may answer `202`; the console must **poll**,
never assume. A webhook never decides entitlement on its own.

### 6.2 Reading the current state

| # | Call | Flag | Contract description |
|---|---|---|---|
| D2 | `GET /v4/account/subscriptions/current` | 🟡 STUB-501 | Active subscription of the self-service context |
| D3 | `GET /v4/account/subscriptions` | 🟡 STUB-501 | *"List subscriptions"* — filters `billing_account`, `service_order`, `account`, `product`, `status` |
| D4 | `GET /v4/account/subscriptions/{id}` | 🟡 STUB-501 | Detail |
| D5 | `GET /v4/account/subscriptions/{id}/versions` | 🟡 STUB-501 | *"List effective term/price history"* — the audit trail of every plan/period/price change |

`Subscription.status`: `incomplete → active → past_due → suspended → cancelled`, plus
`active → cancelled` (`when=now|period_end`).

### 6.3 Changing the plan — the one lifecycle that is fully READY

| # | Call | Flag | Contract description |
|---|---|---|---|
| D6 | `POST /v4/account/subscriptions/{id}/change/preview` | 🟢 READY | *"Preview pro-rata for a change"* |
| D7 | `POST /v4/account/subscriptions/{id}/change` | 🟢 READY | *"Upgrade/downgrade/change periodicity. Local pro-rata (no gateway subscription). A new SubscriptionVersion + PlanTransition is recorded."* |

```http
POST /v4/account/subscriptions/{id}/change
Idempotency-Key: <uuid>

{ "plan_id": "<target>", "period": "monthly",
  "proration_behavior": "create_prorations", "when": "now" }
```
`proration_behavior`: `create_prorations` (default) · `none` · `always_invoice`.
`when`: `now` (default) · `period_end`.

**Timing matrix — decided by the server, not by the client:**

| Transition | Applies | Money |
|---|---|---|
| Hobby → Pro (upgrade) | immediately | pro-rata charge |
| monthly → annual | immediately | pro-rata credit for the unused month |
| Pro → Hobby (downgrade) | **scheduled** to period end | none now; `pending_transition` returned |
| annual → monthly | **scheduled** to period end | none now (refund only under explicit policy) |
| free → paid | **rejected here** — use D1 | – |

**Usage rules — these are the ones that bite:**

- ⚠️ **`{id}` in `change`, `change/preview` and all `scheduled_changes` routes is the
  `service_order` id, not the subscription id.** The route reads `subscriptions/{id}` but the
  wired handler keys on the service order. Until that is reconciled, resolve the SO id first and
  pass it here.
- Always `preview` before `change` and show `immediate_total` — the user must never be surprised
  by a pro-rata charge. `preview` is read-only and safe to call on every selection change.
- `change/preview` **declares `202` but answers `200`.** Treat `200` as success.
- Send `Idempotency-Key` on both — `change` can move money. Retrying with the same key must not
  double-charge.
- `change` answers `202 Accepted`: the transition may be `pending`. Read `pending_transition` from
  the response to render the scheduled-downgrade state without a second round-trip.
- A failed payment leaves the change `pending`/`failed` and **must not** alter entitlement.

`SubscriptionChangePreview` payload: `currency`, `immediate_total` (cents),
`proration_behavior`, `line_items[{description, amount}]`, `next_period_start`, `next_period_end`.

### 6.4 Scheduled changes (the downgrade lifecycle)

| # | Call | Flag | Contract description |
|---|---|---|---|
| D8 | `GET …/{id}/scheduled_changes` | 🟢 READY | *"List scheduled changes"* — what is pending for period end |
| D9 | `GET …/{id}/scheduled_changes/{sc_id}` | 🟢 READY | *"Get a scheduled change"* — any status: `scheduled` · `applied` · `cancelled` |
| D10 | `DELETE …/{id}/scheduled_changes/{sc_id}` | 🟢 READY | *"Cancel a scheduled change"* — "keep my current plan" |

`ScheduledChange`: `type: change|cancel`, `effective_at`, `status: scheduled|applied|cancelled`,
`change: { plan_id, period }`.

**Usage rules.**
- On every billing-screen load, call D8. It is the only way to survive a refresh with a pending
  downgrade banner (the subscription payload does not carry it — §2.4).
- D10 answers **`204`** (contract says `200`). Already applied / already cancelled / unknown →
  `404`. Map `404` to "this change is no longer cancellable", not to a generic error.
- Cancelling a scheduled change is **not** the same as cancelling the subscription (D11).

### 6.5 Cancellation

| # | Call | Flag | Contract description |
|---|---|---|---|
| D11 | `POST /v4/account/subscriptions/{id}/cancel` | 🟡 STUB-501 | *"Cancel a subscription (now \| period_end)"* — body `{ when, reason }`, default `period_end` |

⛔ No implemented cancellation path in the new model. `cancel_at_period_end` on the subscription is
the flag to render once it is wired. Re-subscribing after a closed cancellation creates a **new**
Subscription (per the high-level spec) — not a reactivation of the old one.

---

## 7. Stage E — the card wallet (Stripe Embedded Checkout)

The PAN never touches billing-api. Capture happens in the gateway against a `client_secret`.

| # | Call | Flag | Contract description |
|---|---|---|---|
| E1 | `POST /v4/account/payments/payment_setup_sessions` | 🟢 READY | *"Create a secure capture session"* → `{ setup_session_id, client_secret, gateway }`, `201` |
| E2 | `GET /v4/account/payments/payment_methods` | 🟢 READY | *"List payment methods"* — read live from the gateway, no local table |
| E3 | `GET /v4/account/payments/payment_methods/{id}` | 🟢 READY | *"Get a payment method"* — `brand`, `last4`, `exp_month/year`, `is_default` |
| E4 | `POST /v4/account/payments/payment_methods/{id}/default` | 🟢 READY | *"Set the default payment method"* — `202`, empty body or `{}` |
| E5 | `DELETE /v4/account/payments/payment_methods/{id}` | 🟢 READY | *"Remove a payment method"* — detaches at the gateway |

**Usage rules.**
- **E2 breaks the v4 envelope: it returns a raw array**, not `{count, results}`. Handle it as a
  special case in the adapter. It may also send `X-Stale: true` when the gateway read is degraded
  — show a soft "may be out of date" state, do not fail the screen.
- E1 ignores the `type` field in the body — it always creates a **card** SetupIntent. Do not build
  a payment-rail picker on it.
- E1 works with **no subscription** — it creates the gateway customer on demand. That is what makes
  "add a card before contracting" possible.
- E5 answers **`204`** (contract says `200`). The contract also lists `409` (default card or in
  use) — handle it as "make another card default first".
- `payment_method_id` is an **opaque gateway reference**. `404` if the account has no gateway
  customer or the ref does not exist.
- After the Embedded Checkout confirms, re-fetch E2 — the wallet is the gateway's state, not ours.

---

## 8. Stage F — composing the billing screen

Everything below is independent: **fan out in parallel**, degrade per card, never block the whole
screen on one failure.

| # | Call | Flag | Contract description |
|---|---|---|---|
| F1 | `GET /v4/account/billing/balance` | 🟢 READY | *"Get the credit balance"* — `available_amount` (cents), sum of live non-expired entries |
| F2 | `GET /v4/account/billing/credits` | 🟢 READY | *"List credit entries (statement)"* — paginated, newest first; only `page`/`page_size` |
| F3 | `GET /v4/account/payments` | 🟢 READY | *"List payments (charge ledger view)"* — filters `invoice`, `status`; v4 envelope |
| F4 | `GET /v4/account/payments/{id}` | 🟢 READY | *"Get a payment"* — includes `attempts[]` (`attempt_no`, `status`, `error_code`, `created_at`) = the dunning timeline |
| F5 | `GET /v4/billing_accounts/{id}/cost_breakdown?period=YYYY-MM` | 🟢 READY | *"Cost breakdown (showback per cost center)"* |
| F6 | `GET /v4/account/billing/invoices` | 🟡 STUB-501 | *"List invoices"* |
| F7 | `GET /v4/account/billing/invoices/{id}` · `/lines` · `/pdf` · `/settlements` | 🟡 STUB-501 | Detail, line items, PDF url, settlements |
| F8 | `POST /v4/account/billing/invoices/{id}/pay` | 🟡 STUB-501 ⛔ | *"Pay or retry an open invoice"* — the "pay now" button for `past_due` |

**Naming, per ADR-14.** `Charge` is internal; the public API calls it **Payment**. `Settlement` is
money actually applied and is read-only — never let a customer mutate it.
**Credit** is an internal balance, not a payment rail: it abates an invoice, it does not pay it.
Credit *granting* is server-to-server only (`POST /internal/v1/credits`) — never expose it.

`CreditEntry.type`: `incentive` · `refund` · `adjustment` · `prepay` · `auto_recharge`
(a downgrade credit shows up here as an "unused time" entry).

**Screen composition (target):**

```
identity ──▶ GET /api/account/info                    (gate: §2.3)
   │
   ├─▶ GET /v4/billing_accounts/current               → payer card   (404 ⇒ CTA "create")
   ├─▶ GET /v4/account/subscriptions/current          → plan card    🟡 blocker
   │     └─▶ GET …/{so_id}/scheduled_changes          → pending-downgrade banner
   ├─▶ GET /v4/account/payments/payment_methods       → wallet (raw array!)
   ├─▶ GET /v4/account/billing/balance                → credit card
   ├─▶ GET /v4/account/payments                       → payment history
   ├─▶ GET /v4/billing_accounts/{id}/cost_breakdown   → month-to-date cost
   └─▶ GET /v4/account/billing/invoices               → invoices     🟡 blocker
```

### Server-to-server (context only — the console never calls these)

`POST /internal/v1/charges` 🟢 · `POST /internal/v1/overage_notices` 🟢 ·
`POST /internal/v1/credits` 🟢 — shared-secret surface consumed by the billing engine. Their
effects surface in F1/F2/F3/F6. Knowing they exist explains why an invoice or credit can appear
without any console action.

---

## 9. What is actually deployed — probe, 2026-07-27

Unauthenticated GET; `401` = route mounted, `404` = not on that host. **`401` does not mean
implemented** (a 501 stub also answers `401` unauthenticated).

| Route family | stage `billing-api-stage.azion.app` | prod `jkjuyhi0gza.map.azionedge.net` |
|---|---|---|
| `/v4/billing_accounts` (+`current`, `{id}`, `cost_breakdown`) | `401` mounted | `404` |
| `/v4/account/subscriptions` (+`current`, `{id}`, `versions`, `scheduled_changes`) | `401` mounted | `404` |
| `/v4/account/payments` (+`{id}`, `payment_methods`, `payment_methods/{id}`) | `401` mounted | `404` |
| `/v4/account/billing/balance` · `credits` · `invoices` | `401` mounted | `404` |
| `/v4/account/service_orders` (new-model SO) | `404` | `404` |
| `/v4/service_orders` (legacy SO) | `404` **removed** | `401` mounted |

Consequences:

- **Only stage can exercise the new flow.** Prod still serves the *legacy* service-order surface
  and none of the v4 billing namespace.
- **`billing-api.azion.app` does not route to the service** — `404` on every path including `/`.
  Use the map domain for prod probing.
- Stage lost the legacy `/v4/service_orders` namespace entirely, so any interim fallback that
  leans on it is dead on stage. That is why §2.1's blocker matters *now* and not later.
- The new-model `/v4/account/service_orders` namespace is not deployed anywhere — so
  `ServiceOrder`/`OrderAction` (9 operations) cannot be part of any near-term flow.

---

## 10. Cross-cutting rules

**Idempotency.** `Idempotency-Key` on every POST that can move money: subscription create, change,
invoice pay, refund, credit. Generate one per user *intent* (not per retry) and reuse it across
retries of that intent.

**Envelopes.** Single: `{ "state": "executed", "data": {…} }`. List:
`{ count, total_pages, page, page_size, next, previous, results[] }`.
Known exceptions returning a **raw array**: `payment_methods` (list), `invoices/{id}/lines`,
`invoices/{id}/settlements`, `payments/{id}/refunds`, `spend_alerts`, `spend_limits`,
`budget_alerts`, `webhook_endpoints`, `credit_limits`, `members`.

**Pagination.** `page` (1-indexed, max 10000) + `page_size` (max 100). The spec mentions cursor
pagination (`starting_after`); the skeleton implements page-based. Follow the skeleton.

**Contract divergences to code against (observed > documented):**

| Operation | Contract says | Reality |
|---|---|---|
| `change/preview` | `202` | `200` |
| `DELETE scheduled_changes/{id}` | `200` | `204` |
| `DELETE payment_methods/{id}` | `200` | `204` |
| `GET payment_methods` | v4 envelope | raw array (+ maybe `X-Stale: true`) |
| `POST payment_setup_sessions` | honours `type` | ignores it; always card |
| `change` / `scheduled_changes` `{id}` | subscription id | **service_order id** |
| `plan_id` | `integer` int64 | UUID string in the catalogue |
| period enum | `monthly` / `annual` | catalogue says `yearly` |

**Never do.**
- Never treat a gateway webhook as the source of entitlement.
- Never let a refund revert a plan on its own — only with correlated metadata that still matches
  the current transition.
- Never build UI against a 🟡 STUB-501 operation; model the flow, ship the fallback, flag the gap.
- Never send `account_id` in a body to select the account — it comes from the token.

---

## 11. Blocker ledger (ordered by what unblocks the console most)

| # | Missing | Blocks |
|---|---|---|
| 1 | `POST /v4/account/subscriptions` | **Paid *and* free signup end-to-end.** Nothing else can mint a subscription |
| 2 | `GET /v4/account/subscriptions/current` (+ `account_mode`/`billing_mode` in the payload) | The conditionals: "has a plan?", "which plan?", "managed or self-service?" |
| 3 | `GET /v4/account/subscriptions` · `{id}` · `versions` · `cancel` | Plan card detail, change history, cancellation |
| 4 | Invoices (list · detail · lines · pdf · settlements · **pay**) | Invoice tab and the `past_due` recovery path |
| 5 | `plan_id` type + period vocabulary reconciliation | Any real catalogue → billing-api call |
| 6 | `{id}` semantics in `change`/`scheduled_changes` (SO vs subscription) | Correct wiring of the only READY lifecycle |
| 7 | `pending_transition` on the subscription payload | One fewer request per screen load |
| 8 | products-api `/plans` public availability | Plan names, prices and cycles (mocked today) |

---

## 12. Runnable scenarios

`./http/` contains one file per scenario, cookie-authenticated, in journey order.

> **Not versioned.** The `.http` collection is deliberately kept out of the repository: the files
> are cookie-authenticated and carry a real stage session while in use. Ask a teammate for a copy,
> or rebuild them from the request tables in this guide. Point `AZION_COOKIE` at your own
> `azsid_stg` and never paste the value into a committed file.

| File | Scenario |
|---|---|
| `00-identity-conditionals.http` | Session check + every conditional field, and what each decides |
| `01-signup-new-account-to-hobby.http` | New account → payer → Hobby |
| `02-billing-screen-load.http` | The full parallel fan-out of the billing screen |
| `03-upgrade-hobby-to-pro-monthly.http` | Preview → change → verify (immediate) |
| `04-downgrade-pro-to-hobby.http` | Preview → change → scheduled change created |
| `05-cancel-scheduled-downgrade.http` | List → get → DELETE → verify plan preserved |
| `06-upgrade-pro-monthly-to-annual.http` | Period change (immediate, with credit) |
| `07-payment-methods-wallet.http` | Setup session → list → detail → default → remove |
| `08-cancel-subscription.http` | `period_end` and `now` |
| `09-credits-and-history.http` | Balance, statement, payments, dunning `attempts[]`, showback |

See `http/README.md` for setup (cookie via `.env`) and the expected status of each request.
