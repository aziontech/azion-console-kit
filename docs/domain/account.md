# Domain: account

> owners: []
> source-of-truth: `accountStore` (Pinia) + `src/helpers/account-data.js` + `accountService.getAccountInfo`
> related-memories: project-eng37432-payment-method-ui

## Glossary

| Term | One-line meaning |
|---|---|
| Account | Tenant unit owning subscriptions, users, settings |
| Regular | Account tier without paid plan (Hobby-equivalent) |
| Not Regular | Account with paid plan (Pro-equivalent) |
| client_flags | Feature flags scoped per account |

## State model

(Fill when touched.)

## Boundaries

- **In**: hydration via `loadAccountHydration()` at login
- **Out**: `accountStore` getters consumed by guards, views, billing
- **Allowed importers**: anywhere (Pinia store)

## Open questions

- []
