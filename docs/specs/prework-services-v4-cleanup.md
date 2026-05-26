# prework-services-v4-cleanup — Migrate broken v1 billing/account services to v4

> status: done
> owner: @HerbertJulio
> completed-at: 2026-05-26
> branch: refactor/ENG-37160-billing-rewrite
> commits: []
> figma: []
> prereq: []
> related-memories: reference-so-api-v4-contract, reference-so-lifecycle-flows, project-eng37160-so-v4-migration

## 1. Why

Three services still consume `/api/v1/*` endpoints removed upstream in PR #92: `src/services/v2/billing/invoices-service.js`, `src/services/v2/billing/billing-service.js`, `src/services/v2/account/account-current-service.js`. They are broken in production after the gateway disables v1. Rewrite them targeting v4 routes while preserving domain isolation (do not dissolve into `serviceOrdersService`).

## 2. Out of scope

- New billing features (downgrade derivation, etc — see other specs)
- GraphQL removal (separate spec `prework-graphql-removal`)
- UI changes

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

Default DoD from `workflow.md`.

## Amendments
