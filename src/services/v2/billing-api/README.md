# billing-api v4 — the NEW billing, for the plans experience

This is the console's integration layer for **billing-api v4** (ENG-46458). It
serves the **plans experience**: accounts whose `billing_type` is `plan` or
`null` — everything that is not managed.

The old billing lives in `../billing-legacy/` and stays alive for managed
accounts (`internal` / `custom`). **The two never import each other** — enforced
by `no-restricted-imports` in `.eslintrc.cjs`.

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

- **`Subscription` carries no `plan_id`.** The plan, period and fee snapshot live
  on `SubscriptionVersion`, so plan identity needs `current` **plus** `versions`
  (`useSubscriptionState` does both and picks the version with no `effective_to`).
- **`change` and `scheduled_changes` key on `service_order_id`**, not on the
  subscription id — read it off the subscription (`Subscription.service_order_id`,
  required by the schema).
- **The pending downgrade is not a subscription field.** `pending_transition`
  only comes back from `POST …/change`, so a page load must call
  `GET …/scheduled_changes` to survive a refresh.
- **Period vocabulary differs from the catalogue.** products-api says `yearly`,
  billing-api says `annual` — translate through
  `services/v2/utils/billing-period.js`, never inline.
- **`plan_id` is an opaque token.** UUID in the catalogue, `integer int64` in the
  contract. Pass it through; never parse or `Number()` it.
- **Money is integer cents** on the wire; the catalogue quotes major units.
- Divergences from the written contract (`preview` answers 200 not 202, deletes
  answer 204, `payment_methods` breaks the v4 envelope, setup session ignores
  `type`) are documented in `docs/billing-v4-flows/FLOW-GUIDE.md` §10.

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
