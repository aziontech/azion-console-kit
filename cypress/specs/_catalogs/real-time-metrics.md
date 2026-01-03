# RealTimeMetrics Module - Specification Catalog

## 1. Architecture Overview

```
RealTimeMetrics/
├── RealTimeMetricsView.vue         # Main view component
├── blocks/
│   ├── tabs-page-block.vue         # Group/Page selector
│   ├── interval-filter-block.vue   # Time range filter
│   ├── content-filter-block.vue    # Advanced filter system
│   └── dashboard-panel-block.vue   # Dashboard selector & charts
└── modules/real-time-metrics/
    ├── index.js                    # State management (observer pattern)
    ├── filters/                    # GraphQL filter loading
    ├── reports/                    # Report resolution
    └── constants/
        ├── dashboards.js           # Group/Page/Dashboard config
        ├── reports.js              # Report definitions
        └── time-intervals.js       # Time range options
```

---

## 2. API Endpoints

### Base URL: `POST /v4/metrics/graphql` (Beholder API)

### GraphQL Queries

**Dataset Filters Query**:
```graphql
query {
  __type(name: "${DatasetName}Filter") {
    inputFields { name, description, type { name, inputFields { name, type } } }
  }
}
```

**Info Filters Query**:
```graphql
query {
  __type(name: "Query") {
    fields { name, type { ofType { fields { name, description, args } } } }
  }
}
```

**Report Queries**: Dynamic per report configuration with fields, groupBy, dataset

### Datasets
- `httpMetrics`
- `httpBreakdownMetrics`
- `l2CacheMetrics`
- `edgeFunctionsMetrics`
- `imagesProcessedMetrics`
- `idnsQueriesMetrics`
- `botManagerMetrics`
- `botManagerBreakdownMetrics`
- `dataStreamedMetrics`

---

## 3. Toast Messages

No toast system. Validation errors inline:
- Calendar: "Select the second date."

---

## 4. Validation Rules

### Filter Validation
- Whitelist/Blacklist fields
- Deprecated fields excluded
- Max date range: 7 days

### Date Range
- Max date: current time (updates every 60 seconds)
- Format: DD/MM/YY with 24-hour time
- Storage: ISO 8601 with timezone conversion

### Report Configuration
```javascript
{
  id: string,
  label: string,
  aggregationType: 'sum'|'avg',
  type: 'line'|'big-numbers',
  xAxis: 'ts',
  dataset: string,
  fields: string[],
  groupBy: string[],
  orderDirection: 'ASC'|'DESC'
}
```

---

## 5. Data-TestIDs

| TestID | Purpose |
|--------|---------|
| `real-time-metrics__page-heading-block__title` | Page title |
| `real-time-metrics__interval-filter-block__dropdown` | Time interval selector |
| `real-time-metrics__interval-filter-block__calendar` | Custom date range picker |

---

## 6. Routes

### Route Pattern
```
/real-time-metrics/:pageId?/:dashboardId?
```

### Route Parameters
- `pageId`: Page path (edge-applications, tiered-cache, etc.)
- `dashboardId`: Dashboard path (data-transferred, requests, etc.)

### Query Parameters
- `filters`: Base64-encoded filter state

### Pages
- edge-applications
- tiered-cache
- edge-functions
- image-processor
- waf
- edge-dns
- bot-manager-advanced
- threats
- data-stream

---

## 7. Test Scenarios

### Navigation
1. **View Page** - Load initial group/page/dashboard
2. **Change Group** - Select Build/Secure/Observe dropdown
3. **Change Page/Tab** - Click page tab within group
4. **Change Dashboard** - Select dashboard selector

### Time Range
5. **Select Preset** - Last Hour/Day/7 Days/30 Days/6 Months
6. **Custom Range** - Open date picker, select dates
7. **Apply Custom Dates** - Hide calendar after selection

### Filtering
8. **Apply Field Filter** - Submit advanced filter conditions
9. **Clear Filters** - Reset on dashboard change

### Reports
10. **Load Reports** - Fetch data for current dashboard
11. **Show Mean Line** - For time series with multiple series
12. **Show Variation** - For 2 or fewer series

### Edge Cases
13. **Incomplete Date Range** - Calendar shows error
14. **Dataset Change** - Reset filters when dataset changes
15. **Invalid Filters** - Strip unavailable fields
16. **Abort Previous Request** - Cancel on new request

---

## Time Intervals

| Option | Value |
|--------|-------|
| Last Hour | 1 hour |
| Last Day | 24 hours |
| Last 7 Days | 7 days |
| Last 30 Days | 30 days |
| Last 6 Months | 6 months |
| Custom | Date picker |

---

## Analytics Events

| Event | Trigger |
|-------|---------|
| `Clicked to View Real-Time Metrics` | Page/group selected |
| `Applied Filter on Real-Time Metrics` | Filter applied |
| `Clicked on Time Range` | Dropdown opened |
| `Clicked on Date Picker` | Calendar shown |

---

## State Structure

### Group Observable
- `all`: All groups
- `current`: Current group
- `currentPage`: Current page
- `currentDashboard`: Current dashboard

### Filter Observable
- `isLoading`: Loading state
- `selected`: Active filters (tsRange, datasets, and, or)
- `datasetAvailable`: Available filter fields
- `infoAvailable`: Field descriptions

### Report Observable
- `all`: Report definitions
- `current`: Active reports with query results
