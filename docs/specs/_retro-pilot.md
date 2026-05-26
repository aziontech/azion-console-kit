# SDD Pilot — Retrospective

> wave: Onboarding + Billing Rewrite (ENG-37160)
> completed: 2026-05-26
> outcome: 16 specs done in one branch (`refactor/ENG-37160-billing-rewrite`)
> consolidated commit: d499e27e2 (plus follow-up edits pending commit)

## Numbers

| Metric | Value |
|---|---|
| Specs delivered | 16 done |
| Branches | 1 (no intermediate PRs) |
| Files changed | 101+ (initial commit; follow-ups pending) |
| Tests added | +14 (1377 total, +0 regressions) |
| Lint errors introduced | 0 |
| Decisions logged | 6 cross-cutting + ~10 tactical (resolved per spec) |
| Pre-commit hook fixed | Yes (BroadcastChannel race in setup-tests.js) |

## What worked

- **Pre-work before UI**. Splitting `prework-services-v4-cleanup` and `prework-metadata-decision` as their own specs unblocked the entire billing wave. Without them the UI specs would have hit broken services mid-way.
- **9 Figma designs read at once**. Bulk loading via `mcp__figma-remote-mcp__get_screenshot` in parallel was fast (~1 min total) and let every spec doc reference the exact node visually. Specs got useful "what to build" sections.
- **Bundling the cross-session work into one branch**. Skipping intermediate PRs avoided rebase-thrash during the 16-unit run. Rollback story stays clean: revert one merge commit.
- **Spec status lifecycle (`draft → active → done | abandoned`)**. Made it easy to see at a glance what was in flight. The `abandoned` status with an Amendment block captured why (`prework-graphql-removal`) — that history is more useful than deleting the file.
- **Reusing existing scaffolds (drawers, dialogs, CardBox, useToast)**. The 9 UI specs averaged ~200-400 lines because new code mostly composed existing primitives.
- **Source-of-truth primacy**. Pinning to PR #92 (`aziontech/service-order-api`) HEAD and re-reading the actual handler code prevented two false starts (variant A vs B routing, metadata derivation).

## What did not work

- **Initial assumption about backend contract**. The first read of PR #92 used the textual description; the actual `src/index.ts` registers everything under `/v4/service_orders/*`. Caught it, but cost one cycle. Lesson: always grep the route table, never trust the PR body.
- **`prework-metadata-decision` premise was wrong**. Assumed `transitions[]` would be exposed; PR #92 confirmed it is filtered. Pivot to "implement as-if backend exposes it" worked but documented the gap.
- **`prework-graphql-removal` got blocked**. Single missing endpoint (trial credit) is enough to keep an entire GraphQL service alive. Reactivation tracked in `prework-graphql-removal-v2`.
- **Pre-commit hook crashed on environmental BroadcastChannel issue**. Took two cycles before we identified and fixed it. The fix (one-line change in `setup-tests.js`) was trivial; the diagnostic loop wasn't.

## Decisions made (with rationale)

| Decision | Choice | Why |
|---|---|---|
| `metadata` exposure in adapter | Derived field `downgradePending` | Keeps the contract clean; backend can converge later without breaking consumers |
| Billing spec granularity | 9 specs | Smaller PRs (eventual), clearer review surface, blast radius per Figma node |
| M0/M1 scaffold scope | Full M1 (10 standards + 12 domain cards) | Forces governance upfront; stubs are cheap and self-documenting |
| Feature flag for new flow | None, hard cut-over on the branch | Branch is the rollback boundary; flag would have added dead code |
| One branch, no intermediate PRs | Confirmed by user | Eliminates rebase tax mid-pilot |
| PR #92 as authority | Confirmed by user | Resolved ambiguity between PR description and PR code |

## Caveats remaining

- Specs 4.5/4.6/4.7 wired in code but **not visually smoke-tested in staging**. Need a Hobby and a Pro account to validate.
- Spec 2.3 abandoned (see `prework-graphql-removal-v2` stub).
- BroadcastChannel test fix landed in this session (no commit yet) — `setup-tests.js` now calls the disabler at module top-level.

## M2 (skills) — Status

Per CLAUDE.md M2 wave, 8 skills planned. **4 implemented this session, 4 deferred.**

Implemented (available in `.claude/skills/`):
- `/spec-new` — copy template, fill front matter, register in project-index
- `/spec-task` — load spec, flip `draft → active`, brief on contracts/memories, RPI cycle
- `/spec-close` — verify DoD, collect commit SHAs, flip `active → done`, update index
- `/spec-amend` — append-only `## Amendment YYYY-MM-DD` block

| Skill | Recommendation | Why |
|---|---|---|
| `/spec-new` | Go | Manual copy of `_template.md` worked but the slug rules + project-index update are easy to forget. Worth automating. |
| `/spec-task` | Go | "Open a spec in a clean session and execute it" is the most repeated operation. Big leverage. |
| `/spec-close` | Go | Marking `done` + updating `project-index.md` + tagging commit SHA is the most-forgotten step. |
| `/spec-amend` | Go | Append-only Amendment is mechanically simple to script; humans tend to rewrite past text instead. |
| `/spec-refactor` | Defer | Refactors handled fine via `/spec-new` with a refactor-style template. Not worth a separate skill yet. |
| `/hotfix` | Defer | Hotfixes bypass SDD anyway; the retro doc is enough. |
| `/spec-retro` | Defer | One retro per wave; manual write-up gives better signal than automation. |
| `/component-request` | Defer | Webkit catalog is small; ad-hoc requests via Slack work. |

## Recommendations for M3 (CI sync-guard)

Add three CI checks:
1. **`project-index.md` sync** — fail if any spec under `docs/specs/` is `done` but not listed in the index (or vice-versa).
2. **Spec template conformance** — fail if a spec missing required sections (1–9 + Amendments).
3. **Commit prefix audit** — fail if a commit on a feature branch touches files mentioned in an `active` spec without the `[spec:<slug>]` prefix.

Not blocking, just CI-guarded. Estimated 1 day of scripting.

## Open questions

- Do we keep the `_scaffold-m1` "spec" entry in the index even though it's not a real spec? Currently kept for traceability of when the scaffold landed.
- The 10 standards stubs are minimal; should the next wave include filling them out with BAD/GOOD examples drawn from the pilot? My vote: yes, as a follow-up spec called `docs-standards-fill`.
- 12 domain cards: only `billing` and `onboarding` are fleshed out. The other 10 are stubs. Acceptable for the pilot; new specs touching those domains should fill them as a side-effect of the work.

## Action items (out-of-band)

- [ ] Smoke test in staging (Hobby + Pro accounts) — owner: @HerbertJulio. **Last step before PR.**
- [ ] PR `refactor/ENG-37160-billing-rewrite` → `dev` — only after smoke passes and everything else is closed.
- [ ] Implement 4 M2 skills (`/spec-new`, `/spec-task`, `/spec-close`, `/spec-amend`) — in progress this session.
