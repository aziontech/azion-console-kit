# <slug> — <Title>

> status: draft
> owner: @handle
> branch: refactor/ENG-37160-billing-rewrite
> commits: []
> figma: []
> prereq: []
> related-memories: []
> completed-at:

## 1. Why

2–4 lines. Problem + outcome. No marketing.

## 2. Out of scope

Explicit list of what this spec does NOT cover. Prevents scope creep.

## 3. Contracts

- API v4 endpoints used (request/response shape — link to memory, do not duplicate)
- Composables changed/created (signature, query key, return shape)
- Analytics events (name, payload)

## 4. States & flows

- Visual states (loading, empty, success, error, edge)
- Transitions (mermaid or short prose)
- Enumerated edge cases (DRAFT expired, race, manual refresh, etc.)

## 5. Reuse map

- REUSE: paths + reason
- EXTRACT: parts pulled out for future reuse
- NEW: strictly new code

## 6. Implementation steps

Numbered, commit-sized. Logical steps, not PR scripts.

1.
2.

## 7. Test plan

- Unit: what to test in `src/tests/...`
- Manual smoke: scenarios for QA in staging
- E2E (if applicable)

## 8. Telemetry & rollback

- Metrics/events to watch post-deploy
- How to revert (commit revert, no flag during pilot)

## 9. Definition of Done

- [ ] Commits pushed with `[spec:<slug>]` prefix
- [ ] CI green (build, lint, prettier, `lint:architecture:changed`)
- [ ] Unit tests cover composables/adapters
- [ ] Manual smoke in staging (Hobby + Pro)
- [ ] `project-index.md` updated
- [ ] Memories referenced (not duplicated)
- [ ] No code comments added
- [ ] Spec `status: done` + `completed-at` set

## Amendments

(append-only, format: `## Amendment YYYY-MM-DD` with reason + impact)
