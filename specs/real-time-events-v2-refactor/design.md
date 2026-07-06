# Design: Real-Time Events v2 — Refactor & Hardening

> Status: **Draft, awaiting approval**
> Linked requirements: `specs/real-time-events-v2-refactor/requirements.md` (66 critérios)
> Base: auditoria holística + memória + design por 6 frentes, **todas verificadas adversarialmente**. As correções da verificação (virtualização "flawed", 5 frentes "needs-changes") já estão incorporadas abaixo.

## 1. Goals & Non-Goals

**Goals** — cumprir os 66 critérios: render O(viewport), memória limitada, estado single-source-of-truth, decomposição SOLID, DRY, a11y/DS, e testes de medição real — com **zero-regressão** (N.1 gate duro) e reuso das abstrações de `real-time-events-v2-fixes`.

**Non-Goals** — c3→outra lib; contratos GraphQL; features novas; i18n; refazer a spec `-fixes`. **Decisão do usuário (resolve §7.1/§11): manter o webkit** — o corpo virtualizado é construído **com primitivas, componentes e tokens do webkit** (paridade visual com o DataTable atual). Não é migração para fora do design system; troca-se apenas o _mecanismo_ de materialização de linhas.

## 2. High-Level Architecture

Quatro camadas coesas, com o **`useEventsExplorer`** como único seam de orquestração entre a view e os composables:

```mermaid
flowchart TD
  V[TabPanelBlock view] --> EX[useEventsExplorer  (orquestração única)]
  EX --> DS[useEventDataset  (buffer limitado + índice O(1))]
  EX --> FS[useFilterState  (filtro SoT; hash = projeção)]
  EX --> VS[useViewSelection (View SoT; resto derivado)]
  EX --> CH[useChartConfig/useMetricsChart]
  DS --> TR[useEventsTransport  (fetch/janela via callbacks - DIP)]
  TR --> SVC[services: list/load + loadEventsCount (numérico)]
  SVC --> SF[_shared/filter + _shared/graphql + _shared/service]
  V --> GRID[VirtualEventTable (windower headless - render O(viewport))]
  GRID --> OM[useOverflowMeasure (1 ResizeObserver compartilhado)]
  EX --> IND[DivergenceIndicator (reuso)]
  KAR[useKeepAliveResource (reuso)] -.-> GRID & DS & OM
```

- **Reuso obrigatório:** `useKeepAliveResource`, `_shared/filter/*`, `DivergenceIndicator` (da spec `-fixes`).
- **Co-dependência crítica (verificada):** o teto do buffer (§4.1) sozinho **não** satisfaz os invariantes de render §1 — `VirtualEventTable` + `useEventDataset` devem ser entregues **na mesma wave**.

### 2.1 Contratos-espinha (fixados cedo, consumidos sem mudança) — para as peças ENCAIXAREM

Para que a solução seja **uma arquitetura** e não mudanças isoladas com retrabalho entre waves, estes contratos são estabelecidos na Fase 1 e todos os consumidores dependem deles daí em diante:

1. **Identidade `row.id`** — chave única de linha usada por `useEventDataset` (index `Map<id,summaryMap>`), `useRowWindow` (recycle/`keyOf`), `useOverflowMeasure`, seleção/active/expanded (`useDetailView` → `focusedId`/`Set<id>`), índice de busca e stats. Como o **windowing recicla DOM por id**, a **seleção id-based é da Fase 1** (não Fase 4).
2. **`dataset.rows: shallowRef<Row[]>` + `indexOfId(id)`** — o **contrato de dados da tabela**, fixado na Fase 1 (lá é um adaptador fino sobre o `useEventsData` atual). F3/F4 trocam o _produtor_ atrás desse contrato → a tabela é ligada **uma única vez** (o drop-in §12.1 protege o boundary; o contrato protege o upstream).
3. **Eviction "gated"** — o teto do buffer existe desde a Fase 1, mas a **eviction fica DESLIGADA até a Fase 4** (quando busca/stats viram id-keyed). Os invariantes §1 (observer/DOM = O(viewport)) vêm do **windowing**, não da eviction → a Fase 1 os cumpre e passa o gate P1/P2 sem evictar.
4. **`resetToken` único** — um monotônico no dataset (nova query/filtro/dataset), consumido por window/busca/stats/seleção. Um sinal, não resets espalhados.
5. **Count SoT — um dono, uma wave (Fase 3):** `loadEventsCount` (numérico) **e** a disciplina single-writer-por-recência entram **juntos**, retirando o `@total-computed`/parse-back no mesmo passo. (Removido da Fase 2.)
6. **Seam de reload único:** `useEventsExplorer.reload(reason)` **substitui explicitamente** os writers atuais — watch(`stackByField`), watch(`selectedMetricsDashboard`), watch(`filterData`), `useViewSync.reloadListTableWithHash`, `onActivated loadData` — garantindo ≤1 events + ≤1 metrics por ação.
7. **Dono único de keep-alive:** `useKeepAliveResource`; o bloco de lifecycle do `tab-panel` (keydown) e a de-singletonização do series-cache (`SERIES_ORDER_CACHE`) são reescritos **na mesma wave (Fase 3)**.
8. **`view-protocol` (scheme:key)** vive nos **composables do RTE** (não em `services/_shared`) — é concern de view, já compartilhado por 2 consumidores.
9. **Export:** `VirtualEventTable.exportCSV`/`dataTableRef` são **shim de compatibilidade** que delega ao `useExportData` (re-fetch do range lógico ≤10k), não à instância PrimeVue nem à janela montada.

