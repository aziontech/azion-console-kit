# EdgeSQL Migration & Fix Plan

## Executive Summary

This document outlines the complete understanding of the EdgeSQL SQL Database product implementation and provides a detailed plan to fix the refactored version. The backup implementation (`azion-console-kit-bkp`) is working correctly, while the current refactored version (`azion-console-kit`) has issues due to a major architectural change.

**Critical Finding:** The refactored version has **inlined the entire `SqlDatabaseList` component** directly into `TablesView.vue`, resulting in a bloated component (1,294 lines vs 462 lines in the working version) and loss of abstraction.

---

## Product Overview

### SQL Database Features

EdgeSQL is a comprehensive SQL database management interface providing:

1. **Database CRUD Operations**
   - Create databases with validation (6-50 chars, alphanumeric + hyphen)
   - Edit database settings (name, status)
   - Delete databases with polling for status changes
   - Database status monitoring (polling every 3 seconds)

2. **Table Management**
   - Create tables via SQL editor
   - View table data with pagination
   - View table schema (column definitions)
   - Multi-select tables for batch operations (truncate/delete)
   - Table context menu with actions:
     - Count Records
     - Schema Info
     - View Indexes
     - Foreign Keys
     - Delete
     - Truncate

3. **Data Manipulation**
   - Inline row editing (UPDATE)
   - Row insertion with auto-generated IDs
   - Row deletion
   - Column insertion and modification
   - Schema alteration (ALTER TABLE)

4. **Query Execution**
   - Monaco SQL editor with syntax highlighting
   - SQL autocomplete (tables, keywords, functions)
   - Query execution (⌘/Ctrl + Enter)
   - SQL prettify/format
   - Query history (100 queries per database, persisted to localStorage)
   - Quick templates (10 pre-built SQL snippets)
   - Selected query execution from history

5. **View Modes**
   - Table View (row data display)
   - Schema View (column definitions)
   - JSON View (raw data preview)

6. **Advanced Features**
   - Search/filter on table data
   - Sort with server-side ordering
   - Export to CSV, JSON, XLSX
   - Column visibility selector
   - Vector embeddings support
   - Pagination (10, 25, 50, 100 rows per page)

---

## Architecture Comparison

### Working Implementation (Backup)

```
TablesView.vue (462 lines)
├── Uses SqlDatabaseList component
│   └── @/templates/list-table-block/sql-database-list.vue
│       ├── DataTable component (from @aziontech/webkit/list-data-table)
│       ├── Inline editing logic
│       ├── Export functionality
│       ├── Filter management
│       ├── Column selection
│       └── View switching
├── ListTables component (sidebar)
├── AlterColumn dialog
└── TruncateTable dialog
```

**Benefits:**
- ✅ Clear separation of concerns
- ✅ Reusable `SqlDatabaseList` template
- ✅ Manageable component size
- ✅ Single responsibility principle
- ✅ Maintainable and testable

### Refactored Implementation (Current - BROKEN)

```
TablesView.vue (1,294 lines)
├── INLINED SqlDatabaseList content directly
│   ├── All DataTable logic (inline)
│   ├── Inline editing logic (inline)
│   ├── Export logic (inline)
│   ├── Filter management (inline)
│   ├── Column selection (inline)
│   └── View switching (inline)
├── ListTables component (sidebar)
├── AlterColumn dialog
└── TruncateTable dialog
```

**Issues:**
- ❌ Massive component (1,294 lines)
- ❌ Violates single responsibility principle
- ❌ Duplicated logic that should be abstracted
- ❌ Hard to maintain and test
- ❌ Missing template component reuse
- ❌ TODO comment indicates incomplete migration

---

## Detailed Feature Analysis

### 1. SqlDatabaseList Component (Working Version)

**Location:** `@/templates/list-table-block/sql-database-list.vue`

**Props:**
```javascript
{
  data: Array,              // Table row data
  title: String,            // Table name
  isLoading: Boolean,       // Loading state
  columns: Array,           // Column definitions
  serverPagination: Boolean,// Use server-side pagination
  totalRecords: Number,     // Total records for pagination
  deleteService: Function,  // Delete row service factory
  disabledAction: Boolean,  // Disable actions
  titleDeleteDialog: String, // Delete dialog title
  exportFileName: String,   // Export file name
  emptyBlock: Object,       // Empty state config
  notShowEmptyBlock: Boolean // Hide empty block
}
```

