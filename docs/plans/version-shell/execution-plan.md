# VersionShell — Plano de Execução (multi-agent)

> **Propósito:** roteiro enxuto pra execução. Para arquitetura, hierarquia de
> componentes, fluxos e diagramas, ver `docs/plans/version-shell/plan-v1.md`
> e `docs/VERSION-SHELL.md`.
>
> **Fontes de verdade:**
> - Endpoints: `docs/api/APPLICATIONS.md`
> - Layout de arquivos v6: `docs/V6-GUIDELINES.md`
> - Arquitetura: `docs/VERSION-SHELL.md`

---

## Decisões fixas (não revisitar durante execução)

| Item | Decisão |
|---|---|
| Estados | 7 valores literais da API: `draft`, `building`, `ready`, `active`, `archived`, `cancelled`, `failed` |
| Ações canônicas | `SAVE`, `SAVE_AND_BUILD`, `CANCEL_BUILD`, `NEW_DRAFT_FROM`, `ARCHIVE`, `DELETE` |
| Layout de arquivos | Novos arquivos em `v6/` subpasta; legado intacto |
| Fork de rota | `hasFlagUseV6Configurations()` no `component:` da rota |
| Contrato VersionService | Métodos recebem `resourceId` como primeiro argumento |
| Save Draft | PATCH (parcial), não PUT |
| Polling Building | `refetchInterval: 3000` quando `isProcessing(state)` |
| `trace_id` em build | UUID v4 gerado no client se ausente |
| Tab dirty navigation | Reusar `src/templates/dialog-unsaved/` existente |
| Casca encapsula | PageHeadingBlock + VersionActionBar + ProcessingOverlay + TabView |
| Adapters de sub-resources | REUSAR os legados (schemas idênticos) |
| `active` na matriz V1 | Tratado como `ready` (mesmas ações disponíveis) |
| `is_versioned: false` | Fallback transparente pra TabsView legado no `v6/EditView.vue` |

## Bloqueador conhecido

**WU0** (investigação) deve rodar **antes** de WU9 (integração da página) — não trava as demais fases. Resultado decide se as tabs Origins e Error Responses entram, ficam ocultas, ou herdam endpoint legado.

---

## Work units

Cada work unit (WU) é uma unidade discreta despachável pra um agente. Contém:
- **Inputs:** o que precisa estar pronto antes
- **Outputs:** arquivos entregues
- **Agente sugerido**

### WU0 — Investigação: Origins / Error Responses

- **Inputs:** nenhum
- **Agente:** `Explore`
- **Tarefa:** investigar como `src/services/edge-application-origins-services/` e o service de Error Responses funcionam hoje. Verificar se há endpoint próprio ou se vivem embebidos em `Application`. Reportar qual dos 3 cenários se aplica:
  - (a) embebidos no objeto Application → versionam automaticamente via PUT/PATCH da version
  - (b) endpoint legado dedicado sem versão equivalente → bypass conhecido
  - (c) deferir tabs para V2
- **Output:** relatório curto (não código). Bloqueia escolha final de tabs em WU9.

### WU1 — State machine

- **Inputs:** nenhum
- **Agente:** `builder`
- **Outputs:**
  - `src/composables/versioning/version-states.js` (~40 LOC) — enum dos 7 estados literais da API + predicados `isEditable` (draft/cancelled/failed), `isProcessing` (building), `isImmutable` (ready/active/archived), `isTerminal` (archived).
  - `src/composables/versioning/version-actions.js` (~70 LOC) — enum de 6 ações canônicas + mapa `STATE_ACTIONS: Record<State, Action[]>`. `active` herda mesmas ações de `ready`.
  - `src/tests/composables/versioning/version-states.test.js` (~50 LOC) — cada predicado.
  - `src/tests/composables/versioning/version-actions.test.js` (~120 LOC) — cobre cada célula da matriz estado×ação.

### WU2 — Contrato VersionService

- **Inputs:** nenhum
- **Agente:** `builder`
- **Outputs:**
  - `src/composables/versioning/types.js` (~30 LOC) — JSDoc typedef `VersionService` com assinaturas: `listVersions(rid)`, `loadVersion(rid, vid)`, `createDraft(rid, body)`, `updateDraft(rid, vid, values)`, `patchDraft(rid, vid, partial)`, `deleteVersion(rid, vid)`, `build(rid, vid, body)`, `archive(rid, vid, body)`, `cancelBuild(rid, vid, body?)`.

### WU3 — Application version service

