# Architecture Governance System

Automated enforcement of architectural patterns via a custom ESLint plugin (`eslint-plugin-azion-architecture`) integrated into CI.

## Overview

The system ensures that new and modernized code follows the project's target architecture (Vue 3 + TanStack Vue Query + Pinia for client state). It uses a **progressive enforcement** strategy: modern code (`src/modules/`, `src/services/v2/`) is strictly enforced, while legacy code (`src/views/`, `src/services/`, `src/stores/`) is tracked with warnings only.

### How It Works

```
Developer pushes code
        │
        ▼
┌─────────────────────────┐
│   CI Pipeline (PR)      │
│                         │
│  1. yarn build          │  ← Build integrity
│  2. yarn lint           │  ← Standard ESLint
│  3. yarn prettier       │  ← Formatting
│  4. yarn lint:           │
│     architecture:changed│  ← Architecture gate (BLOCKS PR)
│  5. yarn architecture:  │
│     report              │  ← Conformance report (informational)
└─────────────────────────┘
```

- **Step 4** only lints files changed in the PR. If any architecture rule fires as `error` on those files, the PR is blocked.
- **Step 5** scans the entire codebase and produces a markdown summary in the GitHub Actions job summary. It does not block the PR.

## Enforcement Tiers

| Tier       | Paths                                                                                                      | Errors           | Warnings              |
| ---------- | ---------------------------------------------------------------------------------------------------------- | ---------------- | --------------------- |
| **Modern** | `src/modules/**`, `src/services/v2/**`                                                                     | 3 TanStack rules | 3 best-practice rules |
| **Legacy** | `src/views/**`, `src/services/!(v2\|axios)/**`, `src/components/**`, `src/stores/**`, `src/composables/**` | None             | All 6 rules           |

**Exception:** `src/modules/azion-ai-chat/**` has `require-vue-query` and `no-try-catch-in-services` disabled (SSE streaming — Vue Query not applicable).

## Rules Reference

### Category: TanStack Performance Model (error in modern code)

These rules enforce that all server data flows through Vue Query, ensuring automatic caching, request deduplication, background refetching, and centralized error handling.

---

#### `no-direct-http-in-components`

> Components must not make HTTP calls directly. All server data must flow through composables that use Vue Query.

**Applies to:** files with role `component` (`.vue` files, files in `components/` or `views/`)

**What triggers it:**

- Importing any HTTP library (`axios`, `node-fetch`, `ky`, `ofetch`, etc.)
- Importing any service file (`@/services/*`, `*-service`)
- Calling `fetch()` or `window.fetch()`

**Allowed exceptions:**

- `*.types` / `*.contracts` imports (type-only)
- `*/errors*` imports (error utilities)
- `@/services/v2/*` imports (BaseService wraps Vue Query internally)

**Why:** Without this rule, components bypass the Vue Query cache layer. This leads to duplicate requests, stale data, and no automatic error handling. The correct flow is: `Component → Composable → Vue Query → Service`.

<details>
<summary>Examples</summary>

```vue
<!-- BAD -->
<script setup>
  import { listEdgeFunctions } from '@/services/edge-functions-services'

  const data = ref([])
  onMounted(async () => {
    data.value = await listEdgeFunctions()
  })
</script>

<!-- GOOD -->
<script setup>
  import { useListEdgeFunctions } from '@/modules/edge-functions/composables/useListEdgeFunctions'

  const { data, isLoading, error } = useListEdgeFunctions()
</script>
```

</details>

---

#### `no-http-in-stores`

> Pinia stores must contain only client state. They must not make HTTP calls or import services.

**Applies to:** files with role `store` (`*-store.js/ts`, files in `stores/`)

**What triggers it:**

- Importing any HTTP library or service file
- Calling `fetch()`

**Why:** Pinia manages client-side state (UI state, user preferences, feature flags). Server data belongs in Vue Query's cache. Mixing the two creates stale data, race conditions, and duplicated state management logic.

<details>
<summary>Examples</summary>

```js
// BAD — store fetching data
import { defineStore } from 'pinia'
import { listDomains } from '@/services/domains-services'

export const useDomainsStore = defineStore('domains', {
  actions: {
    async fetchDomains() {
      this.domains = await listDomains()
    }
  }
})

// GOOD — store holds only client state
import { defineStore } from 'pinia'

export const useDomainsStore = defineStore('domains', {
  state: () => ({
    selectedDomainId: null,
    filterText: ''
  })
})
```

</details>

---

#### `require-vue-query`

