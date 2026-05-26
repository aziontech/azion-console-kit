# billing-shell-rewrite — Simplify BillingLayout, remove Payment Methods tab

> status: done
> owner: @HerbertJulio
> completed-at: 2026-05-26
> branch: refactor/ENG-37160-billing-rewrite
> commits: []
> figma: [https://www.figma.com/design/76eAHzSS7et4fywMISotw6/console.azion.com?node-id=314-39818&m=dev]
> prereq: [prework-services-v4-cleanup, prework-metadata-decision]
> related-memories: reference-so-api-v4-contract

## 1. Why

`BillingLayout` + `TabsView` currently expose 2 tabs (Bills + Payment Methods). The Payment Methods tab is being removed entirely (capability moves into upgrade drawer). Also adds the new refresh button per Figma.

## 2. Out of scope

- Card redesign (separate specs)
- Drawer/dialog redesign
- The deprecated route's 301-vs-404 final call (decided in this spec)

## 3. Contracts

TODO at activation.

## 4. States & flows

Per Figma 314-39818, the new shell shows: heading "Billing", subtitle "View and manage invoices, payments, and subscription details.", right side "Last Update: <timestamp>" + refresh icon button. No tabs (Bills is the only view).

States:
- Idle: shows BillsView root
- Refreshing: refresh icon spins, `subscription.refetch()` + `loadCardDefault()`
- Last update timestamp updates on success

## 5. Reuse map

DELETE: `PaymentListView.vue`, `DrawerPaymentMethod.vue` (also coupled `notification-payment.vue` add-payment paths).
REUSE: `BillingLayout` shell (simplified), `BillsView` becomes the root content.
KEEP route `/billing/payment-methods` as 301 redirect to `/billing` for 1 release (mitigate broken bookmarks).

## 6. Implementation steps

1. Remove `PaymentListView` import/render from `TabsView.vue`; collapse `TabsView` into the new shell heading + `BillsView` directly OR delete `TabsView` and have `BillingLayout` host `BillsView` with the header.
2. Move refresh button + last-update label into `BillingLayout` heading per Figma.
3. Delete `PaymentListView.vue` and `DrawerPaymentMethod.vue`.
4. Update `src/router/routes/billing-routes/index.js`: remove `/billing/payment-methods` child route, add 301 redirect (Vue Router `redirect: '/billing'`).
5. Run `grep -r "PaymentListView\|DrawerPaymentMethod" src/` and clean up residual imports.
6. Update test `src/tests/router/billing-routes.test.js` (if exists) for redirect behavior.

## 7. Test plan

TODO at activation. Manual: bookmark of `/billing/payment-methods` redirects to `/billing`.

## 8. Telemetry & rollback

TODO at activation.

## 9. Definition of Done

Default DoD + zero residual references to `PaymentListView` or `DrawerPaymentMethod` in the repo.

## Amendments
