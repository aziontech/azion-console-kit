# DataTable

## Purpose

Modular component system for creating data tables with advanced features, based on PrimeVue DataTable. Provides a consistent interface for displaying, searching, sorting, pagination and tabular data management with support for skeleton loading, cell quick actions, CSV export and store integration.

### Use Cases

- Resource listing with server-side pagination (lazy loading)
- Tables with dynamic search and filters
- Data management with row actions (edit, delete, clone)
- Data export to CSV
- Tables with grouping and expandable rows
- Item reordering via drag-and-drop
- Multiple record selection

---

## Props

### Required

| Prop | Type | Description                                |
| ---- | ---- | ------------------------------------------ |
| -    | -    | All props are optional with default values |

### Optional

| Prop                     | Type                  | Default                                                                           | Values                   | Description                                          |
| ------------------------ | --------------------- | --------------------------------------------------------------------------------- | ------------------------ | ---------------------------------------------------- |
| `data`                   | `Array`               | `[]`                                                                              | -                        | Data array to display in the table                   |
| `columns`                | `Array`               | `[]`                                                                              | -                        | Column configuration (used for skeleton loading)     |
| `lazy`                   | `Boolean`             | `false`                                                                           | `true`, `false`          | Enables lazy loading mode for server-side pagination |
| `loading`                | `Boolean`             | `false`                                                                           | `true`, `false`          | Loading state (displays skeleton)                    |
| `dataKey`                | `String`              | `'id'`                                                                            | -                        | Unique identifier field for each record              |
| `rowHover`               | `Boolean`             | `true`                                                                            | `true`, `false`          | Enables hover effect on rows                         |
| `paginator`              | `Boolean`             | `false`                                                                           | `true`, `false`          | Enables pagination                                   |
| `rows`                   | `Number`              | `10`                                                                              | -                        | Number of rows per page                              |
| `rowsPerPageOptions`     | `Array`               | `[10, 25, 50, 100]`                                                               | -                        | Options for number of rows per page                  |
| `totalRecords`           | `Number`              | `0`                                                                               | -                        | Total number of records (used in lazy mode)          |
| `first`                  | `Number`              | `0`                                                                               | -                        | Index of the first visible record                    |
| `containerClass`         | `String/Object/Array` | `''`                                                                              | -                        | CSS classes for the main container                   |
| `tableClass`             | `String/Object/Array` | `'overflow-clip rounded-md table-with-orange-borders'`                            | -                        | CSS classes for the table                            |
| `pt`                     | `Object`              | `{}`                                                                              | -                        | PrimeVue PassThrough props                           |
| `filters`                | `Object`              | `{}`                                                                              | -                        | Filters object                                       |
| `sortField`              | `String`              | `''`                                                                              | -                        | Initial sorting field                                |
| `sortOrder`              | `Number`              | `1`                                                                               | `1`, `-1`                | Sort direction (1: ASC, -1: DESC)                    |
| `globalFilterFields`     | `Array`               | `[]`                                                                              | -                        | Fields to apply global filter                        |
| `selection`              | `Object/Array`        | `null`                                                                            | -                        | Selected records                                     |
| `exportFilename`         | `String`              | `'export'`                                                                        | -                        | CSV export filename                                  |
| `exportFunction`         | `Function`            | `null`                                                                            | -                        | Custom export function                               |
| `rowClass`               | `Function`            | `null`                                                                            | -                        | Function to return CSS classes per row               |
| `groupRowsBy`            | `String`              | `''`                                                                              | -                        | Field to group records by                            |
| `sortMode`               | `String`              | `'single'`                                                                        | `'single'`, `'multiple'` | Sorting mode                                         |
| `expandedRowGroups`      | `Array`               | `[]`                                                                              | -                        | Expanded groups (v-model)                            |
| `skeletonRows`           | `Number`              | `5`                                                                               | -                        | Number of skeleton rows during loading               |
| `emptyListMessage`       | `String`              | `'No data available'`                                                             | -                        | Message when there's no data                         |
| `emptyBlock`             | `Object`              | `{ title, description, createButtonLabel, createPagePath, documentationService }` | -                        | Configuration for EmptyResultsBlock component        |
| `scrollable`             | `Boolean`             | `true`                                                                            | `true`, `false`          | Enables table scrolling                              |
| `scrollHeight`           | `String`              | `'calc(100vh - 300px)'`                                                           | -                        | Height of scrollable area                            |
| `showLastModifiedColumn` | `Boolean`             | `true`                                                                            | `true`, `false`          | Shows Last Modified column                           |
| `hasEmptyBlockSlot`      | `Boolean`             | `false`                                                                           | `true`, `false`          | Indicates if emptyBlock slot is used                 |
| `appliedFilters`         | `Array`               | `[]`                                                                              | -                        | Array of currently applied filters                   |
| `notShowEmptyBlock`      | `Boolean`             | `false`                                                                           | `true`, `false`          | Forces table render even when empty                  |
| `frozenValue`            | `Array`               | `[]`                                                                              | -                        | Array of frozen rows                                 |
| `isSelectable`           | `Boolean`             | `false`                                                                           | `true`, `false`          | Enables row selection                                |
| `searchValue`            | `String`              | `''`                                                                              | -                        | Current search value                                 |

