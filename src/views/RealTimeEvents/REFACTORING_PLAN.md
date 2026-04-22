# Real-Time Events — Deep Analysis & Refactoring Plan

## Architecture Overview

The module has **4 layers**:

| Layer              | Files                                            | Purpose                                                                 |
| ------------------ | ------------------------------------------------ | ----------------------------------------------------------------------- |
| **Router**         | `real-time-events-routes/index.js`               | Injects services as route props                                         |
| **Orchestrator**   | `TabsView.vue` (626 lines)                       | Session mgmt, dataset selection, URL sync, field loading                |
| **Core Panel**     | `tab-panel-block.vue` (527 lines)                | Filters, charts, table, detail view, export, search — **does too much** |
| **Sub-components** | 9 components + 10 composables + 4 constant files | Individual UI concerns                                                  |

### File Inventory

**Views:**

- `TabsView.vue` — main orchestrator (626 lines)
- `Blocks/tab-panel-block.vue` — core panel (527 lines)

**Components (Blocks/components/):**

- `event-chart.vue` — C3.js chart with brush selection
- `dashboard-panel.vue` — wrapper for predefined panels
- `detail-sidebar-panel.vue` — sidebar detail view
- `event-document-view.vue` — document details (table/JSON tabs)
- `field-sidebar.vue` — field selection + stats
- `field-selector.vue` — column picker
- `log-field-badges.vue` — inline log field badges
- `session-browser.vue` — session list sidebar
- `session-creator.vue` — session create/edit dialog

**Composables:**

- `useEventsData.js` — data fetching + pagination + chart aggregation
- `useChartBuilder.js` — raw data → C3.js config transformation
- `useChartBucketing.js` — time bucketing + formatting utilities
- `useMetricsChart.js` — metrics GraphQL API loader
- `useDetailView.js` — inline/sidebar detail, row selection, keyboard nav
- `useDocumentSearch.js` — debounced document search + highlighting
- `usePageSize.js` — persisted page size
- `useQueryHistory.js` — AQL query history (localStorage)
- `useSavedSearches.js` — saved searches (localStorage)
- `useSeverityClassifier.js` — severity classification for log fields

**Constants (Blocks/constants/):**

- `chart-configs.js` — chart configs per dataset
- `predefined-panels.js` — predefined investigation panels
- `query-fields.js` — GraphQL field/operator query builders
- `tabs-events.js` — dataset definitions, fields, tab metadata

**Services:**

- `services/panels-service/index.js` — panel CRUD + sharing (localStorage)
- `services/real-time-events-service/` — API services (list, load, aggregation)

---

## Dead Code & Unused Exports

### `tab-panel-block.vue`

| Item            | Line | Issue                                                |
| --------------- | ---- | ---------------------------------------------------- |
| `truncateValue` | ~220 | Function defined, never called in template or script |
| `nextTick`      | 2    | Imported from Vue, never used                        |
| `toRef`         | 2    | Imported from Vue, never used                        |

### `TabsView.vue`

| Item                 | Line | Issue                                                         |
| -------------------- | ---- | ------------------------------------------------------------- |
| `loadMetricsReports` | 176  | Prop declared with `default: null`, never referenced anywhere |

### `tabs-events.js`

| Item                          | Lines                             | Issue                                                                                                                                                                                                       |
| ----------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `columns` property            | Every tab config (~8 occurrences) | Defined with `columnBuilder` but **no component ever reads `.columns`** from tab config. Table columns are defined inline in `tab-panel-block.vue` template                                                 |
| `columnBuilder` import        | 1                                 | Only used by the dead `columns` property                                                                                                                                                                    |
| `customColumnMapper` property | Every tab config                  | Only used by `exportFunctionMapper` in `tab-panel-block.vue` for CSV export — but all 8 mappers are **identical** (`{ tsFormat: rowData.data, summary: rowData.data }`). Should be a single shared function |
| `DATASET_FIELDS` export       | 366                               | Named export, only consumed internally. No external import found                                                                                                                                            |

### `useSavedSearches.js`

| Item           | Line | Issue                                           |
| -------------- | ---- | ----------------------------------------------- |
| `updateSearch` | 65   | Exported but **never imported** by any consumer |

### `useMetricsChart.js` — Design Smell

`METRICS_CHART_CONFIGS` only contains one entry: `wafThreats`. In `tab-panel-block.vue` line 244, `METRICS_CHART_CONFIGS.wafThreats` is hardcoded for **ALL** dashboard selections:

