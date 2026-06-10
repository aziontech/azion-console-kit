# Version Shell — Arquitetura

> **Status:** V1 implementado (Caminho B) — em validação.
> Este documento descreve a arquitetura efetivamente entregue pelas WUs 0–10
> do plano `docs/plans/version-shell/execution-plan.md`. Limitações conhecidas
> e gaps tratados em V1.5 estão listados na seção dedicada ao final.

## Contexto

Conforme `docs/RESOURCES.MD`, os resources versionáveis (Application, Firewall,
Function, Custom Pages, WAF, etc. — Workload segue caminho próprio)
compartilham um state machine. A API expõe, na prática, **7 estados literais**
(ver §"Decisões validadas" abaixo), que cobrem o ciclo de vida observado pela
UI.

A matriz de ações disponíveis depende do estado. Hoje, conforme
`docs/APPLICATION-FLOW.md`, o fluxo de Application **não tinha conceito de
versão na UI** — o usuário editava e salvava direto. Estender cada resource
para suportar o ciclo de vida completo de versionamento exigiria reimplementar
a mesma lógica em N lugares.

Este documento descreve a arquitetura da **casca de versionamento**
(`<VersionShell>`) — um componente reutilizável que centraliza:

- O conhecimento do estado da versão atual (vindo da API).
- As ações disponíveis em cada estado (Save, Save and Build, Cancel Build,
  Archive, New Draft From, Delete).
- A orquestração: traduzir a intenção do usuário em chamada de serviço.
- A editabilidade do form (read-only em estados imutáveis).

## Escopo

- **Primeiro consumidor:** Application (Edge Application v6).
- **Fora do escopo:** Workload — segue fluxo próprio, já consolidado em
  `docs/WORKLOAD-VERSIONING.md`.
- **Futuros consumidores:** demais resources versionáveis listados em
  `RESOURCES.MD` (Firewall, Functions, Custom Pages, WAF, etc.). A casca
  acomoda novos resources via um `VersionService` próprio implementando o
  typedef único, sem alteração no componente em si.

## Decisões validadas

### 1. State machine — 7 estados literais da API

A casca opera sobre os 7 estados literais retornados pela API
(`src/composables/versioning/version-states.js`), e **não** sobre os 9 estados
conceituais descritos em `docs/RESOURCES.MD`:

```
draft | building | ready | active | archived | cancelled | failed
```

Predicados auxiliares:

- `isEditable(state)` — `draft`, `cancelled`, `failed`.
- `isProcessing(state)` — `building` (UI faz polling com
  `refetchInterval: 3000ms` enquanto ativo).
- `isImmutable(state)` — `ready`, `active`, `archived`.
- `isTerminal(state)` — `archived`.

`cancelled` e `failed` são tratados como **estados de retomada do draft**: o
usuário continua editando o mesmo draft (não há criação automática de novo
draft).

### 2. Action vocabulary — 6 ações canônicas

Vocabulário fechado (`src/composables/versioning/version-actions.js`):

```
SAVE | SAVE_AND_BUILD | CANCEL_BUILD | NEW_DRAFT_FROM | ARCHIVE | DELETE
```

Ações como `deploy`, `rollback` e `download` **não fazem parte do contrato
V1** — não existem na API hoje. Quando/se forem adicionadas, entrarão como
extensões do vocabulário, sem quebrar consumidores existentes.

Regras de payload:

- `comment` é **obrigatório** em ARCHIVE.
- `comment` é **opcional** em SAVE_AND_BUILD (build) e CANCEL_BUILD.
- `trace_id` em build: UUID v4 gerado client-side se ausente do payload.
- `updateDraft` da casca usa **PATCH** (não PUT) — semântica de atualização
  parcial do draft.

### 3. Form sempre montado; editabilidade derivada do estado

A casca renderiza o form como conteúdo de tab. O estado decide a editabilidade
via `provide(VERSION_CONTEXT_KEY, { state, readOnly, version })`, lido pelos
forms descendentes através de `useVersionContext()`
(`src/composables/versioning/use-version-context.js`).

| Estado                          | Form                                |
| ------------------------------- | ----------------------------------- |
| `draft` / `cancelled` / `failed`| editável                            |
| `ready` / `active` / `archived` | read-only (mesmo componente)        |
| `building`                      | bloqueado por `ProcessingOverlay`   |

