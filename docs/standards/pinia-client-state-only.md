# Standard: pinia-client-state-only

> applies-to: src/stores/*.js
> enforced-by: eslint `azion-architecture/no-http-in-stores`
> related-specs: —

## Rule

Pinia stores MUST contain only client state (UI flags, session data, derived selectors). They MUST NOT make HTTP calls, import services, or transform API responses.

## Rationale

Stores that fetch break Vue Query's cache (no dedup, no refetch policy, no error boundary). They also create circular dependencies between stores and services. Server data belongs in Vue Query; the store may consume the query result via composables.

Reference: [architecture-governance.md](../architecture-governance.md) `no-http-in-stores`.

## Examples

```js
// BAD
export const useAccountStore = defineStore('account', {
  actions: {
    async loadInfo() {
      this.info = await accountService.getInfo()
    }
  }
})

// GOOD — composable fetches, store stores the result
const { data } = useAccountInfoQuery()
watch(data, (v) => accountStore.setInfo(v))
```

## Exceptions

- `account-data.js` (legacy hydration helper) is allowed to call services during the migration. Plan migration in a dedicated spec.
