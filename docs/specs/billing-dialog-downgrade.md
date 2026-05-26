# billing-dialog-downgrade — Downgrade confirmation dialog

> status: done
> owner: @HerbertJulio
> completed-at: 2026-05-26
> branch: refactor/ENG-37160-billing-rewrite
> commits: []
> figma: [https://www.figma.com/design/76eAHzSS7et4fywMISotw6/console.azion.com?node-id=314-39654&m=dev]
> prereq: [billing-drawer-plans-pro, prework-metadata-decision]
> related-memories: reference-so-lifecycle-flows
> completed-at:

## 1. Why

Confirmation dialog before scheduling a downgrade. Triggered from Pro plans drawer when the user picks a lower tier. Must show the effective date computed from current period end.

## 2. Out of scope

- Cancel downgrade (separate spec)
- Upgrade

## 3. Contracts

- Props: `fromPlan`, `toPlan`, `effectiveAt`, feature comparison rows.
- `useServiceOrders.downgrade({id, accountId, newPlanId, priceId})` for submit.
- Effective date computed from `useCurrentSubscription.currentPeriodEnd`.

## 4. States & flows

Per Figma 314-39654, modal ~582x452:
- **Header**: "Downgrade to Hobby" + close
- **Body**:
  - Red banner (dark red bg, red info icon): "Your current plan will remain active until the end of your billing period (`<effectiveAt>`). After that, your subscription will move to the Hobby plan and new actions may be restricted if usage exceeds its limits."
  - Feature comparison (2-column): "Pro" + chip "Actual Plan" | "Hobby". 4+ rows comparing capabilities ("10X Resources" green check vs "5X Resources" gray x). Hardcoded per design (placeholder).
- **Footer**: "Downgrade plan" (outline) + "Keep Pro" (white solid, primary action — keep current plan, NOT submit downgrade).

States:
- Idle → user clicks "Downgrade plan" → submitting → success/error.
- Success → close dialog, refetch SO, banner `billing-downgrade-warning` appears.
- Error → inline message, keep dialog open.

## 5. Reuse map

REUSE: `DialogDowngradePlan.vue` (refresh visual + add feature comparison block), `useServiceOrders.downgrade`, webkit `useDialog` / `PrimeDialog`.
NEW: `PlanFeatureComparison.vue` (2-col compare with checks/x).

## 6. Implementation steps

1. Refresh `DialogDowngradePlan.vue` per Figma (red banner, comparison block, button positions).
2. Create `PlanFeatureComparison.vue`.
3. Wire submit → `useServiceOrders.downgrade(...)`, handle success/error.
4. Tests: render with/without effectiveAt, submit success, submit failure.

## 7. Test plan

TODO at activation.

## 8. Telemetry & rollback

TODO at activation.

## 9. Definition of Done

Default DoD + visual match with Figma + staging smoke schedules downgrade and banner appears.

## Amendments
