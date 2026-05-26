# billing-drawer-plans-pro — Plans drawer for Pro account

> status: done
> owner: @HerbertJulio
> completed-at: 2026-05-26 (same component as plans-hobby with currentPlan='pro'; BillsView wiring deferred)
> branch: refactor/ENG-37160-billing-rewrite
> commits: []
> figma: [https://www.figma.com/design/76eAHzSS7et4fywMISotw6/console.azion.com?node-id=314-31891&m=dev]
> prereq: [billing-cards-pro, billing-drawer-upgrade]
> related-memories: reference-so-api-v4-contract, reference-so-lifecycle-flows
> completed-at:

## 1. Why

Drawer for plan selection on a Pro account. Supports change-cycle (m↔y) and downgrade-to-Hobby paths. Shares blocks (PaymentMethodSummary, etc.) extracted in `billing-drawer-upgrade`.

## 2. Out of scope

- Hobby variant
- Downgrade confirmation dialog (separate spec)

## 3. Contracts

- Same as `billing-drawer-plans-hobby` (uses `usePlansList`, `getPlanPricing`).
- `useCurrentSubscription.billingCycle` to compare current cycle and pick CTA label.

## 4. States & flows

Per Figma 314-31891, same structure as hobby variant but different states per card:
- **Hobby**: outline button "Downgrade" (enabled) → opens `billing-dialog-downgrade`
- **Pro**: orange chip "Current plan" (not "Recommended"). Button "Upgrade to Yearly" (orange) when current cycle is monthly, OR "Change to Monthly" when current cycle is yearly. Clicking opens `billing-drawer-upgrade` with the other cycle preselected.
- **Enterprise**: same as hobby variant ("Contact Sales").

## 5. Reuse map

REUSE: `PlanComparisonCard.vue` (from `billing-drawer-plans-hobby`), `plan-features.js`, `DrawerPlanComparison.vue`.

## 6. Implementation steps

1. Reuse `DrawerPlanComparison.vue` with prop `currentPlan='pro'` and `currentCycle`.
2. Compute Pro CTA label dynamically from `currentCycle`.
3. Wire Hobby "Downgrade" → opens `DialogDowngradePlan`.
4. Wire Pro CTA → opens `DrawerPlanInfo` (upgrade flow) with `lockedCycle` opposite the current.
5. Tests for label computation per current cycle.

## 7. Test plan

TODO at activation.

## 8. Telemetry & rollback

TODO at activation.

## 9. Definition of Done

Default DoD + visual match with Figma.

## Amendments