> Composables that import services must use Vue Query (`useQuery` / `useMutation`).

**Applies to:** files with role `composable` (`use*.js/ts`, files in `composables/`)

**What triggers it:**

- Composable imports a service but does not import `@tanstack/vue-query`
- Does not call `useQuery`, `useMutation`, `useEnsureQueryData`, or `usePrefetchQuery`

**Escape hatches:**

- Calling `.useQuery()`, `.useMutation()` etc. on a member expression (BaseService pattern) counts as compliant
- `azion-ai-chat` module is opted out entirely

**Why:** If a composable calls a service without Vue Query, it's just a wrapper that adds no value. Vue Query provides caching, error/loading states, retries, and background refetching automatically.

<details>
<summary>Examples</summary>

```js
// BAD — composable calls service directly
import { listEdgeFunctions } from '@/services/edge-functions-services'

export function useListEdgeFunctions() {
  const data = ref([])
  const load = async () => {
    data.value = await listEdgeFunctions()
  }
  return { data, load }
}

// GOOD — composable uses Vue Query
import { useQuery } from '@tanstack/vue-query'
import { listEdgeFunctions } from '@/services/edge-functions-services'

export function useListEdgeFunctions() {
  return useQuery({
    queryKey: ['edge-functions'],
    queryFn: listEdgeFunctions
  })
}
```

</details>

---

### Category: Layer Responsibility (warn in all code)

These rules enforce clean separation between architecture layers. They are warnings today and will be promoted to errors as the codebase matures.

---

#### `no-try-catch-in-services`

> Service files must not use try/catch. Let errors propagate to Vue Query's error handling.

**Applies to:** files with role `service` (`*-service.js/ts`, files in `services/`)

**Excluded:** base infrastructure files (`base/http`, `base/query`, `axios/makeApi`, `axios/errors`)

**Why:** Services are thin HTTP wrappers. When a service swallows an error with try/catch, Vue Query cannot detect the failure — so it won't retry, show error UI, or trigger `onError` callbacks. Errors should propagate naturally.

<details>
<summary>Examples</summary>

```js
// BAD — service swallows errors
export async function listDomains() {
  try {
    const { data } = await api.get('/domains')
    return data
  } catch (error) {
    console.error(error)
    return []
  }
}

// GOOD — let errors propagate
export async function listDomains() {
  const { data } = await api.get('/domains')
  return data
}
```

</details>

---

#### `services-http-only`

> Service files must only contain HTTP logic. No stores, composables, router, or DOM access.

**Applies to:** files with role `service`

**What triggers it:**

- Importing stores, composables, or router
- Accessing `document`, `localStorage`, or `sessionStorage`

**Excluded:** base infrastructure files

**Why:** Services have a single responsibility — making HTTP requests. When a service reads from a store or accesses the DOM, it creates hidden coupling that makes testing and refactoring harder.

---

#### `pure-adapters`

> Adapter files must be pure transformation functions. No HTTP calls, no side effects.

**Applies to:** files with role `adapter` (`*-adapter.js/ts`, files in `adapters/`)

**What triggers it:**

- Importing HTTP libraries or services
- Calling `fetch()`, `console.*`, `localStorage.*`, `sessionStorage.*`
- Accessing `document.*`
- Calling `this.http.*` methods

**Why:** Adapters transform data between API shape (`snake_case`, raw types) and app shape (`camelCase`, domain contracts). Side effects break testability — an adapter should be a pure function you can unit test with just input and output.

<details>
<summary>Examples</summary>

```js
// BAD — adapter with side effects
export function adaptDomain(apiDomain) {
  console.log('adapting domain', apiDomain)
  localStorage.setItem('lastDomain', apiDomain.id)
  return { id: apiDomain.id, name: apiDomain.name }
}

// GOOD — pure transformation
export function adaptDomain(apiDomain) {
  return {
    id: apiDomain.id,
    name: apiDomain.name,
    isActive: apiDomain.is_active
  }
}
```

</details>

---

### Category: Boundaries & Structure (disabled — ready for progressive adoption)

These rules are implemented and tested but currently disabled (`off`). They will be enabled progressively as the codebase is migrated.

---

#### `module-isolation`

> Modules must not import from other modules. Shared code goes to `@/components`, `@/stores`, or `@/composables`.

**Why:** Cross-module imports create tight coupling between features. If module A imports from module B, changes to B can break A unexpectedly.

---

#### `naming-convention`

> Files in modules must follow naming patterns: `*-service.js/ts`, `*-adapter.js/ts`, `use*.js/ts`, `*-store.js/ts`.

