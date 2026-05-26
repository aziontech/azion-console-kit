# Standard: module-isolation

> applies-to: src/modules/**
> enforced-by: eslint `azion-architecture/no-cross-module-import` (planned)
> related-specs: —

## Rule

Modules under `src/modules/*` MUST NOT import from each other directly. Cross-module communication MUST go through shared composables (`src/composables/`), shared services (`src/services/v2/`), or events.

## Rationale

Module isolation prevents the slow drift toward a single tangled blob. When two modules need to share, the shared concept belongs at a higher level (composable or service) — extracting it upfront keeps both modules independently shippable.

## Examples

```js
// BAD
import { useRealTimeMetrics } from '@/modules/real-time-metrics/composables/...'
// inside src/modules/billing/...

// GOOD — both modules consume a shared composable
import { useMetrics } from '@/composables/useMetrics'
```

## Exceptions

- Type-only imports across modules are tolerated until the type system is fully migrated.
