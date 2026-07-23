# Contract gap analysis — console-kit (PLANS branch) vs billing-api v4 (ENG-46458)

Branch analyzed: `feat/plans-experience` (worktree). Spec: `docs/billing-api-v4-openapi.reference.yaml`.
Scope: how the current console-kit billing/service-order/subscription/payment contracts differ from the new **billing-api v4** DRAFT skeleton, so we know what the frontend adapters/services must change once the API lands.

> TL;DR: the new API is a **structural rewrite**, not a field tweak. Three big shifts:
> 1. **Paths move** from `/edge_api/v4/service_orders/**` + `/v4/payments/**` + GraphQL → a single `/v4/account/**` REST surface on `api.azion.com` (+ payer profile at `/v4/billing_accounts/**`).
> 2. **Subscription becomes a first-class resource**, split from ServiceOrder. Plan change / cancel / preview move to `/subscriptions/**`; SO keeps only the commercial agreement + `/actions`.
> 3. **Money is integer cents everywhere**, `plan_pricing_id` disappears (replaced by `period` + price snapshots), and several enums are renamed (`yearly→annual`, `CANCELED→cancelled`, …).

---

## 1. Endpoint mapping (current → v4)

| Domain | Current console-kit | billing-api v4 | Status |
|---|---|---|---|
| List plans | `GET /edge_api/v4/service_orders/plans` | *(none — no plan catalog endpoint; plans referenced by `plan_id`, catalog is billing-engine PriceTable)* | ❌ removed |
| Current plan | `GET /edge_api/v4/service_orders/plans/current` | *(none)* | ❌ removed |
| List SOs | `GET /edge_api/v4/service_orders` | `GET /v4/account/service_orders` | ⚠️ path |
| Get SO | `GET /edge_api/v4/service_orders/{id}` | `GET /v4/account/service_orders/{id}` | ⚠️ path |
| Current SO | `GET /edge_api/v4/service_orders/current` | `GET /v4/account/service_orders/current` | ⚠️ path |
| Create SO | `POST /edge_api/v4/service_orders` | `POST /v4/account/service_orders` (admin/sales) **or** `POST /v4/account/subscriptions` (self-service) | ⚠️ path+semantics |
| Update SO | `PATCH /edge_api/v4/service_orders/{id}` (sends `plan_id`,`plan_pricing_id`) | `PATCH /v4/account/service_orders/{id}` (**only `order_number`**) | ❌ semantics changed |
| Signup checkout | `POST /edge_api/v4/service_orders/signup/checkout/prepare` | *(none — use `POST /v4/account/subscriptions`)* | ❌ removed |
| Upgrade | `POST /edge_api/v4/service_orders/{id}/upgrade` | `POST /v4/account/subscriptions/{id}/change` | 🔀 moved to subscriptions |
| Downgrade | `POST /edge_api/v4/service_orders/{id}/downgrade` | `POST /v4/account/subscriptions/{id}/change` (`when:period_end`) | 🔀 moved |
| Cancel downgrade | `POST /edge_api/v4/service_orders/{id}/cancel_downgrade` | `DELETE /v4/account/subscriptions/{id}/scheduled_changes/{scid}` | 🔀 moved |
| Cancel SO | `POST /edge_api/v4/service_orders/{id}/cancel` | `POST /v4/account/service_orders/{id}/cancel` **and/or** `POST /v4/account/subscriptions/{id}/cancel` | ⚠️ split |
| Change preview | *(none — read `proration.amount_due` off upgrade resp)* | `POST /v4/account/subscriptions/{id}/change/preview` | ➕ new |
| Subscriptions | *(none — SO doubles as entitlement)* | `GET /v4/account/subscriptions`, `/current`, `/{id}`, `/{id}/versions`, `/{id}/scheduled_changes` | ➕ new resource |
| SO amendments | *(none)* | `GET/POST /v4/account/service_orders/{id}/actions` | ➕ new |
| Billing payment methods | `GET /edge_api/v4/service_orders/billing/payment_methods` | `GET /v4/account/payments/payment_methods` (**bare array**) | ⚠️ path+shape |
| Legacy credit cards | `GET/POST/PATCH/DELETE /v4/payments/credit_cards[/{id}]` | `GET /v4/account/payments/payment_methods` + `DELETE /{id}` | 🔀 consolidated |
| Setup intent | `POST /edge_api/v4/service_orders/billing/payment_methods/setup_intents` → `{client_secret}` | `POST /v4/account/payments/payment_setup_sessions` → `{setup_session_id, client_secret, gateway}` | ⚠️ path+shape |
| Set default PM | `POST /edge_api/v4/service_orders/billing/payment_methods/{id}/set_default` | `POST /v4/account/payments/payment_methods/{id}/default` | ⚠️ path |
| Default card | `GET /v4/payments/credit_cards?is_default=True` | `GET /v4/account/payments/payment_methods` → filter `is_default` | 🔀 client-side filter |
| Invoices list | `GET /edge_api/v4/service_orders/billing/invoices?limit&starting_after` (Stripe list) | `GET /v4/account/billing/invoices?page&page_size&status&period` (Azion paginated) | ❌ envelope+params |
| Invoice detail | *(GraphQL `billDetail`)* | `GET /v4/account/billing/invoices/{id}` | 🔀 REST |
| Invoice lines | *(GraphQL `list-service-and-products-changes`)* | `GET /v4/account/billing/invoices/{id}/lines` (bare array) | 🔀 REST |
| Invoice PDF | `getLinkDownloadInvoice(...)` (client-built URL) / `invoice_pdf` | `GET /v4/account/billing/invoices/{id}/pdf` → `{pdf_url}` | ⚠️ new endpoint |
| Invoice settlements | *(none)* | `GET /v4/account/billing/invoices/{id}/settlements` | ➕ new |
| Pay invoice | *(none)* | `POST /v4/account/billing/invoices/{id}/pay` | ➕ new |
| Payment history | `GET /v4/payments/history` + GraphQL `accountingDetail` | `GET /v4/account/payments` (charge ledger) | 🔀 REST |
| Payment detail / refunds | *(none)* | `GET /v4/account/payments/{id}` `/refunds` | ➕ new |
| Add credit | `POST /v4/payments/credits {amount}` | `POST /v4/account/billing/credits {amount,type,...}` (admin) | ⚠️ path+body |
| Credit balance | *(none)* | `GET /v4/account/billing/balance` → `{available_amount}` | ➕ new |
| Credit ledger | *(none)* | `GET /v4/account/billing/credits` | ➕ new |
| Client debt / your plan | GraphQL `paymentsClientDebt` (`load-your-service-plan-service`) | *(none — superseded by balance/invoices)* | ❌ removed |
| Consumption breakdown | GraphQL `billDetail` / `accountingDetail` (`list-service-and-products-changes*`) | *(none in this API — separate consumption/accounting surface)* | ⚠️ out of scope |
| Billing address | `PATCH /v4/iam/account {postal_code,country,...}` | `PATCH /v4/billing_accounts/{id} {address:{...}, tax_id, ...}` | 🔀 moved to payer |
| Payer profile | *(none — implicit via account)* | `/v4/billing_accounts`, `/current`, `/{id}` | ➕ new resource |
| Budget alerts / spend limits | *(none)* | `/v4/account/billing/{budget_alerts,spend_limits}` | ➕ new |

