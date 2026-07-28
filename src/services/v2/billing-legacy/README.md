# billing-legacy — the OLD billing, kept alive for managed accounts

Everything here serves the **managed billing experience** only: accounts whose
`billing_type` is `internal` or `custom` (store getter `isManagedBillingAccount`).
Those clients stay on the old billing until the product decides to move them, so
this layer must keep working exactly as it is.

## Rules

1. **Frozen.** Bug fixes only. No new features, no new endpoints. Anything new
   belongs in `../billing-api/`.
2. **No imports from `../billing-api/`.** The two layers never mix — enforced by
   `no-restricted-imports` in `.eslintrc.cjs`.
3. **Only the legacy screens consume this.** `src/views/Billing/legacy/**` and
   `src/composables/billing-legacy/**`. If a plans-experience view needs
   something from here, the answer is a v4 endpoint, not an import.

## What lives here

| Folder        | Surface                                                                                  | Consumed by                                                         |
| ------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `wallet/`     | `/edge_api/v4/service_orders/billing/payment_methods` (+ `setup_intents`, `set_default`) | `useLegacyWallet` → legacy billing screen                           |
| `payments/`   | `/v4/payments/credit_cards` · `/credits` · `/history` (payments-api)                     | add-credit drawer, add-payment-method block, legacy payment history |
| `invoices/`   | `/edge_api/v4/service_orders/billing/invoices` (Stripe invoice objects)                  | legacy payment history merge                                        |
| `accounting/` | accounting GraphQL — account credit and expiration                                       | account hydration (`loadBillingData`)                               |

## Two things that are legacy for _everyone_

The v4 contract has no public equivalent, so both experiences still come through
here:

- **Granting credit.** `POST /v4/payments/credits`. In v4, credit is granted
  server-to-server (`POST /internal/v1/credits`) — there is no public write.
- **The old add-payment-method block.** `POST /v4/payments/credit_cards`. The
  plans experience captures cards through a v4 setup session instead.

## The new layer

`src/services/v2/billing-api/` — billing-api v4, the plans experience. See its
README, and `docs/billing-v4-flows/FLOW-GUIDE.md` for the flow contract.
