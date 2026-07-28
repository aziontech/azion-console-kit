# Billing — Master Spec & Workflow (console-kit)

> **Fresh AI session? Start here.** This is the single canonical entry point for anything billing/plans/subscription in this repo. It consolidates (1) the current implementation reality, (2) the authoritative Azion billing model from the Architecture Committee spec, (3) how the model maps to what's actually wired today, and (4) the decisions taken and why. Read **Part I** first (what's real now), then use the rest as reference.
>
> **How this doc references things:** by concept and by **searchable name** (env vars, store getters, helper/service names, doc titles) — never by fragile file paths, so nothing dead-ends if a file moves or is deleted. To locate something, grep for the name given. Companion docs live alongside this one in the docs area, findable by title/topic: the **billing flow doc** (onboarding→billing walkthrough + stage curl recipes), the **READY-surface doc** (the exact READY-vs-501 op list + divergences), the **coverage matrix**, and the **contract gap analysis**. If a companion is gone, this doc still stands on its own.

**Status:** Architecture Committee spec is *in review*. Phase 1 = Hobby/PRO (monthly/annual) + Enterprise on-demand. Everything else is **[Future]** framework, not delivered.

---

# PART I — Current reality in this repo (read first)

Branch: `feat/plans-experience`. Issue family: ENG-46458 (billing-api v4), ENG-37160 (plans experience).

## I.1 Golden rules (do not violate)

1. **The console integrates ONLY against READY (wired) billing-api ops.** 501 stubs exist only to populate the OpenAPI/registry — never build a screen or network call against them. (23 READY / 49 stub at handoff.)
2. **The gateway (Stripe) is an executor, not the source of truth.** Plan, price, subscription, invoice, charge, history are all local. The gateway only "charges X on card Y". The only thing that lives in the gateway vault is the card PAN — we store just a reference.
3. **Money is integer minor units (cents) everywhere.** Never `/100` in adapters; format only at render.
4. **Wire is snake_case; app contract is camelCase.** Adapters translate both ways with conditional-spread payloads (honor `additionalProperties:false`).
5. **Do NOT rewire consumers** onto the new layer until an endpoint is READY *and* a flow is cut over deliberately. The new layer ships unwired.
6. **Two billing UIs coexist, chosen by a flag** (see I.4). Keep both working; the legacy one must behave like `main`.

## I.2 The NEW billing-api v4 layer (what we built)

Isolated in a dedicated **`billing-api` namespace under the v2 services** (grep `services/v2/billing-api`; it carries a README explaining the new↔legacy boundary), deliberately grouped to stay separate from long-standing legacy services. Each resource is a `BaseService` subclass + pure adapter + frozen constants, trimmed to **READY ops only**, and **unwired**. Grep the singleton to find each:

| Resource (grep) | READY ops wired |
|---|---|
| `subscriptionsService` | `change`, `change/preview`, `scheduled_changes` (list/get/delete) — **`{id}` = service_order UUID today** |
| `paymentMethodsService` | list (raw array) · setup session · get · delete · set-default |
| `paymentsService` | list · get (`attempts[]` dunning) — read-only ledger |
| `creditsService` | balance · statement (list) — read-only |
| `billingAccountsService` | list/create/current/get/patch/cost_breakdown — **product-deferred ("não será feito agora"), kept as inert scaffolding** |