**Events:**
```javascript
emit('row-edit-saved', action)    // Row edit completed
emit('row-edit-cancel', event)    // Row edit cancelled
emit('reload-table')             // Reload table data
emit('page', event)              // Page change
emit('view-change', event)       // View mode change
emit('click-to-create')          // Click create button
```

**Features Provided:**
1. **DataTable with inline editing**
   - Row edit mode
   - Cell validation
   - Type-aware editors (dropdowns for schema view)

2. **View Switching**
   - Table, Schema, JSON views
   - Monaco editor for JSON preview

3. **Export Functionality**
   - Export to CSV
   - Export to JSON
   - Export to XLSX

4. **Filtering**
   - Global search
   - Column-specific filters
   - Applied filters display
   - Filter panel overlay

5. **Column Management**
   - Column visibility selector
   - Dynamic column selection
   - Prevents empty column list

6. **Actions**
   - Insert row
   - Insert column (schema view)
   - Reload table
   - Row actions menu (Edit, Delete)

7. **Pagination**
   - Client-side pagination
   - Server-side pagination support
   - Configurable rows per page (10, 25, 50, 100)

### 2. TablesView Component (Working Version)

**Responsibilities:**
- Orchestrates table list and table data display
- Manages table selection state
- Handles table-level actions (delete, truncate)
- Coordinates between ListTables and SqlDatabaseList
- Manages schema vs data view state

**Key Features:**
```javascript
// Table selection
selectedTableNames: ref([])
isSelectionMode: ref(false)

// Current table state
selectedTable: ref(null)
columns: ref([])
tableRows: ref([])
tableSchema: ref([])

// Pagination
currentPage: ref(1)
currentPageSize: ref(10)
tableTotalRecords: ref(0)

// Services
deleteService = createDeleteService(...)
insertRowService = createInsertRowService(...)
updateRowService = createUpdateRowService(...)
```

**Table Menu Actions:**
```javascript
const tableActionManager = new TableActionManager(
  executeQueryFn,
  showDrawerFn,
  activeTabIndex,
  isEditorCollapsed,
  sqlQueryRef,
  deleteDialogFn,
  truncateDialogFn
)
```

### 3. ListTables Component

**Location:** `./components/ListTables.vue`

**Props:**
```javascript
{
  listTables: Array,        // List of tables
  isLoading: Boolean,       // Loading state
  selectedTables: Array,    // Selected table names
  showCheckbox: Boolean     // Show selection checkboxes
}
```

**Events:**
```javascript
emit('update:selectedTables')
emit('update:showCheckbox')
emit('reload-tables')
emit('create-table')
emit('select-table')
emit('show-table-menu')
emit('open-confirm-truncate')
emit('open-confirm-delete')
```

**Features:**
- Search/filter tables by name
- Table selection with checkboxes
- Bulk operations (truncate, delete)
- Context menu per table
- Selection mode toggle

### 4. Composables

**useEdgeSQL.js**
- Global singleton state management
- Database and table state
- Query execution
- Query history with localStorage persistence
- Error handling

**useSqlFormatter.js**
- SQL formatting/prettify
- Preserves string literals
- Clause-based formatting

**useMonacoEditor.js**
- Monaco editor configuration
- SQL autocomplete provider
- Tables, keywords, functions, snippets

**useDataTable.js**
- Export helpers (CSV, JSON, XLSX)
- Search/filter handling
- Pagination utilities

### 5. Utility Functions

**row-actions.js**
```javascript
createDeleteService(executeQuery, getTableName, getTableSchema, reloadCallback, entityType)
createInsertRowService(insertRowApi, getDatabaseId, getTableName, getTableSchema, reloadCallback)
createUpdateRowService(updateRowApi, getDatabaseId, getTableName, getTableSchema, reloadCallback)
filterRowBySchema(data, schema)
onRowEditSave(newData, oldData, updateService, insertService)
```

**table-actions.js**
```javascript
class TableActionManager {
  generateMenuItems(tableName) // Returns menu items
  executeTableAction(action)   // Execute table action
}
```