> Essas mudanças de sequenciamento estão refletidas no `tasks.md` (seção "Ajustes de coerência").

## 3. Components

### Front A — Renderização O(viewport)

### 3.1 `VirtualEventTable` (novo) + `useRowWindow` (novo)

- **Purpose**: renderizar só as linhas do viewport (+overscan) com **altura dinâmica** (célula variável, linha de expansão, resize), sobre um container de scroll **próprio**.
- **Correção da verificação (decisiva):** virtual scroll do PrimeVue é **rejeitado** (itemSize fixo, math multiplicativo, sem medição por-item — provado em `virtualscroller.esm.js`); injetar linhas/spacers no tbody do PrimeVue via `pt`/slots **não compõe** (`pt` é só atributos; o wrapper webkit encaminha um allow-list fixo de slots). Portanto o **corpo** da grid é renderizado por um componente nosso (`VirtualEventTable`), reproduzindo o chrome que de fato usamos (thead sticky, sort, resize de coluna, striping, empty, expansão). Cells/botões continuam webkit.
- **Signature (useRowWindow)**: `useRowWindow({ logicalRows, scrollParentRef, estimatedRowHeight, overscan, keyOf, expandedKey }) -> { windowedRows, topSpacer, bottomSpacer, totalHeight, measureRow, scrollToKey, forceRemeasure }`.
- **Responsibilities**: math de janela com alturas medidas; overscan fixo; recycle por **chave estável** (keyOf=row.id); `forceRemeasure` no fim do resize de coluna.
- **Non-responsibilities**: não mede overflow de badges (é do 3.2); não faz fetch.
- **Touches**: 1.1, 1.2, 1.3, 1.5, 1.6, 1.7, 4.13.

### 3.2 `useOverflowMeasure` (novo) + `log-field-badges.vue` (slimmed)

- **Purpose**: substituir o **1 ResizeObserver por linha** por **exatamente 1** observer por tabela (via `useKeepAliveResource`), calculando o "+N more" das linhas visíveis por identidade.
- **Signature**: `useOverflowMeasure({ scrollParentRef }) -> { hiddenCountFor(rowKey), observeRow(rowKey, el), unobserveRow(rowKey) }`.
- **log-field-badges** vira puramente apresentacional (recebe `:hiddenCount` por prop; remove seu RO/measure). `highlightMatch` produz markup **pré-escapado** (sem round-trip DOMParser/innerHTML) e roda O(visível).
- **Touches**: 1.2, 1.5, 4.5.

### 3.3 `useExportData` (estendido)

- **Purpose**: export CSV/JSON sobre o **resultado lógico** (dataset), não a janela montada nem o buffer evictado. Coexiste com eviction re-buscando o range requisitado (ver Open Question export).
- **Non-responsibilities**: não usa `dataTableRef.exportCSV()` (ligado ao `:value` da janela).
- **Touches**: 1.8, 4.10.

### Front B — Modelo de dados & SoT

### 3.4 `useEventDataset` (novo) + `useEventsTransport` (refactor de `useEventsData`)

