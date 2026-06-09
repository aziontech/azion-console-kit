# Version Shell — Arquitetura

> **Status:** rascunho em construção (brainstorm em andamento).
> Este documento captura as decisões já validadas e enumera as seções
> pendentes de discussão. Iterar conforme o brainstorm avança.

## Contexto

Conforme `docs/RESOURCES.MD`, os resources versionáveis (Application, Firewall,
Function, Custom Pages, WAF, etc. — Workload segue caminho próprio)
compartilham um state machine único:

```
Draft → Queued → Building → Ready → Archiving → Archived → Deleted
                                ↘ Canceled / Error (≈ Draft)
```

A matriz de ações disponíveis depende do estado (§4 de `RESOURCES.MD`). Hoje,
conforme `docs/APPLICATION-FLOW.md`, o fluxo de Application **não tem conceito
de versão na UI** — o usuário edita e salva direto. Estender cada resource
para suportar o ciclo de vida completo de versionamento exigiria reimplementar
a mesma lógica em N lugares.

Este documento descreve a arquitetura de uma **casca de versionamento**
(`<VersionShell>`) — um componente reutilizável que centraliza:

- O conhecimento do estado da versão atual (vindo da API).
- As ações disponíveis em cada estado (Save, Save and Build, Promote, Archive,
  New Draft, Delete, ...).
- A orquestração: traduzir a intenção do usuário em chamada de serviço.
- A editabilidade do form (readOnly em estados imutáveis).

## Escopo

- **Primeiro consumidor:** Application.
- **Fora do escopo:** Workload — segue fluxo próprio, já consolidado em
  `docs/WORKLOAD-VERSIONING.md`.
- **Futuros consumidores:** demais resources versionáveis listados em
  `RESOURCES.MD` (Firewall, Functions, Custom Pages, WAF, etc.). A casca deve
  acomodá-los via adapter próprio, sem alteração no componente em si.

## Decisões validadas

### 1. Form sempre montado; editabilidade derivada do estado

A casca renderiza o form como slot. O estado decide apenas a editabilidade:

| Estado | Form |
|---|---|
| `Draft` / `Canceled` / `Error` | editável |
| `Ready` / `Archived` | read-only (mesmo componente, prop `readOnly`) |
| `Queued` / `Building` | visível com overlay/badge de progresso |
| `Deleted` | redireciona |

Vantagem: um único componente de form por resource (sem duplicação entre
"edit" e "view"). O form precisa honrar a prop `readOnly`/inject vindo da
casca.

### 2. Casca consome um adapter por resource

A camada de dados é injetada via objeto `versioningAdapter` específico do
resource (ex.: `applicationVersioningAdapter`). O adapter usa os services v2
do resource; a casca usa o adapter via `@tanstack/vue-query` internamente.

- A casca **não importa** nada de `services/v2/<resource>/`.
- O adapter vive em `src/services/v2/<resource>/<resource>-versioning-adapter.js`.
- Adicionar um novo resource versionável = 1 adapter novo + reuso total da
  casca.

Alinhado com `docs/V6-GUIDELINES.md` — services v2 não importam composables, e
adapters podem encapsular a lógica de mapeamento.

### 3. Casca é a controladora das ações

Botões de ação ficam **na casca**, não no form. A casca conhece o mapeamento
*(estado atual, ação clicada) → método do adapter*.

Exemplo: o usuário clica "Save and Build" enquanto a versão está em Draft. A
casca:

1. Pede ao `useForm` interno os valores e validação.
2. Identifica que o estado atual é `Draft`.
3. Dispara `adapter.saveAndBuild(values)`.
4. Trata o sucesso/erro (transição → `Queued`, toast, etc.).

O form não sabe que isso aconteceu — ele só fornece valores via VeeValidate.

## Arquitetura em camadas

