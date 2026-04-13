# Real-Time Events — Plano de Melhoria

> Objetivo: tornar a tela Real-Time Events **superior ao Kibana Discover**, reutilizando componentes Azion existentes e seguindo as melhores práticas de UI/Frontend.

---

## 1. Auditoria da Tela Atual

### 1.1 Arquitetura de Componentes

| Camada | Componente | Arquivo | Responsabilidade |
|--------|-----------|---------|-----------------|
| **View** | `TabsView` | `src/views/RealTimeEvents/TabsView.vue` | Seleção de dataset (tabs), carrega fields/operators, renderiza `TabPanelBlock` |
| **Orchestrator** | `TabPanelBlock` | `src/views/RealTimeEvents/Blocks/tab-panel-block.vue` | Orquestra filtros, chart, tabela, sidebar e detail panel (~1074 linhas) |
| **Filter** | `AdvancedFilterSystem` | `src/components/base/advanced-filter-system/index.vue` | AQL editor + DataTimeRange + DialogFilter + tags |
| **Chart** | `EventChart` | `src/views/RealTimeEvents/Blocks/components/event-chart.vue` | Histograma C3.js com brush selection |
| **Chart alt** | `EventHistogram` | `src/views/RealTimeEvents/Blocks/components/event-histogram.vue` | Histograma HTML/CSS com brush (alternativo) |
| **Table** | PrimeVue `DataTable` | Inline em `TabPanelBlock` | Tabela de eventos com expansão, seleção, paginação "Load More" |
| **Field Sidebar** | `FieldSidebar` | `src/views/RealTimeEvents/Blocks/components/field-sidebar.vue` | Lista campos, toggle visibilidade, estatísticas (top values) |
| **Field Selector** | `FieldSelector` | `src/views/RealTimeEvents/Blocks/components/field-selector.vue` | Overlay de seleção de colunas com persistência em localStorage |
| **Detail Panel** | `DetailSidebarPanel` | `src/views/RealTimeEvents/Blocks/components/detail-sidebar-panel.vue` | Painel lateral com navegação prev/next |
| **Document View** | `EventDocumentView` | `src/views/RealTimeEvents/Blocks/components/event-document-view.vue` | Tabs Table/JSON, ações de copy e filter |
| **Log Badges** | `LogFieldBadges` | `src/views/RealTimeEvents/Blocks/components/log-field-badges.vue` | Badges inline com severidade e ações de filtro |
| **Field Actions** | `FieldValueActions` | `src/views/RealTimeEvents/Blocks/components/field-value-actions.vue` | Ações hover: add/exclude filter, copy |
| **Code Editor** | `CodeEditor` | `src/views/RealTimeEvents/Blocks/components/code-editor.vue` | Monaco Editor wrapper (GraphQL) |
| **Drawer (legacy)** | `httpRequests.vue` etc. | `src/views/RealTimeEvents/Drawer/` | Drawers antigos com layout Cards+Table via `InfoDrawerBlock` |

### 1.2 Fluxo de Dados

```
User → AdvancedFilterSystem (AQL + tsRange)
  → TabPanelBlock.loadData()
    → Promise.all([
        listService(filterData),        // tabela
        getTotalRecords(filter, dataset), // contagem
        loadEventsAggregation(...)       // chart
      ])
    → tableData, recordsFound, chartData (state)
    → DataTable + EventChart (render)
```

- **Transporte**: HTTP POST para `v4/events/graphql` (sem WebSocket funcional — WS é apenas Vite HMR)
- **Query builder**: `convertGQLAggregation()` em `src/helpers/convert-gql-aggregation.js`
- **Adaptação**: `adaptResponse()` em `load-events-aggregation.js`

### 1.3 Bugs Corrigidos Nesta Sprint

| Bug | Causa Raiz | Correção |
|-----|-----------|----------|
| Chart sempre vazio | `fillGaps` fazia match exato de timestamp (ms), nunca encontrava correspondência com os dados do backend | Normalizar cada `ts` para o bucket boundary mais próximo via `normalizeToBucket()` e somar counts por bucket |
| Console.log de debug | Logs `[Chart Debug]` deixados em `hasChartConfig` computed | Removidos |