Legend: ⚠️ same concept, breaking path/shape · 🔀 relocated/consolidated · ➕ net-new · ❌ removed/no equivalent.

---

## 2. Cross-cutting breaking changes

### 2.1 Base host / proxy
- Current SO+invoices+billing-PM calls go through the **edge map** (`/edge_api/**` → `*.map.azionedge.net/v4/service_orders/**`); legacy payments through `api.azion.com/v4/payments/**`; consumption through GraphQL (`/v4/billing/graphql`, `/v4/accounting/graphql`).
- v4 is a single REST surface on `https://api.azion.com` under `/v4/account/**` and `/v4/billing_accounts/**`. **The `/edge_api` proxy hop and both GraphQL endpoints go away** for these flows. `vite.config.js` proxy + `make-*-base-url` helpers need rework.

### 2.2 Response envelope
- v4 single-resource: `{ state: "executed", data: <Resource> }` — **the SO service already assumes this** (`transformDetailResponse`/`transformSingleResponse` read `data`+`state`). ✅ mostly compatible.
- v4 lists: Azion paginated `{ count, total_pages, page, page_size, next, previous, results }` — SO list already reads `results`+pagination. ✅
- **BUT bare-array lists** (no envelope) for: `payment_methods`, `invoice lines`, `settlements`, `refunds`, `budget_alerts`, `spend_limits`. Current `getBillingPaymentMethods` reads `data.payment_methods[]` inside an envelope → must change to a bare array.
- **Invoices are the biggest envelope break**: current `invoices-service` reads a **Stripe list** (`data[]`,`has_more`,`next_starting_after`,`stale`) with `limit`/`starting_after` cursor paging. v4 uses **page/page_size** paginated `results[]` of the Azion `Invoice` schema. `invoices-adapter` must be rewritten.

