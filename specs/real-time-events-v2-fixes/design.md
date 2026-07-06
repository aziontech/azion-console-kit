# Design: Real-Time Events v2 — Correções de estabilidade, performance e reatividade

> Status: **Draft, awaiting approval** (aprofundado + verificado adversarialmente)
> Linked requirements: `specs/real-time-events-v2-fixes/requirements.md`

## 1. Goals & Non-Goals

**Goals**

- Resolver os 3 defeitos (leak keep-alive, remontagem do Fields, staleness/AQL do metrics) por meio de **abstrações coesas e compartilhadas**, não de remendos isolados no mesmo componente.
- Consolidar a construção de filtros (events×metrics) e o ciclo de vida de recursos em **fontes únicas** reutilizadas por todo o subsistema (SOLID/Clean Code/DRY/OCP).
- Garantir correção verificável (testes + DoD por wave) e **remover o código morto** que a consolidação tornar redundante.

**Non-Goals** — precisão do brush pixel→tempo; virtualização da tabela; migração do c3; mudanças fora do RTE v2; reescrever o fetch chart-driven do `dev` (auditado). Também **fora**: `src/components/ResizableSplitter.vue` (componente distinto, usado por EdgeSQL/EdgeFunctions, sem keep-alive — não confundir com o do RTE em `src/components/Splitter/`).

## 2. Arquitetura em camadas (pensada em conjunto)

O subsistema é reorganizado em **4 camadas**; cada correção nasce de uma camada e as camadas se conectam por **seams compartilhados** — uma mudança vive em um lugar só.

```mermaid
flowchart TD
  subgraph L1[L1 · Domínio de filtro _shared/filter/]
    BF[build-filter: coerce+group+buildFilter → {and,in,or}]
    FC[field-capability: METRICS_FILTER_FIELDS + isFieldSupported]
    AD1[cleanBuiltFilterForMetrics → {cleaned,partial}]
    AD2[buildForTarget(fields,target) → {filter,dropped,partial}]
  end
  subgraph L2[L2 · Ciclo de vida — src/composables]
    KAR[useKeepAliveResource(acquire,release)]
  end
  subgraph L3[L3 · Apresentação do chart]
    EC[event-chart.vue] --> KAR
    LFB[log-field-badges.vue] --> KAR
    RS[Splitter/ResizableSplitter.vue] --> KAR
  end
  subgraph L4[L4 · Reatividade + UI do metrics]
    UCC[useChartConfig: watch(filterData) guardado + reloadActiveMetrics]
    UMC[useMetricsChart: runLoad+token+debounce, expõe partial]
    IND[DivergenceIndicator]
  end
  BF --> UED[useEventsData.buildApiFilters]
  BF --> AD1 --> LEA[load-events-aggregation]
  BF --> AD2 --> UMC
  FC --> AD1 & AD2
  UCC --> UMC --> IND
```

**Seams compartilhados (o "pensar junto"):**