### 6. Constants

**queries.js**
```javascript
SQLITE_QUERIES = {
  SELECT_ALL,
  COUNT_RECORDS,
  TABLE_INFO,
  LIST_TABLES,
  DATABASE_INFO,
  DATABASE_SIZE,
  VACUUM_ANALYZE,
  DELETE_COLUMN,
  ALTER_COLUMN,
  DELETE_DATA,
  TRUNCATE_SIMULATION,
  TABLE_INDEXES,
  FOREIGN_KEYS,
  TABLE_SIZE,
  // ... 30+ helper queries
}
```

**index.js**
```javascript
QUICK_TEMPLATES = [
  { title: 'Create Table', sql: '...' },
  { title: 'Insert Data', sql: '...' },
  { title: 'Select All', sql: '...' },
  { title: 'Count Records', sql: '...' },
  { title: 'Vector Table', sql: '...' },
  { title: 'Insert Vectors', sql: '...' },
  { title: 'Vector Search', sql: '...' },
  { title: 'Vector Top K', sql: '...' },
  { title: 'Create Vector Index', sql: '...' },
  { title: 'Drop Table', sql: '...' }
]
```

---

## Key Differences: Working vs Broken

### 1. Component Architecture

| Aspect | Working Version | Broken Version |
|--------|----------------|----------------|
| TablesView size | 462 lines | 1,294 lines |
| SqlDatabaseList | Used as component | INLINED directly |
| Separation of concerns | ✅ Clear | ❌ Violated |
| Reusability | ✅ High | ❌ None |

### 2. Import Statements

**Working:**
```javascript
import SqlDatabaseList from '@/templates/list-table-block/sql-database-list.vue'
```

**Broken:**
```javascript
// TODO: migrate import to @aziontech/webkit/list-data-table when published
import DataTable from '@aziontech/webkit/list-data-table'
import { useDataTable } from '@/composables/useDataTable'
```

### 3. Template Structure

**Working:**
```vue
<template>
  <SqlDatabaseList
    :data="dataFiltered"
    :title="tableName"
    :isLoading="isLoadingQuery"
    :columns="tableColumns"
    :serverPagination="!isColumnView"
    :totalRecords="tableTotalRecords"
    :delete-service="deleteService"
    @row-edit-saved="handleActionRowTable"
    @row-edit-cancel="onRowEditCancel"
    @reload-table="selectTable(selectedTable)"
    @page="handlePage"
    :disabled-action="isApplyingChanges"
    @view-change="handleViewChange"
    :title-delete-dialog="titleDeleteDialog"
    @click-to-create="createTable"
    :exportFileName="tableName || 'Table Data'"
    :empty-block="{...}"
    :not-show-empty-block="notShowEmptyBlock"
  />
</template>
```

**Broken:**
```vue
<template>
  <!-- INLINED entire SqlDatabaseList content (500+ lines) -->
  <div class="sql-database-list w-full h-full flex flex-col min-h-0">
    <DataTable ...>
      <!-- All DataTable logic inline -->
    </DataTable>
  </div>
</template>
```

### 4. Missing Functionality

The broken version is missing proper integration with:

1. **Template system** - Should use `SqlDatabaseList` component
2. **Proper abstraction** - Logic is mixed with UI
3. **useDataTable integration** - Incorrectly integrated
4. **Export functions** - Duplicated instead of using template

---

## Fix Plan

### Phase 1: Restore Component Architecture

**Goal:** Extract the inlined SqlDatabaseList logic back into a reusable component.

#### Step 1.1: Verify Template Exists
Check if `@/templates/list-table-block/sql-database-list.vue` exists in current codebase.

```bash
# Check if file exists
ls -la src/templates/list-table-block/sql-database-list.vue
```

**If missing:** Copy from backup
**If exists:** Compare with backup version

#### Step 1.2: Extract Inlined Logic
Move the inlined content from `TablesView.vue` back to proper locations:

1. **Export logic** → `useDataTable` composable
2. **Filter logic** → `SqlDatabaseList` component
3. **View switching** → `SqlDatabaseList` component
4. **Inline editing** → `SqlDatabaseList` component

#### Step 1.3: Restore TablesView.vue
Replace inlined content with:

