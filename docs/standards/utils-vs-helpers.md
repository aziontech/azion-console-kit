# Standard: utils-vs-helpers

> applies-to: src/utils/*, src/helpers/*
> enforced-by: manual review
> related-specs: —

## Rule

- `src/utils/*` MUST be pure functions (no side effects, no I/O, no DOM, no time).
- `src/helpers/*` MAY have side effects (read store, read DOM, fire toast, log).

## Rationale

The split lets reviewers reason about test surface immediately. Anything in `utils` should be unit-testable with no setup. Anything in `helpers` requires its environment and is typically tested via the composable that uses it.

## Examples

```js
// utils/format-date.js — pure
export const formatDate = (iso) => new Date(iso).toLocaleDateString('en-US')

// helpers/notify.js — side effect
import { useToast } from '@aziontech/webkit/use-toast'
export const notifySuccess = (msg) => useToast().add({ severity: 'success', summary: msg })
```

## Exceptions

- Files predating this standard may live in either folder; migrate when touched.
