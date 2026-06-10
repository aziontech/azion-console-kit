# VersionShell — Plano V1 (Caminho B)

> **Status:** rascunho em construção. Plano consolidado da conversa de
> brainstorm, revisão da arquitetura, e análise da API real (APPLICATIONS.md,
> FIREWALL.md).
>
> Referências:
> - `docs/api/APPLICATIONS.md` — endpoints reais (fonte de verdade).
> - `docs/api/FIREWALL.md` — endpoints reais do Firewall (validação multi-resource).
> - `docs/VERSION-SHELL.md` — arquitetura validada (decisões + TBDs).
> - `docs/V6-GUIDELINES.md` — regras de organização de arquivos v6.
> - `docs/RESOURCES.MD` — state machine **conceitual** (referência narrativa).
> - `docs/APPLICATION-FLOW.md` — estado atual de Application.
>
> **Nota:** quando `RESOURCES.MD` divergir da API, **a API vence**. A spec é
> conceitual; a API é o que codamos.

---

## 1. Overview

Implementar a `<VersionShell>`: casca reutilizável que **encapsula
PageHeadingBlock + ActionBar + TabView + ProcessingOverlay**, controla a
máquina de estados de versionamento e despacha ações via service por resource.

V1 entrega Application como primeiro consumidor **com UX completa** (Caminho B):
todas as 7 tabs do TabsView atual ficam acessíveis na v6, usando endpoints
versionados nos sub-recursos. Layout `v6/` em subpasta (conforme
`V6-GUIDELINES.md`), sem mexer no código legado existente.

## 2. Requirements

- Componente `<VersionShell>` reutilizável, agnóstico de resource.
- State machine alinhada à API real (7 estados: `draft`, `building`, `ready`,
  `active`, `archived`, `cancelled`, `failed`) + matriz estado×ação em código
  testável.
- Contrato `VersionService` documentado (JSDoc typedef) cobrindo apenas
  operações **existentes** na API de versão (load/list/create/update/patch/
  delete/build/archive/cancel). Operações ausentes (deploy, rollback, download)
  ficam fora do contrato.
- `edge-app-version-service.js` concreto integrando endpoints
  `/applications/{rid}/versions/...`.
- **5 sub-resource version-services** clonados dos legados, apontando para
  `/applications/{rid}/versions/{vid}/<sub_resource>` (cache_settings,
  device_groups, functions, request_rules, response_rules).
- Casca como componente de mais alto nível na hierarquia de edição:
  PageHeadingBlock + ActionBar + TabView (7 tabs) + ProcessingOverlay.
- `provide/inject` de `versionContext` (state, readOnly, version) para tabs
  e form-fields descendentes.
- Tabs com form expõem `versionFormApi` (submit/getValues/isDirty) via
  provide, consumido pela ActionBar para disparar submit no contexto certo.
- Dialog inline para ações que exigem `comment` (archive obrigatório; cancel
  e build opcionais).
- Integração na rota `edit/:id/:tab?` de Application via fork de componente
  (flag `use_v6_configurations`), **sem mover nenhum arquivo existente**.
- Testes unitários em `src/tests/` cobrindo state machine, services, e
  dispatch de ações pela casca.

## 3. Hierarquia de componentes encapsulada pela VersionShell

