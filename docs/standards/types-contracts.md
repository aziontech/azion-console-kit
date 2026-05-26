# Standard: types-contracts

> applies-to: src/services/v2/**/*.types.ts, src/services/v2/**/*.contracts.ts
> enforced-by: manual review
> related-specs: prework-services-v4-cleanup, prework-metadata-decision

## Rule

Each v4 service MUST expose two type files: `*.types.ts` describes the raw API shape (snake_case as it comes off the wire) and `*.contracts.ts` describes the app contract (camelCase consumed by composables/components).

## Rationale

Splitting the wire shape from the app contract lets the adapter be the only place that translates. Components and composables import only `*.contracts`, never `*.types`. When the API changes, only the adapter and `*.types` need updating.

## Examples

```ts
// BAD — same file mixes both
export interface ServiceOrder {
  serviceOrderId: string  // app
  plan_id: string         // wire
}

// GOOD — separated
// service-orders.types.ts
export interface ServiceOrderApi { id: string; plan_id: string }

// service-orders.contracts.ts
export interface ServiceOrder { serviceOrderId: string; planId: string }
```

## Exceptions

- Pure JS services may delay the `.ts` split until migration. Use JSDoc to mark the boundary.