```javascript
watch(selectedMetricsDashboard, (id) => {
  if (!id) {
    metricsChartConfigKey.value = null
    return
  }
  // For now, all dashboards use wafThreats config  ← ⚠️ hardcoded
  const config = METRICS_CHART_CONFIGS.wafThreats
  metricsChartConfigKey.value = config.chartConfigKey
  loadMetricsChart(config)
})
```

The dropdown shows different dashboard names (WAF Threats, Bot Manager, Status Codes, etc.) but **always loads WAF data**. This is either a bug or an incomplete implementation.

---

## Business Logic Embedded in Components

### `tab-panel-block.vue` — the "God Component"

This 527-line file mixes **6 distinct concerns** that should be separated:

#### 1. Filter Management (~60 lines)

- `handleAddFilter` — find filter field, build filter object, push to filterData
- `handleExcludeFilter` — same for exclusion operators
- `handleRemoveFilter` — splice filter by index
- `refreshFilterData` — read from URL hash, merge initial filters
- `defaultFilter` — create default tsRange filter
- `reloadListTableWithHash` — persist to URL hash + reload

#### 2. Chart Config Resolution (~20 lines)

- `chartConfigKey` — maps panel name to chart config key (redundant mapping, since panel name === config key)
- `hasChartConfig` — checks config exists and aggregation function is provided
- Metrics dashboard watcher — loads metrics chart on dashboard selection change

#### 3. Query History Formatting (~20 lines)

- `getHistoryParts` — parses filter fields or AQL strings into structured display parts using `OPERATOR_MAPPING`

#### 4. Export Logic (~15 lines)

- `exportMenuItems` — CSV/JSON export menu
- `exportFunctionMapper` — maps row data for DataTable CSV export

#### 5. Dataset Selection (~5 lines)

- `datasetDropdownOptions` — computed from allDatasets
- `onDatasetDropdownChange` — emits dataset-change event

#### 6. Brush → Filter Sync (~15 lines)

- `handleBrushSelect` — updates filterData.tsRange, syncs AdvancedFilterSystem, reloads metrics chart + table

### `TabsView.vue` — Session Logic in Orchestrator

Contains **~200 lines of session CRUD logic**:

- `handleSessionSave` — save/update panel via panels-service
- `editSession` — open creator in edit mode
- `deleteSession` — delete via panels-service, fallback to Log Explorer
- `shareSession` — encode panel config, copy URL to clipboard
- `syncUrlWithPanel` — sync `?panel=` query param
- `readPanelFromUrl` — restore panel from URL on mount
- `handlePanelConfigImport` — decode `?panelConfig=` and import shared panel
- `removePanelConfigParam` — cleanup URL after import

Also contains **field loading logic** (~50 lines):

- `loadFieldsAndOperators` — fetch GraphQL schema
- `fetchFieldsWithOperator` — build filter field list with abort controller
- `sortByMostRelevantFilters` — sort using `GetRelevantField` helper

### `dashboard-panel.vue` — REPORTS Coupling

Lines 56–80: translates `metricsDashboardIds` → dropdown options by scanning the entire `REPORTS` array. This coupling to the metrics module constants should be in a service/helper.

---

## What's Working Well

- **Composables are well-scoped**: `useDetailView`, `useDocumentSearch`, `usePageSize`, `useQueryHistory`, `useChartBucketing` are clean, focused, and reusable
- **Services are properly separated**: `panels-service`, `real-time-events-service` encapsulate API/storage calls
- **`PREDEFINED_PANELS` constant** is clean, declarative, and easy to extend
- **`useEventsData`** handles temporal windowing for long ranges correctly
- **`useChartBuilder`** cleanly transforms data → C3.js config

---

## Phased Refactoring Plan

### Phase 1 — Cleanup (Safe, No Architecture Change)

| #   | Task                                                                                                      | Impact                       | Risk                                                                   |
| --- | --------------------------------------------------------------------------------------------------------- | ---------------------------- | ---------------------------------------------------------------------- |
| 1.1 | Remove `truncateValue`, `nextTick`, `toRef` from `tab-panel-block.vue`                                    | Dead code removal            | None                                                                   |
| 1.2 | Remove `loadMetricsReports` prop from `TabsView.vue`                                                      | Dead code removal            | None                                                                   |
| 1.3 | Remove `columns` + `customColumnMapper` from every tab in `tabs-events.js`; remove `columnBuilder` import | Dead code (~120 lines saved) | Check CSV export still works — may need a generic mapper               |
| 1.4 | Remove `DATASET_FIELDS` named export (keep as local `const`)                                              | Unused export cleanup        | None                                                                   |
| 1.5 | Remove `updateSearch` from `useSavedSearches.js` return                                                   | Unused export cleanup        | None                                                                   |
| 1.6 | Fix `METRICS_CHART_CONFIGS` — either map dashboard IDs to specific configs or document the limitation     | Bug/design smell             | Medium — requires understanding which dashboards should load what data |