```
<RouterView>
  └── EditView.vue                          (src/views/EdgeApplications/v6/)
       │ • configura applicationTabs[]
       │ • instancia edgeAppVersionService + 5 sub-resource version-services
       │ • resolve title (nome da application)
       │ • checa is_versioned (fallback se false)
       │
       └── <VersionShell>                   (src/templates/version-shell-block/)
            │ props: :service, :resource-id, :version-id?, :tabs[], :title
            │ provides('versionContext'): { state, readOnly, version }
            │ injects (das tabs com form): versionFormApi { submit, getValues, isDirty }
            │
            ├── <PageHeadingBlock>                (existente, reusado)
            │    ├── título (props.title)
            │    └── <VersionStateBadge :state />
            │
            ├── <VersionActionBar>                (novo, em components/)
            │    │ recebe state + availableActions + dispatch
            │    ├── botão primário state-aware
            │    │     (Save and Build em draft, New Draft em ready, etc.)
            │    ├── botões secundários em overflow (Archive, Delete, ...)
            │    └── abre <VersionActionDialog> para ações que pedem comment
            │
            ├── <ProcessingOverlay v-if="isProcessing(state)">  (novo)
            │    ├── spinner
            │    ├── label do estado (Building)
            │    └── botão Cancel (com dialog de comment opcional)
            │
            └── <TabView>                         (PrimeVue, reusado)
                 │
                 ├── <TabPanel header="Main Settings">
                 │    └── <MainSettingsTab>        (novo, em v6/tabs/)
                 │         │ • provideVersionFormApi({ submit, getValues, isDirty })
                 │         │ • injeta versionContext → repassa readOnly
                 │         └── <FormFieldsCreateEdgeApplications>  (V3, modificado)
                 │              • lê useVersionContext()
                 │              • aplica :disabled="readOnly"
                 │
                 ├── <TabPanel header="Cache Settings">
                 │    └── <CacheSettingsListView />  (existente)
                 │         + service substituído por edgeAppCacheSettingsVersionService
                 │
                 ├── <TabPanel header="Device Groups">
                 │    └── <DeviceGroupsListView />   (existente)
                 │         + service edgeAppDeviceGroupVersionService
                 │
                 ├── <TabPanel header="Functions">
                 │    └── <FunctionsListView />      (existente)
                 │         + service edgeApplicationFunctionsVersionService
                 │
                 ├── <TabPanel header="Rules Engine — Request">
                 │    └── <RequestRulesListView />   (existente)
                 │         + service edgeAppRequestRulesVersionService
                 │
                 ├── <TabPanel header="Rules Engine — Response">
                 │    └── <ResponseRulesListView />  (existente)
                 │         + service edgeAppResponseRulesVersionService
                 │
                 └── <TabPanel header="Origins" / "Error Responses">
                      └── ⚠️ Investigar antes de Phase 5 — endpoints não
                          documentados em APPLICATIONS.md. Possibilidades:
                          (a) embebidos no objeto Application → versionados via
                              PUT/PATCH da version. (b) endpoint legado mantido.
                          (c) deferidos para V2.
```

### Componentes externos consumidos lateralmente

```
applicationTabs (config no EditView.vue v6)
   │
   └── [
        { key: 'main-settings',  label: 'Main Settings',
          component: MainSettingsTab,       props: { ... } },
        { key: 'cache-settings', label: 'Cache Settings',
          component: CacheSettingsListView, props: { service: cacheSettingsVersionSvc } },
        { key: 'device-groups',  label: 'Device Groups',
          component: DeviceGroupsListView,  props: { service: deviceGroupVersionSvc } },
        { key: 'functions',      label: 'Functions',
          component: FunctionsListView,     props: { service: functionsVersionSvc } },
        { key: 'request-rules',  label: 'Rules Engine — Request',
          component: RequestRulesListView,  props: { service: requestRulesVersionSvc } },
        { key: 'response-rules', label: 'Rules Engine — Response',
          component: ResponseRulesListView, props: { service: responseRulesVersionSvc } },
        // origins, error-responses: TBD
       ]

edgeAppVersionService (src/services/v2/edge-app/edge-app-version-service.js)
   │
   ├── listVersions(resourceId)
   ├── loadVersion(resourceId, versionId)
   ├── createDraft(resourceId, { sourceVersionId?, comment?, override? })
   ├── updateDraft(resourceId, versionId, values)                  // PUT full
   ├── patchDraft(resourceId, versionId, partial)                  // PATCH partial
   ├── deleteVersion(resourceId, versionId)
   ├── build(resourceId, versionId, { trace_id?, comment? })
   ├── archive(resourceId, versionId, { comment })                 // comment obrigatório
   └── cancelBuild(resourceId, versionId, { comment? })
   │
   └── consumido por <VersionShell> via props.service
        ├── use-version-shell.js → useQuery(props.service.loadVersion)
        └── use-version-shell.js → useMutation(props.service[action])
```

### Fluxo de uma ação (ex.: "Save and Build" em estado draft)

