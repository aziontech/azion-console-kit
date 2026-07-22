# CI Operations — gates, notificações e rotinas

> Fonte única do estado operacional do CI (spec `ci-maturity`, req 9.2).
> Atualize este arquivo sempre que um portão mudar de modo.

## 1. Status dos portões

| Portão | Modo HOJE | Modo alvo | Quando vira bloqueante |
| --- | --- | --- | --- |
| `pre-merge-gate` (agrega lint, security, governance, build, unit, contrato, functional) | **Informativo** — o GitHub ainda não exige o check | **Required check** no branch protection | **✅ APROVADO pelo time (2026-07-22).** Aplicar IMEDIATAMENTE APÓS o merge do PR #3647 em `dev` — nunca antes (o job só existe no novo pre-merge.yml; exigir antes travaria todos os outros PRs). Passos na seção 2 |
| Drift de contrato pré-deploy (`deploy-stage`/`deploy-production`) | **Informativo** — `continue-on-error: true`; drift real notifica no Slack mas o deploy segue | Bloqueante (deploy para em drift real) | Mesma janela de observação; remover o `continue-on-error` (1 linha em cada deploy-*.yml) |
| Drift agendado (dias úteis 06:00 UTC) | Aviso via Slack | Aviso (permanece) | — |
| Mutation agendado (segundas 04:00 UTC) | Relatório (Stryker `break: null`) | Piso de score que quebra | Decisão após o relatório estabilizar |

⚠️ **Agendados só disparam do branch default (`dev`)**: os workflows de drift e
mutation passam a rodar de fato após o merge de `feat/versioning` → `dev`.
Verifique o primeiro run real em Actions após o merge (critério da spec, req 7.3).

## 2. Como ligar o bloqueio (branch protection)

Required check único e estável: **`pre-merge-gate`**. **Decisão já tomada
(2026-07-22): será bloqueante.** Sequência obrigatória:

1. Mergear o PR #3647 (`feat/versioning` → `dev`) — leva o novo `pre-merge.yml`.
2. IMEDIATAMENTE depois, um admin aplica a proteção (o token de CI local não tem
   a permissão *Administration*; use a UI ou o comando abaixo com token admin):

   **Pela UI**: Settings → Branches → Add branch protection rule → branch `dev` →
   marcar *Require status checks to pass* → buscar e selecionar `pre-merge-gate`
   → Save.

   **Por comando**:

```bash
gh api repos/aziontech/azion-console-kit/branches/dev/protection \
  --method PUT \
  --field required_status_checks[strict]=false \
  --field "required_status_checks[contexts][]=pre-merge-gate" \
  --field enforce_admins=false \
  --field required_pull_request_reviews[required_approving_review_count]=1 \
  --field restrictions=null
```

Escrito para "o branch de integração vigente": hoje `dev`; quando o modelo de
branches mudar (`main` + `release-x.y.z`), reaplicar trocando o branch no path.

## 3. Notificações de falha (Slack)

Falhas de agendados, drift real pré-deploy e deploys notificam via
`.github/actions/notify-failure`. Enquanto o webhook não for provisionado, o CI
mostra `::warning::` visível no run — nada quebra, mas ninguém é avisado.

**Provisionar (uma vez, por um admin do Slack + do repo):**

1. No Slack: criar um app (ou usar o existente do time) → *Incoming Webhooks* →
   ativar → *Add New Webhook to Workspace* → escolher o canal (ex.:
   `#console-kit-ci`) → copiar a URL.
2. No GitHub: `Settings → Secrets and variables → Actions → New repository
   secret` → nome `SLACK_CI_WEBHOOK_URL`, valor = a URL copiada.
3. Validar: `Actions → Versioning Contract Drift → Run workflow` (após estar no
   branch default) ou aguardar o próximo agendado.

## 4. Rodar o drift de contrato manualmente

Enquanto os agendados não estão no branch default (ou para investigar um alerta):

```bash
# stage
OPENAPI_SCHEMA_URL=https://stage-api.azion.com/v4/openapi/openapi.yaml yarn test:contract
# produção
OPENAPI_SCHEMA_URL=https://api.azion.com/v4/openapi/openapi.yaml yarn test:contract
```

Divergências conhecidas/aceitas ficam em `tests/contracts/known-drift.json`
(cada entrada com motivo e ação esperada do time de API).

## 5. Sync main → dev pós-release (runbook manual)

O robô `sync-main-to-dev` foi removido (estava desabilitado; o modelo de
branches futuro elimina o `dev`). Enquanto o `dev` existir, após um release em
`main`:

```bash
git checkout dev && git pull origin main && git push origin dev
```

Se houver conflito, resolva em um PR `main → dev` normal (passa pelo
`pre-merge-gate` como qualquer PR).

## 6. Mapa de workflows ativos

| Workflow | Dispara em | Papel |
| --- | --- | --- |
| `pre-merge.yml` | PR + push `dev` | O portão: lint ×3, build, unit, contrato → functional, gate |
| `complexity_check.yml` | PR para `dev`/`main` | Comentário informativo de complexidade (SCC pinado) |
| `deploy-stage.yml` | push `dev` | Deploy stage (+ drift pré-deploy informativo) |
| `deploy-production.yml` | push `main` | Deploy produção (+ drift pré-deploy informativo) |
| `deploy-storybook.yml` | push `dev` (paths storybook/) | Deploy do Storybook |
| `versioning-contract-drift.yml` | agendado (dias úteis 06:00 UTC) + manual | Drift contra OpenAPI publicado |
| `versioning-mutation.yml` | agendado (segundas 04:00 UTC) + manual | Stryker nos módulos de versionamento |
| `assign-pr.yml` / `cla.yml` / `package-audit.yaml` | PR | Automação de PR / CLA / auditoria de dependências |