---

## Slots

| Slot          | Description                            | Scope               |
| ------------- | -------------------------------------- | ------------------- |
| `default`     | Table columns (DataTable.Column)       | -                   |
| `header`      | Custom table header                    | -                   |
| `footer`      | Custom table footer                    | -                   |
| `empty`       | Content displayed when there's no data | -                   |
| `emptyBlock`  | Custom empty state block               | -                   |
| `groupheader` | Custom group header template           | `{ data: rowData }` |

## Events

| Event                      | Payload  | Description                                    |
| -------------------------- | -------- | ---------------------------------------------- |
| `rowReorder`               | `event`  | Emitted when reordering rows via drag-and-drop |
| `rowClick`                 | `event`  | Emitted when clicking on a row                 |
| `page`                     | `event`  | Emitted when changing page                     |
| `sort`                     | `event`  | Emitted when sorting by column                 |
| `update:filters`           | `Object` | Updates filters object (v-model)               |
| `update:sortField`         | `String` | Updates sorting field (v-model)                |
| `update:sortOrder`         | `Number` | Updates sort direction (v-model)               |
| `update:expandedRowGroups` | `Array`  | Updates expanded groups (v-model)              |
| `update:selection`         | `Array`  | Updates selected items (v-model)               |
| `update:editingRows`       | `Array`  | Updates editing rows (v-model)                 |
| `rowEditSave`              | `event`  | Emitted when saving row edit                   |
| `rowEditCancel`            | `event`  | Emitted when canceling row edit                |
| `click-to-create`          | -        | Emitted when clicking create in empty state    |

---

## Sub-Components

### DataTable.Header

Flexible container for organizing header elements with responsive layout. Provides two-line structure with optional divider.

**Props:**

- `showDivider` (Boolean, default: `true`): Shows divider between first and second line

**Slots:**

- `first-line`: Content for the first line (top section)
- `second-line`: Content for the second line (bottom section)

### DataTable.Actions

Container for grouping action buttons in the header.

**Props:**

- `containerClass` (String/Object/Array): Container CSS classes

### DataTable.Search

Search field with icon, optional debounce and optimized events.

**Props:**

- `modelValue` (String): Field value (v-model)
- `placeholder` (String, default: 'Search keywords...'): Input placeholder
- `debounce` (Number, default: 0): Debounce time in ms
- `disabled` (Boolean, default: false): Disables the search input

**Events:**

- `update:modelValue`: v-model binding
- `search`: Emitted when pressing Enter or after debounce
- `input`: Emitted on each input

**Slots:**

- `default`: Additional content next to the field

### DataTable.Export

CSV export button integrated with the table.

**Props:**

- `label` (String, default: ''): Button label
- `tooltipText` (String, default: 'Export to CSV'): Tooltip text
- `buttonClass` (String/Object/Array, default: 'max-sm:w-full ml-auto'): CSS classes
- `testId` (String, default: 'export_button'): Test ID for the button
- `disabled` (Boolean, default: false): Disables the button
- `loading` (Boolean, default: false): Loading state

**Events:**

- `export`: Emitted after export
- `click`: Emitted on click

### DataTable.ActionsButtons

Action buttons group with create button, help links, and optional other actions.

**Props:**

