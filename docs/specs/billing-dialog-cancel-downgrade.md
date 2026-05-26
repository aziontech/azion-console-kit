# billing-dialog-cancel-downgrade — Cancel scheduled downgrade dialog

> status: done
> owner: @HerbertJulio
> completed-at: 2026-05-26 (already aligned with Figma — no code change needed)
> branch: refactor/ENG-37160-billing-rewrite
> commits: []
> figma: [https://www.figma.com/design/76eAHzSS7et4fywMISotw6/console.azion.com?node-id=314-52313&m=dev]
> prereq: [billing-dialog-downgrade, billing-downgrade-warning]
> related-memories: reference-so-lifecycle-flows
> completed-at:

## 1. Why

Dialog opened from the downgrade banner letting the user revert the scheduled downgrade. Calls the v4 cancel-downgrade endpoint and clears the banner.

## 2. Out of scope

- Scheduling a downgrade
- Cancel subscription (different action)

## 3. Contracts

- `useServiceOrders.cancelDowngrade({id, accountId})` for submit.

## 4. States & flows

Per Figma 314-52313, compact modal ~390x182:
- **Header**: "Cancel Scheduled Downgrade" + close
- **Body**: "Confirm to remove the scheduled downgrade. Your current plan will continue without changes."
- **Footer**: "Cancel" (outline) + "Keep current plan" (white solid, primary — confirms cancel of downgrade)

States: idle → submit → success closes dialog and removes banner / error inline.

## 5. Reuse map

REUSE: `DialogCancelDowngrade.vue` (refresh per Figma), `useServiceOrders.cancelDowngrade`, webkit `PrimeDialog`.

## 6. Implementation steps

1. Refresh `DialogCancelDowngrade.vue` per Figma (compact, 1-paragraph body, 2 buttons).
2. Wire "Keep current plan" → `useServiceOrders.cancelDowngrade(...)`.
3. On success, invalidate SO cache so `useCurrentSubscription.scheduledDowngrade` becomes null and banner hides.
4. Tests.

## 7. Test plan

TODO at activation.

## 8. Telemetry & rollback

TODO at activation.

## 9. Definition of Done

Default DoD + visual match with Figma + staging smoke cancels scheduled downgrade and banner disappears.

## Amendments