### 2.3 Money units
- v4: **integer minor units (cents) everywhere** (`amount`, `total`, `immediate_total`, `recurring_fee_snapshot`, `committed_amount`, `available_amount`, `threshold_amount`, …).
- Current is **split**: SO `pricing.price_value` and all GraphQL billing amounts are **decimal**; Stripe invoices are already **cents (÷100)**. → adapters that treat `priceValue`/`totalValue` as decimals (`useCurrentSubscription`, `subscription-helpers.toFiniteNumber`, invoice formatting) must switch to cents math. Currency stays ISO-4217.

### 2.4 Enum renames / casing (will silently break comparisons)
| Concept | Current | v4 |
|---|---|---|
| Period | `monthly` / **`yearly`** | `monthly` / **`annual`** |
| SO status | `DRAFT ACTIVE PAST_DUE BLOCKED CANCELED EXPIRED` (UPPER) | `draft active cancelled expired` (lower, **`cancelled`** 2×l) |
| Subscription status | *(n/a — SO reused)* | `incomplete active past_due suspended cancelled` |
| Billing mode | *(implicit `data.mode`)* | `prepaid` / `postpaid` (explicit `billing_mode`) |
| Plan SKU | `hobby` / `pro` (client slug) | *(no SKU in API — `plan_id` int64)* |
| SO submit actions (client) | `create patch upgrade noop` | maps to SO `action_type`: `create change renew cancel commitment_change` |

`SO_STATUS`, `SO_ENTITLED_STATUSES`, `usePlans.VALID_BILLING_CYCLES`, periodicity lookups in `usePlansService`, and `useCurrentSubscription` sku/cycle logic all hardcode the current spellings.

### 2.5 Plan / pricing identity
- Current: `plan_id` **+ `plan_pricing_id`** (a.k.a. `priceId`), plan matched by **`sku`**, price by **`periodicity`**; `getPlanPricingId` returns the pricing `id`.
- v4: `plan_id` **+ `period`** only. **`plan_pricing_id` does not exist.** Recurring price is a server snapshot (`recurring_fee_snapshot` + `price_table_ref`). → every payload builder (`toCreatePayload`, `toPlanChangePayload`), `getPlanPricingId`, and the whole `usePlansService` pricing lookup collapse to `{plan_id, period}`. The `/plans` catalog fetch has no v4 endpoint (plan metadata must come from elsewhere).

### 2.6 ToS acceptance (aligns with cherry-picked PR #3610)
- v4 `POST /subscriptions` and `POST /service_orders` accept `tos_acceptance` (`{version[, accepted_at, ip]}`). The terms-acceptance checkbox added by #3610 (`terms-acceptance-block.vue`) is the UI half — but the current create payloads (`{plan_id, plan_pricing_id}`) **do not send `tos_acceptance`**. Add it to the create/subscribe payload when wiring v4.

### 2.7 Idempotency
- v4 requires an `idempotency-key` header on `create_subscription`, `change_subscription`, `pay_invoice`, `create_payment_refund`, `create_service_order_action`. Current services send **none**. Need a key generator on those mutations.

### 2.8 Errors
- v4 errors: `application/vnd.api+json` JSON:API `{errors:[{status,code,title,detail,source,meta.request_id}]}`. Current code only special-cases 404→null (SO current/plan) and maps legacy status→string messages. Error parsing/normalization should be centralized for the JSON:API shape.

---

## 3. Resource-by-resource field deltas (high-value)

