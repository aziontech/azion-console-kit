# Requirements: Real-Time Events v2 — Refactor & Hardening da solução completa

## Overview

Refatorar e endurecer toda a solução Real-Time Events v2 aplicando SOLID, Clean Code, DRY, enxuto e performático, a partir de uma auditoria holística verificada adversarialmente e da auditoria de memória, com um passe de revisão adversarial sobre estes próprios requisitos. Objetivo: base coesa e de fácil manutenção que escale com muitos documentos, **sem que nada que funciona hoje pare de funcionar** — zero-regressão é o requisito nº 1; comportamento observável preservado exceto onde for melhoria explícita. Reutiliza/estende o que a spec `real-time-events-v2-fixes` já entregou (não reimplementa).

> Convenção de mensurabilidade: onde um critério cita **K** (teto de cardinalidade por campo) ou **overscan** (linhas extras fora do viewport), o valor numérico é decidido no design; o critério exige a **invariante** (ex.: retido ≤ K), verificável por teste com o K escolhido.

## Personas

- **Analista (usuário final)**: investiga eventos/métricas; sofre com lentidão/consumo ao carregar muitos documentos e precisa que a tela continue funcionando exatamente como hoje, só melhor.
- **Mantenedor (dev front-end)**: precisa de arquitetura coesa (orquestração explícita, responsabilidade única, sem duplicação) e de testes que meçam a realidade, não que deem falsa confiança.

## User Stories & Acceptance Criteria

### 1. Escalabilidade de renderização (virtualização)

**User Story:** As a `Analista`, I want `que a tabela permaneça fluida e leve mesmo com muitos documentos`, so that `carregar milhares de linhas não degrade a tela`.

**Acceptance Criteria:**

1.1 While the results table is displayed, the number of mounted row components shall not exceed the visible-row count plus a fixed overscan constant, independent of the total loaded document count.
1.2 The count of live `ResizeObserver` instances attributable to the results table shall be equal at 100 and at 10,000 loaded documents (observer_count(N=100) == observer_count(N=10000)).
1.3 The table DOM-node count at N=10,000 loaded documents shall not exceed its count at N=100 by more than a fixed viewport-proportional margin (measurable, no linear growth).
1.4 After virtualization, each of the following shall behave identically to the pre-virtualization implementation: column sort, column resize, row expand/detail, row selection/active highlight, and search highlight. Each is asserted as an independent before/after equivalence.
1.5 After a scroll cycle that recycles R rows, the net count of live per-row `ResizeObserver`/timers shall return to the steady-state viewport count (delta == 0 across the recycle).
1.6 The number of row-level operations (find/highlight/measure) executed per scroll frame shall be bounded by the visible-row count and independent of the total loaded document count.
1.7 The system shall render correctly under variable and dynamically-changing row heights — including an expanded/detail row and column-resize reflow — with no row overlap, no clipped rows, and stable scroll position on height change.
1.8 CSV export shall include the full set of rows the user loaded/requested for the current filter+range, independent of virtualization or buffer windowing (export operates over the logical result, not the mounted/retained window).

### 2. Correções de correção (bugs confirmados)

**User Story:** As a `Analista`, I want `que abas, filtros, contagem e estados de erro se comportem corretamente`, so that `eu não veja contagens erradas, chips fora de sincronia ou telas em branco`.

**Acceptance Criteria:**

2.1 The system shall enforce a single, consistent tab limit across all tab kinds (pinned Events, additional Events, Dashboard); restoration and admission (including shared-state tabs, §2.5) shall use the same ceiling.
2.2 When the active tab is closed, the system shall activate a neighbor computed from the correct combined tab ordering (not a positional index into a partial array).
2.3 When a filter chip is removed, the system shall remove exactly the filter it maps to (by identity, not positional index), updating filter state immutably.
2.4 If a chart data load fails, then the system shall present a visible chart error state (not an empty chart), consistent with the loading and empty states.
2.5 When a shared-state tab is admitted, the system shall apply the same tab-limit check as any other tab.
2.6 The system shall not re-export a binding that is not defined by its source module.
2.7 The displayed/known total count shall be carried as a single numeric source of truth with a single authoritative writer (the most recent completed load, by request recency); no formatted-string parse-back shall feed logic, and out-of-order/superseded loads shall not leave a stale count displayed.

### 3. Decomposição de god-components & camada de orquestração

**User Story:** As a `Mantenedor`, I want `componentes/composables de responsabilidade única e uma camada de orquestração explícita`, so that `eu consiga entender, testar e evoluir a feature sem arquivos de 1000+ linhas`.

**Acceptance Criteria:**

