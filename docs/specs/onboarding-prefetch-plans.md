# onboarding-prefetch-plans — Prefetch plans in account guard

> status: done
> owner: @HerbertJulio
> completed-at: 2026-05-26
> branch: refactor/ENG-37160-billing-rewrite
> commits: []
> figma: []
> prereq: []
> related-memories: reference-so-api-v4-contract

## 1. Why

When `needsOnboarding=true`, the guard redirects to `/signup/additional-data` and the user hits the checkout step a moment later. Currently the plans list fetches lazily on step 2, causing a loading flash. Prefetching during the guard transition eliminates the flash with zero additional requests (cache hit).

## 2. Out of scope

- Changing `usePlansList` behavior outside onboarding
- Hobby/Pro flow changes (separate specs)

## 3. Contracts

TODO at activation.

## 4. States & flows

TODO at activation. Edge: prefetch fails → do not block redirect; lazy fetch on step 2 is the fallback.

## 5. Reuse map

REUSE: `queryClient.prefetchQuery`, `usePlansService`, `prefetch-registrations.js`.

## 6. Implementation steps

TODO at activation.

## 7. Test plan

TODO at activation. Smoke: open devtools, login → additional-data, verify 0 network requests for plans on step 2.

## 8. Telemetry & rollback

TODO at activation.

## 9. Definition of Done

Default DoD + smoke proof of cache hit.

## Amendments
