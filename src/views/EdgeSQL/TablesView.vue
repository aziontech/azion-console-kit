<template>
  <div class="flex sm:flex-row flex-col gap-8 mt-4 h-full min-h-0">
    <ConfirmDialog />
    <TruncateTable
      v-model:visible="truncateTableVisible"
      :tables="selectedTableNames"
      @load-tables="emit('load-tables')"
    />
    <AlterColumn
      v-model:visible="alterColumnVisible"
      :query="alterColumnQuery"
      :tableName="selectedTable?.name"
      @load-tables="selectTable(selectedTable)"
    />
    <Menu
      ref="tableMenuRef"
      id="table_menu"
      :model="tableMenuItems"
      :popup="true"
      appendTo="body"
      class="w-fit"
      :pt="{
        menuitem: ({ context }) => ({
          'data-testid': `table-menu-item-${context.item?.label
            ?.toLowerCase()
            .replace(/\s+/g, '-')}`
        })
      }"
    />
    <ListTables
      class="sm:w-64 w-full sm:max-h-72 max-h-full"
      :listTables="props.listTables"
      :isLoading="props.isLoadTables"
      v-model:selectedTables="selectedTableNames"
      v-model:showCheckbox="isSelectionMode"
      @reload-tables="reloadTables"
      @create-table="createTable"
      @select-table="selectTable"
      @show-table-menu="showTableMenu"
      @open-confirm-truncate="openConfirmTruncate"
      @open-confirm-delete="openConfirmDelete"
    />
    <div class="w-full flex flex-col gap-4 overflow-hidden h-full min-h-0">
      <InlineMessage
        v-if="isApplyingChanges"
        severity="info"
        icon="pi pi-spin pi-spinner"
        data-testid="table-loading-message"
      >
        SQL requests are queued. The table will update automatically once processing is complete.
      </InlineMessage>

      <!-- Inlined SqlDatabaseList content -->
      <div class="sql-database-list w-full h-full flex flex-col min-h-0">
        <DataTable
          ref="dataTableRef"
          class="flex-1 min-h-0"
          :data="displayDataForView"
          :columns="tableColumns"
          :loading="isLoadingQuery"
          :empty-block="sqlEmptyBlock"
          :lazy="!isColumnView"
          :totalRecords="!isColumnView ? tableTotalRecords : displayDataForView.length"
          v-model:filters="sqlFilters"
          v-model:sortField="sortFieldValue"
          v-model:sortOrder="sortOrderValue"
          editMode="row"
          v-model:editingRows="editingRows"
          @row-edit-save="onRowEditSave"
          @row-edit-cancel="onRowEditCancel"
          :paginator="true"
          :rowsPerPageOptions="[10, 25, 50, 100]"
          :rows="sqlMinItemsPerPage"
          @page="onPage"
          @sort="(e) => onSort(e)"
          :first="sqlFirstItemIndex"
          :globalFilterFields="sqlFilterBy"
          :notShowEmptyBlock="notShowEmptyBlockComputed"
          removableSort
          scrollable
          scrollHeight="flex"
          @click-to-create="createTable"
          :showGridlines="false"
          :pt="{
            headerContent: {
              class: 'flex items-center gap-2'
            },
            headerText: {
              class: 'text-left'
            },
            emptyMessage: {
              class: 'p-0 h-full'
            },
            footer: {
              class: 'p-0 h-full'
            }
          }"
        >
          <template #header>
            <DataTable.Header :showDivider="!!sqlAppliedFilters.length">
              <template #first-line>
                <div class="flex flex-col gap-2 w-full py-2">
                  <div class="flex items-center gap-2 justify-between">
                    <div class="text-color text-lg font-medium">{{ tableName }}</div>

                    <SplitButton
                      icon="pi pi-plus"
                      size="small"
                      severity="secondary"
                      label="Insert"
                      @click="insertRow"
                      :disabled="disabledActionsJsonView || isApplyingChanges"
                      :model="splitButtonItems"
                    />
                  </div>
                  <div class="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                    <div class="flex gap-2 items-center">
                      <PrimeButton
                        v-if="sqlAllowedFilters.length"
                        outlined
                        icon="pi pi-filter"
                        size="small"
                        @click="toggleSqlFilter"
                        :disabled="disabledActionsJsonView"
                        data-testid="data-table-actions-column-header-toggle-filter"
                      />
                      <DataTable.Search
                        v-model="sqlFilters.global.value"
                        :debounce="500"
                        placeholder="Search..."
                        @input="handleSqlSearchValue"
                        @search="fetchOnSqlSearch"
                        :disabled="disabledActionsJsonView"
                      />
                    </div>
                    <DataTable.Actions>
                      <SelectButton
                        v-model="selectedView"
                        :options="viewOptions"
                        optionLabel="value"
                        dataKey="value"
                        aria-labelledby="custom"
                        @change="onViewChange"
                      >
                        <template #option="slotProps">
                          <div class="flex items-center gap-2">
                            <i :class="slotProps.option.icon"></i>
                            <span>{{ slotProps.option.label }}</span>
                          </div>
                        </template>
                      </SelectButton>
                      <PrimeButton
                        icon="pi pi-refresh"
                        @click="reloadSqlTable"
                        outlined
                        iconOnly
                        v-tooltip="{
                          value: 'Reload',
                          position: 'bottom'
                        }"
                        size="small"
                      />
                      <PrimeButton
                        icon="pi pi-download"
                        outlined
                        iconOnly
                        @click="toggleExportMenu($event)"
                        v-tooltip.left="{ value: 'Export', showDelay: 200 }"
                        size="small"
                      />
                      <Menu
                        ref="exportMenuRef"
                        :popup="true"
                        :model="exportMenuItems"
                      />

                      <PrimeButton
                        icon="ai ai-column"
                        outlined
                        iconOnly
                        :disabled="disabledActionsJsonView"
                        @click="toggleSqlColumnSelector"
                        v-tooltip.left="{ value: 'Available Columns', showDelay: 200 }"
                        data-testid="data-table-actions-column-header-toggle-columns"
                      />
                      <OverlayPanel
                        ref="sqlColumnSelectorPanel"
                        :pt="{ content: { class: 'p-0' } }"
                        data-testid="data-table-actions-column-header-toggle-columns-panel"
                      >
                        <Listbox
                          v-model="sqlSelectedColumns"
                          multiple
                          :options="[
                            {
                              label: 'Available Columns',
                              items: tableColumns.filter((c) => c?.field !== 'actions')
                            }
                          ]"
                          class="hidden-columns-panel"
                          optionLabel="header"
                          optionGroupLabel="label"
                          optionGroupChildren="items"
                          data-testid="data-table-actions-column-header-toggle-columns-panel-listbox"
                        >
                          <template #optiongroup="slotProps">
                            <p class="text-sm font-medium">{{ slotProps.option.label }}</p>
                          </template>
                        </Listbox>
                      </OverlayPanel>
                    </DataTable.Actions>
                  </div>
                </div>
              </template>
              <template
                #second-line
                v-if="sqlAppliedFilters.length"
              >
                <DataTable.AppliedFilters
                  :applied-filters="sqlAppliedFilters"
                  @remove="handleRemoveSqlFilter"
                  @edit="handleEditSqlFilter"
                />
              </template>
            </DataTable.Header>
          </template>
          <template #empty>
            <div class="w-full h-full min-h-0 flex-1">
              <vue-monaco-editor
                v-if="selectedView?.value === 'json' && displayDataForView.length === 0"
                :value="jsonPreview"
                language="json"
                :options="monacoOptions"
                :theme="sqlMonacoTheme"
                class="w-full h-full"
              />
              <div
                v-else
                class="w-full h-full flex items-center justify-center text-color-secondary text-sm"
              >
                No data to display.
              </div>
            </div>
          </template>
          <template v-if="selectedView?.value !== 'json'">
            <Column
              v-for="col in sqlSelectedColumns"
              :key="col.field"
              :field="col.field"
              :header="col.header"
              :style="col.style || 'width: 20%'"
              :sortable="col.sortable !== false"
              :sortField="col.sortField"
              :pt="{
                header: {
                  class: 'bg-gray-50 text-gray-900'
                },
                headerContent: {
                  class: 'flex items-center gap-2'
                },
                headerText: {
                  class: 'hidden'
                }
              }"
            >
              <template #header>
                <span class="flex items-center gap-2 text-color">
                  {{ col.header }}
                  <span class="text-color-secondary font-mono text-xs">{{ col.tagType }}</span>
                </span>
              </template>
              <template #body="{ data: rowData, field }">
                <span
                  v-tooltip.top="isTruncatedValue(rowData[field]) ? String(rowData[field]) : null"
                >
                  {{ formatCellValue(rowData[field]) }}
                </span>
              </template>
              <template #editor="{ data: rowData, field }">
                <Dropdown
                  v-if="isSchemaView && field === 'type'"
                  v-model="rowData[field]"
                  :options="dataTypeOptions"
                  optionLabel="label"
                  optionValue="value"
                  class="w-full"
                  filter
                />
                <Dropdown
                  v-else-if="isSchemaView && (field === 'notNull' || field === 'primaryKey')"
                  v-model="rowData[field]"
                  :options="[
                    { label: 'True', value: 1 },
                    { label: 'False', value: 0 }
                  ]"
                  optionLabel="label"
                  optionValue="value"
                  class="w-full"
                />

                <InputText
                  v-else-if="
                    ['integer', 'bigint', 'decimal', 'float'].includes(
                      String(col.tagType).toLowerCase()
                    )
                  "
                  v-model="rowData[field]"
                  type="number"
                  class="w-full"
                  inputmode="decimal"
                />

                <InputText
                  v-else
                  v-model="rowData[field]"
                  class="w-full"
                />
              </template>
            </Column>
            <DataTable.Column header="Actions">
              <template #body="{ data: rowData }">
                <div
                  v-if="isRowEditing(rowData)"
                  class="flex gap-1 justify-end"
                >
                  <PrimeButton
                    :icon="`pi ${isLoadingEditRow ? 'pi-spin pi-spinner' : 'pi-check'}`"
                    size="small"
                    @click.stop="saveRowEdit(rowData)"
                    outlined
                    iconOnly
                    data-testid="row-save-button"
                    v-tooltip.top="'Save'"
                    :disabled="isLoadingEditRow"
                  />
                  <PrimeButton
                    icon="pi pi-times"
                    size="small"
                    severity="secondary"
                    outlined
                    iconOnly
                    @click.stop="cancelRowEdit(rowData)"
                    data-testid="row-cancel-button"
                    v-tooltip.top="'Cancel'"
                  />
                </div>
                <div
                  v-else
                  class="flex justify-end"
                >
                  <PrimeButton
                    icon="pi pi-ellipsis-h"
                    size="small"
                    :disabled="isApplyingChanges"
                    outlined
                    @click.stop="showRowMenu($event, rowData)"
                    class="w-8 h-8 p-0"
                    data-testid="row-actions-menu-button"
                  />
                </div>
              </template>
            </DataTable.Column>
          </template>
        </DataTable>
        <Menu
          ref="rowMenuRef"
          :model="computedMenuItems"
          :popup="true"
        />
        <DataTable.Filter
          v-if="sqlAllowedFilters.length"
          ref="sqlFilterPanel"
          :filters="sqlAllowedFilters"
          @apply="handleApplySqlFilter"
        />
      </div>
    </div>
  </div>