- `label` (String, required): Create button label
- `disabled` (Boolean, default: false): Disables the create button
- `buttonClass` (String/Object/Array, default: ''): CSS classes for create button
- `testId` (String, default: null): Test ID for create button
- `createPagePath` (String, default: null): Path to navigate on create click
- `otherLink` (String, default: null): Path for "Other Link" button
- `getHelpLink` (String, default: null): Path for "Get Help" button (defaults to copilot)
- `otherActions` (Boolean, default: false): Shows "Other Actions" button

**Events:**

- `click`: Emitted when create button is clicked
- `other-actions`: Emitted when other actions button is clicked

### DataTable.RowActions

Manages row actions with dropdown menu.

**Props:**

- `rowData` (Object, required): Row data
- `actions` (Array/Function, required): List of actions or function that returns actions
- `onMenuToggle` (Function, default: () => {}): Callback when opening menu
- `menuRefSetter` (Function, default: null): Function to set menu reference

### DataTable.ColumnSelector

Column visibility selector with overlay panel.

**Props:**

- `columns` (Array, required): Array of all available columns
- `selectedColumns` (Array, required): Array of currently visible columns

**Events:**

- `update:selectedColumns`: Emitted when column selection changes

**Exposed Methods:**

- `toggleColumnSelector(event)`: Toggles the column selector panel

### DataTable.Filter

Advanced filter panel with dynamic filter components.

**Props:**

- `filters` (Array, default: []): Array of filterable columns

**Events:**

- `apply`: Emitted when filter is applied with `{ field, label, value }`

**Exposed Methods:**

- `toggle(event)`: Toggles the filter panel

### DataTable.AppliedFilters

Displays currently applied filters with remove capability.

**Props:**

- `appliedFilters` (Array, default: []): Array of applied filters

**Events:**

- `remove`: Emitted when removing a filter with field name

### DataTable.LastModifiedPopup

Popup displaying last modified information on hover.

**Props:**

- `visible` (Boolean, default: false): Controls popup visibility
- `lastEditor` (String, required): Name of last editor
- `lastModified` (String, required): Last modified timestamp
- `position` (Object, default: { posX: 0, posY: 0 }): Popup position coordinates

### DataTable.Column

Alias for PrimeVue Column component (primevue/column).

---

## Dependencies

### External

- `primevue/datatable`
- `primevue/column`
- `primevue/skeleton`
- `primevue/button`
- `primevue/menu`
- `primevue/inputtext`

### Internal

- `@/templates/empty-results-block`
- `@/assets/svg/illustration-layers.vue`
- `@/composables/useDataTable`
- `@/composables/use-layout`
- `@/stores/account`
- `@/helpers/convert-date`

---

## Examples

### Basic Usage

```vue
<template>
  <DataTable
    :data="items"
    :loading="isLoading"
    data-key="id"
  >
    <template #header>
      <DataTable.Header>
        <template #first-line>
          <DataTable.Search
            v-model="searchTerm"
            placeholder="Search items..."
          />
        </template>
        <template #second-line>
          <DataTable.Actions>
            <DataTable.ActionsButtons
              label="New Item"
              @click="handleCreate"
            />
            <DataTable.Export />
          </DataTable.Actions>
        </template>
      </DataTable.Header>
    </template>

    <DataTable.Column
      field="name"
      header="Name"
      sortable
    />
    <DataTable.Column
      field="id"
      header="ID"
    />
    <DataTable.Column
      field="lastModified"
      header="Last Modified"
      sortable
    />
  </DataTable>
</template>

<script setup>
  import { ref } from 'vue'
  import DataTable from '@/components/DataTable'

  const items = ref([
    { id: 1, name: 'Item 1', lastModified: '2025-01-01' },
    { id: 2, name: 'Item 2', lastModified: '2025-01-02' }
  ])
  const isLoading = ref(false)
  const searchTerm = ref('')

  const handleCreate = () => {
    console.log('Navigate to create page')
  }
</script>
```

### Advanced Usage

