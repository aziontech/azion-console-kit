# eslint-plugin-azion-architecture

Custom ESLint plugin that enforces the project's architectural patterns. Loaded locally via `Module._resolveFilename` in `.eslintrc.cjs` — no npm publish required.

For the full rules documentation with examples, see [docs/architecture-governance.md](../../docs/architecture-governance.md).

## Rules

| Rule                           | Category  | Default | Description                                                    |
| ------------------------------ | --------- | ------- | -------------------------------------------------------------- |
| `no-direct-http-in-components` | TanStack  | error   | Components must use composables, not direct HTTP/service calls |
| `no-http-in-stores`            | TanStack  | error   | Pinia stores must not make HTTP calls                          |
| `require-vue-query`            | TanStack  | error   | Composables with service imports must use Vue Query            |
| `no-try-catch-in-services`     | Layer     | warn    | Services must not swallow errors with try/catch                |
| `services-http-only`           | Layer     | warn    | Services must only handle HTTP — no stores, DOM, or router     |
| `pure-adapters`                | Layer     | warn    | Adapters must be pure functions — no side effects              |
| `module-isolation`             | Boundary  | off     | Modules must not import from other modules                     |
| `naming-convention`            | Structure | off     | Files must follow naming patterns (`*-service`, `use*`, etc.)  |
| `type-separation`              | Structure | off     | `.types.ts` and `.contracts.ts` must not cross-import          |

## Utilities

- **`lib/utils/path-classifier.js`** — Determines a file's `zone` (module, legacy, shared) and `role` (component, service, adapter, etc.) from its path. Every rule uses this to decide whether to apply.
- **`lib/utils/import-resolver.js`** — Categorizes import sources (http, service, store, composable, dom, vue-query, other). Used by rules to detect violations.

## Running Tests

```bash
yarn test:unit eslint/plugin/tests/
```

## Adding a New Rule

1. Create `lib/rules/my-rule.js` — export an ESLint rule object with `meta` and `create`
2. Create `tests/my-rule.test.js` — use `RuleTester` (see `tests/helpers/rule-tester-setup.js`)
3. Register in `index.js`
4. Set default severity in `lib/configs/recommended.js`
5. Add per-tier overrides in root `.eslintrc.cjs`