```vue
<template>
  <div class="flex sm:flex-row flex-col gap-8 mt-4">
    <ConfirmDialog />
    <TruncateTable ... />
    <AlterColumn ... />
    <Menu ... />
    <ListTables ... />
    <div class="w-full flex flex-col gap-4 overflow-hidden">
      <InlineMessage v-if="isApplyingChanges" ... />
      <SqlDatabaseList
        :data="dataFiltered"
        :title="tableName"
        :isLoading="isLoadingQuery"
        :columns="tableColumns"
        :serverPagination="!isColumnView"
        :totalRecords="tableTotalRecords"
        :delete-service="deleteService"
        data-testid="table-list"
        @row-edit-saved="handleActionRowTable"
        @row-edit-cancel="onRowEditCancel"
        @reload-table="selectTable(selectedTable)"
        @page="handlePage"
        :disabled-action="isApplyingChanges"
        @view-change="handleViewChange"
        :title-delete-dialog="titleDeleteDialog"
        @click-to-create="createTable"
        :exportFileName="tableName || 'Table Data'"
        :empty-block="{
          title: 'No tables yet',
          description: 'Create your first table to store your data.',
          createButtonLabel: 'Table'
        }"
        :not-show-empty-block="notShowEmptyBlock"
      />
    </div>
  </div>
</template>
```

### Phase 2: Fix Missing Functionality

#### Step 2.1: Handle View Change
The working version has simpler view handling:

```javascript
const activeView = ref('table')

const handleViewChange = (event) => {
  if (!event) return
  activeView.value = event.value
}

const isColumnView = computed(() => activeView.value === 'schema')
```

#### Step 2.2: Simplify Sorting
The broken version has complex sort handling with `currentOrderBy`. The working version uses simpler approach:

```javascript
const handlePage = async (event) => {
  if (!selectedTable.value || isColumnView.value) return

  currentPage.value = Number(event?.page) + 1
  currentPageSize.value = Number(event?.rows) || currentPageSize.value

  isLoadingQuery.value = true
  try {
    const result = await edgeSQLService.getTableInfo(
      currentDatabase.value.id,
      selectedTable.value.name,
      {
        paginate: true,
        page: currentPage.value,
        pageSize: currentPageSize.value
      }
    )
    tableRows.value = result.body.rows
    tableTotalRecords.value = result.count || 0
  } finally {
    isLoadingQuery.value = false
  }
}
```

**Note:** The working version does NOT have sorting logic in TablesView. Sorting is handled by SqlDatabaseList component.

#### Step 2.3: Remove Duplicated Logic
Delete from TablesView.vue:
- All export functions (exportAsCSV, exportAsJSON, exportAsXLSX)
- All filter logic (sqlFilters, sqlAppliedFilters, etc.)
- All column selection logic
- All inline editing logic (editingRows, backups, etc.)
- All view switching logic (selectedView, viewOptions, etc.)
- All Monaco editor logic (belongs in SqlDatabaseList)
- All row editing logic (onRowEditSave, onRowEditCancel, etc.)

### Phase 3: Ensure Proper Integration

#### Step 3.1: Check SqlDatabaseList Props
Ensure SqlDatabaseList receives all required props:

```javascript
// Required props
:data="dataFiltered"
:title="tableName"
:isLoading="isLoadingQuery"
:columns="tableColumns"

// Pagination props
:serverPagination="!isColumnView"
:totalRecords="tableTotalRecords"
@page="handlePage"

// CRUD props
:delete-service="deleteService"
@row-edit-saved="handleActionRowTable"
@row-edit-cancel="onRowEditCancel"
@reload-table="selectTable(selectedTable)"

// UI props
:disabled-action="isApplyingChanges"
@view-change="handleViewChange"
:title-delete-dialog="titleDeleteDialog"
@click-to-create="createTable"
:exportFileName="tableName || 'Table Data'"
:empty-block="{...}"
:not-show-empty-block="notShowEmptyBlock"
```

#### Step 3.2: Verify Event Handlers
Ensure TablesView has correct event handlers:

```javascript
const handleActionRowTable = (action) => {
  if (activeView.value === 'table') {
    handleActionRow(action)
  } else {
    handleActionRowSchema(action)
  }
}

const onRowEditCancel = () => {}
```

