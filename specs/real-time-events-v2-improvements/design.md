# Design: Real-Time Events V2 Improvements

> Status: **Draft, awaiting approval**
> Linked requirements: `specs/real-time-events-v2-improvements/requirements.md`

## 1. Goals & Non-Goals

**Goals**
- Enable query sharing via shareable links that encode filters, dataset, page size, and field selection (requirements 1.1–1.7).
- Fix GraphQL errors in Function, Function Console, Data Stream, Edge DNS, and Activity History tabs caused by invalid `groupBy` clauses (requirements 2.1–2.7).
- Restore saved search persistence to localStorage with validation and graceful degradation (requirements 3.1–3.7).
- Stabilize the Add Filter modal width to prevent layout jank on field/operator changes (requirements 4.1–4.6).
- Meet non-functional requirements: clipboard handling (<100ms), share decoding (<50ms), saved search load (<200ms for 50+ items), accessibility (focus trap, ARIA labels, screen-reader announcements), security (URL-safe encoding, no PII exposure, explicit user action only).

**Non-Goals**
- Implement a backend API for cross-device persistent saved searches (localStorage-only).
- Add collaborative/real-time multi-user editing of shared queries.
- Redesign the Add Filter modal component itself (only stabilize width).
- Implement share URL expiry or access control.
- Add usage analytics on shared URLs (internal logging only).

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│               Real-Time Events V2 Flow                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  TabsView.vue (container)                                   │
│  ├─ Share Button [pi-share-alt]                            │
│  │   └─ handleShare() → useSessionManager.shareCurrentView()
│  │                                                          │
│  │       1. Collect viewState (filters, dataset, pageSize) │
│  │       2. Encode state → encodeShareState(state)         │
│  │       3. Build URL with ?shareState=<encoded>          │
│  │       4. AWAIT navigator.clipboard.writeText()         │
│  │       5. Toast success or error                         │
│  │                                                          │
│  ├─ Tabs (pinned Events + custom Panels)                   │
│  │   ├─ EventsTab (fixed)                                  │
│  │   │   └─ TabPanelBlock                                  │
│  │   │       ├─ FilterBar                                  │
│  │   │       │   └─ Add Filter Modal (OverlayPanel)      │
│  │   │       │       └─ FilterPanel                        │
│  │   │       │           └─ FilterRow (width stability)    │
│  │   │       ├─ EventsTable                                │
│  │   │       └─ Saved Searches (useSavedSearches hook)     │
│  │   │                                                      │
│  │   └─ Custom Panels (from Sessions)                      │
│  │       └─ DashboardPanel (metrics charts)                │
│  │                                                          │
│  └─ Share State Import                                      │
│      └─ URL ?shareState param → handleShareImport()        │
│          1. Decode → decodeShareState()                    │
│          2. Validate schema                                │
│          3. Create ephemeral shared tab (if custom panel)   │
│          4. Apply viewState (filters, pageSize, fields)    │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ Composables (state + side-effects)                          │
├─────────────────────────────────────────────────────────────┤
│  • useSessionManager: Share encode/decode, tab lifecycle    │
│  • useSavedSearches: localStorage CRUD, validation          │
│  • useEventsData: Compose chart queries (fix: check groupBy)│
│  • useMetricsChart: Metrics-API chart driver               │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ Services (GraphQL + REST layer)                            │
├─────────────────────────────────────────────────────────────┤
│  • real-time-events-service-v2                             │
│    ├─ load-events-aggregation.js                           │
│    │   └─ loadEventsChartFromEventsApi()                   │
│    │       └─ CHECK: groupByField not in unsupported list  │
│    │           (Function, Function Console, Data Stream,   │
│    │            DNS, Activity History)                      │
│    │                                                        │
│    └─ _shared/dataset-fields.js                           │
│        └─ CURATED_DATASET_FIELDS (truth source for guard)  │
│                                                              │
│  • panels-service (encode/decode share state)              │
│    ├─ encodeShareState() → base64(JSON.stringify(payload)) │
│    └─ decodeShareState() → parse + validate ver            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Components

### 3.1 Share Button Integration

