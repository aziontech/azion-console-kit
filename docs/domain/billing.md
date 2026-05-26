# Domain: billing

> owners: @HerbertJulio
> source-of-truth: `serviceOrdersService` (`/v4/service_orders/*`) + `paymentService` (`/v4/payments/*`) + Stripe
> related-memories: reference-so-api-v4-contract, reference-so-lifecycle-flows, project-eng37160-so-v4-migration

## Glossary

| Term | One-line meaning |
|---|---|
| Service Order (SO) | Subscription contract between an account and a plan |
| Plan | Catalog entry (Hobby free, Pro paid) with one or more pricings |
| Plan pricing | Concrete price + periodicity (monthly/yearly) within a plan |
| Transition | Lifecycle event (upgrade/downgrade/cancel/signup) attached to a SO |
| Payment method | Stripe card attached to the customer; one is marked default |
| Invoice | Stripe invoice for a billing period (keyset paginated) |
| Downgrade pending | SO state where a downgrade is scheduled for `effectiveAt` |

## State model

See [[reference-so-lifecycle-flows]] for the full SO state machine. Summary: `DRAFT → ACTIVE → {PAST_DUE, BLOCKED, CANCELED, EXPIRED}` with transitions tracked in `transitions[]`.

## Boundaries

- **In**: webhooks from Stripe (subscription updated/canceled), user actions (upgrade/downgrade/cancel from UI), prefetch from cache-sync
- **Out**: invoices to email, Sentry on failure, Pinia `accountStore` mirror of `hasAccountPlan`
- **Allowed importers**: `src/views/Billing/*`, `src/views/Signup/*` (onboarding), `src/helpers/account-data.js`

## Open questions

- Final shape of `downgradePending` derived field — confirm with PR #92 metadata structure before implementing spec `prework-metadata-decision`.
- Whether `payment-service.js` (`v4/payments/*`) and `serviceOrdersService.billing.*` (`/v4/service_orders/billing/*`) coexist long-term or merge.