Foundation (grep the name): `generateIdempotencyKey` (UUID key for x-idempotent ops) and per-resource query-key domains. (A JSON:API `application/vnd.api+json` error normalizer is **not built** — deferred until error UX is wired; the app's generic error handler stays in use.)

**LEGACY (long-standing; to be retired as the new layer takes over — do NOT extend), by responsibility:** the GraphQL/REST billing services and the contract services; the legacy payments service (`/v4/payments/credit_cards|credits|history`); the `/edge_api/v4/service_orders` service (plans/checkout/upgrade/downgrade); and the Stripe-list invoices service (grep `billingGqlService`).

## I.3 What is NOT built (correctly absent)

Anything the handoff marks 501 or the spec marks **[Future]**: `POST /subscriptions` (create — **the paid-signup blocker**), subscription list/current/get/versions/cancel, invoices (all), payments refunds, service_orders (all 9), commitments, credit_limits, members/consolidation, spend_alerts/spend_limits, webhook endpoints, and the entire legal/agreement model (CustomerAgreement, TermsAndConditions, AgreementExecution…), SpendCommitment, CapacityReservation, postpaid/NET.

## I.4 The two billing experiences + the flag

`billing_type` (from Manager account info) → resolved by the helper **`resolveBillingType`** (grep it in the account service) with override precedence: **env `VITE_BILLING_TYPE_OVERRIDE` > localStorage `billing_type_override` > real value** (`"null"` string ⇒ null) → store getter **`billingExperience`** → the Billing screen gate component (grep the getter's usage in the Billing views) picks the screen:

| `billing_type` | `billingExperience` | Screen (grep the component name) |
|---|---|---|
| `custom` / `internal` | same | **OLD** tabbed billing — `LegacyBillingScreen` (Bills + Payment Methods tabs, add-card drawer, credit/TRIAL banner) — faithful to `main` |
| `plan` (default) | `plan` | **NEW** plans experience — `TabsView` (SubscriptionPlanCard, upgrade/downgrade, DrawerPlanInfo…) |
| `null` | `null` | redirect → onboarding (`additional-data` route) |

Switch for testing: set `VITE_BILLING_TYPE_OVERRIDE=internal|plan|null` in `.env`, or `localStorage.setItem('billing_type_override', …)` at runtime. The real account-type→experience mapping is a product decision still open; the override is the interim switch.

## I.5 The onboarding→billing flow that ships today

**Entirely legacy + client-side Stripe. Touches ZERO billing-api v4 ops. Paid signup works because it never calls the 501 create.** Path: signup (`signup-services`) → `accountGuard` reads `needsOnboarding` (`kind==='client' && billing_type===null && first_login!==false`) → `additional-data` → **plan catalogue now from products-api `/plans`** (prod `products-api.azion.net`, stage `stage-products-api.azion.net`; **mocked until that endpoint is live** — grep `productsPlansService` / `PLANS_MOCK_RESPONSE`, flip `USE_MOCK` to un-mock) → pro pre-checkout `POST /edge_api/v4/service_orders/signup/checkout/prepare` → Stripe `clientSecret` → client-side `stripe.confirmCheckoutSession()` → success → `home` → later `/billing` (the I.4 gate). Full step detail + sequence diagram are in the **billing flow doc**.

⚠️ **Backend-proxy risk:** if the legacy `signup/checkout/prepare` is ever re-pointed server-side at the 501 v4 create, paid signup breaks with no console change. Confirm before assuming stability.

## I.6 Testing

- **Two UIs (no token):** flip `VITE_BILLING_TYPE_OVERRIDE` and open `/billing`. Restart Vite after service moves (`rm -rf node_modules/.vite` if imports look stale).
- **READY API (needs a STAGE token — request one):** base `https://billing-api-stage.azion.app`; `export AZION_STAGE_TOKEN=…`; use the copy-paste curl recipes in the **billing flow doc** (read-only GETs first).
- **Unit:** `TZ=UTC VITE_DEBUG_LOGIN= npx vitest run` (the empty `VITE_DEBUG_LOGIN` mirrors CI; a local `.env` `VITE_DEBUG_LOGIN=true` makes the account-guard test fail locally only — not a regression).

---

# PART II — Authoritative model (Architecture Committee spec)

## II.1 Objective & premises

One billing engine serving every commercial model with the same code. **Phase 1 now:** Hobby & PRO (monthly/annual) — signup, upgrade, downgrade, period change, activation via IAM; Enterprise fully on-demand (no Support, Savings Plan, capacity reservation, or NET/postpaid). **[Future]:** Support/SLA, Savings Plan, capacity reservation, advanced enterprise support, custom terms (as ServiceOrders/addenda under the existing Subscription); consolidated billing (one payer aggregating accounts, AWS/GCP-style).

Premises:
- **Gateway is executor, not truth.** Plan/price/subscription/invoice/charge/history are local. Guarantees portability, bank reconciliation, resilience. Sole exception: card PAN in the gateway PCI vault; we keep only the reference.
- **Gateway has no Subscription/Plan/Price.** Plan lifecycle (upgrade/downgrade/pro-rata/periodicity) is internal.
- **billing-engine** (private, formerly `azion-billing`) computes Bill/overage/thresholds and calls billing-api internal endpoints. **billing-api** (public surface) emits Invoice/Charge, talks to Stripe/gateway, records Settlement/CreditEntry.
- **service-order-api → billing-api** (multi-domain service: public, private, webhook routes).
- **Every async event has an outbox.**
- **Account status is owned by IAM.** billing-api emits a delinquency event via outbox; IAM blocks/unblocks and fires the worker events that act on Resources.
- **Where things live:** `products-api` = what is sold; `billing-engine` = how much is owed and when a Bill/overage/threshold exists; `billing-api` = emits Invoice/Charge, talks to gateway, records who/how/when paid, Settlement, CreditEntry.

## II.2 Domains

| Domain | Responsibility | Public? |
|---|---|---|
| `products-api` | Catalog: Product, Plan, limits/service quotas, included allowances, recurring fee, allowed modes. (Today via generated JSON; out of scope.) | read public |
| `billing-engine` (`azion-billing`) | Price-table, consumption consolidation, immutable per-account Bill (rating). | private |
| `billing-api` (ex `service-order-api`) | Service Order, Subscription, SpendCommitment, CapacityReservation, Billing Account, payment methods, Invoice(+PDF), Charge ledger, Settlement, gateway adapter, reconciliation, outbox. | public |

Deaths/renames: `service-order-api`→`billing-api`; `payments-api` (cards/credits/history) → consolidated into billing-api, dedupe payment methods, remove; old PDF-only `billing-api` → dead (Invoice/PDF absorbed).

Structural decisions: billing-api is **one service** (internal Subscriptions + Payments modules — splitting would add synchronous calls on the critical path). Cards saved **only in the gateway** (persist the gateway's data in DB as reference). Cross-service latency only on write/lifecycle (signup, upgrade, anniversary); limit/quota enforcement reads local cache invalidated by event.

## II.3 Core concepts (glossary — market meaning · where it lives)

- **Product** — sellable unit (Delivery, WAF, Edge Functions). `products-api`.
- **Plan** — commercial package/rate plan: recurring fee + period + included allowances + service quotas + modes. No live mutable price. `products-api`.
- **Price/Rate** — immutable-per-version pricing rule (recurrence, tiers, unit, currency, tax behavior). `products-api`/`billing-engine`.
- **Limit** — technical/capacity ceiling; hit ⇒ denied (no charge). `products-api` + enforcement cache.
- **Quota** — measured allowance included in plan/contract; beyond ⇒ overage or block per policy. `products-api` + `billing-engine`.
- **Customer Agreement** — governing contract between SellerLegalEntity and CustomerLegalEntity (self-service = online clickwrap; future = MSA/e-sign). Incorporates base docs by reference (ToS/AUP/Privacy) but does **not** replace the separate acceptance of applicable TermsAndConditions.
- **TermsAndConditions** — offer/variant-specific terms (Azion Plans, Savings Plan, Capacity Reservation, incentive credits, marketplace, SO terms); require their own acceptance.
- **Service Order (SO)** — optional commercial addendum under a Subscription; future use for add-ons, support, Savings Plan, capacity reservation, custom terms. References CustomerAgreement; needs its own TermsAndConditions/Order Form when it has its own terms.
- **OrderAction/Amendment** — versioned action inside an SO: create, change, renew, cancel, commitment_change.
- **Subscription** — the live, stable subscription of the plan/account mode; controls plan, custom, period, status, anniversary, entitlement.
- **SubscriptionVersion** — immutable effective snapshot over time (incl. changes from SO/addendum).
- **SpendCommitment** — financial/spend commitment for a term in exchange for a discount (Savings Plan). Capacity is a separate CapacityReservation.
- **BudgetAlert** — spend visibility/governance; informative by default, optional action.
- **SpendLimit** — enforced spend cap; customer chooses block/pause/require-payment/manual-approval + notification.
- **OverageCeiling** — internal ceiling that triggers an intermediate invoice/charge to reduce credit risk.
- **Enterprise/on-demand** — paid usage without mandatory quota/commitment; the base Subscription, not an SO by itself.
- **Price-table** — versioned usage-cost composition (tiers, unit price); every commercial execution uses `price_table_ref{id,version}`.
- **Bill** — how much is owed, immutable, per account at the anniversary; always monthly regardless of payment cadence. `billing-engine`.
- **Invoice** — the billing document Azion issues to the payer; gateway only executes collection/settlement. `billing-api`.
- **PaymentMethod** — tokenized payment rail (card/wallet/PayPal/ACH/SEPA/PIX/boleto/wire…). `billing-api`.
- **Charge** — intent/attempt to collect via an automatic/gateway rail (public API calls it Payment). `billing-api`.
- **Settlement** — money actually received/applied (gateway/PIX/boleto/wire/bank/credit). `billing-api`.
- **Credit Balance / CreditEntry** — internal prepaid/credit balance; not an external payment method. `billing-engine`/`billing-api`.

## II.4 Limit ≠ Quota ≠ BudgetAlert ≠ SpendLimit (the enforcement decision)

- **Limit** — hit = denied (403/429), no charge. "Up to 10 edge applications."
- **Quota** — measured included allowance. Cross = overage charged (on-demand) or block per policy. "1 TB included; beyond = $X/GB."
- **BudgetAlert** — financial alert. Cross = notification (+ optional automated action). Does not promise a cap.
- **SpendLimit** — enforced financial cap. Cross = block / pause / advance charge / manual approval.

Rule: **crossing costs money → quota + overage; crossing is blocked → limit/service quota; crossing only alerts → budget alert.**

## II.5 One engine, all models (difference is data, not code)

| Axis | Prepaid + SpendLimit | On-demand | Postpaid w/ commitment |
|---|---|---|---|
| billing_mode | prepaid/postpaid/credits | postpaid/credits | postpaid |
| Agreement + T&C | clickwrap | clickwrap | signed MSA/contract |
| Service Order | not by default | optional for add-ons | explicit for commitments/addenda |
| Recurring fee | yes (plan) | zero | yes + committed |
| Included quotas | plan's | up to plan limit | plan + commitment |
| Overage | on-demand up to SpendLimit | is the main product | above quota/commitment (commitment_trueup) |
| SpendCommitment | no | no | yes (with discount) |
| Good-payer (advance) | yes (new accounts) | yes | no |
| Invoice settled by | Charge | Charge | finance/account manager |
| When it charges | anniversary + partial (ceiling) | anniversary + partial (ceiling) | committed + excess |
| Delinquency | dunning → suspend | dunning → suspend | finance/account manager |

## II.6 Subscription vs ServiceOrder — when to create each

**2026-07-02 decision: Subscription comes first; ServiceOrder only appears with an addendum, commitment, support, capacity reservation, marketplace, or independent commercial term.** Subscription = which plan/account mode is active and charging now. SO = which addendum/commitment/extra term was accepted.

**Decision table:**

| Event | New SO? | New Subscription? | New SubscriptionVersion? | Changes existing Subscription? | Recorded in |
|---|---|---|---|---|---|
| Self-service signup | no (default) | **yes** | yes | — | Subscription + CustomerAgreement exec + TermsAndConditions(azion_plans) exec |
| Upgrade/downgrade (incl. Pro↔Enterprise) | no | no | yes | yes (plan_id/price) | PlanTransition |
| Period change (monthly↔annual) self-service | no | no | yes | yes (period) | PlanTransition |
| Suspend/reactivate (delinquency) | no | no | no | yes (status) | Subscription status |
| Cancel + re-subscribe later | no (default) | **yes** | yes | — (old stays cancelled) | new Subscription + execs if versions require |
| [Future] independent add-on (support/SLA/marketplace/integration) | **yes** | no | yes if entitlement changes | yes if capability/benefit enabled | ServiceOrder + SubscriptionVersion |
| [Future] Savings Plan / capacity reservation / Spend Commitment | **yes** | no | yes if entitlement/price changes | yes (benefit/precedence) | ServiceOrder + SpendCommitment/CapacityReservation |
| Admin plan→custom | no | no | yes | yes (account_mode) | Admin override + SubscriptionVersion |
| prepaid→postpaid contract | yes (if term/addendum) | no | yes | yes (billing_mode, terms) | T&C/Order Form exec + SubscriptionVersion |
| Change payer (consolidation/reseller) | no | no | no | no | BillingLink |
| Change payment method | no | no | no | no | PaymentMethod |
| Change BudgetAlert / SpendLimit | no | no | no | no | BudgetAlert / SpendLimit |

**Plan-change matrix (minimum):** upgrade Hobby→PRO or Pro→Enterprise = immediate w/ proration/credit; downgrade PRO→Hobby or Enterprise→Pro = scheduled to period end by default; monthly→annual = may be immediate w/ credit/proration; annual→monthly = end of term by default (unless explicit refund policy); a change with a failed payment stays pending/failed and does not change entitlement without idempotent rollback; if CustomerAgreement or applicable TermsAndConditions requires (re)acceptance, the transition does not complete without a valid AgreementExecution for both scopes.

**Practical rules:** plan/period/account-mode changed (incl. Pro↔Enterprise) → same Subscription + new SubscriptionVersion + PlanTransition. Addendum/commitment/reservation/independent term → ServiceOrder under the Subscription (may create SpendCommitment/CapacityReservation/SubscriptionVersion). Simple catalog add-on with no independent term → SubscriptionItem/SubscriptionVersion (no SO). Payer changed → BillingLink. Custom/manual → admin override/account_mode on the Subscription (public API never offers custom as a choice).

## II.7 Legal model, acceptance & signature (§3.6)

Mandatory separation: **CustomerAgreement** = Contrato de Cliente/MSA governing the seller↔customer relationship; incorporates base docs by reference (incl. ToS). **TermsAndConditions** = offer/variant-specific document requiring its own acceptance. **LegalDocumentVersion** = each versioned public doc by URL. **AgreementExecution** = immutable proof of acceptance/signature. Subscription/ServiceOrder are **not** contracts — they reference these.

- **Phase 1:** signup of Hobby/PRO/Enterprise-on-demand creates the Subscription, creates/reuses `CustomerAgreement(type=customer_agreement_online)` + clickwrap `AgreementExecution`; also creates/uses `TermsAndConditions(type=azion_plans)` + a **separate** clickwrap execution (public_url, version, checksum). UX may show both acceptances on one screen but persistence must distinguish them. No ServiceOrder.
- **Future MSA:** signed contract → `CustomerAgreement(type=msa|enterprise_agreement)`; signature → `AgreementExecution(method=e_signature|signed_pdf)`; detail in AgreementExecutionDocument + AgreementSigner. Future SOs sit under the same CustomerAgreement and get their own terms/order-form executions.
- **Precedence:** Order Form/ServiceOrder wins for its specific item; MSA/CustomerAgreement governs the general relationship (incorporates base docs); specific TermsAndConditions govern their variant; SubscriptionVersion + price_table_ref govern the commercial/price snapshot. Never use one generic execution as the sole legal truth.

## II.8 Payment rails — rail ≠ contract ≠ collection (§3.8)

`PaymentMethod` authorizes/identifies a rail; `Charge` attempts to collect; `Settlement` proves money arrived; `CreditEntry` applies internal balance.

| Rail | Handling | Primary entity |
|---|---|---|
| Card, Apple/Google Pay, Link | token in gateway PCI vault; auto-charge; failure → dunning | PaymentMethod + Charge + Settlement |
| [Future] PayPal/wallet | external redirect/approval; settle via gateway | PaymentMethod + Charge + Settlement |
| [Future] ACH/SEPA/bank debit | async confirmation, late failure possible | PaymentMethod + Charge + webhook |
| [Future] PIX/boleto/wire/check | manual/offline; later reconciliation | Settlement (authoritative payment event) |
| Credits/prepay/auto-recharge | internal balance vs invoice/usage | CreditEntry/CreditBalance |
| Refund/dispute/chargeback | async reversible financial event | Refund + ChargeAttempt + WebhookEvent |

Consequence: gateway may hold Customer/PaymentMethod/PaymentIntent/Charge/Refund but not Plan/Price/Subscription. For PIX/boleto/wire the authoritative payment is the reconciled Settlement; for card/wallet the Charge records intent and Settlement records receipt.

## II.9 Main flows (§4)

**4.1 Signup self-service (prepaid).** `POST /v4/account/subscriptions {plan}` → create/use SellerLegalEntity + CustomerLegalEntity + BillingAccount (1:1 if absent) → create/use CustomerAgreement + clickwrap execution (incorporates base docs) → create/use TermsAndConditions(azion_plans) + separate clickwrap execution → create `Subscription(incomplete)` + SubscriptionVersion with both execution ids → gateway setup/payment intent when paid → on gateway confirm, billing-api activates the Subscription, records PaymentMethod/Charge/Settlement → outbox → IAM activates/provisions. **No ServiceOrder at simple signup.** Async-confirm endpoints may return `202 Accepted` + a status query. Later change to CustomerAgreement (incl. an incorporated doc like ToS) or applicable TermsAndConditions creates an `AgreementRequirement` and forces re-acceptance.

**4.2 Billing (anniversary, partial, good-payer).** Monthly: plan + cycle overage. Annual: annuity upfront; overage charged during the year, reconciled at renewal. **Good-payer/interim:** OverageCeiling starts at $500 and doubles per paid Charge ($500→$1k→$2k…) up to `max_overage_ceiling`/SpendLimit. Interim collection is always advance/credit: once paid it becomes `CreditEntry(type=prepay)` applied against the final anniversary invoice (the official cycle consolidation). **Failure does not raise the ceiling. Webhook never decides entitlement alone.** Idempotency: interim Bill/Charge and final invoice use `operation_key` per Subscription/cycle/threshold; `CreditEntry/prepay` prevents double economic charge; `billed_to_date/overage_cursor` prevents recomputing the same consumption window.

**4.3 [Future] Postpaid/contract.** Phase-1 Enterprise/on-demand stays a plan Subscription. NET/postpaid is future: Invoice with `due_date` → settled by reconciled Settlement; no auto-block (delinquency → finance/account manager event); SpendCommitment enters as discount/commitment and true-up (`commitment_trueup`) on the Bill.

**4.4 3-way reconciliation.** Charge ledger (intent) ↔ gateway (receipt via webhook/API) ↔ bank (statement). Webhook updates the ledger but is never the source of truth; if the webhook endpoint is down, the gateway retries and a periodic job reconciles by API/statement; divergence raises an operational alert.

**4.5 PDF generation.** On Invoice issue → outbox `generate_invoice_pdf` → worker composes (Invoice + line snapshot) → writes to bucket → sets `invoice.pdf_url`. Generate once, serve the URL.

## II.10 Canonical state machines (§6)

```
Subscription:
  incomplete -> active -> past_due -> suspended -> cancelled
  active -> pending_reacceptance -> active (accepted)
  pending_reacceptance -> suspended (deadline expired / freeze policy)
  active -> cancelled (when=now|period_end)
SubscriptionVersion: effective_from/effective_to; immutable; created on signup, upgrade, downgrade, Pro<->Enterprise, period change, account_mode/custom, admin_override
AgreementRequirement: pending -> satisfied|expired ; expired -> IAM freeze/block per access_freeze_policy
ServiceOrder: draft -> pending_acceptance -> active -> expired|cancelled (addendum state, not account operational state)
Charge: created -> processing -> succeeded|failed -> disputed|refunded
Invoice: open -> partially_paid -> paid | void | uncollectible
```
Rule: Subscription carries operational lifecycle + execution ids + AgreementRequirement ref. ServiceOrder carries the addendum lifecycle. Charge/Invoice/Settlement never change entitlement without explicit correlation, outbox, and idempotent rollback.

## II.11 Data model (§5, condensed)

Source of truth split: **Bill stays authoritative in billing-engine (the calculation); billing-api is the truth of invoicing/collection/settlement.** Commercial origin lives in BillLineItem/InvoiceLineItem (not the Bill header) to support multiple SOs/commitments/reservations on one invoice.

- **billing-engine (private):** `PriceTable`, `PriceTableItem`, `Bill{kind:cycle|interim, price_table_ref, recurring/usage/commitment_trueup amounts, status}`, `BillLineItem{type, source_type, source_id…}`, `OverageLedger{accrued_overage, overage_billed_to_date, overage_ceiling}`.
- **billing-api (public):** `SellerLegalEntity`, `CustomerLegalEntity`, `BillingAccount{owner_account_id, payer_legal_entity_id, seller_legal_entity_id, currency, country, account_type, status, gateway_customer_ref, default_payment_method_id}`, `BillingLink{consuming_account_id, billing_account_id, role}`, `LegalDocumentVersion`, `CustomerAgreement`, `TermsAndConditions`, `AgreementExecution`, `AgreementExecutionDocument`, `AgreementSigner`, `AgreementRequirement`, `Subscription{account_id, billing_account_id, customer_agreement_id, plan_id?, account_mode, current_version_id, status, billing_mode, current_period_*, anniversary_day, cancel_at_period_end, execution ids…}`, `ServiceOrder{subscription_id, customer_agreement_id, type, status, commercial_items[], terms/order-form exec ids?, price_table_ref?, commercial_terms?}`, `OrderAction`, `SubscriptionVersion`, `GoodPayerState{overage_ceiling, max_overage_ceiling, trust_tier}`, `SpendCommitment`, `CapacityReservation`, `CustomBillingOverride`, `BudgetAlert`, `SpendLimit`, `PaymentMethod{type, gateway, payment_method_ref, brand, last4, exp_*, is_default, status}` (reference only, never PAN), `Invoice{billing_account_id, bill_refs[], amount, currency, status, billing_mode, due_date, issued_at, net_terms_days?, pdf_url, line_items_snapshot[]}`, `InvoiceLineItem`, `Charge{invoice_id, amount, currency, payment_method_id?, idempotency_key, gateway, status}` (append-only ledger; public = Payment), `ChargeAttempt`, `Settlement{source, amount, received_at, status, reconciled}`, `Refund`, `CreditEntry{type:incentive|refund|adjustment|prepay|auto_recharge, amount, remaining_amount, source_*}`.
- **Reused infra:** `PlanTransition{from/to plan+version, transition_type, status, operation_key}`, `WebhookEvent{gateway_event_id UNIQUE, …}`, `Outbox{dedupe_key UNIQUE, status, lease_token, retry_count…}`.

## II.12 Endpoints (billing-api) (§7)

Surfaces: public (`/v4`, JWT/API key) · webhook (HMAC) · internal (`/internal/v1`, shared secret). Conventions: `/v4`; `Idempotency-Key` on every money-moving POST; cursor pagination; `?expand=`; errors `application/problem+json`; non-CRUD action = sub-resource with a verb.

- **Subscriptions (canonical for plan/account-mode):** `GET/POST /v4/account/subscriptions`, `GET /current` (409 if ambiguous), `GET /{id}`, `GET /{id}/versions`, `POST /{id}/change`, `POST /{id}/change/preview`, `POST /{id}/cancel` (`when=now|period_end`), `GET/DELETE /{id}/scheduled_changes[/{sc_id}]`.
- **Service Orders (addenda; future canonical):** `GET/POST /v4/account/service_orders`, `GET /v4/account/subscriptions/{id}/service_orders`, `GET/PATCH /{id}`, `GET/POST /{id}/actions`, `GET /{id}/terms`, `POST /{id}/cancel`.
- **Billing Accounts (payer) — [Não será feito agora]:** `GET/POST /v4/billing_accounts`, `GET /current`, `GET/PATCH /{id}`, `GET /{id}/cost_breakdown`, `GET/POST/DELETE /{id}/members` (phase 2).
- **Payment Methods · Invoices · Payments · Settlements · Credits · Budget Alerts:** `GET /v4/account/payments/payment_methods`, `POST` (capture client_secret), `GET/DELETE /{pm}`, `PUT/PATCH /{pm}` (default); `GET /v4/account/billing/invoices[?…]`, `GET /{id}(?format=json|pdf)`, `GET /{id}/settlements`, `POST /{id}/pay`; `GET /v4/account/payments[?…]` + `/{id}` (public Charge ledger); `GET /v4/account/billing/balance`; `GET/POST /v4/account/billing/credits`; `GET/POST/PATCH/DELETE /v4/account/billing/budget_alerts[/{id}]`. (Public `Payment` = customer-facing view of `Charge`; `Settlement` is read-only in invoice/payment detail.)

## II.13 Phase 1 scope vs Future (§3.7)

**Phase 1 delivers:** plan Subscription for Hobby & PRO (monthly/annual); Enterprise on-demand; upgrade/downgrade/period change via SubscriptionVersion/PlanTransition (incl. Pro↔Enterprise, same consuming account + base product); CustomerAgreement online + clickwrap; TermsAndConditions(azion_plans) + separate clickwrap; tokenized PaymentMethod; Charge/Settlement/CreditEntry; Invoice issued by billing-api; IAM status events via outbox. **Not:** Support, Savings Plan, capacity reservation, NET/postpaid.
**Future (framed, not delivered):** Support/SLA, Savings Plan, reserve capacity, NET/postpaid, N:1 consolidation, advanced enterprise support, marketplace/integration, custom terms — all via ServiceOrder + SpendCommitment + CapacityReservation without inverting Subscription cardinality.

---

# PART III — Model → wired-today mapping (target vs reality)

The spec (Part II) is the **target model**. The **handoff** (the **READY-surface doc**) is what's **wired today**. The console builds only against the wired subset.

| Concern | Spec target | Wired today (READY) | Console layer |
|---|---|---|---|
| Plan change | `POST /subscriptions/{id}/change` (+preview, cancel) | change + preview + scheduled_changes; **preview returns 200 (contract says 202)**, delete returns **204**; **`{id}` = service_order UUID** (not subscription id) | `billing-api/subscriptions` (`serviceOrderId` param) |
| Paid signup create | `POST /subscriptions` | **501 — blocked** | not built (legacy `signup/checkout/prepare` still used) |
| Subscription list/current/get/versions/cancel | canonical | **501** | not built |
| Payment methods | full wallet | list (**raw array**, may send `X-Stale`) / setup session (`type` ignored) / get / delete (204) / set-default (202) | `billing-api/payment-methods` |
| Payments | Charge ledger public | list + get (`attempts[]`) READY | `billing-api/payments` |
| Credits | balance + statement | READY (grant is server-to-server) | `billing-api/credits` |
| Billing accounts | payer entity | endpoints READY on API but **product-deferred** ("não será feito agora") | `billing-api/billing-accounts` (inert scaffolding) |
| Invoices | full | **501** | not built (legacy Stripe-list) |
| Legal/agreement, SpendCommitment, CapacityReservation, postpaid | Part II | **[Future]** | not built |

Real-contract (OpenAPI v1.0.0) notes: `ScheduledChange.id/subscription_id/change.plan_id` are **UUID strings**; the real `Subscription` has **no `service_order_id`**; `PaymentSetupSession` = `{setup_session_id, client_secret, gateway}` under `{data}`; money in cents.

---

# PART IV — Decisions log (what was decided & why)

**Model-level (Architecture Committee):**
1. **Gateway is executor, truth is local** — portability, reconciliation, resilience; only PAN in the vault.
2. **Subscription-first; ServiceOrder only for addenda/commitments (2026-07-02)** — preserves plan history/proration/credits/entitlement in one continuous line; matches Stripe's "update subscription on tier change" practice.
3. **Legal model split** (CustomerAgreement ⟂ TermsAndConditions ⟂ AgreementExecution) — Subscription/SO are not contracts; enables auditable, per-scope legal truth.
4. **Limit vs Quota vs BudgetAlert vs SpendLimit** — one clear enforcement taxonomy (deny vs charge vs alert vs cap).
5. **Billing Accounts deferred** — "não será feito agora" for the payer feature.

**Implementation-level (this branch / this work):**
6. **Console integrates only READY ops** — 501 stubs are contract-only; avoids building dead UI.
7. **Prune the DRAFT-based over-build** — deleted `service-orders-v4/` and `invoices/` (100% 501; the latter name-collided with the live invoices service); trimmed the other resources to READY ops.
8. **Isolate the new layer in a dedicated `billing-api` namespace under the v2 services** — clear new↔legacy boundary so legacy can be retired later; legacy services stay put.
9. **Keep BOTH billing UIs, chosen by `VITE_BILLING_TYPE_OVERRIDE`** — the old tabbed billing is restored faithfully to `main` for `custom`/`internal`; the new plans experience serves `plan`. Real account-type routing decided later.
10. **Restore the old billing faithfully to `main`** — resurrected `billingGqlService`, `loadBillingData`, `PaymentListView`, `DrawerPaymentMethod`, `notification-payment`, `BillingLayout`; new experience unaffected (it self-hides the payment button).
11. **Do NOT wire signup-create to v4** — `POST /subscriptions` is 501; keep signup on legacy until it turns READY.
12. **`{id}` = service_order UUID for change/scheduled today** — modeled as `serviceOrderId`; rename to subscription id when the backend reaches the spec target.

---

## Appendix — where to look (by concept / searchable name, not path)

Docs (in the repo's docs area; find by heading/topic):
- the **billing flow doc** — onboarding→billing flow, the flag, sequence diagram, **stage curl recipes**.
- the **READY-surface doc** — the exact READY vs 501 op list + divergences + real-contract corrections.
- the **coverage matrix** — per-operationId matrix (DRAFT-era reference; superseded by the READY-surface doc for the new layer).
- the **contract gap analysis** — current→v4 deltas.

Code (grep the searchable name):
- New v4 client layer — the `billing-api` namespace under the v2 services (grep `services/v2/billing-api`, or the singletons `subscriptionsService` / `paymentMethodsService` / `paymentsService` / `creditsService` / `billingAccountsService`).
- Billing UI — the Billing views (grep the screen names `LegacyBillingScreen`, `TabsView`, `PaymentListView`, `DrawerPaymentMethod`; the legacy tabbed screen is the one grouped under a `legacy` folder).
- The flag/gate — the store getter `billingExperience`, the helper `resolveBillingType`, the env var `VITE_BILLING_TYPE_OVERRIDE`.
- Foundation — `generateIdempotencyKey` (idempotency-key helper).
