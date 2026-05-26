# billing-downgrade-warning — Pending downgrade banner

> status: done
> owner: @HerbertJulio
> completed-at: 2026-05-26
> branch: refactor/ENG-37160-billing-rewrite
> commits: []
> figma: [https://www.figma.com/design/76eAHzSS7et4fywMISotw6/console.azion.com?node-id=314-39820&m=dev, https://www.figma.com/design/76eAHzSS7et4fywMISotw6/console.azion.com?node-id=314-39818&m=dev]
> prereq: [prework-metadata-decision, billing-cards-pro]
> related-memories: reference-so-lifecycle-flows
> completed-at:

## 1. Why

The pending-downgrade banner currently reads `metadata.status` / `metadata.effective_date` which no longer exist in the v4 response. Switch to the derived `downgradePending: { effectiveAt }` field exposed by the adapter (per `prework-metadata-decision`).

## 2. Out of scope

- Downgrade dialog redesign (separate spec)
- Cancel downgrade dialog (separate spec)

## 3. Contracts

`useCurrentSubscription.scheduledDowngrade` → `{ effectiveAt, mode } | null` (derived from `serviceOrder.downgradePending` per `prework-metadata-decision`).

## 4. States & flows

Per Figma 314-39820, full-width banner above billing cards when `scheduledDowngrade != null`:
- Icon: triangle warning (amber)
- Main text: "You scheduled a downgrade to <target plan> Plan on <formatted effectiveAt>." (white)
- Sub text: "Your usage limits will be reduced after this date." (gray)
- Right action: "Keep current plan" button (white outline) → opens `billing-dialog-cancel-downgrade`.

Hidden when `scheduledDowngrade == null` (no pending).

## 5. Reuse map

REUSE: `useCurrentSubscription` (consumes `downgradePending` derived in pre-work), `DowngradePendingBanner` component (full redesign per Figma).
NEW: helper to resolve target plan name from `downgradePending` (lookup in `usePlansList`).

## 6. Implementation steps

1. Refresh `DowngradePendingBanner.vue` visuals per Figma (amber tint, layout).
2. Read `scheduledDowngrade.mode` to compute target plan label ("Hobby" when mode=cancel_at_period_end, looked-up plan when mode=schedule).
3. Format `effectiveAt` with existing date helper (`formatDateToDayMonthYearHour` or similar).
4. Wire "Keep current plan" → opens `DialogCancelDowngrade` (covered by spec 4.9).
5. Test: render with/without scheduledDowngrade, format edge cases.

## 7. Test plan

TODO at activation. Must cover: no pending → banner hidden; pending → banner shows effective date; canceled → banner disappears.

## 8. Telemetry & rollback

TODO at activation.

## 9. Definition of Done

Default DoD + manual test in staging with a Pro account that has a scheduled downgrade.

## Amendments
