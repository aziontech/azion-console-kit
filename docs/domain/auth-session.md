# Domain: auth-session

> owners: []
> source-of-truth: `@azion/js-auth` + `src/services/v2/base/auth/sessionManager.js` + cookie `azsid_*`
> related-memories: []

## Glossary

| Term | One-line meaning |
|---|---|
| Session | Authenticated client session backed by cookie |
| azsid_* | Production/stage session cookie name |
| SSO | Single sign-on via `sso.azion.com` |

## State model

(Fill when touched.)

## Boundaries

- **In**: login/signup flows, refresh token
- **Out**: session info to `accountStore`, redirect to login on 401
- **Allowed importers**: router guards, HTTP client interceptor

## Open questions

- []
