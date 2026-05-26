# prework-graphql-removal — Delete billing GraphQL, redirect to REST v4

> status: done
> owner: @HerbertJulio
> completed-at: 2026-05-26
> branch: refactor/ENG-37160-billing-rewrite
> commits: []
> figma: []
> prereq: [prework-services-v4-cleanup]
> related-memories: reference-so-api-v4-contract

## 1. Why

`billing-gql-service.js` + `billing-gql-adapter.js` exist solely to fetch `fetchLastBill` and `fetchLastCredit` via GraphQL. v4 REST exposes equivalent data for invoices via `/v4/service_orders/billing/invoices`. Trial credit has no v4 REST equivalent (yet).

## Amendment 2026-05-26 — abandoned, blocked on backend

Investigation in PR #92 (`/tmp/so-pr92/src/index.ts`) confirmed there is NO v4 REST endpoint exposing trial credit (`fetchLastCredit` / `balanceFinancialEntry`). Currently the GraphQL `getCreditAndExpirationDate()` is the ONLY source of `credit/formatCredit/days` consumed by `notification-payment.vue` for the trial credit banner.

Initial decision: keep GraphQL until backend exposes trial credit in v4 REST.

## Amendment 2026-05-26 (2) — reverted to delete now

User decided to delete GraphQL anyway. The trial credit banner stops rendering until backend exposes the data in v4 — acceptable trade-off.

Changes applied:
- DELETED `src/services/v2/billing/billing-gql-service.js`
- DELETED `src/services/v2/billing/billing-gql-adapter.js`
- `src/helpers/account-data.js` — removed `loadBillingData()` function, removed `billingGqlService` import, removed `loadBillingData` from `loadAccountHydration()` parallel chain
- `src/views/Billing/BillingLayout.vue` — removed `loadBillingData` import + call in `onMounted`
- `src/views/Billing/components/notification-payment.vue` — removed `TRIAL` notification config + trial branch in `loadText`; only `BLOCKED`/`DEFAULTING` notifications remain

`prework-graphql-removal-v2` stub is no longer needed and was deleted.

## 2. Out of scope

- Other GraphQL usage outside billing (real-time, accounting, etc.)
- New billing features

## 3. Contracts

TODO at activation.

## 4. States & flows

TODO at activation.

## 5. Reuse map

TODO at activation.

## 6. Implementation steps

TODO at activation.

## 7. Test plan

TODO at activation.

## 8. Telemetry & rollback

TODO at activation.

## 9. Definition of Done

Default DoD + assertion `grep -r 'billing-gql' src/` returns nothing.

## Amendments