```
┌──────────────────────────────────────────────────────────┐
│  Route component                                          │
│  (ex.: /applications/edit/:id → ApplicationVersionPage)   │
│  - Lê route params                                        │
│  - Plug & play do adapter correto                         │
│  - Monta a casca + slot do form                           │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│  <VersionShell>  (componente novo, reutilizável)          │
│  ──────────────────────────────────────────────────────  │
│  • Recebe: adapter, resourceId, versionId?                │
│  • Usa vue-query internamente via adapter                 │
│  • Owns: state da versão atual, lista de versões          │
│  • Owns: useForm (VeeValidate) — owner do submit          │
│  • Mapeia ação canônica × estado → método do adapter      │
│  • Renderiza: header(badge) + ActionBar + <slot/> form    │
│  • Provê via inject: { versionState, readOnly }           │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│  Form (FormFields existente, p.ex. de Application)        │
│  - Pure UI: FieldText, FieldSwitch, etc.                  │
│  - Usa useField (VeeValidate) → comunica com useForm pai  │
│  - Lê inject('readOnly') para desabilitar campos          │
│  - NÃO tem botões de submit — eles ficam na casca         │
└──────────────────────────────────────────────────────────┘

Lateral (per-resource):
┌──────────────────────────────────────────────────────────┐
│  applicationVersioningAdapter (objeto)                    │
│  - load(versionId), list(resourceId)                      │
│  - save(values), saveAndBuild(values)                     │
│  - cancelBuild(), promote(), rollback()                   │
│  - archive(), newDraftFrom(), delete(), download()        │
│  → Cada método chama o service v2 correspondente          │
│  → Cada adapter mora em src/services/v2/<resource>/       │
└──────────────────────────────────────────────────────────┘
```

### Pontos-chave

- A casca é o **único** lugar que conhece *(estado, ação) → método do adapter*.
  Forms e rotas não conhecem essa lógica.
- O adapter é o **único** lugar que conhece API/services do resource
  específico. A casca não importa nada de `services/v2/edge-app/...`.
- A separação garante que adicionar um novo resource versionável seja: 1
  adapter novo + reuso total da casca.

## Em discussão (TBD)

As seções abaixo serão preenchidas conforme o brainstorm avança:

- **Vocabulário canônico de ações.** Lista completa que a casca reconhece
  (Save, SaveAndBuild, CancelBuild, Promote, Rollback, Archive, NewDraftFrom,
  Delete, Download, ...). Confrontar com a matriz §4 de `RESOURCES.MD`.
- **Matriz estado × ação.** Para cada estado, quais ações ficam visíveis no
  ActionBar e como elas se traduzem em métodos do adapter.
- **Contrato do adapter.** Assinatura exata de cada método, formato de
  resposta esperado, padrão de erro.
- **Contrato do form.** Como o form recebe `readOnly` e como participa do
  `useForm` da casca. Compatibilidade com VeeValidate/Yup já em uso pelos
  forms atuais.
- **Integração com a estrutura atual de Application.** Como `TabsView` (7
  sub-tabs: Main Settings, Origins, Device Groups, Error Responses, Cache,
  Functions, Rules Engine) se encaixa dentro da casca. Por `RESOURCES.MD` §1,
  sub-recursos (Cache, Rules, etc.) **são parte da versão** — propagação de
  `readOnly` pra essas tabs precisa ser desenhada.
- **Fluxo Create.** Quando ainda não há `resourceId`, a casca opera em modo
  "novo Draft não persistido". Save cria recurso+draft; Save and Build cria
  recurso+draft+promote.
- **Listagem de versões.** Decisão aberta: a casca também wrappa a listagem
  (`/applications/edit/:id/versions`)? Se sim, contrato; se não, gancho de
  extensão futura.
- **Loading e error UX.** Skeleton durante load; toast/inline error em falha
  de ação; comportamento de polling durante `Queued`/`Building`.
- **Roteamento.** Estrutura de rotas para edit de uma versão específica vs
  edição do Draft atual.

## Referências

- `docs/RESOURCES.MD` — state machine completo e matriz de ações por estado.
- `docs/APPLICATION-FLOW.md` — fluxo atual de Application (sem versionamento).
- `docs/V6-GUIDELINES.md` — regras gerais para features v6.
- `docs/WORKLOAD-VERSIONING.md` — implementação de referência do Workload
  (fluxo próprio, fora do escopo desta casca).