#### Step 3.3: Check Data Computed
Ensure correct data flow:

```javascript
const dataFiltered = computed(() => {
  if (activeView.value === 'table') {
    return tableRows.value
  } else {
    return tableSchema.value
  }
})

const tableColumns = computed(() => {
  if (activeView.value === 'table') {
    return Array.isArray(columns.value) ? columns.value : []
  } else {
    return columnsSchema.value
  }
})
```

### Phase 4: Testing Checklist

#### Test Database Operations
- [ ] Create database
- [ ] Edit database settings
- [ ] Delete database
- [ ] Database status polling

#### Test Table Operations
- [ ] View table list
- [ ] Select table
- [ ] View table data (pagination)
- [ ] View table schema
- [ ] Create table (navigate to editor)
- [ ] Delete table (single)
- [ ] Delete tables (bulk)
- [ ] Truncate table

#### Test Data Operations
- [ ] Insert row
- [ ] Edit row
- [ ] Delete row
- [ ] Insert column (schema view)
- [ ] Edit column (ALTER TABLE)

#### Test View Modes
- [ ] Table view
- [ ] Schema view
- [ ] JSON view

#### Test Features
- [ ] Search/filter table data
- [ ] Export to CSV
- [ ] Export to JSON
- [ ] Export to XLSX
- [ ] Column visibility selector
- [ ] Pagination
- [ ] Table context menu

#### Test Query Editor
- [ ] SQL execution
- [ ] SQL formatting
- [ ] Query history
- [ ] Quick templates
- [ ] Autocomplete

---

## Code Migration Details

### Files to Compare

1. **TablesView.vue**
   - Working: 462 lines
   - Broken: 1,294 lines
   - Action: Replace broken with working version

2. **SqlDatabaseList.vue**
   - Working: Exists in templates
   - Broken: Missing/inlined
   - Action: Ensure exists and is used

3. **CodeEditor.vue**
   - Compare both versions for consistency

4. **ListTables.vue**
   - Should be identical in both

5. **Composables**
   - useEdgeSQL.js
   - useSqlFormatter.js
   - useMonacoEditor.js
   - useDataTable.js

### Import Statements to Fix

**Broken TablesView.vue:**
```javascript
// TODO: migrate import to @aziontech/webkit/list-data-table when published
import DataTable from '@aziontech/webkit/list-data-table'
import { useDataTable } from '@/composables/useDataTable'
```

**Should be:**
```javascript
import SqlDatabaseList from '@/templates/list-table-block/sql-database-list.vue'
```

### Composables to Review

1. **useDataTable.js**
   - Check if exists in current codebase
   - Compare with backup version
   - Ensure export functions work

2. **useEdgeSQL.js**
   - Should be mostly identical
   - Check query history persistence

3. **useSqlFormatter.js**
   - SQL formatting logic

4. **useMonacoEditor.js**
   - Monaco editor setup

---

## Specific Code Changes

### TablesView.vue Changes

**DELETE from broken version:**
- Lines 53-376: Entire inlined SqlDatabaseList content
- Lines 402-404: useDataTable import and usage
- Lines 407-408: TableDefinitions store and theme store (if not used)
- Lines 465-991: All inlined editing, export, filter logic
- Lines 1176-1198: handleSort function (not in working version)

**ADD from working version:**
- SqlDatabaseList component import
- SqlDatabaseList usage in template
- Simplified handleViewChange
- Remove currentOrderBy logic

**MODIFY:**
- Ensure all props are passed correctly
- Verify event handlers match

### Functions to Keep (Both Versions)

These functions should be identical in both versions:

```javascript
// State management
resetTable()
selectTable(table)

// Services
deleteTableService()
insertColumnService()

// Event handlers
handleActionRowTable(action)
handleActionRowSchema(action)
handleActionRow(row)
openAlterColumnDialog(newData, oldData)

// Dialogs
openConfirmTruncate()
openConfirmDelete()

// Menu
showTableMenu(event, table)
```

### Functions to Remove (Broken Version Only)

These are duplicated in the broken version:

