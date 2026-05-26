# Standard: services-http-only

> applies-to: src/services/v2/**/*-service.js
> enforced-by: eslint rule `azion-architecture/no-try-catch-in-services`
> related-specs: prework-services-v4-cleanup

## Rule

Services MUST perform HTTP only. They MUST NOT catch errors, transform shapes, or add business logic. Errors propagate to the composable layer where Vue Query handles them.

## Rationale

Try/catch in services hides errors from Vue Query's onError, breaks retry semantics, and forces every consumer to re-check status. Transformation in services couples the wire format to consumer expectations, making contract changes painful.

Reference: [architecture-governance.md](../architecture-governance.md) `no-try-catch-in-services`.

## Examples

```js
// BAD
listFoo = async () => {
  try {
    const { data } = await this.http.request({ method: 'GET', url: '/foo' })
    return data.map(transformFoo)
  } catch {
    return []
  }
}

// GOOD
listFoo = async () => {
  const response = await this.http.request({ method: 'GET', url: '/foo' })
  return FooAdapter.transformList(response.data)
}
```

## Exceptions

- `getAccountPlanStatus` style "reachability" probes that intentionally collapse errors to boolean. Document inline with a `_legacy` suffix until callers migrate.
- `src/modules/azion-ai-chat/**` (SSE streaming) per `architecture-governance.md` exception.
