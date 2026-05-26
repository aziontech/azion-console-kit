# Standard: testing-conventions

> applies-to: src/tests/**
> enforced-by: manual review + vitest config
> related-specs: all

## Rule

- Unit tests for composables/adapters live in `src/tests/<area>/<file>.test.js`.
- Shared test factories and mocks live in `src/tests/kit/`.
- Each test file MUST be runnable in isolation (`yarn vitest run <path>`).
- `vi.mock(...)` calls MUST be at the top of the file, not inside `describe`.

## Rationale

A predictable test layout makes it cheap to add tests. A shared kit prevents copy-paste of QueryClient setup, vee-validate boilerplate, and service mocks across dozens of files.

## Examples

```js
// BAD — ad-hoc QueryClient setup per file
const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })

// GOOD — use the kit
import { createTestQueryClient } from '@/tests/kit'
const qc = createTestQueryClient()
```

## Exceptions

- E2E tests live under `cypress/` and follow Cypress conventions, not this standard.