```vue
<template>
  <DataTable
    :data="data"
    :columns="columns"
    :loading="isLoading"
    :total-records="totalRecords"
    :first="firstItemIndex"
    :rows="itemsByPage"
    lazy
    paginator
    @page="changeNumberOfLinesPerPage"
    @sort="fetchOnSort"
  >
    <template #header>
      <DataTable.Header>
        <template #first-line>
          <DataTable.Search
            v-model="filters.global.value"
            :debounce="500"
            placeholder="Search applications..."
            @input="handleSearchValue"
            @search="fetchOnSearch"
          />
        </template>
        <template #second-line>
          <DataTable.Actions>
            <DataTable.ActionsButtons
              label="Application"
              @click="navigateToAddPage"
            />
            <DataTable.Export />
          </DataTable.Actions>
        </template>
      </DataTable.Header>
    </template>

    <DataTable.Column
      field="name"
      header="Name"
      sortable
    />
    <DataTable.Column
      field="id"
      header="ID"
      sortable
    />
    <DataTable.Column
      field="lastEditor"
      header="Last Editor"
    />
    <DataTable.Column
      field="lastModified"
      header="Last Modified"
      sortable
    />

    <DataTable.Column header="Actions">
      <template #body="{ data }">
        <DataTable.RowActions
          :rowData="data"
          :actions="actionOptions"
          :onMenuToggle="toggleActionsMenu"
          :menuRefSetter="setMenuRefForRow"
        />
      </template>
    </DataTable.Column>
  </DataTable>
</template>

<script setup>
  import { computed } from 'vue'
  import DataTable from '@/components/DataTable'
  import { useDataTable } from '@/composables/useDataTable'
  import { myService } from '@/services/my-service'

  const props = defineProps({
    listService: {
      type: Function,
      default: myService.list
    }
  })

  const emit = defineEmits(['on-load-data'])

  const columns = computed(() => [
    { field: 'name', header: 'Name' },
    { field: 'id', header: 'ID' },
    { field: 'lastEditor', header: 'Last Editor' },
    { field: 'lastModified', header: 'Last Modified' }
  ])

  const actions = [
    {
      type: 'dialog',
      label: 'Clone',
      icon: 'pi pi-clone',
      dialog: {
        component: CloneDialog,
        body: (item, reload) => ({
          data: { ...item, onSuccess: reload }
        })
      }
    },
    {
      type: 'delete',
      label: 'Delete',
      title: 'Application',
      icon: 'pi pi-trash',
      service: myService.delete
    }
  ]

  const {
    data,
    isLoading,
    totalRecords,
    firstItemIndex,
    itemsByPage,
    filters,
    navigateToAddPage,
    actionOptions,
    toggleActionsMenu,
    setMenuRefForRow,
    changeNumberOfLinesPerPage,
    fetchOnSort,
    handleSearchValue,
    fetchOnSearch
  } = useDataTable(
    {
      ...props,
      columns,
      actions,
      lazy: true,
      createPagePath: '/items/create',
      editPagePath: '/items/edit',
      apiFields: ['id', 'name', 'last_editor', 'last_modified'],
      defaultOrderingFieldName: '-last_modified'
    },
    emit
  )
</script>
```

### With Composables

```vue
<template>
  <DataTable
    :data="data"
    :loading="isLoading"
    :total-records="totalRecords"
    :first="firstItemIndex"
    :rows="itemsByPage"
    v-model:filters="filtersDynamically"
    :row-class="getRowClass"
    lazy
    paginator
    @page="changeNumberOfLinesPerPage"
    @sort="fetchOnSort"
  >
    <template #header>
      <DataTable.Header>
        <template #first-line>
          <DataTable.Search
            v-model="filters.global.value"
            @input="handleSearchValue"
            @search="fetchOnSearch"
          />
        </template>
        <template #second-line>
          <DataTable.Actions>
            <DataTable.ActionsButtons
              label="New Record"
              @click="navigateToAddPage"
            />
            <DataTable.Export @export="handleExportTableDataToCSV" />
          </DataTable.Actions>
        </template>
      </DataTable.Header>
    </template>

    <DataTable.Column
      v-for="col in selectedColumns"
      :key="col.field"
      :field="col.field"
      :header="col.header"
      :sortable="col.sortable"
    />

    <DataTable.Column header="Actions">
      <template #body="{ data: rowData }">
        <DataTable.RowActions
          v-if="isRenderActions"
          :rowData="rowData"
          :actions="actionOptions"
          :singleAction="isRenderOneOption ? optionsOneAction : null"
          :onActionExecute="executeCommand"
          :onMenuToggle="toggleActionsMenu"
          :menuRefSetter="setMenuRefForRow"
        />
      </template>
    </DataTable.Column>
  </DataTable>
</template>

<script setup>
  import { computed } from 'vue'
  import DataTable from '@/components/DataTable'
  import { useDataTable } from '@/composables/useDataTable'

  const props = defineProps({
    listService: Function,
    createPagePath: String,
    editPagePath: String,
    apiFields: Array,
    defaultOrderingFieldName: String,
    actions: Array,
    columns: Array
  })

  const emit = defineEmits(['on-load-data', 'on-before-go-to-edit'])

  const {
    data,
    isLoading,
    totalRecords,
    firstItemIndex,
    itemsByPage,
    filters,
    filtersDynamically,
    selectedColumns,
    isRenderActions,
    isRenderOneOption,
    getRowClass,
    navigateToAddPage,
    actionOptions,
    executeCommand,
    optionsOneAction,
    toggleActionsMenu,
    setMenuRefForRow,
    changeNumberOfLinesPerPage,
    fetchOnSort,
    handleSearchValue,
    fetchOnSearch,
    handleExportTableDataToCSV
  } = useDataTable(props, emit)
</script>
```

