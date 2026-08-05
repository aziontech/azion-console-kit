# billing-api v4 — the NEW billing, for the plans experience

This is the console's integration layer for **billing-api v4** (ENG-46458). It
serves the **plans experience**: every account whose `status` is not `REGULAR`
(store getter `isRegularAccount` decides the billing screen).

The old billing lives in `../billing-legacy/` and stays alive for regular
accounts. **The two never import each other** — enforced by
`no-restricted-imports` in `.eslintrc.cjs`.

## What lives here

| Resource         | Folder              | Surface                                                                                                      |
| ---------------- | ------------------- | ------------------------------------------------------------------------------------------------------------ |
| Subscriptions    | `subscriptions/`    | `current` · `list` · `get` · `versions` · `create` · `cancel` · `change` (+ `preview`) · `scheduled_changes` |
| Invoices         | `invoices/`         | `list` · `get` · `lines` · `pdf` · `settlements` · `pay`                                                     |
| Payment methods  | `payment-methods/`  | wallet: `list` (raw array) · setup session · `get` · `delete` · set-default                                  |
| Payments         | `payments/`         | charge ledger (read-only): `list` + detail with `attempts[]`                                                 |
| Credits          | `credits/`          | `balance` + statement (read-only)                                                                            |
| Billing accounts | `billing-accounts/` | the payer: `list` · `create` · `current` · `get` · `patch` · `cost_breakdown`                                |

## Contract facts that shape this layer

- **`Subscription` (v1.0.0) carries the plan identity inline** — `plan_id`,
  `plan_pricing_id`, `renew` and `pending_transition` all come back from
  `GET …/current`, so one read answers the whole plan card.
- **Nested routes key on `{subscription_id}`** (`change`, `change/preview`,
  `cancel`, `scheduled_changes`) — the id comes from `current`.
- **Period vocabulary differs from the catalogue.** products-api says `yearly`,
  billing-api says `annual` — translate through
  `services/v2/utils/billing-period.js`, never inline.
- **`plan_id` is an opaque UUID.** Pass it through; never parse or `Number()` it.
- **Money is integer cents** on the wire; the catalogue quotes major units.
- Divergences from the written contract (`preview` answers 200 not 202, deletes
  answer 204, `payment_methods` breaks the v4 envelope, setup session ignores
  `type`, set-default is `POST …/default` while the spec-view doc says
  `PUT/PATCH {pm_id}`) are documented in `docs/billing-spec.md` §III.10.

## Conventions

`BaseService` subclass per resource · pure adapters (snake_case wire ↔ camelCase
app, conditional-spread payloads honoring `additionalProperties: false`) · frozen
enum constants · money in integer **cents** · `idempotency-key` on every op that
moves money, one key per user _intent_ reused across retries (grep
`generateIdempotencyKey`).

## Composables on top

`src/composables/billing/` and the subscription composables at the root of
`src/composables/` (`useSubscriptionState`, `useSubscriptionPlanChange`,
`useCurrentSubscription`, `useCheckoutSessionPreparer`, `useLatestInvoice`).
