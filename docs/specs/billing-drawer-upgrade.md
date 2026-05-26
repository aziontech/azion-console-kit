# billing-drawer-upgrade — Upgrade drawer with default payment method

> status: done
> owner: @HerbertJulio
> completed-at: 2026-05-26 (composable + summary block done; DrawerPlanInfo wiring deferred)
> branch: refactor/ENG-37160-billing-rewrite
> commits: []
> figma: [https://www.figma.com/design/76eAHzSS7et4fywMISotw6/console.azion.com?node-id=314-18499&m=dev]
> prereq: [prework-services-v4-cleanup, billing-cards-pro]
> related-memories: reference-so-api-v4-contract, reference-so-lifecycle-flows, project-eng37432-payment-method-ui
> completed-at:

## 1. Why

PRO/m → PRO/y upgrade drawer gains a new capability: surface the customer's default payment method with the option to swap. Today the form is always blank. This eliminates re-entry friction for existing paying customers and aligns with the Stripe "Use •••• 4894 / Pay another way" pattern.

## 2. Out of scope

- Plans drawer redesign (separate specs `billing-drawer-plans-{hobby,pro}`)
- Downgrade drawer (separate spec)
- New payment method creation as a tab (no longer exists)

## 3. Contracts

- `useCheckoutSessionPreparer.prepare({plan:'pro', preferredCycle})` for client_secret
- New `usePaymentMethods()` → `{ defaultCard, allCards, isLoading }` backed by `paymentService.listCreditCards` (default card flagged)
- `useCurrentSubscription.planChargeValue` + `usePlansList` for "Charged" card pricing summary

## 4. States & flows

Per Figma 314-18499, drawer (right side, ~1030px wide):
- **Header**: "Upgrade to Pro" + close (X)
- **Left sidebar** (~300px): description "Upgrade to **Pro** to power your businesses with advanced security and compliance.", "Upgrade features" list (8 items with green check + descriptive sub-line like "100 Workloads / then $0.10 per workload per month"), links "Learn more about Pricing" + "Compare Plans".
- **Right** (stacked cards):
  - **Card "Charged"** with Monthly/Yearly toggle (Yearly default selected per design). Lines: Next Charge Value, Subtotal (per month), Yearly Discount (per month), separator, **Total $X per year/month** (highlight).
  - **Card "Payment Method"**: default PM summary OR full Stripe form. **States**:
    - DefaultCard exists → show `PaymentMethodSummary` (CardFlagBlock + last4 + exp) + secondary "Use another payment method" link. Submit uses existing default.
    - DefaultCard absent OR user clicked "Use another" → mount Stripe PaymentElement (same as today). Submit creates SetupIntent and uses new method.
    - Info banner: "Sensitive data is handled by a PCI-compliant payment partner." (blue tint)
  - **Card "Address Information"**: checkbox "Use same logged user information" (default checked). When unchecked, render existing `AddressInformationBlock` fields.
- **Footer**: Cancel (outline) + Upgrade (orange) — disabled until ready.

## 5. Reuse map

REUSE: `DrawerPlanInfo` shell, existing `PaymentMethodBlock` (Stripe Element), `CheckoutFeaturesBlock`, `PricingCalculationBlock`, `AddressInformationBlock`, `CheckoutSubmissionFooter`, `CardFlagBlock`, `useCheckoutSessionPreparer`.
NEW: `PaymentMethodSummary.vue` (default card chip + "Use another" toggle), `usePaymentMethods.js` (Vue Query wrap of `paymentService.listCreditCards({is_default:true})`).

## 6. Implementation steps

1. Add `usePaymentMethods` composable.
2. Add `PaymentMethodSummary.vue` block (CardFlagBlock + last4 + exp_month/exp_year, "Use another payment method" link).
3. Update `DrawerPlanInfo.vue`: branch in `PaymentMethodBlock` parent — if `defaultCard && !userOptedToSwap` show summary, else mount existing Stripe Element.
4. Update submit handler: if using default, skip Stripe form submit, call upgrade directly with default PM id.
5. Tests for `usePaymentMethods` and the branching logic.
6. Manual E2E in staging with Pro account (default card + swap path).

## 7. Test plan

TODO at activation. Must cover: default visible, swap path mounts full Stripe form, submit with default PM works, submit with new PM works.

## 8. Telemetry & rollback

TODO at activation.

## 9. Definition of Done

Default DoD + manual test with Pro account in staging covering both swap and use-default flows.

## Amendments