- **Purpose**: SRP — **transporte** (fetch/janela) separado do **buffer retido**. Buffer com **teto FIFO** (`maxRows = max(10×pageSize, 5000)`), índice `Map<id, summaryMap>` na ingestão (célula O(1)), `hasMore` de fonte única.
- **Signature**: `useEventDataset({ transport, maxRows }) -> { rows /*shallowRef*/, indexOfId, hasMore, count, append, resetTo, evict, releaseReclaimable, rehydrate }`; transporte depende do dataset só por `onBatch/onCount` (DIP).
- **Touches**: 4.1, 4.4, 4.10, 3.7.

### 3.5 `useDocumentSearch` (lazy) / `useFieldStats` (top-K)

- searchIndex **id-keyed**, construído só com busca ativa, **liberado (entry count 0)** quando inativa. fieldStats retém **≤ K=50** valores/campo + bucket "other"; `statsDirty` (toggle real, sem version-bump).
- **Touches**: 4.2, 4.3, 4.8, 4.16, 7.5.

### 3.6 `useFilterState` (novo) / `useViewSelection` (refactor de `useViewSync`)

- Filtro: **SoT única** (`filterData`), toda mutação imutável; `syncHash()` é o **único writer** do hash (projeção derivada), honrando `initialLoadDone` e a ordem write-hash-before-load. View: `selectedView` writable; `stackByField`/`selectedMetricsDashboard`/`isMetricsView` viram **computeds derivados** injetados no `useChartConfig`.
- **Touches**: 4.9, 4.11, 4.12, 2.3(parcial).

### 3.7 keep-alive reclaimable + `count SoT` + per-tab series cache

- Release/rehydrate do estado reclamável no deactivate/activate (via `useKeepAliveResource`, **um só owner** de lifecycle por composable — evita empilhar registros). `count` = **single-writer por recência** (numérico ponta-a-ponta, sem parse de string). Reativação **não recarrega** se inputs iguais. `createSeriesOrderCache()` por instância (remove o singleton de módulo e os `resetSeriesOrderCache()` em `tab-panel-block:29/534/538`).
- **Touches**: 4.6, 4.14, 4.15, 2.7.

### Front C — Decomposição & orquestração

### 3.8 `useEventsExplorer` (novo) + `reload(reason)`

- Agregador que compõe events/filter/chart/view/detail e expõe **uma API coesa**; **todos** os reload-triggers passam por `reload(reason)` (view/filter/range/activate). ≤1 **events-list** fetch + ≤1 **metrics** fetch por ação (count e chart-agg são chamadas distintas, esperadas). `useViewSync` **emite intent** (`{scheme,key}`) que o `reload` interpreta (evita duplo-disparo).
- **Touches**: 3.2, 4.7, 3.4(behavior).

### 3.9 `EventChart` shell + `chart-render.vue` + `ViewSelector.vue` + `useChartBrush` + decomposição do `useChartBuilder`

- Shell fino preserva nome/ref/emit; `chart-render` só c3; `ViewSelector` (popover+bottom-sheet+focus-trap) próprio; `useChartBrush` (pointer/brush/tooltip). `useChartBuilder` (~1044) → `config`/`series-order`/`pivot-backfill`/`scaling`/`formatting`.
- **Touches**: 3.1, 3.5.

### 3.10 `loadEventsCount` (service novo — **relocação verbatim**)

- **Correção:** **não** reusar `getTotalRecords` (devolve **string 'pt-BR' formatada**, e o inline atual usa fallback chunked próprio). Criar `loadEventsCount({ dataset, tsRange, filters, signal }) -> number` **movendo** a lógica inline de `useEventsData.loadTotalCount` (query + fallback 24h) para o service, preservando auth/tenant (mesmo adapter/headers).
- **Touches**: 3.3, 3.6, 2.7.

### Front D — DRY

### 3.11 Módulos compartilhados

- `_shared/graphql/metrics-filter-inline.js` (**6 sites**, preserva o drop de `or`), `_shared/graphql/pivot-timeseries.js` (**sort como opção explícita** — `pivotGroupedData` é insertion-order; `pickValue` **obrigatório por site** por causa das precedências `sum??count??avg` vs `count??avg??sum`), `_shared/service/parse-graphql-response.js` (switch de status), `_shared/view/view-protocol.js` (scheme:key tipado, 1 lugar), `ts-normalize.js` (+overload `normalizeTsBounds(begin,end)`), `_shared/buckets.js` (duas tabelas de bucket **só** se o oracle provar idênticas; senão mantém as duas). **Oracle golden** por unidade prova byte-equivalência (5.6).
- **Touches**: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7.