---

## 2. Mapeamento de Componentes Azion Reutilizáveis

### 2.1 Templates Disponíveis

| Template | Path | Uso Recomendado no RTE |
|----------|------|----------------------|
| `ContentBlock` | `src/templates/content-block/` | Container principal com heading/content slots — **já usado** |
| `PageHeadingBlock` | `src/templates/page-heading-block/` | Título + breadcrumbs — **já usado** |
| `ListTableBlock` | `src/templates/list-table-block/` | Tabela com search, filtros, export CSV, column selector — **substituir DataTable inline** |
| `InfoDrawerBlock` | `src/templates/info-drawer-block/` | Drawer lateral com expand/minimize — **usar para detail panel** |
| `GraphsCardBlock` | `src/templates/graphs-card-block/` | Card de gráfico com skeleton, error, chart types (bar/line/spline/pie/stacked) — **substituir EventChart** |
| `EmptyResultsBlock` | `src/templates/empty-results-block/` | Estado vazio com ilustração e CTA — **usar para "no events"** |
| `SkeletonBlock` | `src/templates/skeleton-block/` | Skeleton loading genérico — **usar em todas as seções** |
| `AdvancedFilter` | `src/templates/advanced-filter/` | FIELDS_MAPPING + OPERATOR_MAPPING para filtros tipados — **já integrado via AQL** |

### 2.2 Componentes Base

| Componente | Path | Uso |
|-----------|------|-----|
| `AdvancedFilterSystem` | `src/components/base/advanced-filter-system/` | AQL + DateRange + DialogFilter — **já usado** |
| `DataTimeRange` | `src/components/base/dataTimeRange/` | Quick/Absolute/Relative/Now selector + timezone — **já usado** |
| `AzionQueryLanguage` | `src/components/base/advanced-filter-system/filterAQL/` | Editor AQL com autocomplete — **já usado** |
| `ResizableSplitter` | `src/components/Splitter/ResizableSplitter.vue` | Splitter drag horizontal/vertical — **usar para sidebar resize** |
| `DataTable` (custom) | `src/components/DataTable/` | DataTable wrapper da Azion — **usar no lugar do PrimeVue direto** |

### 2.3 Composables

| Composable | Path | Uso |
|-----------|------|-----|
| `useLayout` | `src/composables/use-layout.js` | Estado do sidebar global — **re-render chart on toggle** |
| `useResize` | `src/composables/useResize.js` | Observer de resize — **responsive chart** |
| `useTableQuery` | `src/composables/useTableQuery.js` | Query state management para tabelas |

### 2.4 Helpers

| Helper | Path | Uso |
|--------|------|-----|
| `convertGQLAggregation` | `src/helpers/convert-gql-aggregation.js` | Builder de query GraphQL aggregation — **já usado** |
| `fill-result-query` | `src/modules/real-time-metrics/reports/fill-result-query.js` | Gap-fill robusto do Metrics — **referência para melhorias** |
| `useRouteFilterManager` | `src/helpers/` | Persistência de filtros na URL hash — **já usado** |
| `eventsPlaygroundOpener` | `src/helpers/` | Abre playground de eventos — **já usado** |

---

## 3. Comparação com Kibana Discover — Gap Analysis

### 3.1 Funcionalidades do Kibana Discover