### With Single Action per Row

```vue
<template>
  <DataTable
    :data="data"
    :loading="isLoading"
  >
    <DataTable.Column
      field="name"
      header="Name"
    />
    <DataTable.Column
      field="status"
      header="Status"
    />

    <DataTable.Column header="Actions">
      <template #body="{ data: rowData }">
        <DataTable.RowActions
          :rowData="rowData"
          :singleAction="getSingleAction"
          :onActionExecute="handleEdit"
        />
      </template>
    </DataTable.Column>
  </DataTable>
</template>

<script setup>
  import DataTable from '@/components/DataTable'

  const getSingleAction = (rowData) => ({
    icon: 'pi pi-pencil',
    label: 'Edit',
    disabled: rowData.locked
  })

  const handleEdit = (rowData) => {
    router.push(`/edit/${rowData.id}`)
  }
</script>
```

### With Expandable Groups

```vue
<template>
  <DataTable
    :data="groupedData"
    :expandable-row-groups="true"
    row-group-mode="subheader"
    group-rows-by="category"
    v-model:expanded-row-groups="expandedGroups"
  >
    <template #groupheader="{ data }">
      <div class="flex items-center gap-2">
        <i class="pi pi-tag"></i>
        <span class="font-bold">{{ data.category }}</span>
        <span class="text-sm text-gray-500">({{ getCategoryCount(data.category) }})</span>
      </div>
    </template>

    <DataTable.Column
      field="name"
      header="Name"
    />
    <DataTable.Column
      field="value"
      header="Value"
    />
  </DataTable>
</template>

<script setup>
  import { ref } from 'vue'
  import DataTable from '@/components/DataTable'

  const groupedData = ref([
    { category: 'Category A', name: 'Item 1', value: 100 },
    { category: 'Category A', name: 'Item 2', value: 200 },
    { category: 'Category B', name: 'Item 3', value: 300 }
  ])

  const expandedGroups = ref(['Category A'])

  const getCategoryCount = (category) => {
    return groupedData.value.filter((item) => item.category === category).length
  }
</script>
```

---

## Styling

### Main CSS Classes

- `table-with-orange-borders`: Main class for table styling with orange borders
- `outline-visible`: Activates orange outline when hovering cells (cell quick actions)
- `cell-active-hover`: Applied to cells with active quick actions

### Theme Customization

```css
.table-with-orange-borders :deep(.p-datatable-tbody > tr > td) {
  transition: color 0.2s ease !important;
}

.table-with-orange-borders.outline-visible
  :deep(.p-datatable-tbody > tr > td:hover:not(.p-frozen-column)),
.table-with-orange-borders.outline-visible :deep(.p-datatable-tbody > tr > td.cell-active-hover) {
  outline: 2px solid #f97316 !important;
  outline-offset: -2px;
  transition-delay: 0.3s;
  border-radius: 0 6px 6px 6px;
}
```

---

## Accessibility

### ARIA

