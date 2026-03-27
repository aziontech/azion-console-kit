# AGENTS.md — Guidelines for Agentic Coding Agents

## Build, Lint, and Test Commands

### Development

```bash
yarn dev              # Start development server (Vite)
yarn build            # Production build
yarn preview          # Preview production build locally
```

### Testing

```bash
# Unit tests (Vitest)
yarn test:unit              # Interactive UI mode
yarn test:unit:headless     # Run tests in headless mode
yarn test:unit:coverage     # Run tests with coverage report

# Run a single test file
yarn test:unit:headless --run path/to/test.test.js

# Run tests matching a pattern
yarn test:unit:headless --run --reporter=verbose -t "describe block name"

# E2E tests (Cypress)
yarn test:e2e:run:dev      # Run E2E in dev environment
yarn test:e2e:open:dev     # Open Cypress interactive mode
```

### Linting & Formatting

```bash
yarn lint             # ESLint with auto-fix
yarn format           # Prettier format src/
yarn security-check   # Security-focused ESLint
yarn package-audit    # Check dependencies for vulnerabilities
```

## Project Overview

Vue 3 application using:

- **Vue 3** with `<script setup>` composition API
- **Pinia** for client state, **TanStack Vue Query** for server state
- **Vite** + **TypeScript** + **Vitest**
- **PrimeVue** component library with custom theming

## Important Rules

### NO COMMITS DURING EXECUTION

**Never make git commits during task execution.** Only commit when explicitly requested by the user. This ensures all changes are reviewed before being committed to version control.

### Architecture Reference

**Always read `docs/ARCHITECTURE.md` before creating or modifying files.** It contains the complete source of truth for patterns, naming conventions, and layer responsibilities.

## Code Style Guidelines

### File Naming Conventions

| Type           | Pattern                   | Example                    |
| -------------- | ------------------------- | -------------------------- |
| Directories    | `kebab-case`              | `user-settings/`           |
| Vue Components | `PascalCase.vue`          | `UserSettingsForm.vue`     |
| Views/Pages    | `PascalCase + View.vue`   | `MarketplaceView.vue`      |
| Composables    | `use + PascalCase.ts`     | `useMarketplaceList.ts`    |
| Services       | `kebab-case-service.ts`   | `marketplace-service.ts`   |
| Adapters       | `kebab-case-adapter.ts`   | `marketplace-adapter.ts`   |
| Stores Pinia   | `kebab-case-store.ts`     | `marketplace-store.ts`     |
| Types          | `kebab-case.types.ts`     | `marketplace.types.ts`     |
| Contracts      | `kebab-case.contracts.ts` | `marketplace.contracts.ts` |
| Tests          | `OriginalName.test.js`    | `list-service.test.js`     |
| Utils          | `kebab-case.ts`           | `format-date.ts`           |
| Helpers        | `kebab-case.ts`           | `clipboard-helper.ts`      |

### Code Naming Conventions

| Type                | Pattern                   | Example                           |
| ------------------- | ------------------------- | --------------------------------- |
| Variables/functions | `camelCase`               | `getUserById`, `isLoading`        |
| Types/Interfaces    | `PascalCase`              | `UserProfile`, `MarketplaceItem`  |
| Constants           | `UPPER_SNAKE_CASE`        | `API_BASE_URL`, `MAX_RETRIES`     |
| Composables         | `use` + `PascalCase`      | `useAuth`, `useMarketplaceList`   |
| Store IDs           | `kebab-case` string       | `defineStore('marketplace', ...)` |
| Event handlers      | `handle` + action         | `handleSubmit`, `handleDelete`    |
| Booleans            | `is`/`has`/`can`/`should` | `isLoading`, `hasPermission`      |

### Imports Order

```javascript
// 1. Vue core and ecosystem
import { ref, computed, inject } from 'vue'
import { storeToRefs } from 'pinia'

// 2. External libraries (TanStack, PrimeVue, etc.)
import { useQuery } from '@tanstack/vue-query'

// 3. Internal services and composables (alias @)
import { teamPermissionService } from '@/services/v2/team-permission'
import ContentBlock from '@/templates/content-block'

// 4. Types (type-only imports last)
import type { MarketplaceItem } from '../types/marketplace.contracts'
```

### Formatting (Prettier)

- **Semi**: No semicolons
- **Quotes**: Single quotes
- **Tab Width**: 2 spaces
- **Print Width**: 100 characters
- **Trailing Comma**: None
- **Vue Indent**: Script and style blocks indented

### TypeScript

- Use `interface` for object types, `type` for unions/intersections
- Avoid `any` — use `unknown` with type guards if needed
- Separate API types (`.types.ts`) from app contracts (`.contracts.ts`)

### Error Handling

- **Services**: NO try/catch — let errors propagate
- **Composables**: Handle errors via Vue Query's `onError`
- **Components**: Display error states, don't swallow errors
- Use centralized `parseApiError()` utility for consistent error messages

### Vue Component Structure

```vue
<script setup>
  // 1. Imports
  import { ref, computed, inject } from 'vue'

  // 2. Injects (for shared context)
  const tracker = inject('tracker')

  // 3. Props and Emits (type-based)
  interface Props {
    title: string
  }
  const props = defineProps<Props>()

  // 4. Local state
  const isLoading = ref(false)

  // 5. Computed
  const formattedTitle = computed(() => props.title.toUpperCase())

  // 6. Methods/Handlers
  function handleSubmit() { /* ... */ }
</script>

<template>
  <!-- Template content -->
</template>

<style scoped>
  /* Scoped styles only */
</style>
```

### Testing Patterns

```javascript
// Test file structure
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { functionToTest } from '@/path/to/module'

const fixtures = {
  mockData: { id: 1, name: 'Test' }
}

const makeSut = () => {
  const sut = functionToTest
  return { sut }
}

describe('ModuleName', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('should do something specific', async () => {
    const { sut } = makeSut()
    const result = await sut(fixtures.mockData)
    expect(result).toEqual({ expected: 'output' })
  })
})
```

### Architecture Layers

- **Services**: HTTP calls only, no try/catch, no transformation
- **Adapters**: Pure functions, API ↔ App conversion (snake_case → camelCase)
- **Composables**: Orchestrate service → adapter → Vue Query
- **Stores (Pinia)**: Client state ONLY (UI state, filters, preferences)
- **Components**: `< 200 lines`, use composition pattern with slots

### Module Isolation

- Modules in `src/modules/` do NOT import from each other
- Shared code goes to `src/shared/`
- Use provide/inject for cross-component context

## AI Agent Integration

This project uses specialized agents defined in `CLAUDE.md`:

- `@builder` — Create modules, components, services, tests
- `@reviewer` — Code review, architecture validation
- `@doctor` — Debug issues, trace errors
- `@migrator` — Migrate legacy code to modern patterns

Available skills include `/dev-create-module`, `/dev-create-component`, `/review-check-architecture`, and more.