### 4. Casca é a controladora das ações

`<VersionActionBar>` mora **dentro da casca**, não no form. A casca conhece o
mapeamento *(estado atual, ação clicada) → método do service*. Forms
participam fornecendo valores/validação via `provideVersionFormApi`
(`src/templates/version-shell-block/use-version-form-api.js`):

```js
provideVersionFormApi({ submit, getValues, isDirty })
```

A tab que contém o form chama `provideVersionFormApi` no `setup`; a
`VersionActionBar` consome via `inject` ao despachar SAVE / SAVE_AND_BUILD.

### 5. Layout v6 — subpasta `v6/` (não `legacy/`)

Conforme `docs/V6-GUIDELINES.md`, a integração mora em
`src/views/EdgeApplications/v6/`. A view legada (`TabsView.vue`) permanece
intacta e é usada como fallback transparente quando `is_versioned: false`.

### 6. Casca consome um `VersionService` por resource

A camada de dados não é um "adapter da casca" — é um **typedef**
(`src/composables/versioning/types.js`) implementado por um `VersionService`
específico de cada resource. A casca importa apenas a interface; nunca
importa nada de `services/v2/<resource>/...` diretamente. O service injetado
em runtime é responsável por todas as chamadas HTTP, normalizações e
adaptações.

Adicionar um novo resource versionável = 1 `VersionService` novo + reuso
total da casca.

### 7. Roteamento por flag

O fork v6 está em `src/router/routes/edge-application-routes/index.js`,
gateado por `hasFlagUseV6Configurations()`. A flag `hasFlagBlockApiV4` (v3 vs
legacy) continua independente — ver "Limitações conhecidas".

## Contrato `VersionService` (typedef)

`src/composables/versioning/types.js` define a interface implementada por
todos os version-services. As 9 assinaturas:

```ts
listVersions(resourceId): Promise<Version[]>
loadVersion(resourceId, versionId): Promise<Version>
createDraft(resourceId, body: CreateDraftBody): Promise<Version>
updateDraft(resourceId, versionId, values): Promise<Version>
patchDraft(resourceId, versionId, partial): Promise<Version>
deleteVersion(resourceId, versionId): Promise<void>
build(resourceId, versionId, body?: BuildBody): Promise<void>
archive(resourceId, versionId, body: ArchiveBody): Promise<void>
cancelBuild(resourceId, versionId, body?: CancelBuildBody): Promise<void>
```

Todos os métodos recebem `resourceId` como primeiro argumento. Tipos auxiliares
(`Version`, `CreateDraftBody`, `BuildBody`, `ArchiveBody`, `CancelBuildBody`)
estão documentados no mesmo arquivo.

## Matriz estado × ação (final)

Mapa autoritativo (`src/composables/versioning/version-actions.js`):

```
draft     → SAVE, SAVE_AND_BUILD, NEW_DRAFT_FROM, DELETE
building  → CANCEL_BUILD
ready     → NEW_DRAFT_FROM, ARCHIVE, DELETE
active    → NEW_DRAFT_FROM, ARCHIVE, DELETE     (idêntico a ready em V1)
archived  → NEW_DRAFT_FROM, DELETE
cancelled → SAVE, SAVE_AND_BUILD, NEW_DRAFT_FROM, DELETE   (idêntico a draft)
failed    → SAVE, SAVE_AND_BUILD, NEW_DRAFT_FROM, DELETE   (idêntico a draft)
```

Racional:

- `active` herda o set de `ready`: ambos são imutáveis e construídos; a
  diferença é apenas tráfego servido, que não muda o que o usuário pode fazer
  pela casca em V1.
- `cancelled` e `failed` herdam de `draft`: são estados de retomada.
- `building` é um lock transiente; única saída pela UI é CANCEL_BUILD.
- `archived` não permite edição; só fork (`NEW_DRAFT_FROM`) ou DELETE.

## Arquitetura em camadas