3.1 The chart concerns shall be separated into single-responsibility, independently-testable units: (a) the chart component owns only rendering/lifecycle; (b) the View selector (popover/bottom-sheet/focus-trap) is its own unit; (c) the pointer-brush/tooltip interaction is its own unit; (d) the chart-building logic (config, series ordering, pivot/backfill, scaling, formatting) is split out of the single 1000+-line builder into focused units.
3.2 The system shall expose a single orchestration seam composing the events/filter/chart/view/detail composables; all data-reload triggers (view change, filter change, range change, tab activation) shall flow through this seam rather than scattered call sites, and the view shall consume one cohesive API rather than manually wiring ~15 composables with forward references.
3.3 The document-count query shall be issued through the service layer; no UI composable shall construct or dispatch GraphQL or reference the HTTP transport directly.
3.4 The decomposition shall not change observable behavior — including chart rendering, brush-to-zoom, View selection, count, detail view, and keep-alive semantics.
3.5 Each extracted unit shall have a single responsibility and be unit-testable in isolation.
3.6 The relocated count query shall preserve the existing authentication, tenant/account scoping, and authorization semantics (same headers/scoping), verified by test.
3.7 The events load path shall have a single load routine with one "has more data" determination reused by all callers (no duplicated hasMoreData logic), producing identical availability for identical load results.

### 4. Modelo de dados limitado, estado derivado lazy/limitado, fonte-única

**User Story:** As a `Analista`, I want `que a tela use memória proporcional ao que vejo e que estado (filtro/view/seleção) nunca desincronize`, so that `sessões longas permaneçam estáveis e corretas`.

**Acceptance Criteria:**

4.1 The retained row buffer shall have an explicit upper bound; loading beyond the bound shall window/evict rather than grow without limit.
4.2 The full-text search index shall exist only while a search is active, not be built eagerly for every loaded row.
4.3 The retained per-field value-statistics entries shall not exceed a fixed maximum K per field, regardless of the number of distinct values ingested.
4.4 Field-value access per rendered cell shall be constant-time (indexed at ingestion), not a linear scan per cell per field.
4.5 Search highlighting shall be produced without re-parsing HTML on every render.
4.6 While a kept-alive tab is deactivated, its reclaimable per-tab memory shall be released (a measurable drop) and fully and correctly rehydrated on re-activation with no observable difference to the user.
4.7 For a single discrete View-change or stack-by-change action, the number of events-fetch service calls shall be ≤ 1 and the number of metrics-fetch service calls shall be ≤ 1 (measured by service-call spy).
4.8 Derived computed values shall recompute via their real reactive dependencies (no manual version-counter bump to force recomputation).
4.9 All filter-state updates shall be immutable and consistent across every filter action.
4.10 Bounding/eviction and lazy derivation shall preserve the logically-available result set (every loaded/requested row remains reachable via scroll or refetch) and shall not change the displayed count or "load more" availability — this preservation is distinct from the physically-retained buffer bounded by §4.1.
4.11 Filter state shall have a single authoritative source of truth; the URL hash shall be a derived projection of that source, not an independent store that can diverge.
4.12 View/stack-by selection shall be represented by a single source of truth with the rest derived (computed) — no parallel derived refs that can desync.
4.13 Row selection, active-row, and expanded-row identity shall be tracked by stable identity (not positional index) and remain correct across insert, evict, and reorder of the row buffer.
4.14 Re-activating a kept-alive tab shall not trigger a data reload unless its inputs (filters, range, dataset, view) changed since deactivation.
4.15 Per-tab derived caches (e.g. series ordering) shall be scoped per tab, not shared via module-level singletons; a given tab shall render identical series order regardless of other tabs' activity.
4.16 When a search is cleared or inactive, the full-text index structure shall be released (entry count 0).

### 5. Consolidação de duplicação (DRY)

**User Story:** As a `Mantenedor`, I want `uma única implementação para cada conceito repetido`, so that `mudanças fiquem localizadas e o código encolha sem perder comportamento`.

**Acceptance Criteria:**

5.1 Metrics-API filter/variable/param construction shall have a single shared implementation reused by all call sites.
5.2 The per-timestamp pivot/backfill/sort logic shall have a single shared implementation reused across services.
5.3 The per-dataset list/load services shall share their common scaffold (status-code handling, request shape) through one implementation.
5.4 The View "scheme:key" protocol shall be defined, parsed, and encoded in exactly one place.
5.5 Timestamp values shall be formatted exactly once (no format-then-overwrite).
5.6 Each consolidation shall be behavior-preserving, verified against a characterization/golden oracle capturing pre-consolidation outputs for representative inputs (structural equality).
5.7 Repeated definition sets (time-bucket intervals, status/method/cache-status buckets) shall each be consolidated into a single shared definition.

### 6. Acessibilidade & design-system

**User Story:** As a `Analista`, I want `operar a tela por teclado e leitor de tela e ver estilos consistentes`, so that `a feature seja acessível e visualmente coerente`.

**Acceptance Criteria:**