- **Location**: [TabsView.vue:52-59](src/views/RealTimeEventsV2/TabsView.vue#L52-L59)
- **Purpose**: Trigger query sharing flow; generate clipboard-copied URL.
- **Type**: Vue component + event handler.
- **Inputs**: Active tab state, current filters, dataset selection (collected by `getCurrentShareState()`).
- **Outputs**: Toast notification (success or error); clipboard write.
- **Responsibilities**:
  - Call `handleShare()` on button click.
  - Collect `viewState` from active tab via `tabPanelBlockRef.value?.getCurrentShareState()`.
  - Pass `viewState` + `eventsTab` to `shareCurrentView()`.
  - Display appropriate success/error toast.
- **Non-responsibilities**:
  - Does not encode/decode share state (delegated to `panels-service`).
  - Does not manage URL history (delegated to `useRouter`).
  - Does not persist queries (delegated to `useSavedSearches`).
- **Touches requirements**: 1.1, 1.2, 1.3, 1.4, N.4, N.8, N.9.

### 3.2 `shareCurrentView()` Composable Function

- **Location**: [useSessionManager.js:317-357](src/views/RealTimeEventsV2/composables/useSessionManager.js#L317-L357)
- **Purpose**: Encode view state, build share URL, copy to clipboard, notify user.
- **Type**: Async composable function.
- **Inputs**: `{ viewState, eventsTab }` object.
- **Outputs**: Side-effects (clipboard write, toast), no return value.
- **Responsibilities**:
  - Construct state object with `tab`, `viewState`, optional `eventsTab` and `panelConfig`.
  - Call `encodeShareState(state)` → base64-encoded string.
  - Build full URL with `?shareState=<encoded>` query param.
  - **AWAIT** `navigator.clipboard.writeText(url.toString())` (fix: currently fire-and-forget).
  - Emit success toast only after clipboard write resolves.
  - On clipboard failure, catch and emit error toast with detail.
  - Feature-detect clipboard availability; fallback to fallback dialog UI (See decision 7.1).
- **Non-responsibilities**:
  - Does not validate that filters/dataset are sensible (caller is responsible).
  - Does not clear existing query params (only adds `shareState` and removes `panel`/`panelConfig`).
- **Touches requirements**: 1.1, 1.2, 1.3, 1.4, 1.6, N.1, N.7, N.8, N.9.

**Pseudo-code (fix)**:
```javascript
const shareCurrentView = async ({ viewState = {}, eventsTab = null } = {}) => {
  try {
    const state = { tab: activeTabId.value, viewState };
    if (eventsTab !== null) state.eventsTab = eventsTab;
    // ... panelConfig logic
    const encoded = encodeShareState(state);
    const url = new URL(window.location.href);
    url.searchParams.delete('panel');
    url.searchParams.set('shareState', encoded);
    
    // FIX: await clipboard write and guard feature availability
    if (!navigator.clipboard || !window.isSecureContext) {
      throw new Error('Clipboard API unavailable');
    }
    await navigator.clipboard.writeText(url.toString());
    
    toast.add({ severity: 'success', summary: 'Share URL copied', life: 3000 });
  } catch (err) {
    // If clipboard fails, try fallback: show dialog with copyable URL
    try {
      fallbackCopyDialog.showURL(url.toString());
      toast.add({ severity: 'info', summary: 'URL opened for manual copy', life: 4000 });
    } catch {
      toast.add({ severity: 'error', summary: 'Error generating share URL', detail: String(err).slice(0, 100), life: 5000 });
    }
  }
};
```

### 3.3 `handleShareImport()` Share State Decoder

- **Location**: [useSessionManager.js:373-430](src/views/RealTimeEventsV2/composables/useSessionManager.js#L373-L430)
- **Purpose**: Decode share state from URL query param and apply to active view.
- **Type**: Composable lifecycle function.
- **Inputs**: `route.query.shareState` (base64-encoded string).
- **Outputs**: Set `pendingShareViewState` and `pendingEventsTabState` refs; create ephemeral shared tab if custom panel in state.
- **Responsibilities**:
  - Read `?shareState` from route query.
  - Call `decodeShareState(encoded)` → validate schema (`ver` field).
  - If invalid, show error toast and remove param.
  - If valid and contains custom `panelConfig`, create ephemeral shared tab (type: 'shared', not persisted).
  - If valid and contains `eventsTab` (separate Events tab), populate `pendingEventsTabState` for TabsView.vue to handle.
  - Set `pendingShareViewState` for the active tab to apply (filters, pageSize, selectedFields).
- **Non-responsibilities**:
  - Does not persist shared tabs (only creates ephemeral ones; user can save via Session Creator).
  - Does not re-encode/validate the actual filter values (only schema validation).
- **Touches requirements**: 1.5, 1.6, 1.7, N.2, N.9.

### 3.4 Saved Searches Persistence

- **Location**: [useSavedSearches.js](src/views/RealTimeEventsV2/composables/useSavedSearches.js) (full file)
- **Purpose**: CRUD operations on saved searches; localStorage persistence with validation.
- **Type**: Composable hook.
- **Inputs**: User actions (create, apply, delete).
- **Outputs**: Reactive `savedSearches` array; side-effects (localStorage write).
- **Responsibilities**:
  - On mount, load saved searches from localStorage using `storageKey = tenant:user`.
  - **FIX**: Validate each entry on load (`try { JSON.parse } catch { skip + log }`), per requirement 3.6.
  - On create, generate unique ID, serialize state object, write to localStorage.
  - On delete, remove entry from localStorage.
  - On save failure (quota exceeded, unavailable), emit `localStorageAvailable = false` flag.
  - **FIX**: Emit a one-time warning toast ("Saved searches unavailable this session") per requirement 3.5.
  - Each saved search contains: `id`, `name`, `dataset`, `filters`, `pageSize`, `selectedFields`, `description`.
  - Requirement 3.7: saved searches are "keyed by dataset" — interpretation: keep flat list, show dataset badge (already done); no filter-by-dataset overlay behavior.
- **Non-responsibilities**:
  - Does not sync across devices (localStorage only, not backend).
  - Does not handle user logout (will be wiped when `storageKey` becomes null, which is OK).
- **Touches requirements**: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, N.3, N.10.

### 3.5 Add Filter Modal — Width Stability

- **Location**: [advanced-filter-system-v2/filterFields/index.vue:16-35](src/components/base/advanced-filter-system-v2/filterFields/index.vue#L16-L35) (OverlayPanel root)
- **Location**: [filterPanel/index.vue](src/components/base/advanced-filter-system-v2/filterFields/filterPanel/index.vue) (inner panel structure)
- **Purpose**: Stabilize modal width across filter field/operator changes.
- **Type**: Vue component (OverlayPanel wrapper + inner FilterPanel).
- **Inputs**: Selected filter field, operator, input values.
- **Outputs**: Rendered filter editor UI with stable width.
- **Responsibilities**:
  - **FIX**: Set fixed responsive width via design-system tokens:
    - Desktop (≥ 1024px): `35rem` (560px, per req 4.1 example).
    - Tablet (640–1023px): `min(35rem, 90vw)`.
    - Mobile (< 640px): `calc(100vw - 1rem)` (full-bleed).
  - Apply width to **OverlayPanel root** (not just outer wrapper).
  - Apply `min-width: 35rem` to inner `filterPanel` div so content cannot shrink it.
  - All child field-input components (`multiselect-filter.vue`, `select-filter.vue`, `dialog-filter.vue`) must use `w-full` + `min-w-0` for responsive reflow without pushing outer bounds.
  - On viewport resize (orientation change), width adapts per breakpoint but does not flicker.
- **Non-responsibilities**:
  - Does not change input types or operators (no new fields in scope).
  - Does not modify dialog behavior or add new affordances.
- **Touches requirements**: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, N.5, N.6.

### 3.6 Add Filter Modal — Focus Trap & Keyboard Support

- **Location**: [filterFields/index.vue](src/components/base/advanced-filter-system-v2/filterFields/index.vue) (OverlayPanel root)
- **Purpose**: Ensure keyboard navigation and focus management per requirement N.5.
- **Type**: Vue component (via directive or event handlers).
- **Inputs**: Keyboard events (Tab, Escape, Enter).
- **Outputs**: Focus trap (prevent tabbing outside modal), close on Escape, confirm on Enter.
- **Responsibilities**:
  - **FIX**: Current OverlayPanel does NOT trap focus (not a Dialog component). Choose one:
    - **Option A**: Switch to PrimeVue `Dialog` (true focus trap, ARIA dialog role) — **recommended for compliance**.
    - **Option B**: Manually add focus trap with `@keydown.escape` handler and `tabindex="-1"` on root; focus first input on open.
  - If Option A: Dialog is centered, modal, with backdrop — verify this UX is acceptable (currently OverlayPanel is trigger-anchored).
  - If Option B: Implement a focus-trap directive or use `focus-trap` npm library.
  - On Escape, close modal and return focus to trigger button.
  - On Enter (in value input), confirm filter and close modal.
- **Non-responsibilities**:
  - Does not change the visual design of the modal.
- **Touches requirements**: N.5, N.6.

### 3.7 GraphQL Query Fix — Invalid `groupBy` in 5 Datasets

- **Location**: [load-events-aggregation.js:749-878](src/services/real-time-events-service-v2/load-events-aggregation.js#L749) (`loadEventsChartFromEventsApi` function)
- **Purpose**: Prevent GraphQL errors from unsupported `groupBy` fields in Function, Function Console, Data Stream, Edge DNS, Activity History tabs.
- **Type**: Service function (GraphQL query builder).
- **Inputs**: `dataset` (e.g., `functionEvents`), `groupByField` (e.g., `'status'`), chart config.
- **Outputs**: Valid GraphQL query string (with corrected or removed `groupBy` field).
- **Responsibilities**:
  - **Root cause**: The 5 datasets above do NOT expose HTTP-specific fields like `status`, `requestMethod`, `upstreamCacheStatus`.
  - **FIX strategy**: Client-side guard + runtime schema validation.
    1. In `loadEventsChartFromEventsApi`, early on, check: `if (groupByField && !isSupportedGroupBy(dataset, groupByField)) groupByField = null`.
    2. Build `DATASET_SUPPORTS_GROUPBY` map from `CURATED_DATASET_FIELDS` (in `_shared/dataset-fields.js`), containing only safe aggregation fields per dataset (e.g., `status` only for `workloadEvents`).
    3. If `groupByField` is dropped, add an inline info message in the chart UI ("This view doesn't support grouping by X") — satisfies requirement 2.6 ("correct data").
  - If query still fails at runtime, `catch` the GraphQL error and emit a user-facing toast per requirement 2.7 ("Error loading events. Please try again or contact support.").
  - Log the raw GraphQL error to console (dev tools) for debugging.
- **Non-responsibilities**:
  - Does not change the chart configuration schema.
  - Does not modify the Metrics API path (only Events API fix required; Metrics API already has schema guards at `metrics-chart-service.js:469-487`).
- **Touches requirements**: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, N.9.

**Pseudo-code (fix)**:
```javascript
const DATASET_SUPPORTS_GROUPBY = {
  workloadEvents: new Set(['status', 'requestMethod', 'upstreamCacheStatus']),
  functionEvents: new Set([]), // No groupBy fields supported
  functionConsoleEvents: new Set([]),
  dataStreamedEvents: new Set([]),
  edgeDnsQueriesEvents: new Set([]),
  activityHistoryEvents: new Set([]),
  // ... others with their supported fields
};

const loadEventsChartFromEventsApi = ({ dataset, groupByField, ... }) => {
  // Guard: drop unsupported groupByField
  const supported = DATASET_SUPPORTS_GROUPBY[dataset] || new Set();
  if (groupByField && !supported.has(groupByField)) {
    console.warn(`Dataset ${dataset} does not support groupBy:${groupByField}; dropping`);
    groupByField = null; // Fallback to time-series only
  }
  
  const query = buildQuery({ dataset, groupByField, ... });
  // ... rest of logic
};
```

---

## 4. Data Model

### localStorage Schema (Saved Searches)

```typescript
// Storage key: "rte:saved-searches:{tenant_id}:{user_id}"

interface SavedSearch {
  id: string;                    // "saved-{timestamp}-{random}"
  name: string;                  // User-given name, 50 chars max
  dataset: string;               // "workloadEvents" | "functionEvents" | ...
  filters: FilterConfig[];       // [{ field, operator, value, ... }]
  pageSize: number;              // Rows per page, e.g., 50
  selectedFields: string[];      // Visible columns, e.g., ['timestamp', 'status', ...]
  description?: string;          // Optional, 120 chars max
  createdAt: ISO8601;            // Timestamp
  updatedAt: ISO8601;            // Timestamp
}

// Full localStorage value: SavedSearch[]
```

### Validation Rules

- On load: skip entries with `JSON.parse` errors; log and continue.
- On save: validate `name` (non-empty, ≤50 chars), `dataset` (in known list), `filters` (non-empty array or null).
- Storage quota: track total size; if write fails with `QuotaExceededError`, set `localStorageAvailable = false` and emit warning toast.

---

## 5. APIs / Contracts

### Clipboard API

- **Interface**: `navigator.clipboard.writeText(text: string): Promise<void>`
- **Availability**: Secure context (HTTPS or localhost) + user permission.
- **Fallback**: If unavailable, show a dialog with the URL text for manual copy (See Decision 7.1).
- **Error contract**: Reject with `DOMException` (e.g., `NotAllowedError` if permission denied, `NotSupportedError` if unavailable).

### Share State Encoding/Decoding

- **File**: [panels-service/index.js:239-256](src/services/panels-service/index.js#L239-L256)
- **Export**: `encodeShareState(state: object): string` → base64-encoded JSON.
- **Export**: `decodeShareState(encoded: string): object | null` → parsed object or null if invalid.
- **Schema**:
  ```typescript
  interface ShareState {
    ver: 1;                    // Version field (required for validation)
    tab: string | null;        // Active tab ID or null (pinned Events tab)
    viewState: {
      filters: FilterConfig[];
      tsRange?: { start, end };
      dataset: string;
      pageSize: number;
      documentQuery?: string;
      selectedFields: string[];
    };
    eventsTab?: {              // Optional: metadata for additional Events tabs
      label: string;
      dataset: string;
      viewState: { ... };      // Nested viewState
    };
    panelConfig?: {            // Optional: custom panel inline (for ephemeral shared tabs)
      id: string;
      label: string;
      icon: string;
      type: 'custom' | 'shared';
      charts?: { reportId: string }[];
      eventsConfig?: { dataset, defaultFilters };
      ... // See SessionCreator props
    };
  }
  ```
- **Security**: Encoding uses `encodeURIComponent(JSON.stringify(...))` + `btoa()` to ensure URL-safe encoding; no PII exposure in plaintext (filters are base64-opaque to URL parsers).

### GraphQL Queries (Events API)

- **Datasets**: `workloadEvents`, `functionEvents`, `functionConsoleEvents`, `dataStreamedEvents`, `edgeDnsQueriesEvents`, `activityHistoryEvents`, `imagesProcessedEvents`, `l2CacheEvents`, `idnsQueriesEvents`, `botManagerEvents`.
- **Aggregation fields**: Vary per dataset; source of truth is [dataset-fields.js:22-220](src/services/real-time-events-service-v2/_shared/dataset-fields.js).
- **Error contract**: GraphQL errors returned in `response.errors` array; client-side guard checks field support before query submission (See Component 3.7).
- **Example fix**:
  ```graphql
  # BEFORE (fails for functionEvents — no 'status' field):
  query {
    functionEvents(dataset: functionEvents, groupBy: ["ts", "status"]) { ... }
  }
  
  # AFTER (valid for functionEvents):
  query {
    functionEvents(dataset: functionEvents, groupBy: ["ts"]) { ... }
  }
  ```

---

## 6. Cross-Cutting Concerns

### 6.1 Security

- **Clipboard API**: Only write on explicit user action (button click); no background/silent writes. Use feature detection (`navigator.clipboard` + `isSecureContext`) before attempting.
- **Share URL encoding**: Use `encodeURIComponent()` + `btoa()` to ensure URL-safe encoding; no plaintext PII in URL. Filters are opaque base64.
- **Fallback copy dialog**: If Clipboard API unavailable, show a modal with read-only URL field — do NOT auto-copy via `execCommand('copy')` (deprecated, less secure).
- **localStorage**: Scoped per tenant + user; no cross-origin leakage (same-origin policy enforced by browser).
- **Saved search validation**: Parse entries with try/catch to prevent malicious JSON from crashing the app.

### 6.2 Performance & Scalability

- **Share URL generation**: Encode + clipboard write < 100ms (See N.1). Current `encodeShareState` is synchronous (base64 encode); `navigator.clipboard.writeText` is async but <50ms typical. **FIX**: Ensure no blocking I/O on the main thread.
- **Share state decoding**: Decode + schema validation < 50ms (See N.2). Current `decodeShareState` is synchronous base64 decode + JSON parse; with a 2KB encoded state, this is <5ms. Safe.
- **Saved searches load**: Load from localStorage + validate all 50+ entries < 200ms (See N.3). Validation is per-entry JSON.parse; with entries ≈100 bytes each, this is <100ms for 50 entries on modern hardware. Safe.
- **Add Filter modal width**: CSS media queries (no JavaScript reflow on field change). Setting `min-width` on the panel prevents layout thrashing. Estimated reflow cost: ~5ms per field change (one-time, not per keystroke).

### 6.3 Observability (Logs, Metrics, Traces)

- **Share URL generation success**: Log `{ event: 'share_url_copied', success: true, timestamp, url_length: encoded.length }` to a telemetry service (if available) or console in dev.
- **Share URL generation failure**: Log error details with type (e.g., `NotAllowedError`, `NotSupportedError`) to help debug clipboard issues.
- **Saved search CRUD**: Log each operation: `{ event: 'saved_search_created'|'deleted'|'loaded', id, dataset, count, timestamp }`. Helps debug persistence issues.
- **GraphQL query failures**: Log raw GraphQL error (`response.errors[0].message`) + `dataset`, `groupByField` to console and error tracking system.
- **localStorage unavailable**: Log `{ event: 'localStorage_unavailable', reason, timestamp }` when quota exceeded or permission denied.

### 6.4 Accessibility (a11y)

- **Share button**: Already has `aria-label="Share current view"` (TabsView.vue:55) and tooltip. Keep.
- **Share toast**: PrimeVue Toast component applies `aria-live="polite"` by default — screen readers will announce success/error messages. Verify after upgrade.
- **Add Filter modal**:
  - **FIX**: Current OverlayPanel does not trap focus — requirement N.5 cannot be met without change.
  - **Recommended**: Switch to PrimeVue `Dialog` component, which has `role="dialog"`, `aria-modal="true"`, and built-in focus trap.
  - Keyboard support: Tab to cycle through inputs, Escape to close (Dialog handles this natively), Enter in value field to confirm (add handler).
- **Error messages**: Toast detail text must be readable and announced. Min 3s display time per N.6. Avoid abbreviated error codes (e.g., `"UNSUPPORTED_GROUPBY"`) — use friendly text ("This dataset doesn't support grouping by X").
- **Saved searches dropdown**: Already accessible (PrimeVue Dropdown). Verify keyboard navigation works (arrow keys, Enter).

### 6.5 Internationalization (i18n)

- **Share toast copy**: "Share URL copied to clipboard" — will be translated via i18n keys. Define keys:
  - `rte.share.success` ("Share URL copied to clipboard")
  - `rte.share.error` ("Error generating share URL")
  - `rte.share.clipboard_unavailable` ("Clipboard API unavailable; URL shown below for manual copy")
- **Saved searches empty state**: "No saved searches yet." + "Build filters, then click Save to reuse them later." — add i18n keys.
- **Modal width field**: No user-facing strings; pure CSS.
- **GraphQL error**: Map error codes to friendly messages:
  - `UNSUPPORTED_GROUPBY` → "This dataset doesn't support grouping by {field}; rendering time-series only."
  - Generic GraphQL error → "Error loading events. Please try again or contact support."

---

## 7. Decisions & Trade-offs

### 7.1 Clipboard Fallback Strategy (Requirement 1.4, Open Q4)

- **Context**: `navigator.clipboard.writeText()` may fail if Clipboard API is unavailable (not secure context), permission denied, or browser support lacking. Requirement 1.4 explicitly asks for error handling.
- **Options considered**:
  - **A. Fallback dialog with manual copy**: Show a modal with read-only URL field + "Copy" button using `select()` + `execCommand('copy')`. UX: slightly clunky but reliable.
  - **B. Fallback hidden `<textarea>`**: Same as (A) but silent (`execCommand('copy')` in background). UX: silent failure if still blocked.
  - **C. Error toast only**: Show error message, no recovery path. UX: user cannot share.
  - **D. Feature detect + omit button**: If Clipboard API unavailable, hide the Share button. UX: feature incomplete.
- **Decision**: **A** (Fallback dialog with manual copy)
  - Feature-detect `navigator.clipboard` + `window.isSecureContext` at mount.
  - If available, use async clipboard write.
  - If unavailable, catch error and show a fallback dialog: read-only URL field + "Copy to clipboard" button (which tries `execCommand` as secondary fallback).
  - UX is transparent (user always has a copy option), and we log all failure modes.
- **Consequences**:
  - Requires a new `FallbackCopyDialog` component or use existing PrimeVue Dialog.
  - Adds 1–2 KB of JavaScript (dialog + feature detection).
  - Slightly longer error toast explanation ("URL shown below…").

### 7.2 GraphQL Query Fix: Client-Side Guard vs. Runtime Schema Check (Requirement 2.1–2.7, Open Q2)

- **Context**: 5 datasets (Function, Function Console, Data Stream, DNS, Activity History) fail when `groupByField` is `status` (not in schema). Root cause: the chart config passes `groupByField: 'status'` to all datasets, but only HTTP-like datasets support it.
- **Options considered**:
  - **A. Client-side guard**: In `useEventsData` or service, check `CURATED_DATASET_FIELDS[dataset]` before passing `groupByField` to the query. Prevents bad queries entirely.
  - **B. Service guard**: In `loadEventsChartFromEventsApi`, drop unsupported `groupByField` at query-build time. Catches bugs but slower (discovered at runtime).
  - **C. Server-side introspection**: Query GraphQL schema at runtime to validate fields. Adds latency + complexity.
  - **D. Ignore errors**: Rely on GraphQL error handling and gracefully degrade (show empty chart). UX: silent failure, user confused.
- **Decision**: **A + B** (client-side + service guard, defense-in-depth)
  - **Primary fix**: In the composable that chooses `groupByField` (likely `useEventsData` or chart config), check `CURATED_DATASET_FIELDS[dataset]` and only pass supported fields.
  - **Secondary fix**: In service `loadEventsChartFromEventsApi`, guard again: `if (!supportedFields.has(groupByField)) groupByField = null`. This is zero-cost (same check), but catches missed calls.
  - **Consequence**: Prevents all bad queries; no server round-trip waste. Requirement 2.6 "render with correct data" is met.
- **Consequences**:
  - Requires changes in two places (composable + service) for clarity.
  - Builds `DATASET_SUPPORTS_GROUPBY` map (small, static).

### 7.3 Add Filter Modal: OverlayPanel vs. Dialog for Focus Trap (Requirement N.5)

- **Context**: Requirement N.5 mandates focus trap (Tab cycles within modal, Escape closes). PrimeVue `OverlayPanel` is a positioned overlay (not a Dialog) and does not trap focus. Current component cannot be made compliant without replacing it or adding complex manual focus trap logic.
- **Options considered**:
  - **A. Switch to PrimeVue `Dialog`**: True modal, centered, with backdrop, `role="dialog"`, `aria-modal="true"`, built-in focus trap. Fully compliant with N.5.
  - **B. Manual focus trap on OverlayPanel**: Add a directive or event handler to trap Tab/Escape. Complex, error-prone, may have edge cases.
  - **C. Accept non-compliance**: Keep OverlayPanel, document that N.5 is not met. Violates requirement.
  - **D. Lazy focus trap**: Only trap focus if keyboard is detected (ignore on touch). Partial compliance.
- **Decision**: **A** (Switch to PrimeVue Dialog)
  - `Dialog` provides true modal semantics and built-in focus trap.
  - UX trade-off: Dialog is centered and overlays the entire view (not trigger-anchored like OverlayPanel). This is acceptable for a modal filter editor.
  - Dialog already has keyboard handlers for Escape (close) and Tab (cycle).
  - Add an Enter handler in the value input to confirm filter + close.
- **Consequences**:
  - Visual change: modal now centered instead of positioned near the trigger. Verify this UX is acceptable (recommend QA testing with actual users).
  - No additional dependencies (PrimeVue Dialog already available).
  - Fixes N.5 compliance.

### 7.4 Saved Searches Scoping: Per-Dataset Filter vs. Flat List (Requirement 3.7)

- **Context**: Requirement 3.7 says searches are "keyed by dataset", meaning saved searches for dataset A should not collide with searches for dataset B (same name). Current implementation already stores `dataset` per entry. The question is UI: should the overlay filter by current dataset, or show all and highlight the current dataset?
- **Options considered**:
  - **A. Filter overlay by current dataset**: Show only saved searches for the active dataset. Cleaner list, less cognitive load.
  - **B. Flat list with dataset badge**: Show all searches, labeled by dataset (e.g., "MySearch [HTTP Events]"). User sees all at a glance; less filtering.
  - **C. Tab selector in overlay**: Let user switch dataset filters with tabs. Complex.
- **Decision**: **B** (Flat list with dataset badge)
  - Already implemented at `saved-searches-overlay.vue:70-74` (dataset badge shown).
  - Requirement 3.7 is satisfied: searches are "keyed" (dataset is a field); no collision.
  - UX benefit: user can browse all saved searches and copy one to another dataset if desired.
  - No code change needed; requirement is met as-is.
- **Consequences**:
  - If user has 100+ searches across datasets, list becomes long. Mitigation: add a search box to the overlay (already exists at `saved-searches-overlay.vue:87`).

### 7.5 Toast vs. Inline Error Message for GraphQL Failures (Requirement 2.7)

- **Context**: When a GraphQL query fails (e.g., unsupported `groupBy`), the error should be user-visible with "remediation guidance". Current code shows an error toast with raw error text. Requirement 2.7 asks for a user-friendly message + option.
- **Options considered**:
  - **A. Toast only** (current): Transient message, easy to miss, no detail.
  - **B. Toast + console log**: Toast is friendly, console has technical detail. Requires user to open dev tools.
  - **C. Toast + inline error region in chart panel**: Persistent error state with a "Retry" button. Better UX.
  - **D. Modal error dialog**: Jarring; breaks flow.
- **Decision**: **B** (Toast + console log)
  - User sees a friendly toast: "Error loading events. Please try again or contact support."
  - Technical detail goes to `console.error({ ...details })` for debugging.
  - Requirement 2.7 is satisfied: user gets a message + can retry (implicit in "try again").
  - No need for persistent inline error (charts reload on dataset/filter change, so transient toast is appropriate).
- **Consequences**:
  - Users won't see technical details unless they open dev tools. Mitigation: a "Details" link in the toast that expands to show the GraphQL error (requires custom Toast template, not PrimeVue default).

### 7.6 Share State URL Length Limit (Requirement 1.2, N.7)

- **Context**: Share state can grow large if the custom panel config is inlined (`panelConfig` field). A panel with many charts (e.g., 20 reports) can exceed 2000 chars encoded, risking URL truncation in email clients or old browsers.
- **Options considered**:
  - **A. Cap encoded URL at 2000 chars**: Warn user if approaching limit; omit `panelConfig` if necessary.
  - **B. Always omit `panelConfig` for new shares**: Users must have already saved the panel. Reduces feature scope.
  - **C. Compress `panelConfig`: Use LZ-string or similar. Adds complexity.
  - **D. No limit**: Accept risk of truncation. UX: silent failure if URL truncated.
- **Decision**: **A** (Cap at 2000 chars with warning)
  - In `shareCurrentView`, after encoding, check `if (url.toString().length > 2000)`. If so, and `panelConfig` is present, drop it and re-encode. Warn user: "Shared query is complex; recipient will need to open it and select the panel manually."
  - This is a graceful degradation: share still works, just less automatic for the recipient.
- **Consequences**:
  - Adds ~5 lines of code.
  - Rare edge case (most queries are < 1500 chars).
  - User experience: transparent warning, feature still works.

### 7.7 Saved Searches Validation Strategy (Requirement 3.6)

- **Context**: On app load, saved searches are restored from localStorage. If an entry is corrupted (e.g., user manually edited JSON, quota fail mid-write), it should not crash the app.
- **Options considered**:
  - **A. Per-entry validation**: Try `JSON.parse` on each entry; skip invalid ones, log.
  - **B. Atomic reload**: Fail entire load if any entry is invalid; show error toast.
  - **C. Auto-repair**: Try to recover partial data (e.g., keep `id` + `name`, drop invalid fields). Complex.
- **Decision**: **A** (Per-entry validation)
  - In `useSavedSearches.load()`, iterate localStorage entries and wrap in try/catch.
  - Invalid entries are skipped (logged to console).
  - Valid entries are loaded normally.
  - User is unaware of corruption (transparent recovery).
- **Consequences**:
  - One corrupted entry doesn't take down all saved searches.
  - User might lose a single search silently. Mitigation: log to console + optional toast ("1 saved search was corrupted and skipped").

---

## 8. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **R1**: Clipboard API unavailable in old browsers or non-HTTPS contexts | Medium | Medium | Feature-detect `navigator.clipboard`; fallback to dialog + manual copy (Decision 7.1). |
| **R2**: Toast fires before clipboard write completes (async race) | Medium | High | Use `async/await`; emit toast **after** await resolves. Add regression test. |
| **R3**: Modal width fix in shared component affects other views | Medium | High | Grep for consumers of `advanced-filter-system-v2`; test all usages. The fixed width applies only to filter panel inner div, should not affect other modal contexts. |
| **R4**: Saved searches loading blocks on large localStorage (50+ items) | Low | Low | Validation is O(n) JSON parse; with 50 items ≈ 100 bytes each, < 200ms (requirement N.3 met). Monitor with perf logs. |
| **R5**: Share URL truncated in email clients (> 2000 chars) | Low | Medium | Cap encoded URL at 2000 chars; warn user and omit `panelConfig` if needed (Decision 7.6). |
| **R6**: accountStore.account is null on first paint; saved searches appear "gone" | Low | Low | Render empty-state placeholder "Loading…" until `accountStore.isReady`. Confirm `accountStore.account` hydration timing. |
| **R7**: GraphQL error message leaks technical jargon to users | Low | Low | Map error codes to friendly messages in UI; log raw errors to console. (Decision 7.5). |
| **R8**: Dialog (new Add Filter modal) is centered; users expect trigger-anchored overlay | Medium | Medium | Conduct QA with actual users. If feedback negative, revert to OverlayPanel + manual focus trap (more complex but preserves UX). |
| **R9**: Clipboard permission denied in iframe context (embedded Real-Time Events) | Low | Medium | Feature-detect + fallback covers this; no special handling needed. |
| **R10**: localStorage scoped by tenant+user; user logout wipes searches (expected but risky) | Low | Low | This is by design (per Open Q1, per-browser scoping). Document in settings/help. |

---

## 9. Migration / Rollout

- **Feature flags**: None required (all changes are additive or in-place fixes).
- **Deprecation**: None.
- **Backfill**: None (localStorage is user-scoped; no data migration).
- **Dark launch**: Can roll out all 4 improvements together; each is independent:
  1. Share URL feature (new UI, no breaking changes).
  2. GraphQL fixes (schema guard silently improves reliability; user sees nothing if successful).
  3. Saved searches persistence (restore from localStorage; if empty, user starts fresh).
  4. Modal width stabilization (CSS-only, visual only).
- **Rollout strategy**: Ship in a single commit or PR per improvement; test each independently. No coordination needed.
- **Monitoring**: Log share success/failure, GraphQL errors, saved search CRUD, localStorage availability. Track metrics (success rate, latency, error patterns).

---

## 10. Requirements Coverage

Every requirement from `specs/real-time-events-v2-improvements/requirements.md` is mapped below:

| Requirement | Covered by |
|---|---|
| 1.1 | §3.2 `shareCurrentView()` + §3.1 Share Button |
| 1.2 | §3.2 `shareCurrentView()` state object |
| 1.3 | §3.2 `shareCurrentView()` success toast |
| 1.4 | §7.1 Clipboard Fallback Strategy; §3.2 error handling |
| 1.5 | §3.3 `handleShareImport()` decoder |
| 1.6 | §3.3 ephemeral shared tab creation |
| 1.7 | §3.3 `handleShareImport()` validation |
| 2.1 | §3.7 GraphQL guard (Function Events) |
| 2.2 | §3.7 GraphQL guard (Function Console Events) |
| 2.3 | §3.7 GraphQL guard (Data Stream Events) |
| 2.4 | §3.7 GraphQL guard (Edge DNS Queries) |
| 2.5 | §3.7 GraphQL guard (Activity History) |
| 2.6 | §3.7 GraphQL guard + error handling |
| 2.7 | §3.7 error toast; §7.5 friendly error messages |
| 3.1 | §3.4 `useSavedSearches` create logic |
| 3.2 | §3.4 `useSavedSearches` load + restore |
| 3.3 | §3.4 `useSavedSearches` apply logic |
| 3.4 | §3.4 `useSavedSearches` delete logic |
| 3.5 | §3.4 graceful degradation + §7.4 localStorage unavailable warning |
| 3.6 | §3.4 per-entry validation; §7.7 validation strategy |
| 3.7 | §3.4 dataset-keyed storage; §7.4 flat list with badge |
| 4.1 | §3.5 Add Filter Modal responsive width |
| 4.2 | §3.5 width stability across field changes |
| 4.3 | §3.5 width stability across operator changes |
| 4.4 | §3.5 width stability across input value changes |
| 4.5 | §3.5 no resize during lifecycle |
| 4.6 | §3.5 responsive to viewport resize |
| N.1 | §3.2 `shareCurrentView()` <100ms |
| N.2 | §3.3 `handleShareImport()` <50ms |
| N.3 | §3.4 `useSavedSearches.load()` <200ms for 50+ items |
| N.4 | §3.1 Share Button aria-label + tooltip |
| N.5 | §3.6 Add Filter Modal focus trap (via Dialog); §7.3 Dialog decision |
| N.6 | §3.1 toast persist 3s+ and announce to screen readers; PrimeVue Toast a11y |
| N.7 | §5 Share State Encoding (base64 URL-safe); §7.6 URL length cap |
| N.8 | §3.2 clipboard write on explicit user action only |
| N.9 | §6.3 Observability logging for share, GraphQL, saved searches |
| N.10 | §6.3 Observability logging for saved search CRUD |

---

## 11. Open Questions

- [x] **Clipboard fallback**: ✅ Approved — fallback dialog with manual copy, scoped to user/client session.
- [x] **GraphQL query fix**: ✅ Confirmed — error shows `upstreamCacheStatus` invalid for `CellsConsoleEventsGroupByFields`; Decision 7.2 (client-side guard) resolves this.
- [x] **Modal desktop width**: ✅ Approved — responsive strategy: 35rem desktop, min(35rem, 90vw) tablet, calc(100vw - 1rem) mobile.
- [ ] **Add Filter modal a11y (N.5)**: 🚫 Deferred — no changes to Add Filter modal at this time.
- [x] **Saved searches filter UI**: ✅ Approved — Decision 7.4 (flat list with badge, already implemented).
- [x] **Error message UX**: ✅ Approved — Decision 7.5 (toast + console log).
- [x] **URL length cap**: ✅ Approved — Decision 7.6 (cap at 2000 chars, warn user).
- [x] **Validation strategy**: ✅ Approved — Decision 7.7 (per-entry validation, silent skip).
- [x] **User logout behavior**: ✅ Confirmed — saved searches cleared on logout (current behavior, acceptable).
- [x] **Toast announcement to screen readers**: ✅ PrimeVue Toast applies `aria-live="polite"` by default.