- `data-testid="data-table-container"`: Main container
- `data-testid="data-table-header"`: Table header
- `data-testid="data-table-search-input"`: Search field
- `data-testid="data-table-actions"`: Actions container
- `data-testid="export_button"`: Export button
- `data-testid="data-table-actions-column-body-action-button"`: Single action button
- `data-testid="data-table-actions-column-body-actions-menu-button"`: Actions menu button
- `data-testid="list-table-block__empty-message__text"`: Empty message text
- `data-testid="edge-applications-empty-results-block"`: EmptyResultsBlock container

### Keyboard Navigation

- **Tab**: Navigate between interactive elements (search, buttons, actions)
- **Enter**: Execute action/search in search field
- **Arrow Keys**: Navigation in action menus (via PrimeVue Menu)
- **Escape**: Close open menus

### Screen Reader

- Informative tooltips on action buttons
- Descriptive labels on search fields
- Customizable empty state messages

---

## Technical Notes

### Performance

- **Skeleton Loading**: Displays placeholders during loading for better UX
- **Lazy Loading**: Server-side pagination support for large datasets
- **Debounce**: Search field with configurable debounce to reduce requests
- **Cell Quick Actions**: Conditional rendering with optimized hover management
- **Virtual Scrolling**: Available via PrimeVue DataTable props

### Compatibility

- Vue 3.x
- PrimeVue 3.x
- Compatible with Composition API and Options API
- TypeScript support (via JSDoc)
- Responsive (mobile-first design)

### Limitations

- CSV export uses PrimeVue native implementation (may need customization for advanced cases)
- Cell Quick Actions require additional configuration via `columns` prop

---

## Composable Integration

### useDataTable

The `useDataTable` composable centralizes all common table logic, including:

**Features:**

- Data loading and reloading
- Pagination and sorting management
- Search and filters (client-side and server-side)
- Row actions (dialog, delete, custom)
- CSV export
- Navigation (create, edit)
- Multiple selection
- Expandable groups
- Row reordering

**Required Props:**

```javascript
{
  listService: Function,
  columns: Array,
  actions: Array,
  createPagePath: String,
  editPagePath: String,
  apiFields: Array,
  defaultOrderingFieldName: String,
  lazy: Boolean,
  csvMapper: Function,
  showContrastInactiveLine: Boolean
}
```

**Returns:**

```javascript
{
  // Reactive variables
  ;(data,
    isLoading,
    totalRecords,
    filters,
    filtersDynamically,
    appliedFilters,
    selectedColumns,
    itemsByPage,
    firstItemIndex,
    sortFieldValue,
    sortOrderValue,
    lastModifiedToggled,
    expandedGroups,
    selectedItems,
    isAllSelected,
    showPopup,
    popupPosition,
    popupData,
    savedSearch,
    // Computed properties
    isRenderActions,
    isRenderOneOption,
    hasExportToCsvMapper,
    filterBy,
    getRowClass,
    // Functions
    loadData,
    reload,
    navigateToAddPage,
    editItemSelected,
    actionOptions,
    executeCommand,
    optionsOneAction,
    toggleActionsMenu,
    setMenuRefForRow,
    toggleColumnSelector,
    changeNumberOfLinesPerPage,
    updateDataTablePagination,
    fetchOnSort,
    sortByLastModified,
    fetchOnSearch,
    handleSearchValue,
    toggleFilter,
    handleApplyFilter,
    handleRemoveFilter,
    toggleLastModifiedDisplay,
    handleMouseEnter,
    handleMouseLeave,
    exportFunctionMapper,
    handleExportTableDataToCSV,
    exportTableAsCSV,
    exportTableAsJSON,
    exportTableAsXLSX,
    extractFieldValue,
    getObjectPath,
    moveItem,
    onRowReorder,
    toggleRowSelection,
    toggleSelectAll,
    toggleGroup,
    stateClassRules)
}
```

**Supported Action Types:**

1. **Dialog Action**

```javascript
{
  type: 'dialog',
  label: 'Clone',
  icon: 'pi pi-clone',
  dialog: {
    component: CloneDialog,
    body: (rowData, reload) => ({ data: { ...rowData } })
  }
}
```

2. **Delete Action**

```javascript
{
  type: 'delete',
  label: 'Delete',
  title: 'Item',
  icon: 'pi pi-trash',
  service: deleteService
}
```