```
┌──────────────────────────────────────────────────────────┐
│  Route component  (v6/EditView.vue)                       │
│  - Lê route params                                        │
│  - Carrega Application via edgeAppService                 │
│  - Se !is_versioned → renderiza TabsView legado           │
│  - Senão monta <VersionShell> + lista de tabs             │
└────────────────────┬─────────────────────────────────────┘
                     ▼
┌──────────────────────────────────────────────────────────┐
│  <VersionShell>  (src/templates/version-shell-block)      │
│  ──────────────────────────────────────────────────────  │
│  • Props: service, resourceId, versionId, tabs, title     │
│  • Usa vue-query internamente via useVersionShell()       │
│  • Owns: state da versão atual, polling em building       │
│  • Mapeia ação canônica × estado → método do service      │
│  • Renderiza: heading + ActionBar + Overlay + TabView     │
│  • Provê via inject:                                      │
│      - VERSION_CONTEXT_KEY  → { state, readOnly, version }│
│      - 'edgeApplication' / 'isApplicationLoaded'  (compat)│
└────────────────────┬─────────────────────────────────────┘
                     ▼
┌──────────────────────────────────────────────────────────┐
│  Tabs (consumer-supplied)                                 │
│  - MainSettingsTab usa o form versionado                  │
│  - Sub-tabs legadas (Origins, Cache, etc.) recebem        │
│    closures de version-services via props                 │
│  - Forms participam via provideVersionFormApi()           │
└──────────────────────────────────────────────────────────┘

Lateral (por resource):
┌──────────────────────────────────────────────────────────┐
│  edgeAppVersionService (e demais *VersionService)         │
│  - Implementa o typedef VersionService                    │
│  - Mora em src/services/v2/edge-app/...                   │
│  - Faz HTTP + adapt() das respostas                       │
└──────────────────────────────────────────────────────────┘
```

### Pontos-chave

- A casca é o **único** lugar que conhece *(estado, ação) → método do
  service*. Forms e rotas não conhecem essa lógica.
- O `VersionService` é o **único** lugar que conhece API/services do resource
  específico. A casca não importa nada de `services/v2/edge-app/...`.
- Adicionar um novo resource versionável = 1 `VersionService` novo + 1 view
  de rota nova + reuso total da casca.

## TBDs resolvidos

Cada item originalmente listado como TBD nas iterações de brainstorm foi
resolvido pelas WUs 0–10:

- **Vocabulário canônico de ações** → Resolvido em
  `src/composables/versioning/version-actions.js` (6 ações).
- **Matriz estado × ação** → Resolvido (mapa acima).
- **Contrato do adapter** → Reframado. Não existe "adapter da casca"; há um
  typedef `VersionService` (`src/composables/versioning/types.js`) que cada
  resource implementa em seu próprio service.
- **Contrato do form** → Resolvido via `provideVersionFormApi`
  (`src/templates/version-shell-block/use-version-form-api.js`).
- **Integração com TabsView atual** → Resolvido em
  `src/views/EdgeApplications/v6/EditView.vue`. 7 tabs configuradas: 5 com
  services versionados (Cache, Device Groups, Functions, Request Rules,
  Response Rules) + 2 com fallback legado (Origins, Error Responses — sem
  endpoint versionado na API).
- **Fluxo Create** → Permanece fora de V1 (Phase 7+).
- **Listagem de versões** → Permanece TBD (Phase 7+).
- **Loading e error UX** → Resolvido: `ProgressSpinner` no loading;
  `InlineMessage(severity="error")` no erro. Polling 3000ms durante
  `building` via vue-query `refetchInterval`.
- **Roteamento** → Resolvido em
  `src/router/routes/edge-application-routes/index.js` via fork
  `hasFlagUseV6Configurations()`.

## Limitações conhecidas em V1

1. **Sub-tabs ainda não consomem services versionados.** Os `*VersionService`
   closures são passados via `applicationTabs[].props` mas as ListViews
   legadas (`EdgeApplicationsCacheSettingsListView`,
   `...DeviceGroupsListView`, `...FunctionsListView`,
   `...RulesEngineListView`) importam services legados internamente.
   Resultado: **apenas Main Settings grava no draft**; sub-tabs ainda editam
   live (bypass de versionamento). Refactor das 4 sub-tab ListViews pra
   aceitar service-injection é trabalho de V1.5.

2. **Origins e Error Responses não têm endpoint versionado.** Sempre editam
   live — limitação da API atual. Documentado em WU0.