| # | Feature Kibana | Status Azion RTE | Gap |
|---|---------------|-----------------|-----|
| 1 | **Barra de busca KQL/Lucene** com autocomplete, syntax highlight, validação em tempo real | ✅ AQL com autocomplete e validação | Falta syntax highlight colorido no editor inline |
| 2 | **Time picker** Quick/Absolute/Relative + auto-refresh | ✅ DataTimeRange com Quick/Absolute/Relative/Now + timezone | Paridade atingida |
| 3 | **Histograma temporal** com bucket automático, brush zoom, tooltip | ⚠️ EventChart com C3.js funciona (pós-fix) mas não tem bucket inteligente do backend | Pedir `interval` ao backend ou alinhar bucket do front com resolução da API |
| 4 | **Tabela de documentos** com expansão inline e colunas configuráveis | ✅ DataTable com expand, columns dinâmicos, LogFieldBadges | Funcional |
| 5 | **Sidebar de campos** com Available/Selected, stats (top 5 values + %) | ✅ FieldSidebar com search, toggle, top values e ProgressBar | Falta: visualização de distribuição como mini bar chart |
| 6 | **Document detail** em panel lateral com tabs (Table/JSON) | ✅ DetailSidebarPanel + EventDocumentView | Funcional |
| 7 | **Navegação entre documentos** (prev/next) | ✅ Setas no DetailSidebarPanel | Funcional |
| 8 | **Context view** (surrounding docs) | ❌ Não existe | Gap: ver eventos adjacentes no tempo |
| 9 | **Saved searches** (persistir query + filtros) | ❌ Apenas hash na URL | Gap: salvar/carregar buscas nomeadas |
| 10 | **Export CSV/JSON** completo | ⚠️ Não há export visível no RTE | Gap: adicionar botão export |
| 11 | **Column resize** na tabela | ❌ Colunas fixas | Gap: permitir resize de colunas |
| 12 | **Column sort** client-side | ❌ Sem sort | Gap: adicionar sort nas colunas |
| 13 | **Multi-field sort** | ❌ | Gap |
| 14 | **Copy value** com um clique | ✅ FieldValueActions, EventDocumentView | Funcional |
| 15 | **Filter for/exclude value** inline | ✅ LogFieldBadges, FieldValueActions, EventDocumentView | Funcional |
| 16 | **Resizable sidebar** | ❌ Sidebar fixa em width | Gap: usar `ResizableSplitter` |
| 17 | **Collapsible sidebar** | ✅ Toggle com `sidebarVisible` | Funcional |
| 18 | **Field type icons** (string, number, date, geo) | ❌ Sem ícones de tipo | Gap: visual importante |
| 19 | **Query history** | ❌ | Gap |
| 20 | **Auto-refresh** com intervalo configurável | ✅ DataTimeRange suporta autoRefresh | Funcional |
| 21 | **Total hit count** | ✅ `recordsFound` exibido | Funcional |
| 22 | **Infinite scroll / pagination** | ⚠️ "Load More" manual com PAGE_SIZE=100 | Gap: infinite scroll seria melhor UX |
| 23 | **Multi-index/data view** switcher | ✅ Dataset selector no FieldSidebar | Funcional |
| 24 | **URL state** (compartilhar link com filtros) | ✅ Hash filters na URL | Funcional |
| 25 | **Dark/Light mode** | ✅ CSS variables + design tokens | Funcional |

### 3.2 Vantagens Atuais sobre Kibana

- **AQL** é mais intuitiva que KQL para usuários Azion
- **DataTimeRange** com timezone selector é superior ao Kibana padrão
- **LogFieldBadges** com classificação de severidade (status codes, log levels) é um diferencial
- **Detail view mode** toggle (inline/sidebar) dá flexibilidade que Kibana não tem
- **Dataset switcher** no sidebar é mais fluido que trocar data views no Kibana

---

## 4. Plano de Melhoria — Priorizado

### Fase 1 — Quick Wins (1-2 sprints)

- [x] **4.1.1 Substituir DataTable inline por `ListTableBlock` ou `DataTable` Azion** _(parcial)_
  - Habilitadas `resizableColumns` + `columnResizeMode="expand"` no DataTable inline.
  - Migração completa para Azion DataTable wrapper requer suporte a `expandedRows` no wrapper.
  - **Ganho**: Sort por coluna, export CSV/JSON, column resize.

- [x] **4.1.2 Sidebar Resizável com `ResizableSplitter`**
  - Layout com `ResizableSplitter` wrapping sidebar (panel-a) e tabela+detail (panel-b).
  - **Componente**: `src/components/Splitter/ResizableSplitter.vue`
  - **Ganho**: Paridade com Kibana, melhor uso de espaço.