3. **Custom Action**

```javascript
{
  type: 'action',
  label: 'Custom',
  icon: 'pi pi-cog',
  commandAction: (rowData) => { /* custom logic */ }
}
```

**Conditional Actions:**

```javascript
{
  type: 'delete',
  label: 'Delete',
  icon: 'pi pi-trash',
  service: deleteService,
  disabled: (rowData) => rowData.locked,
  visibleAction: (rowData) => !rowData.isSystem
}
```

---

## Empty States

The DataTable component provides flexible empty state handling with two different approaches depending on your needs.

### Simple Empty Message

For basic cases, use the `emptyListMessage` prop or the `empty` slot:

```vue
<template>
  <DataTable
    :data="items"
    empty-list-message="No items found"
  >
    <!-- columns -->
  </DataTable>
</template>
```

Or with custom content:

```vue
<template>
  <DataTable :data="items">
    <template #empty>
      <div class="text-center py-8">
        <i class="pi pi-search text-4xl text-gray-400 mb-4"></i>
        <p class="text-lg text-gray-600">No results found</p>
        <p class="text-sm text-gray-500">Try adjusting your search criteria</p>
      </div>
    </template>

    <!-- columns -->
  </DataTable>
</template>
```

### Rich Empty State with EmptyResultsBlock

For a more comprehensive empty state experience, use the `emptyBlock` prop with an object configuration:

```vue
<template>
  <DataTable
    :data="items"
    :empty-block="{
      title: 'No Applications Found',
      description: 'Create your first application to get started with edge computing.',
      createButtonLabel: 'Create Application',
      createPagePath: '/applications/create',
      documentationService: 'applications'
    }"
  >
    <!-- columns -->
  </DataTable>
</template>
```

### EmptyBlock Configuration

| Property               | Type     | Description                                 |
| ---------------------- | -------- | ------------------------------------------- |
| `title`                | `String` | Main title for the empty state              |
| `description`          | `String` | Descriptive text explaining the empty state |
| `createButtonLabel`    | `String` | Label for the create/action button          |
| `createPagePath`       | `String` | Route path for the create action            |
| `documentationService` | `String` | Service identifier for documentation links  |

### Behavior Logic

The component automatically determines which empty state to show:

1. **Table with data or loading**: Shows the PrimeVue DataTable
2. **No data + emptyBlock object**: Shows EmptyResultsBlock with illustration and action button
3. **No data + empty slot**: Shows custom empty slot content
4. **No data + emptyListMessage**: Shows simple text message

### Example with Complete Configuration

```vue
<template>
  <DataTable
    :data="applications"
    :loading="isLoading"
    :empty-block="emptyBlockConfig"
  >
    <template #header>
      <DataTable.Header>
        <template #first-line>
          <DataTable.Search
            v-model="searchTerm"
            placeholder="Search applications..."
          />
        </template>
        <template #second-line>
          <DataTable.Actions>
            <DataTable.ActionsButtons
              label="Application"
              @click="navigateToCreate"
            />
          </DataTable.Actions>
        </template>
      </DataTable.Header>
    </template>

    <DataTable.Column
      field="name"
      header="Name"
      sortable
    />
    <DataTable.Column
      field="status"
      header="Status"
    />
    <DataTable.Column
      field="lastModified"
      header="Last Modified"
      sortable
    />
  </DataTable>
</template>

<script setup>
  import { ref, computed } from 'vue'
  import { useRouter } from 'vue-router'
  import DataTable from '@/components/DataTable'

  const router = useRouter()
  const applications = ref([])
  const isLoading = ref(false)
  const searchTerm = ref('')

  const emptyBlockConfig = computed(() => ({
    title: 'No Edge Applications',
    description:
      'Create your first edge application to start delivering content with high performance and low latency.',
    createButtonLabel: 'Create Application',
    createPagePath: '/edge-applications/create',
    documentationService: 'edge-applications'
  }))

  const navigateToCreate = () => {
    router.push('/edge-applications/create')
  }
</script>

--- ## Related Links - [PrimeVue DataTable Documentation](https://v3.primevue.org/datatable/) -
[Component Implementation](./DataTable.vue) - [Export Module](./index.js) -
[Composable](../../composables/useDataTable.js)
```
