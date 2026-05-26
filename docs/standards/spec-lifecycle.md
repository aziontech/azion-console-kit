# Standard: spec-lifecycle

> applies-to: docs/specs/*.md
> enforced-by: manual review + project-index.md sync
> related-specs: all

## Rule

Every spec MUST follow the lifecycle `draft → active → done` (or `abandoned`), and amendments MUST be append-only sections never rewriting past text.

## Rationale

A predictable lifecycle lets reviewers know what's safe to change, what's frozen, and where to look for the rationale of past decisions. Without append-only amendments, the spec becomes a moving target and the audit trail dies.

## Examples

```md
# BAD — rewriting past text
## 1. Why
[edited 2026-06-01: actually we are migrating because of X]

# GOOD — append-only
## 1. Why
Original rationale here.

## Amendment 2026-06-01
Re-scoped to also cover X. Reason: customer report #1234.
Impact: prereq `prework-foo` no longer required.
```

## Exceptions

- `_template.md` and `_retro-*.md` files are not specs and do not follow the lifecycle.