```
1. Usuário clica "Save and Build" em <VersionActionBar>
2. ActionBar chama dispatch('SAVE_AND_BUILD')
3. use-version-shell.js:
   3.1 — confere matriz: SAVE_AND_BUILD permitido em draft? ✓
   3.2 — pega versionFormApi injetada da tab ativa (MainSettingsTab)
   3.3 — versionFormApi.submit() → VeeValidate valida
   3.4 — versionFormApi.getValues() → payload
   3.5 — chama service.patchDraft(rid, vid, values).then(service.build(rid, vid))
   3.6 — vue-query invalida queryKey da versão; estado refetcha
4. State transita: draft → building → ready (ou failed) — server-driven
5. <ProcessingOverlay> aparece durante building (refetchInterval)
6. ActionBar e form re-renderizam reagindo a versionContext
```

### Multi-resource — uma casca, N services

Quando outros resources versionáveis (Firewall, WAF, Functions...) adotarem
a casca, o desenho fica:

```
            COMPONENTE COMPARTILHADO (escrito 1x, nunca duplica)
            ────────────────────────────────────────────────────
                          <VersionShell>
                          src/templates/version-shell-block/
                          • UI, state machine, dispatch
                          • completamente agnóstico de resource
                                       ▲
                                       │ props.service: VersionService
    ┌─────────────────────┬────────────┴────────┬─────────────────────┐
    │                     │                     │                     │
EditView.vue          EditView.vue         EditView.vue         EditView.vue
(Application)         (Firewall)           (WAF)                (...)
src/views/            src/views/           src/views/
EdgeApplications/v6/  Firewall/v6/         Wafs/v6/
```

**O contrato — escrito 1x, conforme por todos**

```
src/composables/versioning/types.js
─────────────────────────────────────
/**
 * @typedef {Object} VersionService
 * @property {(resourceId) => Promise<Version[]>}                   listVersions
 * @property {(resourceId, versionId) => Promise<Version>}          loadVersion
 * @property {(resourceId, body) => Promise<Version>}               createDraft
 * @property {(resourceId, versionId, values) => Promise<Version>}  updateDraft
 * @property {(resourceId, versionId, partial) => Promise<Version>} patchDraft
 * @property {(resourceId, versionId) => Promise<void>}             deleteVersion
 * @property {(resourceId, versionId, body) => Promise<void>}       build
 * @property {(resourceId, versionId, body) => Promise<void>}       archive
 * @property {(resourceId, versionId, body?) => Promise<void>}      cancelBuild
 */
```

**Implementações paralelas — cada service só conhece seus endpoints**

```
┌────────────────────────────────┬────────────────────────────────┐
│  edgeAppVersionService         │  firewallVersionService        │
│  src/services/v2/edge-app/     │  src/services/v2/firewall/     │
│                                │                                │
│  loadVersion(rid, vid) →       │  loadVersion(rid, vid) →       │
│    GET /edge_application/      │    GET /edge_firewall/api/     │
│    api/applications/{rid}/     │    firewalls/{rid}/            │
│    versions/{vid}              │    versions/{vid}              │
│                                │                                │
│  build(rid, vid, body) →       │  build(rid, vid, body) →       │
│    POST .../versions/{vid}/    │    POST .../versions/{vid}/    │
│    build                       │    build                       │
│                                │                                │
│  archive, cancelBuild,         │  archive, cancelBuild,         │
│  createDraft, patchDraft,      │  createDraft, patchDraft,      │
│  deleteVersion, listVersions   │  deleteVersion, listVersions   │
└──────────────▲─────────────────┴──────────────▲─────────────────┘
               └─── conformam ao ───────────────┘
                    VersionService typedef
```

**Como adicionar um novo resource (checklist)**

Quando Firewall entrar:

1. Backend confirma endpoints (já documentados em `FIREWALL.md`).
2. Criar `src/services/v2/firewall/firewall-version-service.js` (~120 LOC) —
   implementa cada método do contrato. JSDoc `@implements {VersionService}`.
3. Criar `firewall-version-adapter.js` (~80 LOC) — normalização das payloads.
4. **Sub-resources versionados** (Functions, Request Rules para Firewall):
   criar 1 version-service por sub-resource (~80 LOC cada).