### Front E — Correções

### 3.12 Correções pontuais

- **2.1** teto único: `restoreTabs` ceiling-aware (restaura Events primeiro, fatia por `max(0, MAX_TOTAL_TABS-1-eventsRestored)`); usar computed estável (não holder mutável) para evitar init-order trap. **2.2** `closeTab(panelId, nextActiveId?)`/`closeEventsTab(..., nextActiveId?)` — vizinho é **parâmetro** calculado do `combinedTabOrder` (sem overwrite pós-remoção). **2.3** remoção por identidade **sem reordenar** o emit do componente base compartilhado (`emit('removeFilter', index)` fica; a resolução por identidade acontece no consumidor RTE). **2.4** error state pelo **caminho de events** (`chartHasError`, determinístico; metrics auto-fallback). **2.6** deletar re-export morto + teste-guarda (barrel sem `undefined`).
- **Touches**: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6.

### Front F — A11y/DS + Testes

### 3.13 A11y/DS

- **Correção:** detail sidebar é **pane inline**, não modal → `role="complementary"`/`region` + `aria-label`, **sem** `aria-modal`/focus-trap; close com nome acessível. `useFocusTrap` (extraído p/ `src/composables/`) só para o **bottom-sheet real** do chart. Severidade: **tokens de foreground existentes** (`--text-danger` etc.) + **ícone + sr-only** (colorblind-safe); **não** usar `--text-body-xss` (inexistente) — usar `text-body-xs` e caracterizar o delta de px. Afordâncias em elementos interativos. `no-metrics` empty state distinto. `6.1` brush: corrigir/remover o sr-only (default), só referenciando um controle de teclado que **comprovadamente exista**. `6.5` tokens: inventário grep-driven **completo** por arquivo do surface auditado.
- **Touches**: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6.

### 3.14 Testes de medição real

- `results-grid.scaling.test.js` (contagem de rows/DOM/observer em N=100 vs 10000), `search-index.lifecycle`, `field-stats.k-bound`, `focus-trap.listener-count` (keydown 1x por spy), `detail-sidebar.a11y` (comportamental), `event-chart.error-empty` (render do erro), unit dos composables extraídos. Caracterização **antes** de refatorar (N.2). **Dependência dura:** os testes de escala só passam **com** a virtualização → mesma wave.
- **Touches**: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, N.2.

## 4. Data Model

Sem mudança de schema. Novidade **interna**: índice `Map<rowId, Map<fieldKey,value>>` na ingestão (célula O(1)); buffer FIFO com teto; top-K por campo.

## 5. APIs / Contracts

Sem endpoints novos. **Novo contrato interno:** `loadEventsCount(...) -> number` (numérico, auth/tenant preservados). GraphQL de events/metrics inalterado.

## 6. Cross-Cutting Concerns

- **6.1 Security:** `loadEventsCount` preserva auth/tenant/headers (teste assertivo).
- **6.2 Performance:** render O(viewport); 1 observer; ≤1+≤1 fetch/ação; stats ≤K; célula O(1).
- **6.3 Observability:** manter logs; `partial`/divergência preservados (N.7).
- **6.4 A11y:** roles/label/foco corretos por tipo de surface (inline vs modal); não-só-cor.
- **6.5 i18n:** inglês (convenção do projeto).

## 7. Decisions & Trade-offs

### 7.1 Motor de virtualização (a decisão crítica)