### Phase 2 — Extract Business Logic to Composables

| #   | New Composable                                                            | Extracted From        | Responsibility                                                                                                                                      |
| --- | ------------------------------------------------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1 | **`useFilterActions(filterData, filterFields, tabSelected, toast)`**      | `tab-panel-block.vue` | `handleAddFilter`, `handleExcludeFilter`, `handleRemoveFilter`, `refreshFilterData`, `defaultFilter`, `reloadListTableWithHash`, URL hash sync      |
| 2.2 | **`useSessionManager(toast)`**                                            | `TabsView.vue`        | All session CRUD: save, edit, delete, share, URL sync, panel config import/decode, panel loading. Returns reactive `panels`, `activePanel`, methods |
| 2.3 | **`useChartConfig(tabSelected, filterData, loadEventsChartAggregation)`** | `tab-panel-block.vue` | `chartConfigKey` resolution, `hasChartConfig`, metrics dashboard selection/watcher, brush → filter propagation                                      |
| 2.4 | **`useExportData(tableData, tabSelected)`**                               | `tab-panel-block.vue` | `exportMenuItems`, `exportFunctionMapper`, CSV/JSON export logic                                                                                    |
| 2.5 | **`useMetricsDashboardResolver(dashboardIds)`**                           | `dashboard-panel.vue` | Translate `metricsDashboardIds` → dropdown options using REPORTS constant                                                                           |

#### Expected Results after Phase 2

- **`tab-panel-block.vue`**: ~527 → ~250 lines (template + composable wiring)
- **`TabsView.vue`**: ~626 → ~350 lines
- All business logic becomes **testable in isolation** without mounting Vue components
- `useFilterActions` becomes **reusable** across Log Explorer and Dashboard Panel

### Phase 3 — Structural Simplifications (Optional, Higher Risk)

| #   | Task                                                                                                                                                       | Benefit                                                          | Risk                            |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------- |
| 3.1 | Unify route props — replace 8 individual dataset props with a single `services` map object                                                                 | Eliminates repetitive prop declarations in router + TabsView     | Medium — changes prop interface |
| 3.2 | Simplify `tabs-events.js` schema — remove `index`, consolidate `panel`/`tabRouter`, drop unused fields                                                     | Cleaner data model                                               | Low                             |
| 3.3 | Consider merging `useEventsData` + `useMetricsChart` into unified `useDataLoader` with strategy pattern                                                    | Single data pipeline, less duplication in loading/error handling | High — significant rewrite      |
| 3.4 | Extract `chartConfigKey` mapping — the `map` object in `tab-panel-block.vue` line 74 maps panel names to themselves; simplify to just use `panel` directly | Remove unnecessary indirection                                   | Low                             |

---

## Dependency Graph

```
TabsView.vue
├── TabPanelBlock (Log Explorer mode)
│   ├── useEventsData (data fetching)
│   ├── useDocumentSearch (search)
│   ├── useDetailView (row selection)
│   ├── usePageSize (pagination)
│   ├── useQueryHistory (history)
│   ├── useSavedSearches (persistence)
│   ├── useMetricsChart (metrics API)
│   ├── EventChart ← useChartBuilder ← useChartBucketing
│   ├── FieldSidebar / FieldSelector
│   ├── LogFieldBadges ← useSeverityClassifier
│   ├── DetailSidebarPanel ← EventDocumentView
│   └── AdvancedFilterSystem (shared base component)
│
├── DashboardPanel (Session mode)
│   └── TabPanelBlock (reused with fixed dataset + metrics dashboards)
│
├── SessionBrowser (session list)
├── SessionCreator (create/edit dialog)
└── panels-service (CRUD + sharing)
```

---

## Notes

- `AdvancedFilterSystem` is a **shared base component** (`src/components/base/`). Changes there affect other features beyond Real-Time Events. Refactoring proposals should avoid breaking its public API.
- The `charts` property in `PREDEFINED_PANELS` is always `[]` for all predefined panels. The charts functionality is only used by custom sessions created via `SessionCreator`.
- The temporal windowing in `useEventsData` (2-hour windows for long ranges) is a critical performance feature that must be preserved during any refactoring.