</template>
<script setup>
  defineOptions({ name: 'tables-view' })
  import { ref, computed, nextTick, watch, onMounted } from 'vue'
  import { FilterMatchMode } from '@aziontech/webkit/api'
  import { useEdgeSQL } from './composable/useEdgeSQL'
  import InlineMessage from '@aziontech/webkit/inlinemessage'
  import ConfirmDialog from '@aziontech/webkit/confirm-dialog'
  import TruncateTable from './Dialog/TruncateTable.vue'
  import AlterColumn from './Dialog/AlterColumn.vue'
  import { useDeleteDialog } from '@/composables/useDeleteDialog'
  import Menu from '@aziontech/webkit/menu'
  import PrimeButton from '@aziontech/webkit/button'
  import SplitButton from '@aziontech/webkit/splitbutton'
  import SelectButton from '@aziontech/webkit/selectbutton'
  import OverlayPanel from '@aziontech/webkit/overlaypanel'
  import Listbox from '@aziontech/webkit/listbox'
  import InputText from '@aziontech/webkit/inputtext'
  import Dropdown from '@aziontech/webkit/dropdown'
  import Column from '@aziontech/webkit/column'
  import { VueMonacoEditor as vueMonacoEditor } from '@guolao/vue-monaco-editor'
  import { edgeSQLService } from '@/services/v2/edge-sql/edge-sql-service'
  import { TableActionManager } from './utils/table-actions'
  // TODO: migrate import to @aziontech/webkit/list-data-table when published
  import DataTable from '@aziontech/webkit/list-data-table'
  import { useDataTable } from '@/composables/useDataTable'
  import { SQLITE_QUERIES } from './constants/queries'
  import ListTables from './components/ListTables.vue'
  import { useTableDefinitionsStore } from '@/stores/table-definitions'
  import { useThemeStore } from '@/stores/theme'
  import {
    createDeleteService,
    createInsertRowService,
    createUpdateRowService
  } from './utils/row-actions'

  const emit = defineEmits([
    'go-editor',
    'load-tables',
    'execute-query',
    'show-table-info',
    'show-definition',
    'on-load-data',
    'row-click',
    'sort',
    'page',
    'navigate-other-link',
    'navigate-get-help',
    'other-actions',
    'row-edit-saved',
    'row-edit-cancel',
    'click-to-create',
    'reload-table',
    'view-change'
  ])

  const props = defineProps({
    listTables: {
      type: Array,
      required: true
    },
    isLoadTables: {
      type: Boolean,
      required: true
    }
  })

  const { currentDatabase, executeQuery } = useEdgeSQL()
  const tableDefinitions = useTableDefinitionsStore()
  const themeStore = useThemeStore()
  const isSelectionMode = ref(false)
  const selectedTableNames = ref([])
  const tableMenuRef = ref(null)
  const selectedTable = ref(null)
  const truncateTableVisible = ref(false)
  const alterColumnVisible = ref(false)
  const alterColumnQuery = ref('')
  const columns = ref([])
  const tableRows = ref([])
  const tableTotalRecords = ref(0)
  const currentPage = ref(1)
  const currentPageSize = ref(tableDefinitions.getNumberOfLinesPerPage || 50)
  const currentOrderBy = ref(null)
  const isLoadingQuery = ref(false)
  const notShowEmptyBlock = ref(false)

  // --- Inlined sql-database-list state ---
  const dataTableRef = ref(null)
  const editingRows = ref([])
  const backups = ref(new Map())
  const rowMenuRef = ref(null)
  const selectedRowData = ref(null)
  const isLoadingEditRow = ref(false)
  const exportMenuRef = ref(null)
  const sqlColumnSelectorPanel = ref(null)
  const sqlFilterPanel = ref(null)
  const sqlAppliedFilters = ref([])
  const sortFieldValue = ref(null)
  const sortOrderValue = ref(null)
  const sqlMinItemsPerPage = ref(tableDefinitions.getNumberOfLinesPerPage)
  const sqlFirstItemIndex = ref(0)

  const sqlMonacoTheme = computed(() => {
    return themeStore.currentTheme === 'light' ? 'vs' : 'vs-dark'
  })

  const tableSchema = ref([])
  const activeView = ref('table')

  const columnsSchema = ref([
    { field: 'name', header: 'Column Name' },
    { field: 'type', header: 'Data Type' },
    { field: 'default', header: 'Default' },
    { field: 'notNull', header: 'Nullable' },
    { field: 'primaryKey', header: 'Primary Key' }
  ])

  const tableColumns = computed(() => {
    if (activeView.value === 'table') {
      return Array.isArray(columns.value) ? columns.value : []
    } else {
      return columnsSchema.value
    }
  })

  const dataFiltered = computed(() => {
    if (activeView.value === 'table') {
      return tableRows.value
    } else {
      return tableSchema.value
    }
  })

  const editableData = ref([])
  const selectedView = ref({
    label: 'Table',
    value: 'table',
    icon: 'pi pi-table'
  })

  const viewOptions = [
    { label: 'Table', value: 'table', icon: 'pi pi-table' },
    { label: 'Schema', value: 'schema', icon: 'ai ai-layers' }
  ]

  const dataTypes = [
    'INTEGER',
    'BIGINT',
    'DECIMAL',
    'FLOAT',
    'VARCHAR',
    'TEXT',
    'BOOLEAN',
    'DATE',
    'DATETIME',
    'TIMESTAMP',
    'JSON',
    'UUID'
  ]
  const dataTypeOptions = dataTypes.map((type) => ({ label: type, value: type }))

  const sqlFilters = ref({
    global: { value: '', matchMode: FilterMatchMode.CONTAINS }
  })

  const sqlSelectedColumns = ref([])

  // Watcher for sqlSelectedColumns to prevent empty state
  watch(
    () => sqlSelectedColumns.value,
    (newVal, oldVal) => {
      const newList = Array.isArray(newVal) ? newVal : []
      if (newList.length === 0) {
        const previous = Array.isArray(oldVal) ? oldVal : []
        if (previous.length) {
          sqlSelectedColumns.value = previous
          return
        }
        const availableColumns = (tableColumns.value || []).filter(
          (column) => column?.field !== 'actions'
        )
        if (availableColumns.length) {
          sqlSelectedColumns.value = [availableColumns[0]]
        }
      }
    },
    { deep: true }
  )

  // Watch for view change to reset filters
  watch(
    () => selectedView.value?.value,
    (newValue, oldValue) => {
      if (!oldValue || newValue === oldValue) return
      resetSqlFilterState()
    }
  )

  // Watch tableColumns to keep sqlSelectedColumns in sync
  watch(
    () => tableColumns.value,
    (newCols) => {
      sqlSelectedColumns.value = Array.isArray(newCols) ? [...newCols] : []
    },
    { deep: true }
  )

  // Watch data source for editableData
  watch(
    () => dataFiltered.value,
    (val) => {
      editableData.value = Array.isArray(val) ? val.map((row) => ({ ...row })) : []
    },
    { immediate: true, deep: true }
  )

  // --- useDataTable for export helpers ---
  const sqlTableProps = { columns: tableColumns, loadDisabled: true }
  const {
    handleExportTableDataToCSV: sqlExportCSV,
    exportTableAsJSON: sqlExportJSON,
    exportTableAsXLSX: sqlExportXLSX,
    fetchOnSearch: fetchOnSqlSearch,
    handleSearchValue: handleSqlSearchValue,
    filterBy: sqlFilterBy
  } = useDataTable(sqlTableProps, emit)

  const { openDeleteDialog: openDeleteDialogComposable } = useDeleteDialog()

  // --- Computed ---
  const sqlAllowedFilters = computed(() =>
    (tableColumns.value || [])
      .filter((col) => col?.field && col.field !== 'actions')
      .map((col) => ({
        ...col,
        sortField: col?.sortField ?? col?.field
      }))
  )

  const isSchemaView = computed(() => selectedView.value?.value === 'schema')
  const displayDataForView = computed(() =>
    selectedView.value?.value === 'json' ? [] : editableData.value
  )
  const notShowEmptyBlockComputed = computed(() => {
    const isJsonView = selectedView.value?.value === 'json'
    return Boolean(notShowEmptyBlock.value || isJsonView)
  })
  const disabledActionsJsonView = computed(() => selectedView.value?.value === 'json')

  const jsonPreview = computed(() => {
    try {
      return JSON.stringify(editableData.value ?? [], null, 2)
    } catch {
      return '[]'
    }
  })
  const monacoOptions = {
    readOnly: true,
    automaticLayout: true,
    wordWrap: 'on',
    minimap: { enabled: false }
  }

  const sqlEmptyBlock = computed(() => ({
    title: 'No tables yet',
    description: 'Create your first table to store your data.',
    createButtonLabel: 'Table'
  }))

  // --- Cell formatting ---
  const MAX_CELL_LENGTH = 100
  const formatCellValue = (value) => {
    if (value == null) return value
    const stringValue = String(value)
    if (stringValue.length <= MAX_CELL_LENGTH) return stringValue
    return `${stringValue.slice(0, MAX_CELL_LENGTH)}...`
  }
  const isTruncatedValue = (value) => {
    if (value == null) return false
    return String(value).length > MAX_CELL_LENGTH
  }

  // --- Row key helper ---
  const getRowKey = (row) =>
    row?.id != null ? row.id : row?.index != null ? row.index : row?._tempKey

  // --- Filter logic ---
  const resetSqlFilterState = () => {
    sqlAppliedFilters.value = []
    sqlFilters.value = {
      global: { value: '', matchMode: FilterMatchMode.CONTAINS }
    }
    sqlFilterPanel.value?.hide?.()
  }

  const toggleSqlFilter = (event) => {
    if (sqlFilterPanel.value) sqlFilterPanel.value.toggle(event)
  }

  const handleApplySqlFilter = (filterData) => {
    const hasValue =
      filterData?.value !== null && filterData?.value !== undefined && filterData?.value !== ''
    if (!filterData?.field || !filterData?.label || !hasValue) return

    const existingIndex = sqlAppliedFilters.value.findIndex(
      (filterEntry) => filterEntry.field === filterData.field
    )
    const entry = {
      field: filterData.field,
      label: filterData.label,
      value: filterData.value,
      matchMode: 'contains'
    }
    if (existingIndex !== -1) {
      sqlAppliedFilters.value[existingIndex] = entry
    } else {
      sqlAppliedFilters.value.push(entry)
    }

    sqlFilters.value[filterData.field] = {
      value: filterData.value,
      matchMode: FilterMatchMode.CONTAINS
    }
  }

  const handleRemoveSqlFilter = (field) => {
    sqlAppliedFilters.value = sqlAppliedFilters.value.filter(
      (filterEntry) => filterEntry.field !== field
    )
    if (sqlFilters.value?.[field]) {
      delete sqlFilters.value[field]
    }
  }

  const handleEditSqlFilter = ({ filter, event }) => {
    sqlFilterPanel.value?.openForFilter?.(filter, event)
  }

  const toggleSqlColumnSelector = (event) => {
    sqlColumnSelectorPanel.value.toggle(event)
  }

  // --- Export logic ---
  const toggleExportMenu = (event) => {
    if (exportMenuRef.value) exportMenuRef.value.toggle(event)
  }

  const exportAsCSV = () =>
    sqlExportCSV(tableName.value || 'Table Data', editableData.value, sqlSelectedColumns.value)
  const exportAsJSON = () =>
    sqlExportJSON(tableName.value || 'Table Data', editableData.value, sqlSelectedColumns.value)
  const exportAsXLSX = () =>
    sqlExportXLSX(tableName.value || 'Table Data', editableData.value, sqlSelectedColumns.value)

  const exportMenuItems = computed(() => [
    { label: 'Export all to .csv', icon: 'pi pi-file', command: exportAsCSV },
    { label: 'Export all to .json', icon: 'pi pi-code', command: exportAsJSON },
    { label: 'Export all to .xlsx', icon: 'pi pi-file-excel', command: exportAsXLSX }
  ])

  // --- Inline editing ---
  const editRow = (row) => {
    const key = getRowKey(row)
    if (key == null) return
    backups.value.set(key, { ...row })
    if (!editingRows.value.some((editing) => getRowKey(editing) === key)) {
      editingRows.value = [...editingRows.value, row]
    }
  }

  const isRowEditing = (row) => {
    if (!row) return false
    const key = getRowKey(row)
    if (key == null) {
      return editingRows.value.includes(row)
    }
    return editingRows.value.some((editing) => getRowKey(editing) === key)
  }

  const showRowMenu = (event, rowData) => {
    selectedRowData.value = rowData
    if (rowMenuRef.value) {
      rowMenuRef.value.hide()
      rowMenuRef.value.show(event)
    }
  }

  const saveRowEdit = (rowData) => {
    isLoadingEditRow.value = true
    onRowEditSave({ newData: { ...rowData }, data: rowData })
    isLoadingEditRow.value = false
  }

  const cancelRowEdit = (rowData) => {
    onRowEditCancel({ data: rowData })
  }

  const onRowEditSave = (event) => {
    const { newData, data: eventData } = event || {}
    const key = getRowKey(newData) ?? getRowKey(eventData)
    if (key == null) return
    const index = editableData.value.findIndex((item) => getRowKey(item) === key)
    const oldData = backups.value.get(key)
    if (index !== -1) {
      handleActionRowTable({ id: key, oldData, newData, index })
    }
    backups.value.delete(key)
    editingRows.value = editingRows.value.filter((row) => getRowKey(row) !== key)
  }

  const onRowEditCancel = (event) => {
    const { data: eventData } = event || {}
    const key = getRowKey(eventData)
    const isNew = eventData?._isNew === true
    if (isNew) {
      if (key != null) {
        editableData.value = editableData.value.filter((item) => getRowKey(item) !== key)
        backups.value.delete(key)
        editingRows.value = editingRows.value.filter((row) => getRowKey(row) !== key)
      } else if (eventData?._tempKey) {
        editableData.value = editableData.value.filter(
          (item) => item?._tempKey !== eventData._tempKey
        )
        editingRows.value = editingRows.value.filter((row) => row !== eventData)
      } else {
        editableData.value = editableData.value.filter((item) => item !== eventData)
        editingRows.value = editingRows.value.filter((row) => row !== eventData)
      }
      return
    }
    if (key == null) return
    const original = backups.value.get(key)
    if (original) {
      const idx = editableData.value.findIndex((item) => getRowKey(item) === key)
      if (idx !== -1) {
        editableData.value[idx] = { ...original }
      }
    }
    backups.value.delete(key)
    editingRows.value = editingRows.value.filter((row) => getRowKey(row) !== key)
  }

  const computedMenuItems = computed(() => {
    const base = []
    base.push({
      label: 'Edit',
      icon: 'pi pi-pencil',
      command: () => {
        if (selectedRowData.value) editRow(selectedRowData.value)
      }
    })
    base.push({
      label: 'Delete',
      icon: 'pi pi-trash',
      command: () => {
        if (!selectedRowData.value) return
        const row = selectedRowData.value
        openDeleteDialogComposable({
          id: row.id,
          data: row,
          title: titleDeleteDialog.value,
          deleteService: deleteService,
          closeCallback: (opt) => {
            if (opt?.data?.updated) selectTable(selectedTable.value)
          }
        })
      }
    })
    return base
  })

  // --- Insert row/column ---
  const generateUniqueKey = () => {
    const prefix = 'new-'
    if (typeof crypto !== 'undefined' && crypto?.randomUUID) {
      return `${prefix}${crypto.randomUUID()}`
    }
    return `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  }

  const generateUniqueId = () => {
    const existingIds = editableData.value
      .map((rowItem) => rowItem?.id)
      .filter((val) => val != null)
    const existingSet = new Set(existingIds)

    const idColumn = (tableColumns.value || []).find((col) => col?.field === 'id')
    const typeLabel = (idColumn?.tagType || '').toString().toLowerCase()
    const isNumericId = [
      'int',
      'integer',
      'bigint',
      'smallint',
      'tinyint',
      'number',
      'numeric'
    ].some((type) => typeLabel.includes(type))

    if (isNumericId) {
      const numericIds = existingIds
        .map((value) => (typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value))
        .filter((num) => Number.isFinite(num))
      const next = (numericIds.length ? Math.max(...numericIds) : 0) + 1
      let candidate = next
      while (existingSet.has(candidate) || existingSet.has(String(candidate))) {
        candidate += 1
      }
      return candidate
    }

    let candidate =
      typeof crypto !== 'undefined' && crypto?.randomUUID
        ? crypto.randomUUID()
        : `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    while (existingSet.has(candidate)) {
      candidate =
        typeof crypto !== 'undefined' && crypto?.randomUUID
          ? crypto.randomUUID()
          : `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    }
    return candidate
  }

  const insertRow = () => {
    const fields = (tableColumns.value || [])
      .filter((col) => col?.field && col.field !== 'actions')
      .map((col) => col.field)
    const hasId = fields.includes('id')
    const base = fields.reduce((acc, key) => {
      acc[key] = ''
      return acc
    }, {})
    base.id = generateUniqueId()
    const newRow = { ...base, _tempKey: generateUniqueKey(), _isNew: true }
    editableData.value = [newRow, ...editableData.value]
    if (hasId) {
      editRow(newRow)
    } else {
      if (!editingRows.value.includes(newRow)) {
        editingRows.value = [...editingRows.value, newRow]
      }
    }
  }

  const insertColumnSplitEvent = async () => {
    selectedView.value = { label: 'Schema', value: 'schema', icon: 'ai ai-column' }
    onViewChange({ value: selectedView.value })
    await nextTick()
    insertRow()
  }

  const insertRowSplitEvent = async () => {
    selectedView.value = { label: 'Table', value: 'table', icon: 'pi pi-table' }
    onViewChange({ value: selectedView.value })
    await nextTick()
    insertRow()
  }

  const splitButtonItems = computed(() => {
    const list = [
      {
        icon: 'pi pi-minus',
        label: 'Insert Data',
        command: () => insertRowSplitEvent()
      }
    ]
    list.unshift({
      icon: 'ai ai-column',
      label: 'Insert Column',
      command: () => insertColumnSplitEvent()
    })
    return list
  })

  // --- View change / sort / page ---
  const onViewChange = ({ value }) => {
    if (!value) return
    activeView.value = value.value || value
  }

  const reloadSqlTable = () => {
    selectTable(selectedTable.value)
  }

  const onSort = (event) => {
    editableData.value = editableData.value.filter((row) => row?._isNew !== true)
    editingRows.value = []
    backups.value.clear()

    const { sortField, sortOrder } = event
    let orderByClause = null

    if (sortField) {
      const direction = sortOrder === -1 ? 'DESC' : 'ASC'
      orderByClause = `${sortField} ${direction}`
    }

    handleSort({
      ...event,
      orderBy: orderByClause,
      sortField,
      sortOrder
    })
  }

  const onPage = (event) => {
    sqlMinItemsPerPage.value = event.rows
    tableDefinitions.setNumberOfLinesPerPage(event.rows)
    sqlFirstItemIndex.value = event.first
    handlePage(event)
  }

  // --- Original TablesView logic ---
  const resetTable = () => {
    selectedTable.value = null
    columns.value = []
    tableRows.value = []
    tableSchema.value = []
    isSelectionMode.value = false
    selectedTableNames.value = []
    notShowEmptyBlock.value = false
    currentOrderBy.value = null
    tableMenuRef.value.hide()
  }

  const titleDeleteDialog = computed(() => {
    if (activeView.value === 'table') {
      return 'Table'
    } else {
      return 'Column'
    }
  })

  const isApplyingChanges = ref(false)

  const isColumnView = computed(() => activeView.value === 'schema')

  const openConfirmTruncate = () => {
    truncateTableVisible.value = true
  }

  const deleteTableService = async () => {
    await edgeSQLService.executeDatabase(currentDatabase.value.id, {
      statements: selectedTableNames.value.map((tableName) => `DROP TABLE ${tableName};`)
    })

    const namesTablesDeleted = selectedTableNames.value.join(', ')
    selectedTableNames.value = []
    notShowEmptyBlock.value = false
    resetTable()
    emit('load-tables')
    return `Table "${namesTablesDeleted}" deleted successfully`
  }

  const createTable = () => {
    emit('go-editor')
  }

  const insertColumnService = async (columnData) => {
    await edgeSQLService.insertColumn(currentDatabase.value.id, {
      tableName: selectedTable.value.name,
      columnData
    })
    await selectTable(selectedTable.value)
  }

  const handleActionRowSchema = (action) => {
    if (action.newData._isNew) {
      insertColumnService(action.newData)
    } else {
      openAlterColumnDialog(action.newData, action.oldData)
    }
  }

  const openAlterColumnDialog = (newData, oldData) => {
    if (!selectedTable.value?.name) return
    const sql = SQLITE_QUERIES.ALTER_COLUMN(
      selectedTable.value.name,
      tableSchema.value,
      oldData,
      newData
    )
    alterColumnQuery.value = sql
    alterColumnVisible.value = true
  }

  const handleActionRowTable = (action) => {
    if (activeView.value === 'table') {
      handleActionRow(action)
    } else {
      handleActionRowSchema(action)
    }
  }

  const handleActionRow = async (row) => {
    if (row.newData._isNew) {
      await onRowInsert(row.newData)
    } else {
      await onRowEditSaveAction(row.newData, row.oldData)
    }
  }

  const deleteService = createDeleteService(
    (stmts) => executeQuery(stmts, { addToHistory: false }),
    () => selectedTable.value.name,
    () => tableSchema.value,
    () => selectTable(selectedTable.value),
    () => (isColumnView.value ? 'column' : 'row')
  )

  const insertRowService = createInsertRowService(
    (databaseId, payload) => edgeSQLService.insertRow(databaseId, payload),
    () => currentDatabase.value.id,
    () => selectedTable.value.name,
    () => tableSchema.value,
    () => selectTable(selectedTable.value)
  )

  const onRowInsert = async (row) => {
    try {
      isApplyingChanges.value = true
      await insertRowService(row)
    } finally {
      isApplyingChanges.value = false
    }
  }

  const updateRowService = createUpdateRowService(
    (databaseId, payload) => edgeSQLService.updatedRow(databaseId, payload),
    () => currentDatabase.value.id,
    () => selectedTable.value.name,
    () => tableSchema.value,
    () => selectTable(selectedTable.value)
  )

  const onRowEditSaveAction = async (newData, whereData) => {
    isApplyingChanges.value = true
    try {
      await updateRowService(newData, whereData)
    } finally {
      isApplyingChanges.value = false
    }
  }

  const selectTable = async (table) => {
    isLoadingQuery.value = true
    selectedTable.value = table
    notShowEmptyBlock.value = true
    currentOrderBy.value = null
    try {
      currentPage.value = 1
      const result = await edgeSQLService.getTableInfo(currentDatabase.value.id, table.name, {
        paginate: true,
        page: currentPage.value,
        pageSize: currentPageSize.value,
        orderBy: currentOrderBy.value
      })
      columns.value = result.body.tableSchema.map(({ name, type }) => ({
        field: name,
        tagType: type?.toLowerCase?.() ?? String(type || ''),
        header: name,
        sortable: true
      }))

      tableRows.value = result.body.rows
      tableSchema.value = result.body.tableSchema
      tableTotalRecords.value = result.count || 0
    } finally {
      isLoadingQuery.value = false
    }
  }

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
          pageSize: currentPageSize.value,
          orderBy: currentOrderBy.value
        }
      )
      tableRows.value = result.body.rows
      tableTotalRecords.value = result.count || 0
    } finally {
      isLoadingQuery.value = false
    }
  }

  const handleSort = async (event) => {
    if (!selectedTable.value || isColumnView.value) return

    currentOrderBy.value = event.orderBy
    currentPage.value = 1

    isLoadingQuery.value = true
    try {
      const result = await edgeSQLService.getTableInfo(
        currentDatabase.value.id,
        selectedTable.value.name,
        {
          paginate: true,
          page: currentPage.value,
          pageSize: currentPageSize.value,
          orderBy: currentOrderBy.value
        }
      )
      tableRows.value = result.body.rows
      tableTotalRecords.value = result.count || 0
    } finally {
      isLoadingQuery.value = false
    }
  }

  const tableName = computed(() => selectedTable.value?.name)

  const reloadTables = () => {
    emit('load-tables')
  }

  onMounted(() => {
    reloadTables()
  })

  const showTableMenu = (event, table) => {
    selectedTable.value = table
    const menu = tableMenuRef.value
    if (!menu) return
    if (menu.overlayVisible) {
      menu.hide()
    }
    nextTick(() => {
      menu.show(event)
    })
  }

  watch(
    selectedTableNames,
    (list) => {
      if (Array.isArray(list)) {
        isSelectionMode.value = !!list.length
      }
    },
    { deep: true }
  )

  // Bridge functions/refs for TableActionManager
  const activeTabIndex = ref(0)
  const isEditorCollapsed = ref(false)
  const sqlQueryRef = ref('')

  const executeQueryFn = async () => emit('execute-query', sqlQueryRef.value)

  const showDrawerFn = {
    showTableInfo: (tName) => emit('show-table-info', tName),
    showDefinition: (tName) => emit('show-definition', tName)
  }

  const deleteDialogFn = (tName) => {
    selectedTableNames.value = [tName]
    openDeleteDialogComposable({
      title: 'Table',
      message: `Delete 1 selected table(s)?`,
      icon: 'pi pi-exclamation-triangle',
      rejectLabel: 'Cancel',
      acceptLabel: 'Delete',
      acceptClass: 'p-button-danger',
      deleteService: deleteTableService,
      successCallback: () => emit('load-tables')
    })
  }

  const truncateDialogFn = (tName) => {
    selectedTableNames.value = [tName]
    truncateTableVisible.value = true
  }

  const tableActionManager = new TableActionManager(
    executeQueryFn,
    showDrawerFn,
    activeTabIndex,
    isEditorCollapsed,
    sqlQueryRef,
    deleteDialogFn,
    truncateDialogFn
  )

  const tableMenuItems = computed(() => {
    if (!selectedTable.value) return []
    const menuTableName =
      selectedTable.value?.name || selectedTable.value?.label || selectedTable.value?.key
    return tableActionManager.generateMenuItems(menuTableName)
  })

  const openConfirmDelete = () => {
    if (!selectedTableNames.value.length) return
    openDeleteDialogComposable({
      title: `${selectedTableNames.value.length === 1 ? 'Table' : 'Tables'}`,
      message: `Delete ${selectedTableNames.value.length} selected table(s)?`,
      icon: 'pi pi-exclamation-triangle',
      rejectLabel: 'Cancel',
      acceptLabel: 'Delete',
      acceptClass: 'p-button-danger',
      deleteService: deleteTableService
    })
  }
</script>

<style scoped>
  :deep(.p-column-title) {
    display: none !important;
  }

  :deep(.p-datatable-emptymessage > td) {
    height: 600px !important;
    padding: 0 !important;
  }

  .sql-database-list {
    background-color: var(--surface-100, #f3f4f6);
  }

  :deep(.p-datatable-header) {
    padding: 0 !important;
    border-bottom: none !important;
    background-color: var(--surface-100, #f3f4f6);
  }

  :deep(.p-datatable-scrollable-header) {
    background-color: var(--surface-100, #f3f4f6);
    border-top: none !important;
  }

  :deep(.p-datatable-scrollable-header-box) {
    background-color: var(--surface-100, #f3f4f6);
  }

  :deep(.p-datatable-thead) {
    background-color: var(--surface-100, #f3f4f6);
  }

  :deep(.p-datatable-header-cell) {
    background-color: var(--surface-100, #f3f4f6) !important;
  }

  :deep(.p-datatable-wrapper) {
    background-color: var(--surface-100, #f3f4f6);
  }
</style>