- **Context:** §1 exige O(viewport); o DataTable do PrimeVue/webkit **não** virtualiza no lugar (provado) e o `pt`/slots não injetam corpo/spacers.
- **Options:** A. Virtual scroll do PrimeVue — **descartado** (itemSize fixo, quebra altura variável/expansão/resize). B. Injetar tbody via pt/slots — **descartado** (não compõe). C. `VirtualEventTable` próprio (windower headless de altura dinâmica) reproduzindo o chrome usado. D. Adotar um virtual-scroller vetado (ex.: vue-virtual-scroller) para as linhas + header próprio.
- **Decision:** **C, construído COM o webkit (confirmado pelo usuário).** `VirtualEventTable` reusa primitivas, componentes e tokens do webkit (cells, botões, chrome/estilo do DataTable) para paridade visual; substitui apenas a materialização de linhas (windowing). Não é migração para fora do webkit. D descartado.
- **Consequences:** o _mecanismo_ de linhas passa a ser nosso, mas o design system permanece webkit. Exige **spike** como 1ª task para confirmar quanto do chrome do DataTable webkit é reusável vs recriado com primitivas webkit, e preservar `data-testid='table-body-row'` (teste por grep). Co-entrega com o buffer (§3.4).

### 7.2 Contagem: relocar (não reusar `getTotalRecords`)

- **Decision:** criar `loadEventsCount` numérico movendo a lógica inline; `getTotalRecords` (string pt-BR) não serve. **Consequences:** count SoT numérico single-writer (2.7) fica viável.

### 7.3 Detail sidebar: inline, não modal

- **Decision:** `role=complementary`/`region` + label, **sem** focus-trap/aria-modal (é pane inline, verificado). Focus-trap só no bottom-sheet real. **Consequences:** a11y correta sem introduzir trap indevido que quebraria a navegação.

### 7.4 Buffer bound + eviction por identidade

- **Decision:** teto FIFO `max(10×pageSize,5000)`, tudo id-keyed; export re-busca o range lógico. **Consequences:** memória limitada sem perder correção de seleção/expansão/export.

### 7.5 Orquestração via `useEventsExplorer` + intent-based reload

- **Decision:** um seam; `useViewSync` emite intent, `reload(reason)` interpreta; um só owner de keep-alive por composable. **Consequences:** mata duplo-disparo e forward-refs; ≤1+≤1 fetch/ação testável.

## 8. Risks & Mitigations

| Risk                                                                | L   | I   | Mitigation                                                                             |
| ------------------------------------------------------------------- | --- | --- | -------------------------------------------------------------------------------------- |
| Virtualização custom quebra sort/resize/expand/sticky/testid        | M   | H   | Spike 1ª task; caracterização antes; preservar data-testid; testes de equivalência 1.4 |
| Tensão de escopo (substituir corpo do DataTable)                    | M   | H   | **Open Question §11** — decisão de produto/tech-lead antes da wave de virtualização    |
| Buffer bound sozinho não cumpre §1                                  | H   | M   | Co-entregar buffer + VirtualEventTable na mesma wave (N.3)                             |
| Relocação da count query mudar auth/tenant                          | L   | H   | Mover verbatim; teste assertando headers/scoping (3.6/6.1)                             |
| Consolidação DRY divergir de comportamento (sort/pickValue/or-drop) | M   | H   | `pickValue` obrigatório, sort opcional, or-drop preservado; oracle golden (5.6)        |
| Reordenar emit do base component quebra outros consumidores         | M   | M   | Manter emit('removeFilter', index); resolver identidade no consumidor RTE              |
| Lifecycle double-fire ao empilhar useKeepAliveResource              | M   | M   | Um owner de lifecycle por composable                                                   |
| Tokens/contraste (severidade, --text-body-xss inexistente)          | M   | M   | Usar tokens existentes; caracterizar delta de px                                       |

## 9. Migration / Rollout

Sem flag. **Waves mergeáveis** (cada uma: caracterização → mudança → suíte verde + medição real → app-verify). Ordem por risco/ROI:

- **W-spike** virtualização (prova de conceito do `VirtualEventTable`; resolve §11).
- **W1** VirtualEventTable + useEventDataset (co-dependentes, §1+§4.1/4.4/4.10 + observer compartilhado).
- **W2** correções (§2) — barato, alto valor.
- **W3** decomposição/orquestração (§3) incl. loadEventsCount.
- **W4** derivados lazy/limitados + SoT (§4 restante).
- **W5** DRY (§5).
- **W6** a11y/DS + testes reais (§6/§7) — co-fase com W1 para os testes de escala.

## 10. Requirements Coverage

