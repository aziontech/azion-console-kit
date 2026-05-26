# billing-cards-pro — Pro account cards redesign

> status: done
> owner: @HerbertJulio
> completed-at: 2026-05-26
> branch: refactor/ENG-37160-billing-rewrite
> commits: []
> figma: [https://www.figma.com/design/76eAHzSS7et4fywMISotw6/console.azion.com?node-id=170-11283&m=dev]
> prereq: [billing-shell-rewrite, prework-metadata-decision]
> related-memories: reference-so-api-v4-contract
> completed-at:

## 1. Why

Redesign cards visible on a Pro account: `SubscriptionPlanCard` (Pro variant), `CurrentInvoiceCard`. Data via v4 endpoints; current invoice replaces GraphQL `fetchLastBill`.

## 2. Out of scope

- Hobby variant
- Upgrade drawer (separate spec)

## 3. Contracts

Data sources per Figma 170-11283:
- `useCurrentSubscription` → `planSku` ("Pro"), `planStartDate`, `nextChargeDate` + countdown ("in 4 days"), `nextChargeValue` ($200), `paymentMethod` ("Credit Card" — derived from default card)
- Current invoice: `invoicesService.listAccountInvoicesAsRows({limit:1})` for billing period, plan charge, extra charges, professional services, credit balance, credit applied, total.
- `useCurrentSubscription.scheduledDowngrade` for banner visibility (handled by spec 4.4).

## 4. States & flows

Per Figma 170-11283, 2-column layout for Pro:
- **SubscriptionPlanCard (Pro variant)**: header "Subscription Plan" + button "Change Plan" (opens `billing-drawer-plans-pro`). Body: "Pro" + chip "Actual Plan", Plan Start Date, Next Charge Date (with relative "in X days"), Next Charge Value ($N), Payment Method ("Credit Card"). Footer same as Hobby variant.
- **CurrentInvoiceCard**: header "Current Invoice" + icon button "Details" (link to invoice detail view). Body: Billing Period, Plan Charge, Extra Product Charges, Professional Services Plan Charges, Credit Balance, separator, "Credit that will be used for payment", **Total** (highlight, larger font).

Empty/error: when no current invoice (DRAFT account?), show skeleton or empty state.

## 5. Reuse map

REUSE: `useCurrentSubscription`, new `useCurrentInvoice` composable backed by `invoicesService` (limit=1).
EXTRACT: invoice row formatting helpers (currency, period rendering) to `src/helpers/format-invoice.js`.

## 6. Implementation steps

1. Refresh `SubscriptionPlanCard.vue` Pro variant.
2. Refresh `CurrentInvoiceCard.vue` per Figma (8 fields + total).
3. Add `useCurrentInvoice` composable (Vue Query around `invoicesService.listAccountInvoices({limit:1})`).
4. Wire "Change Plan" → opens `billing-drawer-plans-pro`.
5. Wire "Details" icon → routes to existing `InvoiceDetailsView`.
6. Update tests.

## 7. Test plan

TODO at activation.

## 8. Telemetry & rollback

TODO at activation.

## 9. Definition of Done

Default DoD + visual match with Figma.

## Amendments
