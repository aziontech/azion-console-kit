# Runbook — Azion Console Kit

> Operational guide: how to run, deploy, diagnose and recover the Console.
> Complements [CI-OPERATIONS.md](./CI-OPERATIONS.md) (pipeline operations) and
> [ARCHITECTURE.md](./ARCHITECTURE.md).

## 1. Service overview

| Item | Value |
| --- | --- |
| What | Azion Console — web management UI (static SPA) |
| Runtime | Azion Edge Platform (static bundle + edge functions) |
| Environments | Stage (push to `dev`) · Production (push to `main`) |
| Source of user impact | Bundle serving, Azion API v4 availability, feature flags |

## 2. Local development

```bash
yarn install:lock     # frozen lockfile install
yarn dev              # local dev server (Vite)
yarn build            # production build
```

Quality loop:

```bash
yarn lint && yarn prettier --check src/   # static
yarn test:unit:coverage                   # unit suite (~5 min)
yarn test:functional                      # real-browser suite (versioning)
yarn test:contract                        # OpenAPI drift (set OPENAPI_SCHEMA_URL)
```

Pre-commit hooks (husky) run eslint + security lint + prettier automatically.

## 3. Deploy

| Target | Trigger | Workflow |
| --- | --- | --- |
| Stage | push to `dev` | `.github/workflows/deploy-stage.yml` |
| Production | push to `main` | `.github/workflows/deploy-production.yml` |

The deploy job installs the Azion CLI, runs an **informational** contract-drift
check against the published OpenAPI spec, and publishes with
`azion deploy --auto --local`. A deploy failure notifies Slack (once
`SLACK_CI_WEBHOOK_URL` is provisioned — see CI-OPERATIONS §3).

### Rollback

The bundle is immutable per commit: **revert the offending commit** on the
target branch (`git revert <sha>` → push) and the deploy workflow republishes
the previous behavior. There is no manual server state to clean.

## 4. Diagnosing common failures

| Symptom | First checks |
| --- | --- |
| PR blocked on `pre-merge-gate` | Open the run summary — the consolidated report lists totals per suite and, on failure, WHICH test failed and WHY (see CI-OPERATIONS) |
| Deploy workflow red | Job log: CLI auth (`PLATFORM_KIT_TOKEN`), build env vars, Azion CLI output. Drift step is informational and never blocks |
| Console broken only for some accounts | Feature-flag fork: check `use_v6_configurations` in the account's `client_flags`; both flows are covered by `src/tests/flag-v6/` — reproduce with the flag toggled |
| API errors in the UI | Azion API v4 status; contract drift alerts (`tests/contracts/known-drift.json` documents accepted divergences) |
| Scheduled workflows silent | They only fire from the default branch; see CI-OPERATIONS §1 |

## 5. Monitoring & alerting

- **CI/deploy failures** → Slack via `.github/actions/notify-failure`
  (requires `SLACK_CI_WEBHOOK_URL` secret; absent = visible `::warning::`).
- **Runtime errors** → Sentry (DSN via `VITE_*_SENTRY` env at build).
- **Contract drift** → weekday-scheduled workflow + pre-deploy check.
- **Dependency vulnerabilities** → `package-audit` on PRs + `ci-security`
  (Semgrep/osv-scanner/Gitleaks/zizmor) + Dependabot updates.

## 6. Secrets & access

| Secret | Used by |
| --- | --- |
| `PLATFORM_KIT_TOKEN` | Azion CLI deploy auth |
| `STAGE_*` / `PROD_*` build vars | Vite build (Stripe, Sentry, SSO, Segment) |
| `SLACK_CI_WEBHOOK_URL` | Failure notifications |
| `AZION_PERSONAL_TOKEN` | Storybook deploy |

Rotation: platform tokens via the Azion RTM; repository secrets via GitHub
Settings → Secrets (admin). Never commit secrets — Gitleaks runs in
`ci-security` and the false-positive allowlist (`.gitleaks.toml`) is gated by
security-office through CODEOWNERS.

## 7. Escalation

| Area | Owner |
| --- | --- |
| Console codebase | Console squad (see CODEOWNERS `*` rule) |
| CI/CD standards | @aziontech/team-delivery-engineering |
| Security findings | @aziontech/security-office · security@azion.com |
| Azion platform/API incidents | Platform on-call (internal RTM) |