| Req | Covered by                  | Req  | Covered by  |
| --- | --------------------------- | ---- | ----------- |
| 1.1 | §3.1                        | 4.6  | §3.7        |
| 1.2 | §3.1, §3.2                  | 4.7  | §3.8        |
| 1.3 | §3.1, §3.14                 | 4.8  | §3.5, §3.6  |
| 1.4 | §3.1, §7.1, §8              | 4.9  | §3.6        |
| 1.5 | §3.1, §3.2                  | 4.10 | §3.3, §3.4  |
| 1.6 | §3.1                        | 4.11 | §3.6        |
| 1.7 | §3.1, §7.1                  | 4.12 | §3.6        |
| 1.8 | §3.3, §11                   | 4.13 | §3.1, §3.4  |
| 2.1 | §3.12                       | 4.14 | §3.7        |
| 2.2 | §3.12, §7                   | 4.15 | §3.7        |
| 2.3 | §3.12, §3.6                 | 4.16 | §3.5        |
| 2.4 | §3.12, §3.14                | 5.1  | §3.11       |
| 2.5 | §3.12                       | 5.2  | §3.11       |
| 2.6 | §3.12                       | 5.3  | §3.11       |
| 2.7 | §3.7, §3.10, §7.2           | 5.4  | §3.11       |
| 3.1 | §3.9                        | 5.5  | §3.11       |
| 3.2 | §3.8                        | 5.6  | §3.11, §8   |
| 3.3 | §3.10                       | 5.7  | §3.11       |
| 3.4 | §3.8, §3.9                  | 6.1  | §3.13, §11  |
| 3.5 | §3.9                        | 6.2  | §3.13, §7.3 |
| 3.6 | §3.10, §6.1                 | 6.3  | §3.13       |
| 3.7 | §3.4                        | 6.4  | §3.13       |
| 4.1 | §3.4, §7.4                  | 6.5  | §3.13       |
| 4.2 | §3.5                        | 6.6  | §3.13       |
| 4.3 | §3.5                        | 7.1  | §3.14       |
| 4.4 | §3.4                        | 7.2  | §3.14       |
| 4.5 | §3.2                        | 7.3  | §3.14       |
| 7.4 | §3.14                       | 7.5  | §3.14       |
| 7.6 | §3.14                       | 7.7  | §3.14       |
| 7.8 | §3.14                       | N.1  | §9, §3.14   |
| N.2 | §3.14, §9                   | N.3  | §9          |
| N.4 | §3.1/§3.4/§3.5              | N.5  | §9          |
| N.6 | §2 (reuso), §3.1/§3.4/§3.13 | N.7  | §6.3, §3.\* |

**Cobertura: 66/66 mapeados.**

## 11. Open Questions

- [x] **RESOLVIDO (decisão do usuário):** Caminho A — `VirtualEventTable` próprio, **construído com o webkit** (reusa componentes/tokens/estilo do DS; substitui só a materialização de linhas, não abandona o webkit). O spike (1ª task) confirma quanto do chrome do DataTable webkit é reusável vs recriado com primitivas webkit.
- [x] **RESOLVIDO — Export (§1.8/§4.1):** export tem **teto de 10.000 linhas** (constante `EXPORT_MAX_ROWS`, alinhada ao `limit:10000` da API). Re-busca o range/filtro atuais até o teto; se exceder, exporta as 10.000 mais recentes + aviso de truncamento.
- [x] **RESOLVIDO — Brush por teclado (§6.1):** **corrigir/remover** o texto sr-only para refletir a capacidade real (sem implementar zoom por teclado agora).
- [x] **RESOLVIDO — Buckets (§5.7):** unificar numa **regra única compartilhada** adotando a **tabela de maior granularidade** (a do histograma). O gráfico empilhado passa a usá-la → fica **mais fino** nos períodos onde divergia (2d→1h, >365d mais detalhado). É **mudança intencional** (não byte-equivalente para o caminho pivot): caracterização assertando a **nova** granularidade esperada + app-verify, em vez do oracle de igualdade.

## 12. Implementação detalhada (deep-dive verificado)

Detalhamento das peças de maior risco, contra o código-fonte real do webkit/PrimeVue, com as correções da verificação já aplicadas.

### 12.1 `VirtualEventTable` — corpo próprio, chrome/tokens do webkit

