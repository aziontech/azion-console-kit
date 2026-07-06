# Requirements: Real-Time Events v2 — Correções de estabilidade, performance e reatividade

## Overview

O Real-Time Events v2 (RTE v2), após a fusão com `dev`, apresenta três defeitos confirmados por auditoria adversarial sobre o código mesclado (HEAD `4edbd0730`): (1) vazamento de memória por `ResizeObserver`/listeners não liberados de forma simétrica sob `<KeepAlive>`, (2) lentidão perceptível ao alternar o painel **Fields** por remontagem completa da subárvore do gráfico + tabela, e (3) o gráfico de **Metrics** que não reflete mudanças de data/filtro e ignora inteiramente o filtro AQL. Esta feature corrige os três **sem regredir comportamento observável** (o #1 é invisível ao usuário; #2 e #3 melhoram a experiência) e consolida a lógica duplicada de construção de filtros e de ciclo de vida de recursos em abstrações coesas e reutilizáveis (SOLID/Clean Code/DRY).

## Personas

- **Analista (usuário final do RTE v2)**: investiga eventos e métricas em tempo real; sofre com a lentidão do Fields, o gráfico de Metrics desatualizado e sessões longas que consomem memória crescente.
- **Mantenedor (desenvolvedor front-end)**: precisa de uma estrutura coesa, com fonte única de verdade para construção de filtros e para o ciclo de vida de recursos sob keep-alive, para evitar que a divergência events↔metrics e os leaks se repitam.

## User Stories & Acceptance Criteria

### 1. Ciclo de vida de recursos sob keep-alive (correção do vazamento de memória)

**User Story:** As a `Analista`, I want `que abrir/fechar abas e alternar o painel Fields não acumule memória`, so that `sessões longas permaneçam estáveis`.

**Acceptance Criteria:**

1.1 The system shall create at most one active `ResizeObserver` per mounted `EventChart` instance at any moment.

1.2 When an `EventChart` instance is first mounted inside `<KeepAlive>` (onMounted followed by onActivated), the system shall not leave any `ResizeObserver` orphaned (unreferenced but still connected).

1.3 When a keep-alive host is deactivated or unmounted, the system shall disconnect every `ResizeObserver` and remove every `document`/`window`/element listener it acquired, on all teardown paths (including the error path where `chartInstance.destroy()` throws).

1.4 When a keep-alive host is re-activated, the system shall re-acquire the observers/listeners it released on deactivation, exactly once (no duplicate registration).

1.5 While a tab is deactivated (cached, not unmounted), the system shall not keep per-row `ResizeObserver` instances of `log-field-badges` connected.

1.6 The system shall not register the same named listener more than once for a given target as a net effect of a mount/activate cycle.

1.7 After any sequence of activate/deactivate cycles followed by unmount, the count of live observers and listeners attributable to the component shall return to zero (no residual retention of the c3 chart instance or `chartData`).

### 2. Reativação preserva comportamento (regressão-guard do #1)

**User Story:** As a `Analista`, I want `que o gráfico e os badges continuem funcionando depois de trocar de aba`, so that `a correção do vazamento não quebre a interação`.

**Acceptance Criteria:**

2.1 When a tab is re-activated and its chart container has a new width, the system shall refit the chart to the new width.

2.2 When a tab is re-activated, the system shall recompute the `log-field-badges` overflow ("+N more") indicator so it reflects the current layout.

2.3 While a tab is active, the system shall respond to container resizes (sidebar/splitter changes, window resize) by refitting the chart, as it does today.

### 3. Alternância do painel Fields sem remontagem (correção de performance)

**User Story:** As a `Analista`, I want `alternar o painel Fields de forma instantânea`, so that `eu inspecione campos sem travamentos nem flicker`.

**Acceptance Criteria:**

3.1 When the user toggles the Fields panel, the system shall not destroy and recreate the `EventChart` component instance.

3.2 When the user toggles the Fields panel, the system shall not invoke a full chart regeneration (`c3.generate`) nor re-run the events/metrics aggregation request.

3.3 When the user toggles the Fields panel, the system shall not unmount and re-render the entire results table; already-loaded rows shall be preserved.

3.4 When the Fields panel is hidden or shown, the system shall ensure the chart and the results table occupy the resulting available width (no clipped or under-sized chart after the toggle).

3.5 When the Fields panel is hidden, the system shall keep it visually hidden (no layout artifact) and shall restore it on show.

3.6 If the Fields panel is toggled while data is loaded, then the system shall preserve the incremental field-statistics already computed (no full O(rows × fields) recomputation caused by the toggle).

### 4. Gráfico de Metrics reflete data e filtro atuais (correção de staleness)

**User Story:** As a `Analista`, I want `que o gráfico de Metrics acompanhe a data e os filtros que apliquei`, so that `eu confie que estou vendo o recorte atual`.

**Acceptance Criteria:**

4.1 While a Metrics view is active, when the user changes the date range and applies, the system shall reload the metrics chart for the new range.

4.2 While a Metrics view is active, when the user applies, edits, or removes an AQL filter (including legend-click filters), the system shall reload the metrics chart.

4.3 While a Metrics view is active, when the tab is re-activated (keep-alive), the system shall reload the metrics chart for the current filter/range.

4.4 While an Events view is active, the system shall not issue metrics-chart requests in response to filter/date changes.

4.5 If two metrics reloads are triggered in rapid succession, then the system shall ensure the response of the superseded request never overwrites the result of the most recent request.

4.6 When multiple filter/date changes occur within a short window, the system shall coalesce them so that redundant metrics requests are not issued for each intermediate state.

4.7 When a metrics reload is in flight, the system shall reflect a loading state consistent with the existing events-chart loading behavior.

4.8 When a single user action both changes the time range and requests a reload (e.g. brush-select, which mutates `tsRange` and requests a data reload), the system shall issue at most one metrics reload for that action (no duplicate request from the direct call plus the filter watcher).

4.9 When the dataset changes and the currently active metrics view is not available for the new dataset, the system shall reset the view to the default events view.

4.10 If a metrics reload fails, then the system shall preserve the existing error handling (user-facing notification and fallback to the default events view) and shall not leave a blank or broken chart silently.

### 5. Contrato de capacidade de filtro (events × metrics) e consolidação

**User Story:** As a `Mantenedor`, I want `uma fonte única que decida se um campo de filtro se aplica a cada API (events/metrics) e um construtor de filtro reutilizado pelas duas`, so that `events e metrics parem de divergir de forma ad hoc e o código fique coeso`.

**Acceptance Criteria:**

5.1 The system shall determine, for a given filter field and a given target (Events GraphQL, or a specific Metrics dataset), whether that field is applicable, from a single authoritative source.

5.2 The system shall build the API filter payload for the Events path and for the Metrics path from a single shared clause-coercion-and-grouping implementation (no duplicated filter-building logic across the composable and service layers).

5.3 When one or more active filter fields are not applicable to the current metrics target, the system shall exclude only the unsupported fields from the metrics query while keeping the supported ones.

5.4 If any active filter field was excluded from the metrics query because the target does not support it, then the system shall flag the result as partial so the UI can indicate the displayed total does not reflect all active filters.

5.5 The system shall keep the observed behavior of the Events path unchanged: every filter field expressible against the Events GraphQL continues to be applied to events queries and counts.

### 6. Aplicação do filtro AQL ao gráfico de Metrics (decidido: aplicar subconjunto suportado)

**User Story:** As a `Analista`, I want `que o gráfico de Metrics respeite os filtros AQL suportados pela API de metrics`, so that `o gráfico e a tabela mostrem o mesmo recorte sempre que possível`.

**Acceptance Criteria:**

6.1 While a Metrics view is active and AQL filters are applied, the system shall apply the supported subset of those filters (per §5) to the metrics query.

6.2 If an active filter field is not supported by the current metrics target, then the system shall not apply that field to the metrics query and shall not raise an error (silent no-op at query level; the divergence is surfaced per §7).

6.3 The system shall never send an unsupported filter field to the metrics API (no schema-mismatch error introduced by AQL application).

### 7. Indicador de divergência entre gráfico (Metrics) e lista (Events)

**User Story:** As a `Analista`, I want `um aviso visual quando o gráfico e a lista puderem divergir`, so that `eu esteja ciente de que nem todos os filtros valem para o gráfico`.

**Acceptance Criteria:**

7.1 When the metrics chart could not apply one or more active filters that the events (documents) query does apply, the system shall display a visible indicator (e.g. a "!" / "?" affordance) adjacent to the chart.

7.2 When the user hovers or focuses the indicator, the system shall explain that the chart (Metrics) and the documents list (Events) may differ because one or more active filters are not supported by the metrics data source.

7.3 While all active filters are applied to both the metrics and the events queries (or no filters are active), the system shall not display the indicator.

7.4 The indicator (icon, tooltip, semantic color) shall use Azion design-system tokens/components — no hardcoded colors, sizes, or shadows.

7.5 The indicator shall expose an accessible name/description to assistive technologies (e.g. an accessible label / `aria` description), not only a visual hover affordance.

## Non-Functional Requirements

### N. Qualidade, performance, testes e observabilidade

N.1 The system shall not regress the existing RTE v2 automated test suite (currently 431 passing tests); all shall remain green.

N.2 The keep-alive resource-lifecycle acquisition/release pattern shall be implemented once and reused by `EventChart`, `log-field-badges`, and `ResizableSplitter` (single implementation, not copied per component).

N.3 When the Fields panel is toggled, the system shall complete the toggle without a network request and without a chart-instance recreation (verifiable: no `c3.generate` call and stable chart instance identity across the toggle).

N.4 The metrics-chart loader shall implement request supersession (monotonic token) and input debounce equivalent to the events-chart loader, so out-of-order responses cannot render.

N.5 The refactor shall be covered by tests that assert: at most one live observer per EventChart across mount/activate/deactivate cycles; no chart regeneration on Fields toggle; metrics reload on date/filter change while a metrics view is active; and the filter-capability contract's inclusion/exclusion + partial flag.

N.6 Filter-related and lifecycle-related units introduced shall follow the project's SOLID/Clean Code guardrails (single responsibility, dependency inversion at the API/target boundary) and the Azion design-system rules where UI is touched.

N.7 The divergence indicator (§7) shall be covered by tests asserting it is shown only when the metrics query dropped at least one events-applicable filter, and hidden otherwise.

## Out of Scope

- Precisão do brush "drag-to-zoom" (mapeamento pixel→tempo ignorando a margem do eixo Y) — item distinto, não faz parte destes três.
- Virtualização da tabela de resultados (mudança maior de UX/perf) — aqui apenas removemos a remontagem; a tabela continua sem virtualização.
- Migração do c3.js para outra biblioteca de gráficos.
- Alterações fora do RTE v2 trazidas pelo merge com `dev`.
- Reescrever a lógica de contagem/fetch chart-driven do `dev` (auditada e considerada sólida).

## Decisions (resolved)

- **Metrics honra AQL:** sim — aplica apenas o subconjunto de campos suportados pela API de metrics; campos não suportados **não são aplicados** (no-op, sem erro). Resolve §6.
- **Campo não suportado:** **não** roteia para a Events API; apenas descarta do metrics e **sinaliza a divergência ao usuário** via indicador visual (§7). Fixa o comportamento do contrato §5 (descartar-e-sinalizar).

## Open Questions

- (nenhuma pendente)