5. Criar `src/views/Firewall/v6/EditView.vue` (~150 LOC) — page wrapper.
6. Criar tabs em `src/views/Firewall/v6/tabs/` para abas com form.
7. Fork no router de Firewall (mesmo padrão de Application).
8. Testes em `src/tests/services/v2/firewall/` e `src/tests/views/Firewall/v6/`.

## 4. File map final (V1, Caminho B)

```
src/
  composables/versioning/
    version-states.js              T1.1   ~40 LOC
    version-actions.js             T1.2   ~70 LOC  (matriz com 7 estados)
    use-version-context.js         T4.1   ~20 LOC
    types.js                       T2.1   ~30 LOC  (JSDoc typedef VersionService)

  services/v2/edge-app/
    edge-app-version-service.js                       T2.2   ~120 LOC
    edge-app-version-adapter.js                       T2.3   ~80 LOC
    edge-app-cache-settings-version-service.js        T2.5   ~80 LOC
    edge-app-device-group-version-service.js          T2.6   ~80 LOC
    edge-application-functions-version-service.js     T2.7   ~80 LOC
    edge-app-request-rules-version-service.js         T2.8   ~80 LOC
    edge-app-response-rules-version-service.js        T2.9   ~80 LOC
    (adapters dos sub-resources: REUSAR os legados, sem novos arquivos)

  templates/version-shell-block/
    index.vue                      T3.1   ~300 LOC
    use-version-shell.js           T3.5   ~120 LOC
    use-version-form-api.js        T3.6   ~30 LOC
    components/
      VersionStateBadge.vue        T3.2   ~50 LOC
      VersionActionBar.vue         T3.3   ~150 LOC
      ProcessingOverlay.vue        T3.4   ~80 LOC
      VersionActionDialog.vue      T3.10  ~80 LOC   (dialog inline pra comment)

  views/EdgeApplications/v6/
    EditView.vue                   T5.1   ~180 LOC  (config das 7 tabs + check is_versioned)
    tabs/
      MainSettingsTab.vue          T5.2   ~50 LOC

  router/routes/edge-application-routes/index.js     T5.3   +15 LOC modif.

  views/EdgeApplications/V3/FormFields/
    FormFieldsCreateEdgeApplications.vue             T4.2   +30 LOC modif.

src/tests/
  composables/versioning/
    version-states.test.js         T1.3   ~50 LOC
    version-actions.test.js        T1.4   ~120 LOC  (matriz estado×ação)

  services/v2/edge-app/
    edge-app-version-service.test.js                  T2.4   ~120 LOC
    edge-app-cache-settings-version-service.test.js   T2.10  ~70 LOC
    edge-app-device-group-version-service.test.js     T2.10  ~70 LOC
    edge-application-functions-version-service.test.js T2.10 ~70 LOC
    edge-app-request-rules-version-service.test.js    T2.10  ~70 LOC
    edge-app-response-rules-version-service.test.js   T2.10  ~70 LOC

  templates/version-shell-block/   ← pasta nova
    version-shell.test.js          T3.7   ~150 LOC
    version-action-bar.test.js     T3.8   ~70 LOC
    processing-overlay.test.js     T3.9   ~30 LOC
    version-action-dialog.test.js  T3.11  ~50 LOC

docs/
  VERSION-SHELL.md                 T6.1   +150 LOC modif. (resolve TBDs)
```

## 5. Task breakdown por fase

### Phase 1 — State machine (fundações)

| Task | Descrição |
|---|---|
| T1.1 | `version-states.js` — enum dos **7 estados reais da API**: `DRAFT`, `BUILDING`, `READY`, `ACTIVE`, `ARCHIVED`, `CANCELLED` (spelling britânico, conforme API), `FAILED`. Predicados: `isEditable` (DRAFT/CANCELLED/FAILED), `isProcessing` (BUILDING), `isImmutable` (READY/ACTIVE/ARCHIVED), `isTerminal` (ARCHIVED). |
| T1.2 | `version-actions.js` — enum de ações canônicas reduzido: `SAVE`, `SAVE_AND_BUILD`, `CANCEL_BUILD`, `NEW_DRAFT_FROM`, `ARCHIVE`, `DELETE`. **Removidos do plano anterior:** `PROMOTE`, `ROLLBACK`, `DOWNLOAD` (não existem na API de versão). Mapa `STATE_ACTIONS` derivado dos endpoints reais + matriz `RESOURCES.MD §4` (quando coerente). |
| T1.3 | `version-states.test.js` — cobre cada predicado. |
| T1.4 | `version-actions.test.js` — cobre cada célula da matriz estado×ação. Defesa contra regressão. |

