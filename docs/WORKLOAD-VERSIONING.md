# Workload — Versionamento (`use_v6_configurations`)

Como a tela de Workload atende **dois tipos de conta** (com e sem versionamento), diferenciados pelo client flag
`use_v6_configurations` — lido via `hasFlagUseV6Configurations()` em `src/composables/user-flag.js`.

## Contexto

O formulário de Workload foi redesenhado por completo para o fluxo **v6** (versionado). Para que contas **sem** o
flag continuem com a experiência **legada**, o fluxo é bifurcado. A estratégia é **híbrida, por camada**, conforme o
tamanho da divergência:

- **Fork no router** onde a divergência é *estrutural* (Create, Edit e composição do formulário) — cada variante é um
  arquivo independente carregado por `import()` dinâmico no router.
- **Gating de rota** nas rotas/abas *exclusivas do v6*.
- **Flag-aware** na camada de dados onde a divergência é *localizada* (adapter de payload, estratégia de certificado).
- **Compartilhado** onde os dois fluxos são idênticos.

Os pontos de decisão são dois: **rota** (carregamento condicional do componente + gating de `deployment-details`) e
**dados** (adapter/service). Não há mais dispatcher de runtime no nível dos componentes.

## Diagrama do fork

```mermaid
flowchart TD
    subgraph R["Rotas - workload-routes/index.js"]
        RL["list-workloads<br/>ListView.vue"]
        RC{"create-workload<br/>hasFlagUseV6Configurations()"}
        RE{"edit-workload<br/>hasFlagUseV6Configurations()"}
        RD["workload-deployment-details<br/>DeploymentDetailsView.vue"]
    end

    RD --> FG{{"flagGuard - meta.flag: use_v6_configurations"}}
    FG -->|sem flag| NF["redirect /not-found"]
    FG -->|com flag| DDV["DeploymentDetailsView v6"]

    RL --> LV["ListView v6 - dados pela API por conta"]

    RC -->|com flag| CV6["v6/CreateView.vue<br/>buildV6Schema + createWorkload payload, true"]
    RC -->|sem flag| CLG["CreateView.vue (legado)<br/>buildLegacySchema + createWorkload payload, false"]

    RE -->|com flag| TV["v6/TabsView.vue - abas Overview, Deployment, Settings"]
    RE -->|sem flag| LEV["EditView.vue (legado) - pagina flat"]
    TV --> EV["v6/EditView.vue - aba Settings<br/>buildV6Schema + editWorkload payload, true"]
    LEV --> LE2["buildLegacySchema + editWorkload payload, false"]

    CV6 --> FF6["v6/FormFields/FormFieldsWorkload.vue<br/>General, Domains drawer + environment + cert por dominio<br/>DeploymentSettings cards por ambiente, Protocol sem cert<br/>mTLS, Status"]
    EV --> FF6
    CLG --> FFL["FormFields/FormFieldsWorkload.vue (legado)<br/>General, Infrastructure, Domains lista inline<br/>DeploymentSettings dropdowns flat, Protocol cert global<br/>mTLS, Status"]
    LE2 --> FFL

    FF6 --> ADP
    FFL --> ADP
    DDV --> ADP

    subgraph DATA["Camada de dados flag-aware - compartilhada"]
        ADP["workload-adapter.js<br/>le o flag para shape de domains e tls.certificate"]
        SVC["workload-service.js<br/>recebe isV6 - cert por-FQDN v6 ou global legado"]
    end
    ADP --> SVC

    classDef v6 fill:#1f6feb,stroke:#0b3d91,color:#ffffff;
    classDef legacy fill:#d29922,stroke:#8a5a00,color:#ffffff;
    classDef shared fill:#3fb950,stroke:#1a7f37,color:#ffffff;
    classDef gate fill:#f85149,stroke:#a40e26,color:#ffffff;

    class CV6,TV,EV,DDV,FF6 v6;
    class CLG,LEV,LE2,FFL legacy;
    class LV,ADP,SVC v6;
    class LV shared;
    class FG,NF,RC,RE gate;
```

**Legenda:** azul = v6 · laranja = legado · verde = compartilhado · vermelho = ponto de decisão por flag.

## Etapas do fork

1. **Rota** (`src/router/routes/workload-routes/index.js`)
   - `list` permanece compartilhada entre os dois tipos de conta.
   - `create-workload` e `edit-workload` definem `component: () => hasFlagUseV6Configurations() ? import(<v6>) : import(<legacy>)`,
     o mesmo padrão usado em `edge-application-routes` para `hasFlagBlockApiV4`. A flag é avaliada na navegação e
     o chunk correto é lazy-loaded — nenhum componente carregado contém branching.
   - `workload-deployment-details` é a única rota gated por `flagGuard` (`meta.flag: 'use_v6_configurations'`) → conta
     legada vai para `/not-found`.
   - `edit/:id/:tab?` continua com o mesmo nome de rota (`edit-workload`); o `:tab` é lido pelo `v6/TabsView` (v6) e
     simplesmente ignorado pelo `EditView` legado (na raiz).

2. **Create** — dois arquivos independentes
   - `src/views/Workload/v6/CreateView.vue` (v6): `buildV6Schema()`, `initialValues` v6, `createWorkload(payload, true)`.
   - `src/views/Workload/CreateView.vue` (legado, na raiz): `buildLegacySchema()`, `initialValues` legado,
     `createWorkload(payload, false)`.
   - Nenhum dos dois importa `user-flag.js`.