**ServiceOrder** — v4 adds `order_number`, `billing_mode`, `period`, `price_table_ref`, `commercial_items[]` (`product_id, plan_id, quantity, subscription_id`), `tos_acceptance`, `contract{...}`. Current adapter emits `serviceOrderId, planId, priceId, status, startDate/endDate, currentPeriodStart/End, autoRenew, downgradePending, invoiceAmountCharged, clientSecret, checkoutSessionId`. → `priceId`, `downgradePending`, `invoiceAmountCharged`, `clientSecret` have **no v4 counterpart on SO**; period/plan changes and payment intents now live on **Subscription**/**Payment**.

**Subscription (new)** — `{id, service_order_id, current_version_id, status, current_period_start/end, anniversary_day, cancel_at_period_end}`; history via `SubscriptionVersion` (`plan_id, period, billing_mode, recurring_fee_snapshot, price_table_ref, effective_from/to`); pending changes via `ScheduledChange` (`type: change|cancel, effective_at, status, change:{plan_id, period}`). The console's `downgradePending`/`deriveDowngradePending` heuristic (reading `pending_transition`/`downgrade_pending`/`metadata`) is replaced by **`scheduled_changes`**.

**SubscriptionCreateResponse** — `{ subscription, payment:{ client_secret, gateway } }`. This is the v4 equivalent of today's `signup/checkout/prepare` + `resolvePaymentFromResponse` client-secret hunt. The multi-key/multi-container secret resolver (`stripe-payment-resolver.js`) can be simplified to `data.payment.client_secret`.

**PaymentMethod** — v4 `{id, account_id, type(card/wallet/pix/boleto/…), gateway, payment_method_ref, brand, last4, exp_month, exp_year, is_default, status(active/inactive/expired/pending)}`. Current billing-PM shape (`funding, country, customer_email/name, billing_address, stale`) and legacy `card_*` fields (`card_last_4_digits, card_brand, card_holder, card_expiration_month/year`) both differ — unify on the v4 field names. `set_default`→`default`, `setup_intents`→`payment_setup_sessions`.

**Invoice** — v4 `{id, account_id, bill_refs[], amount(cents), currency, status(open/paid/partially_paid/void/uncollectible), billing_mode, due_date, issued_at, net_terms_days, pdf_url, line_items_snapshot[InvoiceLineItem]}`. Current reads Stripe fields (`number, invoice_pdf, hosted_invoice_url, amount_paid, total, period_end, created`, Stripe status). Status map, amount (÷100 already), and date handling (unix-seconds → ISO string) all change. PDF via dedicated endpoint.

**Payment (new)** — charge ledger `{id, invoice_id, amount, currency, payment_method_id, gateway, gateway_charge_ref, status(pending/processing/succeeded/failed/disputed/refunded), attempts[]}`; refunds `{amount, reason, status}`. Replaces today's `/v4/payments/history` rows (`amount_with_currency` preformatted string, `payment_intent_id`, `invoice_number`).

**CreditBalance / CreditEntry (new)** — balance `{available_amount(cents), currency}`; ledger entry `{amount, remaining_amount, type(incentive/refund/adjustment/prepay/auto_recharge), source_ref, expires_at}`. Current only has fire-and-forget `POST /v4/payments/credits {amount}`.

**BillingAccount (new payer)** — `{owner_account_id, currency, country, tax_id, account_type(self_serve/invoiced), legal_entity_name, status, gateway_customer_ref, default_payment_method_id}`; address updated via `PATCH /v4/billing_accounts/{id}`. Today address is `PATCH /v4/iam/account`.

---

## 4. What already lines up (low/no change)
- SO **single** + **list** envelope (`{state,data}` / `{results,count,total_pages,page,page_size,next,previous}`) — the SO service/adapter already speak this. Mostly a base-path swap.
- Stripe.js loader (`get-stripe-client-service`) is client-side and gateway-agnostic; `payment.gateway` in v4 responses lets us stay multi-gateway. No change needed for `@stripe/stripe-js/pure` usage (note: this branch pins `9.4.0`).
- The `/current` singleton pattern (SO/subscription/billing-account) matches the console's `getCurrent*` calls (just watch the **409 ambiguous** case — currently only 404 is handled).

---

## 5. Suggested migration order (when the API is real)
1. **Foundation**: new `/v4/account` base + JSON:API error normalizer + `idempotency-key` helper; retire `/edge_api` + GraphQL for these flows.
2. **Plans/pricing**: replace `plan_pricing_id`/`periodicity(yearly)` with `plan_id`+`period(annual)`; source plan catalog from wherever it now lives (no `/plans`).
3. **Subscriptions**: introduce the Subscription resource + adapter; move upgrade/downgrade/cancel/preview off `/service_orders/*` onto `/subscriptions/{id}/change[/preview]|cancel` and `scheduled_changes`.
4. **Create/checkout**: `POST /v4/account/subscriptions` (with `tos_acceptance` from #3610) replacing `signup/checkout/prepare`; read `data.payment.client_secret`.
5. **Payment methods**: repoint to `/v4/account/payments/payment_methods` (bare array), `payment_setup_sessions`, `/{id}/default`; unify card fields.
6. **Invoices/payments/credits**: rewrite invoices adapter to the Azion `Invoice` schema + page paging; add `/pay`, `/lines`, `/pdf`, `/settlements`, payments ledger, `balance`/`credits`.
7. **Payer + address**: `PATCH /v4/billing_accounts/{id}` for address/tax; adopt `/current` payer.
8. Money → cents across all adapters; enum constants updated.

---

*Generated on the `feat/plans-experience` worktree; this doc is uncommitted. No source files were modified.*