- **L1** alimenta os dois loaders (events e metrics) e a contagem → AQL, `partial` e indicador saem de **uma origem**.
- **L2** é o único dono de "recurso keep-alive-safe" → resolve o leak (#1) e habilita a largura no toggle do Fields (#2) **no mesmo seam**.
- **L4** é um fluxo único: watch → `reloadActiveMetrics` → `useMetricsChart` (que consome L1) → `partial` → indicador.

**Decisão de profundidade de extração (pragmática, ver §7.6):** extraímos as **duas preocupações genuinamente transversais/duplicadas** (L1 filtro, L2 lifecycle). A decomposição adicional do god-component `event-chart.vue` (brush, view-menu) é benéfica mas de maior risco → proposta como follow-up opcional, **fora destas waves**, para não arriscar regressão nos concerns intactos (SOLID "na medida").

## 3. Components

### L1 — Domínio de filtro

#### 3.1 `_shared/filter/build-filter.js` (novo)

- **Purpose**: única implementação de coerção + agrupamento de cláusulas.
- **Exports**: `coerceFilterValue(raw,type)`, `buildFilterGroup(clauses)`, `buildFilter(fields) → {and,in,or}` (movidos de `useEventsData`).
- **Non-responsibilities**: não renderiza GraphQL (segue via `build-filter-parts.js`), não conhece Vue, não consulta capacidade.
- **Touches**: 5.2, 5.5, 6.1.

#### 3.2 `_shared/filter/field-capability.js` (novo)

- **Purpose**: **fonte única** de "campo X é filtrável no alvo Y?".
- **Exports**: `isFieldSupported(valueField, target)`, `resolveCapabilityTarget(config) → {api:'metrics',dataset}` (resolve o dataset a partir das **4 formas** de `METRICS_CHART_CONFIGS`: `metricsApiSeries.metricsDataset` | `eventsApi`/`metricsApiFallback.metricsDataset` | `config.metricsDataset`, espelhando o branch do `load()`); dono do mapa **`METRICS_FILTER_FIELDS`** (hoje em `load-events-aggregation.js:137-217`, movido para cá).
- **Correção verificada**: **filterable-fields ≠ aggregable-fields** — o introspection `aggregableFieldsByDataset`/`canUseConfig` (viabilidade de chart) **permanece** em `useChartConfig`. Esta camada só cuida de **filtrabilidade**.
- **Default conservador**: campo não registrado → tratado como **não suportado** para metrics (nunca envia chave que a API rejeitaria — 6.3).
- **Touches**: 5.1, 6.2, 6.3.

#### 3.3 Adapters em `_shared/filter/` (novos) — **dois caminhos distintos**

- `cleanBuiltFilterForMetrics(builtFilter, metricsDataset) → {cleaned, partial}` — **substitui** `filterForMetrics` **apenas** no caminho _events-roteado-via-metrics_ (`load-events-aggregation.js`). Preserva o contrato `{cleaned, partial}`, **deixa `.or` intacto** (como hoje), e não altera o tratamento especial de chaves `status*`.
- `buildForTarget(fields, target) → {filter, droppedFields, partial}` — **novo**, para o caminho _metrics-VIEW_ (`useMetricsChart`). Dataset-aware; **sem remapper de operador lossy** — só inclui campos cuja expressão na convenção daquele dataset é conhecida/correta; o resto vai para `droppedFields` e `partial=true`.
- **Touches**: 5.3, 5.4, 6.1.

### L2 — Ciclo de vida

#### 3.4 `src/composables/useKeepAliveResource.js` (novo — **local neutro**)

- **Purpose**: dono único da simetria `onMounted+onActivated` (acquire-if-inactive) / `onBeforeUnmount+onDeactivated` (release-if-active).
- **Signature**: `useKeepAliveResource(acquire: () => H|void, release: (h: H|null) => void) → { isActive, forceAcquire, forceRelease }`.
- **Internals**: `handle=null`, `active=ref(false)`; `doAcquire` retorna cedo se `active`; `doRelease` guarda `!active` e envolve `release` em `try/finally` (reset garantido mesmo se `release` lançar — 1.3 error path). **SSR-safe**: nenhum acesso a `window` no load do módulo (guards ficam no `acquire`).
- **Correção verificada**: fica em `src/composables/` (não sob `RealTimeEventsV2`) porque o splitter mora em `src/components/Splitter/` e também consome (N.2).
- **Touches**: 1.1, 1.2, 1.4, 1.6, N.2.

### L3 — Apresentação do chart (consomem L2)

#### 3.5 `event-chart.vue` (modificado)

- **Change**: definir `acquireViewportResources()` (cria RO em `chartContainerRef||chartRef` + adiciona os 6 listeners; retorna o RO como handle) e `releaseViewportResources(ro)` (remove os 6 listeners + `ro.disconnect()`); **deletar** os blocos duplicados de criação (606-610/708-712) e remoção (641-648/679-686) do RO e listeners nos 4 hooks; chamar `useKeepAliveResource(acquire, release)` uma vez; **remover** o `let resizeObserver=null` (580).
- **Permanece** nos hooks próprios do componente: `initChart()` no `onMounted`; limpeza de timers/rAF/`pendingResize`, `chartInstance.destroy()`, `resetTickCache`, `remove onSheetKeydown`, `closeViewMenu` (só deactivate); e o **bloco de refit** no `onActivated` (715-718) — que lê `chartRef` e **independe** do RO.
- **Correção verificada**: ordem no primeiro mount — a claim "acquire roda antes do refit" foi corrigida: o refit não depende do RO; garantir apenas que `initChart` do componente e o `acquire` do composable coexistam (ambos `onMounted`, ordem de registro). `expandAndResize` (watch `collapsed`) segue intacto.
- **Touches**: 1.1, 1.2, 1.3, 1.4, 1.6, 1.7, 2.1, 2.3, 3.1, 3.2, 7.1.

#### 3.6 `log-field-badges.vue` (modificado)

- **Change**: `acquire=()=>{observe+scheduleMeasure; return ro}`, `release=(ro)=>{cancelAF; ro?.disconnect()}` via `useKeepAliveResource`, adicionando a simetria activate/deactivate que falta; re-mede overflow no activate. Renderiza sob o mesmo KeepAlive do `tab-panel-block` (confirmado) — 1 instância por linha; custo de hooks por linha é negligível.
- **Touches**: 1.5, 2.2.

#### 3.7 `src/components/Splitter/ResizableSplitter.vue` (modificado)

- **Change**: `acquire=()=>{applyInitialSizes(); cria+observa RO; return ro}`, `release=(ro)=>{onPointerUp(); ro.unobserve+disconnect}` via `useKeepAliveResource`, fechando a falta de `onDeactivated`. `applyInitialSizes` passa a rodar **uma vez** no 1º mount (hoje roda em dobro) + a cada reativação genuína. `onPointerUp` no release é no-op quando `!isDragging` (harmless — verificado).
- **Touches**: 1.3, 1.4, 3.4.

#### 3.8 `tab-panel-block.vue` (modificado)

- **Change**: **remover** `:key="String(sidebarVisible)"` (581) — a classe `splitter--sidebar-collapsed` já esconde o painel; adicionar `watch(sidebarVisible)`→`nextTick`→`eventChartRef.resize()` (salvaguarda de largura, mesmo padrão do `watch(detailSidebarVisible)`); no `onActivated`, chamar `reloadActiveMetrics()` (§3.10); na troca de dataset, resetar view órfã (§3.10); montar `DivergenceIndicator` no header via prop.
- **Touches**: 3.1, 3.3, 3.4, 3.5, 3.6, 4.3, 4.9, 7.1, 7.3.

### L4 — Reatividade + UI do metrics

#### 3.9 `useEventsData.js` (modificado)

- **Change**: `buildApiFilters` passa a delegar para `buildFilter` (L1); **deletar** `coerceFilterValue`/`buildFilterGroup`/corpo inline. **Byte-equivalente** (mesmo `{and,in,or}`); `buildFilterParts` segue como renderer. Nada do fetch chart-driven/`knownTotalCount`/windowing muda.
- **Touches**: 5.2, 5.5.

#### 3.10 `useChartConfig.js` (modificado)

- **Change**: adicionar `watch(() => [filterData.value?.tsRange, filterData.value?.fields], handler, {deep:true})` — `handler` retorna se `!selectedMetricsDashboard.value`, senão chama `reloadActiveMetrics()`; **sem** `immediate` (o watcher 197 já faz o 1º load); **remover** a chamada direta `loadMetricsChart` do `handleBrushSelect` (o watch cobre — 4.8); expor **`reloadActiveMetrics()`** (zero-arg: resolve `selectedMetricsDashboard.value` em `METRICS_CHART_CONFIGS` e chama `loadMetricsChart`), consumido pelo `onActivated` e pelo reset de dataset; expor `metricsViewItemsFlat` para o reset. `aggregableFieldsByDataset`/`canUseConfig` **inalterados**.
- **Touches**: 4.1, 4.2, 4.3, 4.4, 4.8, 4.9, 5.1.

#### 3.11 `useMetricsChart.js` (modificado)

- **Change**: renomear o corpo async para `runLoad(config)` com **token de supersessão** (`let loadToken=0; const myToken=++loadToken`; checar após cada `await` antes de escrever `data.value`/`isLoading`; **preservar** o `if(result.loaded)` do branch `metricsApiFallback`); exportar `load(config)` **debounced** (leading-clear + trailing 50ms → `runLoad`); `onScopeDispose(()=>clearTimeout(loadDebounceTimer))`; consumir `filterData.value.fields` via `buildForTarget(fields, resolveCapabilityTarget(config))` e **expor `partial`** (≥1 campo aplicável-no-events descartado). `isLoading` correto sob supersessão (superseded `runLoad` não mexe em `isLoading`).
- **Touches**: 4.5, 4.6, 4.7, 6.1, N.4.

#### 3.12 `load-events-aggregation.js` (modificado)

- **Change**: substituir `filterForMetrics` local (223-251) por `cleanBuiltFilterForMetrics` (L1) mantendo `{cleaned, partial}`, o passthrough de `.or` e o tratamento de `status*`; **deletar** `filterForMetrics`/`extractBaseField`/`METRICS_FILTER_FIELDS` locais (movidos para L1).
- **Touches**: 5.3, 5.4, 5.5.

#### 3.13 `DivergenceIndicator` (novo — feito inline, subsistema do workflow falhou)

- **Purpose**: avisar que gráfico (Metrics) e lista (Events) podem divergir.
- **Type**: `Blocks/components/divergence-indicator.vue`, prop-driven (sem estado global).
- **Data flow do `partial`**: `buildForTarget` → `useMetricsChart` expõe `partial` → `useChartConfig` re-expõe → `tab-panel` passa como prop ao `EventChart` → header renderiza `<DivergenceIndicator :visible="isMetricsView && metricsPartial" />`.
- **UI**: ícone de aviso do design system (recomendação: `pi pi-exclamation-triangle` / equivalente webkit; cor semântica `--yellow`/warning via token, **sem hex/tailwind cru**), no header do chart perto do count/"Drag to zoom"; `v-tooltip` explicando "o gráfico (Metrics) pode não refletir todos os filtros da lista (Events)".
- **A11y**: `aria-label`/descrição acessível + acionável por teclado (focus), não só hover.
- **Visibilidade**: só quando metrics view ativa **e** `partial`; escondido sem filtros ou com todos aplicados.
- **Touches**: 7.1, 7.2, 7.3, 7.4, 7.5.

## 4. Data Model

Não aplicável.

## 5. APIs / Contracts

Sem endpoints novos. Contratos **internos** novos (L1): `isFieldSupported(field,target)`, `resolveCapabilityTarget(config)`, `buildFilter(fields)`, `buildForTarget(fields,target)→{filter,droppedFields,partial}`, `cleanBuiltFilterForMetrics(built,dataset)→{cleaned,partial}`. Queries GraphQL existentes inalteradas; muda só **quais** campos de filtro o metrics recebe.

## 6. Cross-Cutting Concerns

### 6.1 Security

Filtros seguem parametrizados (variáveis via `build-filter-parts`); descartar campo não suportado **reduz** risco de erro de schema.

### 6.2 Performance & scalability

Fields toggle O(1) (sem `c3.generate`/re-render de 500 linhas); debounce coalesce metrics; menos observers vivos.

### 6.3 Observability

Ao descartar campos no metrics (`partial`), log info dos campos descartados (suporte explica a divergência).

### 6.4 Accessibility

Indicador com `aria-label`/descrição, foco por teclado; tokens do design system (guardrail `azion-design-system`).

### 6.5 i18n

Copy do tooltip do indicador segue o padrão de textos do projeto.

### 6.6 Correção verificável & Definition of Done (por wave)

Cada wave só fecha quando: (1) testes unitários da wave verdes; (2) **suíte RTE v2 inteira verde** (431 — N.1); (3) lint/format sem novos warnings; (4) comportamento verificado nos pontos observáveis (contagem de observers no baseline; **nenhum `c3.generate`** no toggle; metrics recarrega em data/AQL; indicador só na divergência); (5) **teste de byte-equivalência** do builder de events; (6) **dead-code sweep** concluído (§9).

## 7. Decisions & Trade-offs

### 7.1 Composable único de lifecycle vs corrigir cada componente

- **Options**: A. `useKeepAliveResource` reutilizável (local neutro `src/composables/`). B. Guarda inline por componente.
- **Decision**: A. **Consequences**: 1 ponto de teste (N.2), menor reincidência.

### 7.2 Fonte de capacidade: filterable-fields dedicado vs reusar aggregable introspection

- **Decision**: mapa **`METRICS_FILTER_FIELDS`** dedicado em `field-capability.js`; **não** reusar `aggregableFieldsByDataset` (concern diferente — viabilidade de chart). **Consequences**: separação limpa; introspection fica onde está.

### 7.3 Dois caminhos de "metrics", não um

- **Context**: `filterForMetrics` (events→metrics em `load-events-aggregation`) foi confundido com o metrics-VIEW (`useMetricsChart`).
- **Decision**: adapters separados — `cleanBuiltFilterForMetrics` (mantém `{cleaned,partial}`, `.or` intacto) e `buildForTarget` (novo). **Consequences**: byte-equivalência do caminho antigo preservada; AQL-no-metrics-view isolado.

### 7.4 Convenção de operador do metrics: mapper lossy vs suportado-ou-descarta

- **Context**: `botManagerMetrics` usa `classifiedEq`; `httpMetrics` usa chaves nuas (`wafBlock:'1'`) — conflitam.
- **Options**: A. Remapper global (lossy/frágil). B. `isFieldSupported` só aprova o que é expressável corretamente naquele dataset; resto → dropped+partial+indicador.
- **Decision**: B (alinha com "só campos suportados, senão nada + indicador"). **Consequences**: aplica menos campos, porém sempre correto; nunca envia chave inválida.

### 7.5 Reatividade do metrics: dedup do brush + helper zero-arg

- **Decision**: `watch(filterData)` em `useChartConfig` + remover load direto do `handleBrushSelect`; expor `reloadActiveMetrics()` (não vazar config resolution pro componente); `runLoad`+token+`load` debounced+`onScopeDispose`. **Consequences**: um disparo por ação; sem timer vazado.

### 7.6 Profundidade de extração do event-chart (escopo)

- **Options**: A. Extrair só as 2 preocupações transversais (lifecycle, filtro). B. Decompor também brush/view-menu do god-component.
- **Decision**: A nestas waves; B como follow-up opcional. **Consequences**: coesão nas partes que os fixes tocam, sem arriscar concerns intactos; a porta para B fica aberta.

## 8. Risks & Mitigations

| Risk                                                    | L   | I   | Mitigation                                                           |
| ------------------------------------------------------- | --- | --- | -------------------------------------------------------------------- |
| Refit/overflow quebrar após activate                    | M   | M   | Testes 2.1/2.2/2.3; acquire refaz observe/measure                    |
| Remover `:key` deixar largura errada                    | M   | M   | Salvaguarda `resize()` (7.5/3.8) + teste 3.4                         |
| Quebrar byte-equivalência do events ao mover o builder  | L   | H   | `buildFilter` idêntico + teste de byte-equiv + suíte (N.1)           |
| Confundir os 2 caminhos de metrics                      | M   | H   | §7.3 adapters separados; teste "metrics count path unchanged"        |
| Chave de operador errada enviada ao metrics             | L   | M   | §7.4 suportado-ou-descarta; teste "no unsupported field survives"    |
| Timer de debounce vazando sob keep-alive                | M   | M   | `onScopeDispose` em `useMetricsChart`                                |
| Remover código ainda referenciado                       | L   | H   | **Grep de referências + suíte verde antes de deletar** (§9)          |
| Tocar `src/components/ResizableSplitter.vue` por engano | L   | H   | Escopo explícito: só `src/components/Splitter/ResizableSplitter.vue` |

## 9. Migration / Rollout & Dead-code hygiene

Sem feature flag. **Waves mergeáveis** (cada uma cumpre §6.6):

- **W1 — L1 filtro** (build-filter + field-capability + adapters); `useEventsData` e `load-events-aggregation` delegam; **deleta** duplicatas (coerce/group/buildApiFilters body; filterForMetrics/extractBaseField/METRICS_FILTER_FIELDS). Comportamento inalterado (byte-equiv).
- **W2 — L2 lifecycle** (`useKeepAliveResource`); event-chart/log-badges/splitter delegam; **deleta** blocos duplicados de RO/listeners e o `let resizeObserver`.
- **W3 — #2** remover `:key` + salvaguarda resize.
- **W4 — L4 reatividade** (watch + `reloadActiveMetrics` + token/debounce + `onScopeDispose` + reset dataset + error path).
- **W5 — #6/#7** aplicar AQL suportado ao metrics + `DivergenceIndicator`.

**Dead-code sweep (cada wave + varredura final):** grep de referências no repo antes de qualquer remoção; só remove o **comprovadamente não referenciado**; remove imports/exports órfãos e código legado/comentado que a extração deixar. **Trava de segurança:** não deletar código não criado nesta feature sem confirmar que está morto — em ambiguidade, **reportar em vez de apagar**.

## 10. Requirements Coverage

| Req | Covered by                        | Req  | Covered by                      |
| --- | --------------------------------- | ---- | ------------------------------- |
| 1.1 | §3.4, §3.5                        | 4.6  | §3.11                           |
| 1.2 | §3.4, §3.5                        | 4.7  | §3.11                           |
| 1.3 | §3.4, §3.5, §3.7                  | 4.8  | §3.10, §7.5                     |
| 1.4 | §3.4, §3.5, §3.7                  | 4.9  | §3.10, §3.8                     |
| 1.5 | §3.6                              | 4.10 | §3.11 (preserva onMetricsError) |
| 1.6 | §3.4, §3.5                        | 5.1  | §3.2, §3.10                     |
| 1.7 | §3.5                              | 5.2  | §3.1, §3.9                      |
| 2.1 | §3.5                              | 5.3  | §3.3, §3.12                     |
| 2.2 | §3.6                              | 5.4  | §3.3, §3.12, §6.3               |
| 2.3 | §3.4, §3.5                        | 5.5  | §3.1, §3.9, §3.12, §8           |
| 3.1 | §3.8, §7 (W3)                     | 6.1  | §3.3, §3.11                     |
| 3.2 | §3.8, §6.2                        | 6.2  | §3.2, §3.3                      |
| 3.3 | §3.8, §6.2                        | 6.3  | §3.2, §7.4                      |
| 3.4 | §3.7, §3.8                        | 7.1  | §3.13, §3.8                     |
| 3.5 | §3.8                              | 7.2  | §3.13, §6.4                     |
| 3.6 | §3.8 (cache vive fora do subtree) | 7.3  | §3.13                           |
| 4.1 | §3.10                             | 7.4  | §3.13, §6.4                     |
| 4.2 | §3.10                             | 7.5  | §3.13, §6.4                     |
| 4.3 | §3.8, §3.10                       | N.1  | §6.6, §9                        |
| 4.4 | §3.10                             | N.2  | §3.4, §7.1                      |
| 4.5 | §3.11                             | N.3  | §3.8, §6.6                      |
| —   | —                                 | N.4  | §3.11, §7.5                     |
| —   | —                                 | N.5  | §6.6 + testes por wave          |
| —   | —                                 | N.6  | §3.1–§3.4 (SOLID), §6.4         |
| —   | —                                 | N.7  | §3.13                           |

**Cobertura: 46/46 mapeados.**

## 11. Open Questions

- [ ] Ícone/copy exatos do indicador (recomendado `pi pi-exclamation-triangle` + tooltip "gráfico pode não refletir todos os filtros") — ajuste fino de UX na wave do indicador; não bloqueia tasks.