3. **Edit** — sem dispatcher de runtime
   - V6 carrega `v6/TabsView.vue` (Overview / Deployment / Settings); a aba Settings monta `v6/EditView.vue` com
     `buildV6Schema()` + `editWorkload(payload, true)`.
   - Legado carrega `EditView.vue` (na raiz) diretamente (página flat) com `buildLegacySchema()` +
     `editWorkload(payload, false)`.

4. **Composição** (`FormFields/FormFieldsWorkload.vue`) — duas variantes, sem seletor
   - `src/views/Workload/v6/FormFields/FormFieldsWorkload.vue` (v6): General, Domains, DeploymentSettings, ProtocolSettings,
     MutualAuthentication, Status. **Não** monta `Infrastructure`. Importa `domains/deploymentSettings/protocolSettings`
     de `v6/FormFields/blocks/` e reusa `General`/`MutualAuthentication` de `FormFields/blocks/` (compartilhados).
   - `src/views/Workload/FormFields/FormFieldsWorkload.vue` (legado, na raiz): idem v6 + `Infrastructure`; importa
     `domains/deploymentSettings/protocolSettings` de `FormFields/blocks/`. Os blocos `General`, `MutualAuthentication`,
     `Infrastructure` são reusados de `FormFields/blocks/` (compartilhados).
   - Nenhuma das duas tem `v-if`/`v-else` por flag — só uma das variantes é carregada pelo router por vez.

5. **Validação** (`Config/validation.js`)
   - Dois exports independentes: `buildV6Schema()` e `buildLegacySchema()`. Não há mais parâmetro `isV6`.
   - Os schemas internos (`baseSchema`, `v6Extras`, `legacyExtras`) seguem inalterados — só mudou a fronteira pública.

6. **Dados** (`services/v2/workload/`) — inalterado pela refatoração de rota
   - `workload-adapter.js` lê o flag diretamente para escolher o *shape* de `domains` e de `tls.certificate`.
   - `workload-service.js` recebe `isV6` por **parâmetro** (não importa o composable, por causa da regra ESLint
     `services-http-only`) e escolhe a estratégia de certificado: **por-FQDN** (v6) ou **global** (legado). As views v6
     passam `true` e as legadas passam `false`.
   - `fetch` / `list` / `deployment` / `cache` são idênticos e permanecem compartilhados.

## Layout de arquivos (atual)

O Workload segue o layout canônico do `docs/V6-GUIDELINES.md`: **legado na raiz**, **v6 isolado em
`v6/`**, **compartilhado na raiz**, com imports por **alias absoluto** (`@/views/Workload/...`).

**Raiz de `src/views/Workload/` — legado + compartilhado**
- `CreateView.vue`, `EditView.vue` — variantes **legadas** (`buildLegacySchema`).
- `ListView.vue` — compartilhada (flag-aware via prop `isV6`).
- `Config/validation.js` — compartilhado; exporta `buildV6Schema` **e** `buildLegacySchema`.
- `FormFields/FormFieldsWorkload.vue` — composição **legada** do formulário.
- `FormFields/blocks/{generalBlock,mutualAuthenticationSettingsBlock,infrastructureBlock}.vue` — blocos **compartilhados** (usados por v6 e legado).
- `FormFields/blocks/{domainsBlock,deploymentSettingsBlock,protocolSettingsBlock}.vue` — blocos **legados**.
- `components/FormSkeleton.vue` — skeleton **compartilhado**.

**`src/views/Workload/v6/` — tudo que é exclusivo do v6**
- Views: `CreateView.vue`, `EditView.vue`, `TabsView.vue`, `DeploymentDetailsView.vue`, `VersionEditView.vue`.
- `WorkloadSettingsTab.vue`, `WorkloadVersionAdapter.vue`.
- `FormFields/FormFieldsWorkload.vue` + `FormFieldsCreateDomains.vue`, `FormFieldsEditDomains.vue`.
- `FormFields/blocks/{domainsBlock,deploymentSettingsBlock,protocolSettingsBlock}.vue` (variantes v6).
- `FormFields/components/{CreateDeploymentVersionDrawer,DomainDrawer,DomainRow}.vue`.
- `Tabs/**`, `Drawer/`, `Dialog/`, `components/EditViewSkeleton.vue`, `composables/`, `utils/`.

**Regra de import:** a composição v6 (em `v6/`) importa os blocos **compartilhados** da raiz por
alias absoluto (`@/views/Workload/FormFields/blocks/generalBlock.vue`) e os blocos **v6** de
`@/views/Workload/v6/FormFields/blocks/`. A composição legada (na raiz) importa tudo de
`@/views/Workload/FormFields/...`.

**Compartilhado fora de Workload (sem mudança)**
- `src/services/v2/workload/workload-adapter.js`, `workload-service.js`
- `src/composables/user-flag.js`, `src/router/hooks/guards/flagGuard.js`

## Como verificar

Alternar `use_v6_configurations` em `client_flags` (fixture `cypress/fixtures/account/info/*` ou conta de teste):

- **Com flag:** ao navegar para `/workloads/create` ou `/workloads/edit/:id`, o router carrega o chunk v6
  (`v6/CreateView.vue` / `v6/TabsView.vue`); abas Overview/Deployment/Settings; certificado por domínio; sem bloco
  Infrastructure; `/workloads/edit/:id/deployment/:versionId` carrega.
- **Sem flag:** o router carrega o chunk legado (`CreateView.vue` / `EditView.vue`, na raiz); bloco Infrastructure
  presente; dropdown de certificado global no Protocol; dropdowns flat de deployment; edição em página única sem abas;
  `/workloads/edit/:id/deployment/:versionId` → `/not-found`. Observação: rotas como `/workloads/edit/:id/overview`
  permanecem renderizando a página legada (o `:tab` é silenciosamente ignorado).