- **Inputs:** WU2 (typedef)
- **Agente:** `builder`
- **Outputs:**
  - `src/services/v2/edge-app/edge-app-version-service.js` (~120 LOC) — estende `BaseService`. Endpoints `/edge_application/api/applications/{rid}/versions/...`. JSDoc `@implements {VersionService}`. PATCH para `patchDraft`; UUID v4 client-side para `trace_id` se omitido em `build`.
  - `src/services/v2/edge-app/edge-app-version-adapter.js` (~80 LOC) — `transformLoadVersion`, `transformListVersions`, `transformDraftPayload`.
  - `src/tests/services/v2/edge-app/edge-app-version-service.test.js` (~120 LOC) — mocks dos endpoints; valida URL, método HTTP e payload de cada método.

### WU4.1 a WU4.5 — Sub-resource version services (5× paralelos)

- **Inputs:** nenhum (independentes entre si e do resto)
- **Agente:** `builder` (5 agentes em paralelo, um por sub-resource)
- **Padrão:** cada WU clona o service legado correspondente, substituindo apenas a URL base por `/applications/{rid}/versions/{vid}/<sub_resource>`. **Adapter do legado é importado e reusado** — sem novo arquivo de adapter.

| WU | Sub-resource | Service novo (~80 LOC) | Teste (~70 LOC) |
|---|---|---|---|
| WU4.1 | cache_settings | `edge-app-cache-settings-version-service.js` | `*.test.js` |
| WU4.2 | device_groups | `edge-app-device-group-version-service.js` | `*.test.js` |
| WU4.3 | functions | `edge-application-functions-version-service.js` | `*.test.js` |
| WU4.4 | request_rules | `edge-app-request-rules-version-service.js` | `*.test.js` |
| WU4.5 | response_rules | `edge-app-response-rules-version-service.js` | `*.test.js` |

Todos em `src/services/v2/edge-app/`; testes em `src/tests/services/v2/edge-app/`.

### WU5 — Componentes-folha da casca

- **Inputs:** WU1 (states/actions)
- **Agente:** `builder`
- **Outputs:** (em `src/templates/version-shell-block/components/`)
  - `VersionStateBadge.vue` (~50 LOC) — props `:state`. Cores: amarelo (draft), azul (building), verde (ready/active), cinza (archived), vermelho (failed/cancelled).
  - `ProcessingOverlay.vue` (~80 LOC) — `v-if="isProcessing(state)"`. Spinner + label "Building" + botão Cancel.
  - `VersionActionDialog.vue` (~80 LOC) — PrimeVue Dialog com textarea. Comment obrigatório quando `requireComment: true`; opcional caso contrário. Emit `confirm(commentText)`.
  - Testes correspondentes em `src/tests/templates/version-shell-block/` (~130 LOC totais).

### WU6 — Composables da casca

- **Inputs:** WU1, WU2
- **Agente:** `builder`
- **Outputs:**
  - `src/composables/versioning/use-version-context.js` (~20 LOC) — `useVersionContext()` retorna `{ state, readOnly, version }` via inject com defaults seguros.
  - `src/templates/version-shell-block/use-version-form-api.js` (~30 LOC) — helper `provideVersionFormApi({ submit, getValues, isDirty })`.
  - `src/templates/version-shell-block/use-version-shell.js` (~120 LOC) — composable interno. Recebe `service, resourceId, versionId`. Owns `useQuery(props.service.loadVersion)` com `refetchInterval` condicional; `useMutation` factory por ação; dispatch handler que mapeia `(state, action)` → `props.service[methodName](...)` com argumentos certos. Composição: SAVE_AND_BUILD = `patchDraft.then(build)`.

### WU7 — VersionActionBar

- **Inputs:** WU1, WU5 (precisa do dialog), WU6 (precisa do dispatch)
- **Agente:** `builder`
- **Outputs:**
  - `src/templates/version-shell-block/components/VersionActionBar.vue` (~150 LOC) — recebe `state + availableActions + dispatch`. Botão primário state-aware (Save and Build em draft; New Draft em ready). Secundários em overflow se >3. Abre `VersionActionDialog` quando ação requer comment.
  - `src/tests/templates/version-shell-block/version-action-bar.test.js` (~70 LOC).

### WU8 — VersionShell root

- **Inputs:** WU5, WU6, WU7
- **Agente:** `builder`
- **Outputs:**
  - `src/templates/version-shell-block/index.vue` (~300 LOC) — componente raiz. Props `:service, :resource-id, :version-id?, :tabs[], :title`. Compõe `PageHeadingBlock` (existente) + `VersionActionBar` + `ProcessingOverlay` + `TabView` (PrimeVue) com `<TabPanel v-for>`. `provide('versionContext', { state, readOnly, version })`. Lê inject `versionFormApi` da tab ativa. Espelha `provide('edgeApplication')` e `provide('isApplicationLoaded')` da TabsView legada para retrocompat com sub-tabs.
  - `src/tests/templates/version-shell-block/version-shell.test.js` (~150 LOC) — render, provide do versionContext, dispatch correto por estado, props de tabs renderizam.

### WU9 — Form context + modificação da Main Settings