**Why:** Consistent naming makes the codebase navigable and enables tooling (like the path classifier) to automatically determine a file's role.

---

#### `type-separation`

> `.types.ts` (API raw types) and `.contracts.ts` (app contracts) must not import from each other.

**Why:** Types mirror the API response. Contracts define the app's domain model. The adapter is the bridge — if contracts import from types, the boundary between API and app domain is violated.

## How Files Are Classified

Every rule depends on two classifiers:

### Zone (determines enforcement level)

| Zone         | Paths                                 | Enforcement       |
| ------------ | ------------------------------------- | ----------------- |
| `module`     | `src/modules/<name>/`                 | error (blocks CI) |
| `v2-service` | `src/services/v2/`                    | error (blocks CI) |
| `store`      | `src/stores/`                         | warn (tracked)    |
| `legacy`     | `src/views/`, `src/services/<name>/`  | warn (tracked)    |
| `shared`     | `src/components/`, `src/composables/` | warn (tracked)    |

### Role (determines which rule applies)

| Role         | Detection                                          |
| ------------ | -------------------------------------------------- |
| `component`  | `.vue` extension, or in `components/`              |
| `service`    | `*-service.js/ts`, or in `services/` (not `base/`) |
| `adapter`    | `*-adapter.js/ts`, or in `adapters/`               |
| `composable` | `use[-A-Z]*`, or in `composables/`                 |
| `store`      | `*-store.js/ts`, or in `stores/`                   |
| `type`       | `*.types.js/ts` or `*.contracts.js/ts`             |

See [path-classifier.js](../eslint/plugin/lib/utils/path-classifier.js) and [import-resolver.js](../eslint/plugin/lib/utils/import-resolver.js) for implementation details.

## CLI Commands

```bash
# Run architecture lint on all files
yarn lint:architecture

# Run architecture lint only on files changed vs. a base branch
yarn lint:architecture:changed --base origin/dev

# Generate conformance report (markdown)
yarn architecture:report --format markdown

# Generate conformance report (JSON)
yarn architecture:report --format json

# Generate report with quality gate (exit 1 if score < threshold)
yarn architecture:report --format markdown --min-score 80
```

## CI Pipeline Integration

The architecture governance runs in the existing ESLint CI workflow (`.github/workflows/eslint.yml`):

1. **Architecture Lint (Changed Files)** — runs on every PR, only checks files in the diff. Exits with error if any architecture `error`-level rule is violated. This **blocks the PR**.
2. **Architecture Conformance Report** — runs on every PR, scans the full codebase and appends a markdown summary to the GitHub Actions job summary. This is **informational only** (`continue-on-error: true`).

## Conformance Report Scoring

The report scores each module/service individually:

```
Score = round((1 - filesWithViolations / totalFiles) * 100)
```

| Score | Status     |
| ----- | ---------- |
| 100   | Perfect    |
| >= 90 | Good       |
| >= 75 | Needs Work |
| < 75  | Critical   |

## Adding or Modifying Rules

1. Create the rule in `eslint/plugin/lib/rules/`
2. Add tests in `eslint/plugin/tests/`
3. Register the rule in `eslint/plugin/index.js`
4. Set default severity in `eslint/plugin/lib/configs/recommended.js`
5. Configure per-tier overrides in `.eslintrc.cjs`
6. Run tests: `yarn test:unit eslint/plugin/tests/`

## Project Structure

```
eslint/plugin/
├── index.js                     # Plugin entry — registers rules and configs
├── package.json                 # eslint-plugin-azion-architecture
├── lib/
│   ├── configs/
│   │   └── recommended.js       # Default severity per rule
│   ├── rules/
│   │   ├── no-direct-http-in-components.js
│   │   ├── no-http-in-stores.js
│   │   ├── require-vue-query.js
│   │   ├── no-try-catch-in-services.js
│   │   ├── services-http-only.js
│   │   ├── pure-adapters.js
│   │   ├── module-isolation.js
│   │   ├── naming-convention.js
│   │   └── type-separation.js
│   └── utils/
│       ├── path-classifier.js   # Zone + role detection from file path
│       └── import-resolver.js   # Import source categorization
└── tests/                       # One test file per rule

scripts/
├── lint-architecture-changed.cjs       # Diff-based PR gate
└── architecture-report/
    ├── index.cjs                       # CLI entry point
    ├── scanner.cjs                     # ESLint Node API runner
    ├── scorer.cjs                      # Score calculation
    └── reporter.cjs                    # Markdown/JSON formatting
```
