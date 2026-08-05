# billing-legacy — the OLD billing, kept alive for regular accounts

Everything here serves the **legacy billing experience** only: accounts whose
`status` is `REGULAR` (store getter `isRegularAccount`). Every other account
uses the plans experience on billing-api v4. Regular clients stay on the old
billing until the product decides to move them, so this layer must keep working
exactly as it is.

## Rules

1. **Frozen.** Bug fixes only. No new features, no new endpoints. Anything new
   belongs in `../billing-api/`.
2. **No imports from `../billing-api/`.** The two layers never mix — enforced by
   `no-restricted-imports` in `.eslintrc.cjs`.
3. **Only the legacy screens consume this.** `src/views/Billing/legacy/**`. If a
   plans-experience view needs something from here, the answer is a v4
   endpoint, not an import.

## What lives here

| Folder        | Surface                                                              | Consumed by                                                         |
| ------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `payments/`   | `/v4/payments/credit_cards` · `/credits` · `/history` (payments-api) | add-credit drawer, add-payment-method block, legacy payment history |
| `accounting/` | accounting GraphQL — account credit and expiration                   | account hydration (`loadBillingData`)                               |

The former `wallet/` and `invoices/` folders were removed with the
`/edge_api/v4/service_orders/*` surface — service_orders no longer exists in
the API, and the legacy screen (regular accounts) never rendered the surfaces
that consumed them.

## Two things that are legacy for _everyone_

The v4 contract has no public equivalent, so both experiences still come through
here:

- **Granting credit.** `POST /v4/payments/credits`. In v4, credit is granted
  server-to-server (`POST /internal/v1/credits`) — there is no public write.
- **The old add-payment-method block.** `POST /v4/payments/credit_cards`. The
  plans experience captures cards through a v4 setup session instead.

## The new layer

`src/services/v2/billing-api/` — billing-api v4, the plans experience. See its
README, and `docs/billing-spec.md` for the flow contract.
