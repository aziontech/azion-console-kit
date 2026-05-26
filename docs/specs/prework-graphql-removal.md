# prework-graphql-removal — Delete billing GraphQL, redirect to REST v4

> status: abandoned
> owner: @HerbertJulio
> branch: refactor/ENG-37160-billing-rewrite
> commits: []
> figma: []
> prereq: [prework-services-v4-cleanup]
> related-memories: reference-so-api-v4-contract

## 1. Why

`billing-gql-service.js` + `billing-gql-adapter.js` exist solely to fetch `fetchLastBill` and `fetchLastCredit` via GraphQL. v4 REST exposes equivalent data via `/v4/service_orders/current` and `/v4/service_orders/billing/invoices`.

## Amendment 2026-05-26 — abandoned, blocked on backend

Investigation in PR #92 (`/tmp/so-pr92/src/index.ts`) confirmed there is NO v4 REST endpoint exposing trial credit (`fetchLastCredit` / `balanceFinancialEntry`). Currently the GraphQL `getCreditAndExpirationDate()` is the ONLY source of `credit/formatCredit/days` consumed by `notification-payment.vue` for the trial credit banner.

Decision: spec abandoned for now. GraphQL stays operational until backend exposes trial credit in v4 REST. Reopen as a new spec (`prework-graphql-removal-v2`) when that endpoint is available. Downstream specs do NOT depend on this — proceed with onboarding + billing waves without it.

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
