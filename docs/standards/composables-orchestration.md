# Standard: composables-orchestration

> applies-to: src/composables/*.js
> enforced-by: eslint `azion-architecture/require-vue-query`
> related-specs: onboarding-prefetch-plans, onboarding-flow-hobby, onboarding-flow-pro

## Rule

Composables MUST orchestrate `service → adapter → Vue Query`. Server data MUST go through `useQuery` / `useMutation`. Components MUST NOT import services directly — only composables.

## Rationale

Vue Query provides cache, dedup, background refetch and centralized error handling. Bypassing it leads to duplicate requests, stale data and ad-hoc error handling in every component.

Reference: [architecture-governance.md](../architecture-governance.md) `require-vue-query` + `no-direct-http-in-components`.

## Examples

```js
// BAD — component calls service
const data = ref([])
onMounted(async () => { data.value = await listFoo() })

// GOOD — composable wraps Vue Query
export function useFoo() {
  return useQuery({
    queryKey: queryKeys.foo.list(),
    queryFn: () => fooService.list().then(FooAdapter.transformList)
  })
}
```

## Exceptions

- One-shot imperative fetches (ex: `ensureFooList()` for prefetch) MAY call services directly inside a query-aware wrapper like `queryClient.fetchQuery`, but must NOT be invoked from components.
