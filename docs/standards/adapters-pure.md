# Standard: adapters-pure

> applies-to: src/services/v2/**/*-adapter.js
> enforced-by: manual review
> related-specs: prework-metadata-decision

## Rule

Adapters MUST be pure functions: API ↔ App shape conversion (typically snake_case ↔ camelCase). They MUST NOT perform HTTP, access stores, throw, or read time/randomness without injection.

## Rationale

Pure adapters are trivially testable, deterministic, and reusable across composables. Side effects in adapters hide bugs (cache pollution, time-based flakes) and prevent the type system from describing the conversion accurately.

## Examples

```js
// BAD
const transform = (data) => {
  if (!data.plan_id) toast.error('missing plan')   // side effect
  return { planId: data.plan_id, fetchedAt: Date.now() }   // hidden time
}

// GOOD
const transform = (data) => ({
  planId: data.plan_id,
  startDate: data.start_date
})
```

## Exceptions

- Derived fields from arrays (ex: `downgradePending: deriveFromTransitions(data.transitions)`) are allowed and encouraged — the derivation itself stays pure.
- Adapters MAY accept injected dependencies (a `now()` function) when time is part of the contract.