### Phase 2 — Services versionados (Application + 5 sub-recursos)

| Task | Descrição |
|---|---|
| T2.1 | `types.js` — JSDoc typedef `VersionService` com assinaturas dos 9 métodos (load/list/create/update/patch/delete/build/archive/cancel). Todos recebem `resourceId` como primeiro argumento. |
| T2.2 | `edge-app-version-service.js` — implementação para Application versão. Estende `BaseService` (padrão do `edge-app-service.js`). Endpoints `/edge_application/api/applications/{rid}/versions/...`. |
| T2.3 | `edge-app-version-adapter.js` — normalização de versão (transformLoadVersion, transformListVersions, transformDraftPayload). |
| T2.4 | `edge-app-version-service.test.js` — mocks dos endpoints; valida cada método. |
| T2.5 | `edge-app-cache-settings-version-service.js` — clone do legado `edge-app-cache-settings-service.js` apontando para `/applications/{rid}/versions/{vid}/cache_settings`. **Adapter reusado** do legado (schemas idênticos por design da API). |
| T2.6 | `edge-app-device-group-version-service.js` — idem. |
| T2.7 | `edge-application-functions-version-service.js` — idem. |
| T2.8 | `edge-app-request-rules-version-service.js` — idem. |
| T2.9 | `edge-app-response-rules-version-service.js` — idem. |
| T2.10 | 5 testes correspondentes (`*-version-service.test.js`) — mocks dos endpoints, valida URL versionada. |

### Phase 3 — VersionShell (a casca)

| Task | Descrição |
|---|---|
| T3.1 | `index.vue` — componente raiz. Recebe `:service, :resource-id, :version-id?, :tabs[], :title`. Compõe PageHeadingBlock + VersionActionBar + ProcessingOverlay + TabView. Provê `versionContext`. |
| T3.2 | `VersionStateBadge.vue` — badge por estado (cor + label). Cores: amarelo (draft), azul (building), verde (ready/active), cinza (archived), vermelho (failed/cancelled). |
| T3.3 | `VersionActionBar.vue` — botões dinâmicos por estado. Primário state-aware; secundários em overflow se >3. Dispara `VersionActionDialog` para ações que pedem `comment`. |
| T3.4 | `ProcessingOverlay.vue` — spinner + label "Building" + Cancel quando aplicável. **Simplificado:** API não tem `queued` separado, só `building`. |
| T3.5 | `use-version-shell.js` — composable interno. Owns `useQuery` da versão (com `refetchInterval` quando `isProcessing(state)`), `useMutation` por ação, dispatch handler que chama `props.service[action]` com argumentos certos. |
| T3.6 | `use-version-form-api.js` — helper `provideVersionFormApi({ submit, getValues, isDirty })` para tabs com form expõem submit à casca. |
| T3.7 | `version-shell.test.js` — estado × ações visíveis, dispatch correto, provide do versionContext. |
| T3.8 | `version-action-bar.test.js` — renderização condicional, primary button por estado. |
| T3.9 | `processing-overlay.test.js` — visibilidade condicional, cancel handler. |
| T3.10 | `VersionActionDialog.vue` — dialog inline que coleta `comment` (obrigatório para Archive, opcional para Build/Cancel). |
| T3.11 | `version-action-dialog.test.js` — validação do comment, dispatch on confirm. |

### Phase 4 — Form context

| Task | Descrição |
|---|---|
| T4.1 | `use-version-context.js` — `useVersionContext()` retorna `{ state, readOnly, version }` (inject com defaults seguros). |
| T4.2 | `FormFieldsCreateEdgeApplications.vue` (V3) — consumir `useVersionContext()`, aplicar `:disabled="readOnly"` nos campos da Main Settings. |