- [x] **4.1.3 Ícones de Tipo nos Campos**
  - Adicionar ícones ao lado de cada campo no `FieldSidebar` indicando tipo.
  - **Ganho**: UX profissional, paridade com Kibana.

- [x] **4.1.4 Export de Dados**
  - Botões "Export CSV" e "Export JSON" no toolbar da tabela.
  - **Ganho**: Feature essencial para análise de logs.

- [x] **4.1.5 Empty State com `EmptyResultsBlock`**
  - DataTable #empty slot usa `EmptyResultsBlock` com ícone de busca.
  - **Componente**: `src/templates/empty-results-block/`
  - **Ganho**: Consistência visual.

### Fase 2 — Melhorias Estruturais (2-3 sprints)

- [ ] **4.2.1 Refatorar `TabPanelBlock` (God Component)**
  - Extrair em composables: `useEventsData()`, `useEventsFilter()`, `useEventsChart()`, `useEventsDetail()`, `useEventsKeyboard()`.
  - **Ganho**: Manutenibilidade, testabilidade, separation of concerns.

- [x] **4.2.2 Chart: Migrar padrões do GraphsCardBlock** _(parcial)_
  - `EventChart` agora usa `Skeleton` loading e `InlineMessage` error states (padrão GraphsCardBlock).
  - Mantém C3.js (mesmo engine do GraphsCardBlock internamente).
  - **Ganho**: Consistência visual com skeleton/error states.

- [x] **4.2.3 Load More / Pagination**
  - Paginação de 50 em 50 com botão "Load more".
  - **Ganho**: UX incremental sem sobrecarga.

- [x] **4.2.4 Column Resize na Tabela**
  - `resizableColumns` + `columnResizeMode="expand"` habilitados.
  - **Ganho**: Paridade com Kibana.

- [x] **4.2.5 Query History**
  - Composable `useQueryHistory()` salva últimas 20 queries em localStorage.
  - Dropdown com ícone pi-history no filter bar.
  - **Ganho**: Produtividade do usuário.

### Fase 3 — Diferenciais (3-4 sprints)

- [x] **4.3.1 Saved Searches**
  - Composable `useSavedSearches()` com localStorage (até 50 buscas).
  - UI com botão bookmark no toolbar, save input + lista de buscas salvas.
  - Salva: filterData, selectedColumns, dataset.
  - **Ganho**: Feature premium que Kibana tem via saved objects.

- [ ] **4.3.2 Context View (Surrounding Events)**
  - Ao clicar em um evento, ver N eventos antes e depois no tempo.
  - **Ganho**: Análise de incidentes.

- [ ] **4.3.3 Syntax Highlight no AQL**
  - Colorir tokens (campo=verde, operador=azul, valor=laranja) no ContentEditable.
  - **Ganho**: UX profissional, reduz erros de query.

- [ ] **4.3.4 Mini Sparkline nos Campos do Sidebar**
  - Ao lado das top values, mostrar mini bar chart de distribuição.
  - **Ganho**: Visualização rápida de distribuição sem ocupar espaço.

- [ ] **4.3.5 Alertas Inline**
  - Criar alertas a partir de uma query.
  - **Ganho**: Diferencial sobre Kibana Discover.

---

## 5. Diretrizes de Design

### 5.1 Tokens de Design

Usar consistentemente as CSS variables do tema Azion:

```css
/* Superfícies */
--surface-card, --surface-section, --surface-border, --surface-ground

/* Texto */
--text-color, --text-color-secondary

/* Cores primárias */
--primary-color, --primary-color-text

/* Séries de gráficos */
--series-one-color ... --series-five-color

/* Border radius */
--border-radius (global)
```

### 5.2 Padrões de Layout

- **Splitter layout**: Usar `ResizableSplitter` para qualquer painel redimensionável
- **Content blocks**: Sempre usar `ContentBlock` como container externo
- **Loading states**: `Skeleton` do PrimeVue ou `SkeletonBlock` para todos os estados de carregamento
- **Empty states**: `EmptyResultsBlock` com ilustração e CTA
- **Error states**: `InlineMessage severity="error"` como no `GraphsCardBlock`