6.1 The time-range brush shall resolve to a single testable behavior per the recorded UX decision (see Open Questions): either it is keyboard-operable consistent with its screen-reader instruction, or the instruction is removed/corrected to match the actual capability.
6.2 The detail sidebar (modal-like surface) shall expose an appropriate role, an accessible label, and focus management (trap + restore); its close control shall have an accessible name.
6.3 Interactive affordances shall be built on keyboard-operable interactive elements, not click handlers on non-interactive tags.
6.4 Status/severity and feedback shall not be conveyed by color alone; a text or icon cue shall accompany it.
6.5 Within the RTE v2 components/files touched by this refactor (the audited surface), the system shall use design-system tokens/components only — no hardcoded hex/rgba, no palette utility classes, no raw font-size utilities, no non-token shadows, no legacy PrimeVue aliases.
6.6 When the selected dataset/range yields no metric data, the system shall show a defined empty/no-metrics state, visibly distinct from the loading and error states.

### 7. Integridade de testes & medição real

**User Story:** As a `Mantenedor`, I want `testes que meçam a realidade`, so that `o zero-regressão seja verificável e não uma falsa confiança`.

**Acceptance Criteria:**

7.1 The memory/scaling benchmark shall assert real measurable bounds — live ResizeObserver count, mounted-row-component count, table DOM-node count, and search-index entry count — each compared across two document counts (e.g. 100 vs 10,000) with a defined tolerance; it shall not assert object/ref identity.
7.2 The results grid shall have component tests including a scaling invariant (component/DOM/observer count vs document count).
7.3 Keep-alive release/rehydrate shall be tested by asserting actual acquisition/release (observer/listener counts, index/stat entry counts cleared to their defined floor) — not by re-reading a ref.
7.4 Accessibility shall be tested behaviorally (keyboard operation, focus management, roles/labels) — not by grepping source text.
7.5 The high-cardinality field-stats bound shall be tested by feeding strictly more than K distinct values and asserting the retained stat-map size ≤ K while displayed stats remain correct.
7.6 Each composable extracted or refactored in this effort shall have unit tests covering its public API and behavior.
7.7 Global/document-level listeners (e.g. keydown) shall be tested to be added exactly once per lifecycle and removed symmetrically, with no double-registration across tab re-activation or component remount (asserted by add/removeEventListener spy counts).
7.8 A simulated chart-load failure shall be tested to drive the component into the visible error state (§2.4), asserted by querying the mounted error region.

## Non-Functional Requirements

### N. Zero-regressão, performance, processo

N.1 The full RTE v2 automated suite shall remain green at every mergeable phase; no existing passing test shall break (zero-regression, hard gate).
N.2 Before refactoring each area, characterization tests shall exist for its current behavior. At minimum this includes: brush-to-zoom range emission, tab admission/limit + neighbor-on-close ordering, filter chip removal, share-state round-trip, displayed count, and sort/expand/selection.
N.3 Each phase shall be independently mergeable, pass lint with no new warnings, and carry a measurable acceptance criterion.
N.4 Performance budgets, each as a concrete two-point/threshold measurement: observer count and mounted-row count equal at N=100 vs N=10,000; table DOM-node count ≤ f(viewport)+C independent of N; events + metrics service calls ≤ 1 each per discrete view/filter action; per-field stat entries ≤ K.
N.5 Observable phases (§1, §3, §6) shall be verified against a per-phase manual-verification checklist (explicit pass/fail per item) via a real app run before merge, in addition to automated tests.
N.6 The refactor shall reuse/extend the abstractions delivered by `real-time-events-v2-fixes` (`useKeepAliveResource`, `_shared/filter/`, `DivergenceIndicator`), not duplicate them.
N.7 Where filters are dropped or data is partial (including any chart-vs-list range/clamp boundary difference), the system shall keep signaling it to the user (preserve the divergence/partial indicator behavior).

## Out of Scope

- Migrar para fora do c3.js ou do PrimeVue/@aziontech/webkit.
- Alterar contratos das APIs GraphQL (events/metrics) — apenas relocar lógica de query já existente para a camada certa.
- Novas features de produto — este trabalho é refactor/hardening/correção do comportamento existente.
- i18n/tradução (inglês é a convenção do projeto — descartado na verificação).
- Rebater o escopo já entregue por `real-time-events-v2-fixes` (reusar, não refazer).
- Eliminar a divergência chart-vs-list de fronteira/clamp (C5): mantida sob §N.7 (sinalizada, não removida) salvo decisão contrária.

## Open Questions

- [ ] **Teto do buffer retido (§4.1):** valor de K-linhas máximas retidas (ex.: múltiplo do page size) — decisão de UX/produto; default sensato no design.
- [ ] **Brush por teclado (§6.1):** implementar caminho de teclado para o brush **ou** corrigir/remover o texto sr-only — decisão de UX; resolve §6.1 para uma afirmação testável única.
- [ ] **Export vs buffer limitado (§1.8 / §4.1):** ao exportar com buffer limitado/evictado, exportar o buffer atual ou re-buscar o range completo requisitado? — decisão de UX/produto.