- **Inputs:** WU6 (use-version-context)
- **Agente:** `builder`
- **Outputs:**
  - `src/views/EdgeApplications/V3/FormFields/FormFieldsCreateEdgeApplications.vue` (+30 LOC modif.) — consumir `useVersionContext()`, aplicar `:disabled="readOnly"` nos campos.

### WU10 — Integração Application V6

- **Inputs:** WU3, WU4.1-WU4.5, WU8, WU9, WU0 (define quais tabs entram)
- **Agente:** `builder`
- **Outputs:**
  - `src/views/EdgeApplications/v6/EditView.vue` (~180 LOC) — page wrapper. Importa `edgeAppVersionService` + 5 sub-resource version-services. Carrega a application via API existente; se `is_versioned === false`, renderiza `<TabsView />` legado e early-return. Caso contrário, monta `applicationTabs[]` (5–7 dependendo de WU0) e renderiza `<VersionShell>`.
  - `src/views/EdgeApplications/v6/tabs/MainSettingsTab.vue` (~50 LOC) — wrapper finíssimo do `V3/EditView.vue` que adiciona `provideVersionFormApi`. Não duplica lógica do form.
  - `src/router/routes/edge-application-routes/index.js` (+15 LOC modif.) — fork no `edit/:id/:tab?`:
    ```js
    component: () =>
      hasFlagUseV6Configurations()
        ? import('@views/EdgeApplications/v6/EditView.vue')
        : import('@views/EdgeApplications/TabsView.vue')
    ```

### WU11 — Atualização de docs

- **Inputs:** WU1-WU10 concluídos
- **Agente:** `docs`
- **Outputs:** `docs/VERSION-SHELL.md` (+150 LOC) — resolver TBDs com o que foi implementado: matriz com 7 estados reais, contrato `VersionService` enxuto, contrato do form, decisões finais.

---

## Grafo de dependências

```
WU0 ───────────────────────────────────────────► WU10
WU1 ────► WU5 ─┐
            │   ├─► WU7 ─┐
WU2 ──► WU3 ┤   │         ├─► WU8 ─┐
       │    │   ▼         │         ├─► WU10 ─► WU11
       │   WU6 ───────────┘         │
       │                            │
       │   WU6 ─► WU9 ──────────────┘
       │
       └─► WU4.1 ┐
           WU4.2 │
           WU4.3 ├─► WU10
           WU4.4 │
           WU4.5 ┘
```

## Estratégia de dispatch (orchestrator)

**Onda 1 — paralelo (até 8 agentes):**
- WU0 (Explore) — investiga Origins/ErrorResponses
- WU1 (builder) — state machine
- WU2 (builder) — typedef
- WU4.1 a WU4.5 (5× builders) — sub-resource services (independentes; usam apenas convenção, não dependem do typedef pra existir)

**Onda 2 (após WU1, WU2):**
- WU3 (builder) — Application version service (depende de WU2)
- WU5 (builder) — componentes-folha (depende de WU1)
- WU6 (builder) — composables da casca (depende de WU1, WU2)

**Onda 3 (após WU5, WU6):**
- WU7 (builder) — VersionActionBar
- WU9 (builder) — modificação da FormFields da Main Settings

**Onda 4 (após WU7):**
- WU8 (builder) — VersionShell root

**Onda 5 (após WU0, WU3, WU4.*, WU8, WU9):**
- WU10 (builder) — integração da página + router

**Onda 6 (após WU10):**
- WU11 (docs) — atualização da VERSION-SHELL.md

**Paralelização máxima:** Onda 1 com 8 agentes simultâneos; Onda 2 com 3; Onda 3 com 2.

---

## Custo estimado

- 19 arquivos novos + 12 testes + 2 modificados
- ~2370 LOC novas + ~45 LOC modificadas
- ~110–160k tokens (sequencial) → ~60–90k tokens com dispatch paralelo

## Guardrails durante execução

Conforme `CLAUDE.md`:
- Sem commits, stashes ou pushes.
- Sem `yarn test`, `yarn build` autônomos.
- Sem criar/trocar branches ou worktrees.
- Trabalhar no branch atual (`feat/versioning`).
- Cada agente edita só seus arquivos; nenhum agente edita arquivo de outro WU.

## Convenções para agentes builder

Cada agente builder recebe um WU e deve:

1. Ler `docs/VERSION-SHELL.md` (arquitetura) e o WU específico deste plano.
2. Ler arquivos similares já existentes pra seguir padrão (ex.: `edge-app-service.js` antes de criar `edge-app-version-service.js`).
3. Implementar exatamente os arquivos listados no WU (sem extras).
4. Não importar `user-flag.js` em views (gate é no router).
5. Não tocar arquivo de outro WU.
6. Concluir com um relatório de 2-3 linhas: arquivos criados/modificados + pendências (se houver).