### 5.3 Padrões de Interação

- **Hover actions**: Aparecer ações apenas no hover (como `FieldValueActions`)
- **Tooltips**: Usar `v-tooltip` do PrimeVue com `showDelay: 200`
- **Keyboard**: Suportar navegação via teclado em todos os componentes interativos
- **Persist state**: Usar localStorage para preferências do usuário (colunas, detail mode, sidebar width)
- **URL state**: Usar hash params para filtros compartilháveis

### 5.4 Performance

- **Virtual scrolling** para tabelas com > 100 linhas
- **AbortController** em todas as chamadas HTTP (já implementado via `AxiosHttpClientSignalDecorator`)
- **Debounce** em inputs de busca (300ms)
- **Lazy rendering** de componentes pesados (Monaco editor, gráficos) com `defineAsyncComponent`

---

## 6. Estrutura de Arquivos Proposta

```
src/views/RealTimeEvents/
├── TabsView.vue                          # View principal (mantém)
├── composables/
│   ├── useEventsData.js                  # Fetch, pagination, load more
│   ├── useEventsFilter.js                # Filter state, URL sync
│   ├── useEventsChart.js                 # Aggregation, chart data
│   ├── useEventsDetail.js                # Detail mode, active row, nav
│   └── useEventsKeyboard.js              # Keyboard shortcuts
├── Blocks/
│   ├── tab-panel-block.vue               # Refatorado (~300 linhas, usa composables)
│   ├── events-table.vue                  # NEW: Tabela dedicada com ListTableBlock
│   ├── events-toolbar.vue                # NEW: Toolbar (export, view mode, refresh)
│   ├── components/
│   │   ├── field-sidebar.vue             # Melhorado com ícones de tipo
│   │   ├── detail-sidebar-panel.vue      # Mantém
│   │   ├── event-document-view.vue       # Mantém
│   │   ├── log-field-badges.vue          # Mantém
│   │   ├── field-value-actions.vue       # Mantém
│   │   ├── field-selector.vue            # Mantém
│   │   ├── event-chart.vue               # Fase 1: corrigido / Fase 2: migrar para GraphsCardBlock
│   │   ├── event-histogram.vue           # Avaliar deprecação após migração do chart
│   │   ├── code-editor.vue               # Mantém
│   │   └── query-history-dropdown.vue    # NEW: dropdown de histórico de queries
│   └── constants/
│       ├── tabs-events.js                # Mantém
│       └── chart-configs.js              # Mantém
└── Drawer/                               # Legacy — avaliar migração para DetailSidebarPanel
```

---

## 7. Métricas de Sucesso

| Métrica | Meta |
|---------|------|
| Linhas do `TabPanelBlock` | < 350 (de ~1074) |
| Cobertura de testes dos composables | > 80% |
| Lighthouse Performance score | > 90 |
| Funcionalidades do Kibana cobertas | > 90% (22/25) |
| Componentes Azion reutilizados | > 80% do UI vem de templates/componentes compartilhados |
| Bugs de chart | 0 (regressão) |

---

## 8. Ações Já Realizadas

- [x] **Fix**: `fillGaps` em `event-chart.vue` — normaliza timestamps para bucket boundaries
- [x] **Cleanup**: Removidos `console.log` de debug em `tab-panel-block.vue`
- [x] **Confirmação**: WebSocket observado é Vite HMR, não transporte de dados
- [x] **Fix**: Filter bar font uppercase — substituído `font-mono` por monospace explícito
- [x] **Fix**: Click-to-filter em badges — adicionada propriedade `field` nos filtros
- [x] **Fix**: Inline expansion view compacta com prop `compact`
- [x] **Fix**: JSON/pre font uppercase corrigido
- [x] **Fix**: Alturas de linha uniformes na tabela
- [x] **Fix**: Load more com paginação de 50 em 50
- [x] **Fix**: Row selection visual com estado ativo
- [x] **Fix**: Detail sidebar acompanha altura da tela
- [x] **Fix**: Tab view (Table/JSON) estilização compacta
- [x] **Fix**: Badge filter popover compacto (mini icons)