- **Fronteira de reuso (confirmada lendo `@aziontech/webkit` datatable.vue + PrimeVue DataTable.vue/VirtualScroller):** manter o DataTable e injetar só o `<tbody>` é **inviável** (thead/tbody são irmãos dentro do `<table>` que vive no `#content` do VirtualScroller; não há slot entre eles; `pt` só decora nós existentes). Logo `VirtualEventTable` **possui o próprio `<table>/<thead>/<tbody>`**.
- **Reusado do webkit:** tokens/CSS vars (todas as regras `:deep(var(--…))` reaproveitadas, re-alvo de `.p-datatable-*` → nossas classes); componentes-folha `PrimeButton`, `Skeleton`, `EmptyResultsBlock`; células de projeto `LogFieldBadges`/`EventDocumentView` inalteradas. `Column` **não** é reusável como renderer (é config-only) → substituído por um descritor JS `columns`.
- **Drop-in:** props/emits/`defineExpose` **byte-idênticos** ao `discover-data-table.vue` (troca-se só o import).
- **Correções da verificação aplicadas:** `table-layout: fixed` com larguras autoritativas do descritor + `columnWidths` ref (o `auto` atual só funciona porque hoje renderiza todas as linhas); **spacers** como um único `<td>` full-width (`height`/`padding:0`/`border:0`/`line-height:0`), não `<tr>` nu; **sort** próprio client-side (espelha o `removableSort` 3-estados); **resize** próprio (espelho de `columnResizeMode=expand`); expansão re-criada como `<tr>` inline; `data-testid="table-body-row"` em cada `<tr>` (preserva o teste por grep). Re-framing: o virtual scroll do PrimeVue **já está desligado** no build atual (baseline renderiza todas as linhas) — a conclusão "possuir a tabela" continua correta.

### 12.2 `useRowWindow` — algoritmo de altura dinâmica

- Cache de alturas medidas **keyed por row.id** (não índice); linha não medida usa estimativa e corrige após medir.
- Offsets cumulativos = prefix-sum (rebuild on dirty); range visível por **busca binária**; spacers derivados dos offsets (não `itemSize×N`).
- **Overscan** constante fixo → linhas montadas = visíveis + overscan (req 1.1).
- **Âncora de scroll:** quando uma correção de altura recai em linhas **acima** da primeira visível (ou em expand/collapse), ajustar `scrollTop` pelo delta acumulado (sem "pulo").
- **Reset seam:** novo `resetToken` monotônico em `useEventsData.load()` (nova query/filtro/dataset) → limpa o cache de alturas (evita alturas obsoletas); `append` **não** reseta.
- **Observers (corrigido):** **uma** instância de `ResizeObserver` (via `useKeepAliveResource`) para medir altura de linha; o "+N more" dos badges é **outra** preocupação, observada **só** quando a coluna Document existe (`selectedFields.length===0`) — a afirmação anterior de "um observer, duas funções, mesmo elemento" foi **refutada**. Células re-materializadas como `<td>` com o markup/classes atuais (não dá para re-invocar os `#body` do `Column` do PrimeVue).
- `scrollParentRef` = o elemento de scroll concreto (nosso próprio viewport). `expandedKeys` normalizado para `Set<id>` a partir do `expandedRows` (array de objetos). Cleanup simétrico em `onBeforeUnmount` **e** `onDeactivated`.

### 12.3 Seams (correções)

- **`loadEventsCount`**: numérico; **reusa `buildFilterParts` + `_shared/filter/build-filter` verbatim**; move a lógica inline (range cheio + fallback 24h) preservando auth/tenant (mesmo `AxiosHttpClientAdapter`/headers) + `AbortSignal`. **Não** reusa `get-total-records` (devolve string pt-BR).
- **top-K stats (corrigido p/ preservar semântica):** `total` continua **exato** — o bucket `other` carrega a soma da cauda (`total = Σ topK + other`); `uniqueCount` mantido exato por contador (ou estimativa HLL se memória crítica); índice keyed por `row.id`, ingerido de `row.summary` (`{key,value}`); teardown limpa os mapas.
- **`useEventsExplorer`:** API retornada (rows/hasMore/count/filter/view/detail/reload); `reload(reason)` é o único gatilho (≤1 events-list + ≤1 metrics por ação; count e chart-agg são chamadas distintas esperadas); `useViewSync` emite **intent**; **um** owner de keep-alive.
- **Oracle DRY:** capturar saídas pré-refactor como fixtures e assertar igualdade estrutural pós-consolidação (query-strings/pivot).
