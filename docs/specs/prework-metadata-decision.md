# prework-metadata-decision — Derived `downgradePending` field in SO adapter

> status: done
> owner: @HerbertJulio
> completed-at: 2026-05-26
> branch: refactor/ENG-37160-billing-rewrite
> commits: []
> figma: []
> prereq: []
> related-memories: reference-so-api-v4-contract (sec 8), reference-so-lifecycle-flows, project-eng37160-so-v4-migration

## 1. Why

The v4 contract (verified in `/tmp/so-pr92/src/dto/public-v4.ts:18-39`) currently exposes 14 SO fields + optional `payment.client_secret`. It does NOT expose `metadata`, `transitions[]`, or any derived `downgrade_pending` field — even though the backend writes `serviceOrder.metadata.status='downgrade_pending'` in DB (handler lines 1921, 2075).

Per user decision (2026-05-26): implement the frontend adapter as if backend already exposed the needed data. Adapter accepts both shapes (future `downgrade_pending: {effective_at, mode}` AND legacy `metadata.status`/`metadata.effective_date`) and exposes a stable `downgradePending: {effectiveAt, mode} | null` to consumers. Backend will add the field upstream later; once it lands, the legacy branch becomes dead code and can be removed.

Same approach for `invoiceAmountCharged` (currently read from `metadata.amountCharged` / `metadata.amount_charged`).

## 2. Out of scope

- Other derived fields not related to downgrade (separate specs if needed)
- Adapter changes beyond `service-orders-adapter.js`
- UI redesign of the banner (covered by `billing-downgrade-warning`)

## 3. Contracts

TODO at activation. Must verify real `metadata` and `transitions[]` shape by reading PR #92 handler code (`/tmp/so-pr92/src/handlers/service-orders.ts` or re-fetch).

## 4. States & flows

TODO at activation.

## 5. Reuse map

TODO at activation.

## 6. Implementation steps

TODO at activation.

## 7. Test plan

TODO at activation. Must include adapter test covering: (a) no transitions → `downgradePending = null`, (b) pending downgrade transition → `downgradePending = { effectiveAt }`, (c) completed/canceled transitions ignored.

## 8. Telemetry & rollback

TODO at activation.

## 9. Definition of Done

Default DoD from `workflow.md`.

## Amendments
