# billing-drawer-plans-hobby — Plans drawer for Hobby account

> status: done
> owner: @HerbertJulio
> completed-at: 2026-05-26 (DrawerPlanComparison + PlanComparisonCard + plan-comparison-features done; BillsView wiring deferred)
> branch: refactor/ENG-37160-billing-rewrite
> commits: []
> figma: [https://www.figma.com/design/76eAHzSS7et4fywMISotw6/console.azion.com?node-id=314-21316&m=dev]
> prereq: [billing-cards-hobby]
> related-memories: reference-so-api-v4-contract
> completed-at:

## 1. Why

Drawer for plan selection when a Hobby account clicks Upgrade. Redesigned per Figma.

## 2. Out of scope

- Pro variant (separate spec)
- Payment processing (delegated to upgrade flow)

## 3. Contracts

- `usePlansList` for plan catalog (Hobby/Pro/Enterprise)
- `getPlanPricing(plans, planName)` for prices per cycle

## 4. States & flows

Per Figma 314-21316, drawer ~1158px wide:
- **Header**: "Change Plan" + close
- **Top**: Monthly/Yearly toggle (centered)
- **3 plan cards** in horizontal grid:
  - **Hobby** (current): "The perfect starting place", **Free**, billing line, features list with icons (Infraestrutura global, Funções serverless, Image optimization, Armazenamento e BD, Mitigação DDoS+firewall), **disabled** button "Actual plan"
  - **Pro** (highlighted with orange chip "Recommended"): description, **$20 per month** (from `getPlanPricing`), billing line, features (Workloads adicionais, Limites maiores, Mais Storage, Maior cobertura segurança, Limite de gasto configurável), **orange** button "Upgrade" → opens `billing-drawer-upgrade`
  - **Enterprise**: description, **Custom**, billing line, features (Preços on-demand, Economize com compromissos, Reserva de Capacidade, Savings Plans, Suporte avançado), outline button "Contact Sales" (mailto or external link)

Cycle toggle updates Pro price reactively. Switching to Yearly emits/closes this drawer and opens Upgrade drawer with yearly preselected.

## 5. Reuse map

REUSE: `usePlansList`, `getPlanPricing`, `DrawerPlanInfo` shell (or extract a leaner `DrawerPlanComparison.vue` for this 3-card view).
NEW: per-plan card component `PlanComparisonCard.vue` (props: name, price, billingLine, features, chipLabel, buttonLabel, buttonVariant, disabled, onClick).
EXTRACT: feature lists for each tier to `src/views/Billing/plan-features.js`.

## 6. Implementation steps

1. Create `PlanComparisonCard.vue` component.
2. Create `DrawerPlanComparison.vue` (or extend `DrawerPlanInfo` with a comparison variant).
3. Define `plan-features.js` with hardcoded feature lists per tier.
4. Wire "Upgrade" CTA → closes this drawer, opens upgrade drawer.
5. Wire "Contact Sales" → mailto/link (confirm target with user).
6. Tests.

## 7. Test plan

TODO at activation.

## 8. Telemetry & rollback

TODO at activation.

## 9. Definition of Done

Default DoD + visual match with Figma.

## Amendments