3. **`is_versioned` e `versionId` ainda não estão no `edge-app-adapter.js`.**
   O `v6/EditView.vue` lê esses campos defensivamente (probing múltiplos
   shapes: `isVersioned` / `is_versioned`; `versionId` / `version_id` /
   `activeVersionId` / `activeVersion.id` / `active_version.id`). Surface
   esses campos no adapter da Application é cleanup pendente.

4. **Estado `active` sem semântica explícita.** A API expõe `active` como
   possível estado mas não há endpoint pra transicionar a versão. Hipótese:
   derivado de Deployment. V1 trata `active` como `ready` na matriz de ações
   disponíveis.

5. **`hasFlagBlockApiV4` (v3 vs legacy) e `hasFlagUseV6Configurations` (v6)
   coexistem como flags independentes.** A v6 só ativa pra contas com
   `use_v6_configurations`; dentro da v6, o form continua honrando
   `hasFlagBlockApiV4` pra escolher entre v3 e legacy form fields.

6. **Inconsistência interna em queryKeys.** Alguns sub-resource
   version-services adicionaram entries ao `queryKeys.js` compartilhado
   (`cacheSettingsVersion`, `functionInstanceVersion`, `responseRulesVersion`,
   `version`); outros (request rules, device groups) usam queryKey inline.
   Não afeta funcionamento mas vale consolidar em cleanup V1.5.

## Mapa de arquivos implementados (V1, Caminho B)

### State machine (Phase 1)
- `src/composables/versioning/version-states.js`
- `src/composables/versioning/version-actions.js`
- `src/tests/composables/versioning/version-states.test.js`
- `src/tests/composables/versioning/version-actions.test.js`

### Contrato + Services (Phase 2)
- `src/composables/versioning/types.js`  (typedef `VersionService`)
- `src/services/v2/edge-app/edge-app-version-service.js`
- `src/services/v2/edge-app/edge-app-version-adapter.js`
- `src/services/v2/edge-app/edge-app-cache-settings-version-service.js`
- `src/services/v2/edge-app/edge-app-device-group-version-service.js`
- `src/services/v2/edge-app/edge-application-functions-version-service.js`
- `src/services/v2/edge-app/edge-app-request-rules-version-service.js`
- `src/services/v2/edge-app/edge-app-response-rules-version-service.js`
- `src/tests/services/v2/edge-app/*-version-service.test.js` (6 testes)

### VersionShell (Phase 3)
- `src/templates/version-shell-block/index.vue`
- `src/templates/version-shell-block/use-version-shell.js`
- `src/templates/version-shell-block/use-version-form-api.js`
- `src/templates/version-shell-block/components/VersionStateBadge.vue`
- `src/templates/version-shell-block/components/VersionActionBar.vue`
- `src/templates/version-shell-block/components/ProcessingOverlay.vue`
- `src/templates/version-shell-block/components/VersionActionDialog.vue`
- `src/tests/templates/version-shell-block/*.test.js` (5 testes)

### Form context (Phase 4)
- `src/composables/versioning/use-version-context.js`
- `src/views/EdgeApplications/V3/FormFields/FormFieldsCreateEdgeApplications.vue` (modificado)

### Integração Application V6 (Phase 5)
- `src/views/EdgeApplications/v6/EditView.vue`
- `src/views/EdgeApplications/v6/tabs/MainSettingsTab.vue`
- `src/router/routes/edge-application-routes/index.js` (modificado — fork)

### Modificações em compartilhados
- `src/services/v2/base/query/queryKeys.js` (entries `application.version`,
  `cacheSettingsVersion`, `functionInstanceVersion`, `responseRulesVersion`)

## Referências

- `docs/RESOURCES.MD` — state machine conceitual e matriz de ações por estado.
- `docs/APPLICATION-FLOW.md` — fluxo de Application antes da casca.
- `docs/V6-GUIDELINES.md` — regras gerais para features v6.
- `docs/WORKLOAD-VERSIONING.md` — implementação de referência do Workload
  (fluxo próprio, fora do escopo desta casca).
- `docs/plans/version-shell/plan-v1.md` — plano conceitual.
- `docs/plans/version-shell/execution-plan.md` — plano de execução (WUs 0–11).