```javascript
// All belong in SqlDatabaseList component:
formatCellValue()
isTruncatedValue()
getRowKey()
resetSqlFilterState()
toggleSqlFilter()
handleApplySqlFilter()
handleRemoveSqlFilter()
handleEditSqlFilter()
toggleSqlColumnSelector()
toggleExportMenu()
exportAsCSV()
exportAsJSON()
exportAsXLSX()
editRow()
isRowEditing()
showRowMenu()
saveRowEdit()
cancelRowEdit()
onRowEditSave() // This version
onRowEditCancel() // This version
computedMenuItems()
generateUniqueKey()
generateUniqueId()
insertRow()
insertColumnSplitEvent()
insertRowSplitEvent()
onViewChange()
reloadSqlTable()
onSort()
onPage()
```

---

## Critical Issues Summary

### Issue 1: Component Architecture Violation
**Severity:** Critical
**Impact:** Maintainability, testability, code clarity
**Fix:** Restore SqlDatabaseList component usage

### Issue 2: Missing Template
**Severity:** High
**Impact:** Code reuse, consistency
**Fix:** Ensure SqlDatabaseList.vue exists in templates

### Issue 3: TODO Comment
**Severity:** Medium
**Impact:** Incomplete migration
**Fix:** Resolve TODO or remove if using template

### Issue 4: Complex Sorting Logic
**Severity:** Low
**Impact:** Potential bugs
**Fix:** Remove currentOrderBy if not needed

### Issue 5: Duplicated Logic
**Severity:** High
**Impact:** Maintenance burden, bugs
**Fix:** Remove all duplicated logic from TablesView

---

## Implementation Steps

### Step 1: Backup Current State
```bash
# Create backup
git add .
git commit -m "backup: before EdgeSQL fix"
```

### Step 2: Check Template Exists
```bash
# Check if SqlDatabaseList exists
ls -la src/templates/list-table-block/sql-database-list.vue

# If missing, copy from backup
cp ../azion-console-kit-bkp/src/templates/list-table-block/sql-database-list.vue \
   src/templates/list-table-block/sql-database-list.vue
```

### Step 3: Replace TablesView.vue
```bash
# Option 1: Copy from backup (recommended)
cp ../azion-console-kit-bkp/src/views/EdgeSQL/TablesView.vue \
   src/views/EdgeSQL/TablesView.vue

# Option 2: Manually extract inlined content
# (More time-consuming but allows for understanding)
```

### Step 4: Check Composables
```bash
# Compare composable files
diff -r ../azion-console-kit-bkp/src/views/EdgeSQL/composable \
        src/views/EdgeSQL/composable

# Update if needed
```

### Step 5: Check Utils
```bash
# Compare utility files
diff -r ../azion-console-kit-bkp/src/views/EdgeSQL/utils \
        src/views/EdgeSQL/utils

# Update if needed
```

### Step 6: Test Implementation
1. Run development server
2. Navigate to EdgeSQL
3. Test all features in checklist
4. Fix any issues found

### Step 7: Code Review
1. Review all changes
2. Ensure no regressions
3. Check performance
4. Validate all features work

---

## Risk Assessment

### High Risk Areas
1. **Event handling** - Ensure all events are properly connected
2. **Data flow** - Verify data flows correctly through components
3. **Service integration** - Check deleteService, insertRowService, updateRowService
4. **Pagination** - Verify server-side pagination works correctly

### Medium Risk Areas
1. **View switching** - Test table/schema/json view transitions
2. **Filter state** - Ensure filters don't persist incorrectly
3. **Export functionality** - Test all export formats

### Low Risk Areas
1. **UI styling** - CSS classes and layout
2. **Constants** - SQL queries and templates
3. **Menu items** - Context menus should be identical

---

## Success Criteria

The fix is successful when:

1. ✅ TablesView.vue is < 500 lines
2. ✅ SqlDatabaseList component is used (not inlined)
3. ✅ All database operations work
4. ✅ All table operations work
5. ✅ All data operations work
6. ✅ All view modes work
7. ✅ All exports work
8. ✅ Query editor works
9. ✅ No TODO comments remain
10. ✅ No duplicated logic
11. ✅ Tests pass (if any)
12. ✅ Performance is acceptable

---

## Appendix A: File Comparison Matrix

