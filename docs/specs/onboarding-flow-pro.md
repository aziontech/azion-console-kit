# onboarding-flow-pro — Pro (paid) onboarding path with checkout

> status: done
> owner: @HerbertJulio
> completed-at: 2026-05-26
> branch: refactor/ENG-37160-billing-rewrite
> commits: []
> figma: []
> prereq: [prework-services-v4-cleanup, prework-metadata-decision, onboarding-prefetch-plans, onboarding-flow-hobby]
> related-memories: reference-so-api-v4-contract, reference-so-lifecycle-flows

## 1. Why

Pro path opens the checkout drawer, decides CREATE vs PATCH-if-DRAFT-<24h vs UPGRADE via `resolveSubmitStrategy`, mounts Stripe Payment Element with `clientSecret`, and routes to success after confirm. Edge cases (DRAFT expired, double-pay, 3DS, network drop) must be handled deterministically and tested.

## 2. Out of scope

- Hobby path
- Drawer redesign (covered by `billing-drawer-upgrade` for the Pro→Pro cycle change case)
- Webhook handling on backend

## 3. Contracts

TODO at activation.

## 4. States & flows

TODO at activation. Edge cases enumerated with payloads:
- DRAFT expired between steps → fallback CREATE
- Checkout paid between attempts → detect via SO state, jump to success
- Stripe 3DS / timeout → retry without losing form data
- Network drop after PATCH ok before confirm → idempotency

## 5. Reuse map

REUSE: `submitServiceOrder` from `useServiceOrders`, `useCheckoutSessionPreparer` (PATCH-if-DRAFT logic + `recoverFromStaleSession`), `DrawerPlanInfo`, `stripe-payment-resolver`, `payment-method-block.vue`.

## 6. Implementation steps

Implemented via PR reapply. Current state:
- `src/views/Signup/AdditionalDataView.vue:195-218` — Pro branch resolves `planPricingId`, calls `submitServiceOrder({accountId, planId, planPricingId})`, extracts `clientSecret` from response, transitions to checkout step with `DrawerPlanInfo`.
- `src/composables/useCheckoutSessionPreparer.js:35-84` — `prepareMutation` handles 3 paths: DRAFT exists → PATCH refresh (handles 24h expiry); ACTIVE exists → upgrade; nothing → CREATE.
- `src/composables/useCheckoutSessionPreparer.js:95-99` — `recoverFromStaleSession` for Stripe rejection (resource_missing, etc).
- `src/services/v2/service-orders/stripe-payment-resolver.js` — extracts `clientSecret` from multiple response shapes.

## 7. Test plan

Existing coverage:
- `service-orders-strategy.test.js` — CREATE/PATCH/UPGRADE/NOOP branches
- `service-orders-adapter.test.js` — payload + response shape for paid plans
- `stripe-payment-resolver.test.js` — secret extraction edge cases

E2E in staging (manual until Cypress added):
- Stripe test card 4242 4242 4242 4242 — normal flow
- Card 4000 0027 6000 3184 — 3D Secure challenge
- Abandon checkout, return within 24h — PATCH refresh path
- Abandon checkout, return after 24h — CREATE fresh path
- Network drop after PATCH ok before confirm — verify idempotency (re-submit doesn't duplicate)

## 8. Telemetry & rollback

TODO at activation.

## 9. Definition of Done

Default DoD + E2E staging proof for each edge case + Sentry baseline for `useCheckoutSessionPreparer`.

## Amendments