### Phase 5 — Integração Application V6 (7 tabs com services versionados)

| Task | Descrição |
|---|---|
| T5.1 | `views/EdgeApplications/v6/EditView.vue` — page wrapper. Configura `edgeAppVersionService` + os 5 sub-resource version-services. Monta `applicationTabs[]` com 5–7 tabs (depende do que rolar pra Origins/Error Responses). Checa `is_versioned` da application; se `false`, renderiza fallback para TabsView legado. Renderiza `<VersionShell>`. |
| T5.2 | `views/EdgeApplications/v6/tabs/MainSettingsTab.vue` — wrapper finíssimo do `V3/EditView.vue` que adiciona `provideVersionFormApi` pra ActionBar disparar submit. Não duplica lógica do form. |
| T5.3 | `router/routes/edge-application-routes/index.js` — fork no `edit/:id/:tab?`: `hasFlagUseV6Configurations()` → `v6/EditView.vue` : `TabsView.vue` (intacto). |

### Phase 6 — Docs

| Task | Descrição |
|---|---|
| T6.1 | `VERSION-SHELL.md` — resolver TBDs: matriz com 7 estados reais, contrato do `VersionService` enxuto (sem deploy/rollback/download), contrato do form, layout `v6/`, escopo Caminho B (todas as tabs). Documentar divergência consciente entre `RESOURCES.MD` (conceitual) e API (implementação). |

## 6. Dependencies

```
Phase 1 ──┐
          ├─→ Phase 3 ──┐
Phase 2 ──┘             ├─→ Phase 5 ──→ Phase 6
          Phase 4 ──────┘
```

- Phase 1 e Phase 2 podem rodar em paralelo (fundações independentes).
- Dentro de Phase 2: T2.1–T2.4 (Application version-service) pode ir antes
  de T2.5–T2.10 (sub-resource version-services) ou em paralelo.
- Phase 3 consome 1 e 2 (precisa de states + actions + service contract).
- Phase 4 consome 3 (precisa do `versionContext`).
- Phase 5 consome 3, 4, e todos os services de Phase 2.
- Phase 6 documenta o que ficou.

## 7. Checkpoints

- **Após Phase 1:** matriz estado×ação em código + testada. Ground truth alinhada com API real.
- **Após Phase 2:** 6 services (1 Application + 5 sub-resources) testados contra mocks; contrato `VersionService` documentado.
- **Após Phase 3:** casca monta em isolamento (test harness ou storybook) com service mock.
- **Após Phase 5:** smoke test manual em `/applications/edit/:id` com conta v6 — todas as tabs funcionam, edits gravam na versão draft, ActionBar mostra ações certas por estado, Archive/Cancel pedem comment.

## 8. Risks

| Risco | Mitigação |
|---|---|
| **Origins / Error Responses sem endpoint versionado documentado** | Investigar antes de Phase 5. Possibilidades: (a) embebidos no objeto Application (versionam via PUT/PATCH da version) → sem service novo; (b) endpoint legado mantido → bypass de versionamento aceito como conhecido; (c) deferidos para V2 → tabs ocultas. **Bloqueia escopo final de Phase 5.** |
| **Estado `active` sem semântica clara na API** | API expõe `active` como estado mas não há endpoint pra transicionar. Hipótese: derivado de Deployment (resource separado). Matriz V1 trata `active` como `ready` para fins de ações disponíveis (`NEW_DRAFT_FROM`, `ARCHIVE`, `DELETE`). Confirmar com backend antes de Phase 1 fechar. |
| **`is_versioned: false` para Application em conta com flag** | T5.1 implementa check + fallback transparente para TabsView legado. UX consistente para o usuário. |
| **5 sub-resource version-services em sync com legados** | Risco de drift futuro quando o legado mudar shape de payload. Mitigação: adapters compartilhados (não duplicar normalização) + suite de testes garantindo URL versionada + delegação ao adapter legado. |
| **PUT vs PATCH no saveDraft** | API expõe ambos. Decisão V1: usar **PATCH** (mais semântico para "save changes"; permite enviar só campos alterados). |
| **`trace_id` no build** | Opcional na API. V1 gera UUID v4 no client se não informado. |
| **Polling otimizado durante building** | V1: `useQuery` com `refetchInterval: 3000ms` quando `isProcessing(state)`. Otimização (WebSocket) é trabalho futuro. |
| **VeeValidate schema do form de Application** | T5.2 (`MainSettingsTab`) reusa o schema importando `V3/EditView.vue` como conteúdo; não duplica. |
| **Create flow (sem `resourceId` ainda)** | Fora do V1. Cobre apenas edit/load de versão existente. Phase 7+. |
| **Conflito com `hasFlagBlockApiV4`** | Fluxos independentes. `hasFlagUseV6Configurations` é gate da rota; `hasFlagBlockApiV4` é gate interno do form. Coexistem. |
| **`provide('edgeApplication')` e `provide('isApplicationLoaded')`** consumidos por sub-tabs | Casca espelha esses provides derivados do `versionContext.version`, garantindo retrocompatibilidade total com sub-tab views existentes. |

