# onboarding-flow-hobby — Hobby (free) onboarding path

> status: done
> owner: @HerbertJulio
> completed-at: 2026-05-26
> branch: refactor/ENG-37160-billing-rewrite
> commits: []
> figma: []
> prereq: [prework-services-v4-cleanup, onboarding-prefetch-plans]
> related-memories: reference-so-api-v4-contract, reference-so-lifecycle-flows

## 1. Why

The free path must skip the payment drawer entirely. Today the branching is implicit in the view; spec ensures it is explicit, tested, and decoupled from Pro.

## 2. Out of scope

- Pro path (separate spec `onboarding-flow-pro`)
- Stripe integration

## 3. Contracts

TODO at activation.

## 4. States & flows

```
Step 1 form → user picks Hobby → CREATE SO → loadUserAndAccountInfo() → Step 3 success
```

## 5. Reuse map

REUSE: `submitServiceOrder` from `useServiceOrders`, `resolveSubmitStrategy` (CREATE branch for Hobby), `usePlansList` (prefetched by `onboarding-prefetch-plans`).

## 6. Implementation steps

Implemented via PR reapply (commit chain reverted in `0ed1f7410` and re-applied in this branch). Current state:
- `src/views/Signup/AdditionalDataView.vue:182-193` — Hobby branch calls `submitServiceOrder({accountId, planId})` (no `planPricingId`), then `loadUserAndAccountInfo()` to refresh `hasAccountPlan`, then `handleProceedToCheckout()` which skips checkout step and shows success.
- `src/composables/useServiceOrders.js` — `submitServiceOrder` delegates to `resolveSubmitStrategy` which returns `CREATE` action (no current SO).
- `src/services/v2/service-orders/service-orders-strategy.js` — CREATE branch covered by existing `service-orders-strategy.test.js` (12 tests).

## 7. Test plan

Existing coverage:
- `service-orders-strategy.test.js` — CREATE branch when no current SO (line 54)
- `service-orders-adapter.test.js` — payload shape for hobby (no `plan_pricing_id`)

Smoke staging:
- Login with new account (no plan), pick Hobby in form, click "Start Deploying", verify success screen in < 5s, verify `accountStore.hasAccountPlan === true`, verify zero requests to `/plans` on step transition (prefetch from `onboarding-prefetch-plans`).

## 8. Telemetry & rollback

TODO at activation.

## 9. Definition of Done

Default DoD.

## Amendments
