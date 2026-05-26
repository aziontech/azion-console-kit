# billing-cards-hobby — Hobby account cards redesign

> status: done
> owner: @HerbertJulio
> completed-at: 2026-05-26
> branch: refactor/ENG-37160-billing-rewrite
> commits: []
> figma: [https://www.figma.com/design/76eAHzSS7et4fywMISotw6/console.azion.com?node-id=314-13905&m=dev]
> prereq: [billing-shell-rewrite, prework-metadata-decision]
> related-memories: reference-so-api-v4-contract
> completed-at:

## 1. Why

Redesign cards visible on a Hobby account: `SubscriptionPlanCard` (Hobby variant), `UpgradeToProCard`. Data must come from v4 endpoints, not v1/GraphQL.

## 2. Out of scope

- Pro variant
- Drawer for plan upgrade (separate spec `billing-drawer-plans-hobby`)

## 3. Contracts

Data sources per Figma 314-13905:
- `useCurrentSubscription` → `planSku` ("Hobby"), `planStartDate`, `nextChargeDate` ('--' for free), `nextChargeValue` ('--' for free), `paymentMethod` ('$0' for free)
- Plan card features hardcoded (catalog) OR derived from `usePlansList` finding the Pro plan's pricings/features.

## 4. States & flows

Per Figma 314-13905, 2-column layout:
- **SubscriptionPlanCard (Hobby variant)**: header "Subscription Plan" + button "Change Plan" (opens `billing-drawer-plans-hobby`). Body: "Hobby" + chip "Actual Plan", Plan Start Date, Next Charge Date (--), Next Charge Value (--), Payment Method ($0). Footer: "This invoice includes all consumption up to the last day of the month. [Change payment method.]" link.
- **UpgradeToProCard**: header "Upgrade to Pro". Body: 2-column features grid with green checks (20 Workloads, 20M App requests, 10h Functions, DDoS, 20GB Storage, 20M Firewall, 2GB Events Storage, SOC 2/3). Description text. Link "Pricing and Plans". Footer button orange "Upgrade to Pro" (opens `billing-drawer-upgrade`).

States: loading skeleton → loaded → action triggers drawer.

## 5. Reuse map

REUSE: `useCurrentSubscription` (post `prework-metadata-decision`), `usePlansList`, existing `SubscriptionPlanCard.vue` and `UpgradeToProCard.vue` (refresh visual only).
EXTRACT: features list to a constant (used by both card and drawer).

## 6. Implementation steps

1. Refresh `SubscriptionPlanCard.vue` visuals per Figma (header layout, chip styling, footer link).
2. Refresh `UpgradeToProCard.vue` visuals (2-col features grid, orange CTA).
3. Wire "Change Plan" → emits open of `billing-drawer-plans-hobby`.
4. Wire "Upgrade to Pro" → emits open of `billing-drawer-upgrade`.
5. Update tests in `src/tests/views/Billing/` (create dir if absent).

## 7. Test plan

TODO at activation.

## 8. Telemetry & rollback

TODO at activation.

## 9. Definition of Done

Default DoD + visual match with Figma.

## Amendments