| File | Working Path | Broken Path | Status | Action |
|------|--------------|-------------|--------|--------|
| TablesView.vue | bkp/src/views/EdgeSQL/ | src/views/EdgeSQL/ | Different | Replace |
| SqlDatabaseList.vue | bkp/src/templates/ | src/templates/ | Missing/Inlined | Restore |
| ListTables.vue | bkp/src/views/EdgeSQL/components/ | src/views/EdgeSQL/components/ | Same | Keep |
| TruncateTable.vue | bkp/src/views/EdgeSQL/Dialog/ | src/views/EdgeSQL/Dialog/ | Same | Keep |
| AlterColumn.vue | bkp/src/views/EdgeSQL/Dialog/ | src/views/EdgeSQL/Dialog/ | Same | Keep |
| useEdgeSQL.js | bkp/src/views/EdgeSQL/composable/ | src/views/EdgeSQL/composable/ | Similar | Review |
| useDataTable.js | bkp/src/composables/ | src/composables/ | Check | Verify |
| table-actions.js | bkp/src/views/EdgeSQL/utils/ | src/views/EdgeSQL/utils/ | Same | Keep |
| row-actions.js | bkp/src/views/EdgeSQL/utils/ | src/views/EdgeSQL/utils/ | Same | Keep |

---

## Appendix B: Props Mapping

### SqlDatabaseList Props

| Prop | Type | Source | Description |
|------|------|--------|-------------|
| data | Array | dataFiltered | Table row data |
| title | String | tableName | Table name display |
| isLoading | Boolean | isLoadingQuery | Loading state |
| columns | Array | tableColumns | Column definitions |
| serverPagination | Boolean | !isColumnView | Server pagination toggle |
| totalRecords | Number | tableTotalRecords | Total for pagination |
| deleteService | Function | deleteService | Delete row factory |
| disabledAction | Boolean | isApplyingChanges | Disable actions |
| titleDeleteDialog | String | titleDeleteDialog | Dialog title |
| exportFileName | String | tableName | Export file name |
| emptyBlock | Object | static | Empty state config |
| notShowEmptyBlock | Boolean | notShowEmptyBlock | Hide empty |

### SqlDatabaseList Events

| Event | Handler | Description |
|-------|---------|-------------|
| row-edit-saved | handleActionRowTable | Row edit completed |
| row-edit-cancel | onRowEditCancel | Row edit cancelled |
| reload-table | selectTable(selectedTable) | Reload table data |
| page | handlePage | Page change |
| view-change | handleViewChange | View mode change |
| click-to-create | createTable | Create button clicked |

---

## Appendix C: Service Factories

### deleteService
```javascript
createDeleteService(
  (stmts) => executeQuery(stmts, { addToHistory: false }),
  () => selectedTable.value.name,
  () => tableSchema.value,
  () => selectTable(selectedTable.value),
  () => (isColumnView.value ? 'column' : 'row')
)
```

### insertRowService
```javascript
createInsertRowService(
  (databaseId, payload) => edgeSQLService.insertRow(databaseId, payload),
  () => currentDatabase.value.id,
  () => selectedTable.value.name,
  () => tableSchema.value,
  () => selectTable(selectedTable.value)
)
```

### updateRowService
```javascript
createUpdateRowService(
  (databaseId, payload) => edgeSQLService.updatedRow(databaseId, payload),
  () => currentDatabase.value.id,
  () => selectedTable.value.name,
  () => tableSchema.value,
  () => selectTable(selectedTable.value)
)
```

---

## Conclusion

The EdgeSQL product has undergone a problematic refactoring where the `SqlDatabaseList` component was inlined directly into `TablesView.vue`, creating a massive, unmaintainable component. The fix requires:

1. **Restoring the component architecture** by using `SqlDatabaseList`
2. **Removing duplicated logic** from TablesView.vue
3. **Ensuring proper integration** of all services and events
4. **Testing thoroughly** to prevent regressions

The working version in the backup should be used as the reference implementation. The fix is straightforward: replace the broken TablesView.vue with the working version and ensure the SqlDatabaseList template exists.

**Estimated Effort:** 2-4 hours for implementation and testing.

**Priority:** High - This architectural issue blocks maintainability and future development.