## 9. Out of scope (V1)

- Listagem de versões wrappada pela casca (`versions-list-block`) — TBD.
- Create flow (criar resource + primeiro Draft + opcional promote-to-build) — Phase 7+.
- Polling otimizado / WebSocket para Building (V1 usa `refetchInterval` simples).
- Outros resources (Firewall, WAF, Functions standalone, Custom Pages) — V1 valida a arquitetura com Application; demais são clones de service.
- Diff/Compare entre versões.
- Operações fora da API de versão: `deploy`, `rollback`, `download` (não existem no escopo da API de version atualmente; podem vir de Deployment API ou nunca).
- Origins / Error Responses (se confirmado que não têm endpoint versionado) — defer até backend definir.
- Estado `active` com semântica explícita de "está deployado" — depende de Deployment API estar integrada.

## 10. Cost estimate

- ~19 arquivos novos + 11 testes
- 3 arquivos modificados
- ~2370 LOC novas (Application + 5 sub-services + casca + form context + page wrapper) + ~45 LOC modificadas
- ~110–160k tokens de execução

Decomposição por fase:

| Fase | Arquivos novos | LOC novas | LOC testes |
|---|---|---|---|
| 1. State machine | 2 + 2 testes | ~110 | ~170 |
| 2. Services (1 Application + 5 sub) | 7 + 6 testes | ~600 | ~470 |
| 3. Casca | 7 + 4 testes | ~810 | ~300 |
| 4. Form context | 1 + 0 testes | ~20 (+30 modif.) | — |
| 5. Application V6 | 2 + 0 testes | ~230 (+15 modif.) | — |
| 6. Docs | 0 (1 modif.) | — | — |

## 11. Guardrails de execução

Conforme `CLAUDE.md`, durante execução **não** vou:

- Criar commits, stashes ou pushes.
- Rodar `yarn test` (nem unit, nem e2e, nem coverage).
- Rodar `yarn build`.
- Criar/trocar branches ou worktrees.

Edito arquivos no branch `feat/versioning`; verificação fica por sua conta.

## 12. Itens em aberto

Decisões que ainda precisam ser tomadas antes (ou durante) execução:

- **Origins / Error Responses** — investigação obrigatória antes de Phase 5 fechar (3 cenários possíveis no Risk #1).
- **Estado `active`** — confirmar semântica com backend. Hipótese atual: derivado de Deployment, sem endpoint próprio. V1 trata como `ready` na matriz de ações.
- **`is_versioned: false` UX** — recomendação: fallback transparente para TabsView legado dentro do `v6/EditView.vue`. Concorda?
- **PUT vs PATCH para saveDraft** — recomendação: **PATCH**. Concorda?
- **`trace_id` no build** — recomendação: gerar UUID v4 no client se não informado. Concorda?
- **Polling interval pra building** — recomendação: 3000ms. OK?
- **Forma final dos botões na ActionBar** — primário único state-aware ou múltiplos primários por estado? (Decisão de UX.)
- **Comportamento ao trocar de tab com form sujo** — usar `DialogUnsaved` já existente em `src/templates/dialog-unsaved/`. Concorda?
- **Layout do `VersionActionDialog`** — confirmar com design system (PrimeVue Dialog + textarea + radio para Archive reason?).
