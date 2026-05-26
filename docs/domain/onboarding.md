# Domain: onboarding

> owners: @HerbertJulio
> source-of-truth: `accountGuard` + `accountStore.needsOnboarding` + `useCheckoutSessionPreparer`
> related-memories: reference-so-api-v4-contract, reference-so-lifecycle-flows, project-eng37160-so-v4-migration

## Glossary

| Term | One-line meaning |
|---|---|
| First login | `account.first_login === true` (set server-side, cleared after onboarding completes) |
| Needs onboarding | `first_login && !hasAccountPlan` — guard redirects to `/signup/additional-data` |
| AdditionalDataView | The onboarding screen with 3 steps: form → checkout (Pro only) → success |
| Plan selection | User picks Hobby (free) or Pro (paid) inside the form |
| Checkout drawer | `DrawerPlanInfo` mounted in checkout step for Pro path |

## State model

```
login OK
   │
   ▼
accountGuard
   │
   ├─ needsOnboarding=false ──► home
   └─ needsOnboarding=true  ──► /signup/additional-data
                                    │
                                    ▼
                               Step 1: form
                                    │
                                    ├─ Hobby ──► CREATE SO ──► Step 3: success
                                    └─ Pro    ──► Step 2: drawer payment
                                                       │
                                                       ▼
                                                  CREATE or PATCH-if-DRAFT
                                                       │
                                                       ▼
                                                  Stripe confirm
                                                       │
                                                       ▼
                                                  Step 3: success
```

## Boundaries

- **In**: post-login session, account info, plan catalog (prefetched)
- **Out**: SO created/updated, `hasAccountPlan` flipped to true, redirect to home
- **Allowed importers**: `src/router/hooks/guards/`, `src/views/Signup/*`

## Open questions

- Whether `usePlans` localStorage signup state survives after first login (or should clear post-success).
- Idempotency story for PATCH-if-DRAFT race when user double-submits.
