# RealTimeEvents Module - Specification Catalog

## 1. Architecture Overview

```
RealTimeEvents/
├── TabsView.vue                    # Main container
├── Blocks/
│   ├── tab-panel-block.vue         # Tab panel with filters & table
│   ├── components/code-editor.vue  # GraphQL editor
│   └── constants/
│       ├── tabs-events.js          # 8 tab configurations
│       └── query-fields.js         # GraphQL query builders
├── Drawer/                         # Detail drawers per event type
│   ├── httpRequests.vue
│   ├── edgeFunctions.vue
│   ├── edgeFunctionsConsole.vue
│   ├── activityHistory.vue
│   ├── dataStream.vue
│   ├── tieredCache.vue
│   ├── edgeDNS.vue
│   └── tableEvents.vue             # Shared table component
```

---

## 2. API Endpoints

### Base URL: `POST /v4/events/graphql`

### GraphQL Queries

**Fields Query** - Introspection:
```graphql
query {
  fieldsDataSet: __type(name: "Query") {
    fields { name, type { ofType { fields { name, description } } } }
  }
}
```

**Operators Query**:
```graphql
query {
  operatorsDataSet: __type(name: "${dataset}Filter") {
    inputFields { name, deprecated: description, type { name } }
  }
}
```

**List Query** (example httpEvents):
```graphql
query {
  httpEvents(limit: 1000, filter: {...}, orderBy: ts_DESC) {
    configurationId, host, requestId, httpUserAgent, requestMethod, status
    ts, upstreamBytesSent, sslProtocol, wafLearning, requestTime
  }
}
```

### Datasets
- `httpEvents` - HTTP Requests
- `edgeFunctionsEvents` - Edge Functions
- `cellsConsoleEvents` - Functions Console
- `imagesProcessedEvents` - Image Processor
- `l2CacheEvents` - Tiered Cache
- `idnsQueriesEvents` - Edge DNS
- `dataStreamedEvents` - Data Stream
- `activityHistoryEvents` - Activity History

---

## 3. Toast Messages

| Action | Message |
|--------|---------|
| Copy Success | "Successfully copied!" |
| API Error | error.message from API |

---

## 4. Validation Rules

### Date Range
- Max Days: 7 days
- Default Range: Last 5 minutes
- Format: tsRange with tsRangeBegin and tsRangeEnd

### Filter Rules
- Whitelist/Blacklist fields
- Alias mapping
- Most relevant fields per dataset

### JSON Formatting
Keys requiring JSON format: `stacktrace`, `requestData`

---

## 5. Data-TestIDs

| TestID | Purpose |
|--------|---------|
| `table-tab-panel-block` | Main table component |
| `table-body-row` | Table row |
| `data-table-actions-column-header-toggle-columns` | GraphQL button |
| `data-table-search` | Search container |
| `data-table-search-input` | Search input field |
| `data-table-value` | Field value display |
| `data-table-copy-button` | Copy button |

---

## 6. Routes

### Route Parameters
- `/:tab` - Tab identifier

### Tab Routes
| Tab | Route Path | Dataset |
|-----|-----------|---------|
| HTTP Requests | `http-requests` | httpEvents |
| Functions | `edge-functions` | edgeFunctionsEvents |
| Functions Console | `edge-functions-console` | cellsConsoleEvents |
| Image Processor | `image-processor` | imagesProcessedEvents |
| Tiered Cache | `tiered-cache` | l2CacheEvents |
| Edge DNS | `edge-dns` | idnsQueriesEvents |
| Data Stream | `data-stream` | dataStreamedEvents |
| Activity History | `activity-history` | activityHistoryEvents |

---

## 7. Test Scenarios

### Tab Navigation
1. Click tab → handleTabClick() → router update
2. Fields & operators loaded via GraphQL
3. Table reloaded with new data

### Data Listing
4. GraphQL query → parse response → display
5. Records count calculated
6. Lazy-loaded table
7. Empty state: "No logs have been found for this period."

### Detail View (Drawer)
8. Click row → openDetailDrawer()
9. loadService() fetches details
10. Tabs: "Table" and "Cards"
11. Skeleton loading while fetching

### Filtering
12. Fields loaded via buildFieldsQuery()
13. Operators loaded via buildOperatorQuery()
14. Apply filter → save to hash → reload list

### Table Actions
15. Export CSV with field mapping
16. GraphQL playground opener
17. Copy with toast notification

### Error Handling
18. 400: Bad Request
19. 401: Invalid Token
20. 403: Forbidden
21. 404: Not Found
22. 500: Server Error

---

## Features

### Table Features
- Lazy Loading
- Frozen Columns (first 3rem)
- Sorting by timestamp
- Global search in drawer
- CSV Export

### Drawer Features
- Table (searchable) + Cards (formatted)
- Copy fields to clipboard
- JSON formatting for stacktrace
- Status tags (severity-based)
- HTTP Request field groups:
  - Request/Response Data
  - Origin Data
  - Geolocation Data
  - Secure Data (WAF, SSL)
  - Debug Data
