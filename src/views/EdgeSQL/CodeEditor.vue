<template>
  <div
    class="flex flex-col sm:flex-row mt-4 gap-8 w-full sm:h-[calc(100vh-9.375rem)] overflow-hidden"
  >
    <div class="flex flex-col sm:!w-64 sm:h-full max-h-72 sm:max-h-full">
      <QueryHistoryList
        v-model:searchTerm="searchTerm"
        :isLoading="isLoading"
        :history="filteredHistory"
        :selectedQueryId="selectedQueryId"
        @select="selectQuery"
        @open-menu="openHistoryMenu"
      />
    </div>
    <div class="flex-1 min-h-0 h-full min-w-0 overflow-hidden">
      <Menu
        ref="historyMenu"
        :model="historyMenuItems"
        popup
        appendTo="body"
        :pt="{ root: { 'data-history-menu': true } }"
      />
      <ResizableSplitter
        class="w-full h-full"
        :panelSizes="panelSizes"
        :minSize="[20, 5]"
        :maxSize="[80, 95]"
        :initialTopPanelPercent="50"
        @update:panelSizes="onUpdatePanelSizes"
        @resizeend="onResizeEnd"
      >
        <template #panel-a>
          <div class="flex flex-col h-full min-h-0 min-w-0 overflow-hidden">
            <div
              class="flex flex-col sm:flex-row gap-4 sm:gap-0 justify-between border-x border-t surface-border rounded-t-md p-3"
            >
              <Button
                :label="labelRunQuery"
                icon="pi pi-play"
                size="small"
                severity="primary"
                :loading="isExecutingQuery || isLoadingQuery"
                @click="runQuery"
                v-tooltip="{
                  value: 'Run Query (⌘ ↵)',
                  pt: {
                    arrow: { class: 'bg-primary text-white' }
                  }
                }"
              />

              <div class="flex gap-2">
                <Button
                  label="Prettify"
                  icon="pi pi-align-left"
                  size="small"
                  outlined
                  severity="secondary"
                  @click="prettifyCode"
                />
                <Button
                  label="Templates"
                  icon="pi pi-bolt"
                  size="small"
                  severity="secondary"
                  outlined
                  @click="showTemplatesModal = true"
                />
              </div>
            </div>
            <div class="flex-1 min-h-0 min-w-0 border-1 surface-border">
              <vue-monaco-editor
                :key="`editor-${panelSizes[0]}`"
                v-model:value="sqlQueryText"
                language="sql"
                :theme="monacoTheme"
                :options="{ ...editorMonacoOptions, readOnly: isExecutingQuery }"
                class="w-full h-full"
              />
            </div>
          </div>
        </template>

        <template #panel-b>
          <div
            class="flex flex-col h-full min-h-0 min-w-0"
            :class="{ 'overflow-hidden': resultsView !== 'json' }"
          >
            <!-- Inlined SqlDatabaseList for results -->
            <div
              class="sql-database-list w-full flex flex-col"
              :class="{ 'overflow-auto': resultsView !== 'json' }"
            >
              <DataTable
                ref="dataTableRef"
                class="flex-1 min-h-0"
                :data="displayDataForView"
                :columns="resultColumns"
                :loading="isLoadingQuery"
                :empty-block="resultsEmptyBlock"
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
                showGridlines
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
                          <div class="text-color text-lg font-medium">Results</div>

                          <SplitButton
                            icon="pi pi-plus"
                            size="small"
                            severity="secondary"
                            label="Insert"
                            @click="insertRow"
                            :disabled="
                              disabledActionsJsonView ||
                              isExecutingQuery ||
                              isLoadingQuery ||
                              shouldNotEditRow
                            "
                            :model="splitButtonItems"
                          />
                        </div>
                        <div
                          class="flex flex-col sm:flex-row sm:items-center gap-2 justify-between"
                        >
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
                              v-model="selectedResultsView"
                              :options="resultsViewOptions"
                              optionLabel="value"
                              dataKey="value"
                              aria-labelledby="custom"
                              @change="onResultsViewChange"
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
                              @click="reloadData"
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
                                    items: resultColumns.filter((c) => c?.field !== 'actions')
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
                      v-if="
                        selectedResultsView?.value === 'json' && displayDataForView.length === 0
                      "
                      :value="jsonPreview"
                      language="json"
                      :options="viewerMonacoOptions"
                      :theme="monacoTheme"
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
                <template v-if="selectedResultsView?.value !== 'json'">
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
                        <span class="text-color-secondary font-mono text-xs">{{
                          col.tagType
                        }}</span>
                      </span>
                    </template>
                    <template #body="{ data: rowData, field }">
                      <span
                        v-tooltip.top="
                          isTruncatedValue(rowData[field]) ? String(rowData[field]) : null
                        "
                      >
                        {{ formatCellValue(rowData[field]) }}
                      </span>
                    </template>
                    <template #editor="{ data: rowData, field }">
                      <InputText
                        v-if="
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
                          :disabled="isExecutingQuery || isLoadingQuery || shouldNotEditRow"
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
        </template>
      </ResizableSplitter>
    </div>
    <QuickTemplates
      v-if="showTemplatesModal"
      :show-templates-modal="showTemplatesModal"
      @use-template="handleUseTemplate"
      @update:show-templates-modal="(v) => (showTemplatesModal = v)"
    />
  </div>
</template>

<script setup>
  import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
  import { useRoute } from 'vue-router'
  import { FilterMatchMode } from '@aziontech/webkit/api'

  import Button from '@aziontech/webkit/button'
  import PrimeButton from '@aziontech/webkit/button'
  import Menu from '@aziontech/webkit/menu'
  import SplitButton from '@aziontech/webkit/splitbutton'
  import SelectButton from '@aziontech/webkit/selectbutton'
  import OverlayPanel from '@aziontech/webkit/overlaypanel'
  import Listbox from '@aziontech/webkit/listbox'
  import InputText from '@aziontech/webkit/inputtext'
  import Column from '@aziontech/webkit/column'
  import { useThemeStore } from '@/stores/theme'
  import { useTableDefinitionsStore } from '@/stores/table-definitions'

  import { useEdgeSQL } from './composable/useEdgeSQL'
  import { useSqlFormatter } from './composable/useSqlFormatter'
  import { useMonacoEditor } from './composable/useMonacoEditor'
  import { QUICK_TEMPLATES } from './constants/queries'
  import QuickTemplates from './components/QuickTemplates.vue'
  import ResizableSplitter from '@/components/ResizableSplitter.vue'
  import QueryHistoryList from './components/QueryHistoryList.vue'
  import { VueMonacoEditor as vueMonacoEditor } from '@guolao/vue-monaco-editor'
  import { useDeleteDialog } from '@/composables/useDeleteDialog'
  // TODO: migrate import to @aziontech/webkit/list-data-table when published
  import DataTable from '@aziontech/webkit/list-data-table'
  import { useDataTable } from '@/composables/useDataTable'
  import {
    createDeleteService,
    createInsertRowService,
    createUpdateRowService
  } from './utils/row-actions'
  import { edgeSQLService } from '@/services/v2/edge-sql/edge-sql-service'

  defineOptions({ name: 'CodeEditor' })
  const props = defineProps({
    listTables: {
      type: Array,
      default: () => []
    },
    showSnippetsCreateTable: {
      type: Boolean,
      default: false
    }
  })
  const emit = defineEmits([
    'update:show-snippets-create-table',
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

  const showTemplatesModal = ref(false)
  const sqlQueryText = ref('')
  const searchTerm = ref('')
  const isExecutingQuery = ref(false)
  const editorPanelSize = ref(70)
  const panelSizes = ref([editorPanelSize.value, 100 - editorPanelSize.value])
  const selectedQueryId = ref(null)
  const historyMenu = ref(null)
  const currentMenuQuery = ref(null)
  const selectedSqlText = ref('')
  const resultColumns = ref([])
  const activeTableName = ref('')
  const resultRows = ref([])
  const resultSchema = ref([])
  const resultsView = ref('table')
  const isLoadingQuery = ref(false)
  const resultsViewOptions = ref([
    { label: 'Table', value: 'table', icon: 'pi pi-table' },
    { label: 'Json', value: 'json', icon: 'ai ai-json' }
  ])

  const { formatSql } = useSqlFormatter()
  const {
    queryResults,
    isLoading,
    executeQuery,
    updateListHistory,
    removeQueryFromHistory,
    currentDatabase,
    isNonEditableQuery
  } = useEdgeSQL()
  const route = useRoute()

  const themeStore = useThemeStore()
  const tableDefinitions = useTableDefinitionsStore()
  const shouldNotEditRow = ref(false)
  const { openDeleteDialog: openDeleteDialogComposable } = useDeleteDialog()

  const monacoTheme = computed(() => {
    return themeStore.currentTheme === 'light' ? 'vs' : 'vs-dark'
  })
  const {
    monacoOptions: editorMonacoOptions,
    waitForMonaco,
    registerSqlAutocomplete,
    disposeProvider
  } = useMonacoEditor()

  const filteredHistory = computed(() => {
    const term = searchTerm.value.trim().toLowerCase()
    if (!term) return queryResults.value
    return queryResults.value.filter((queryItem) => {
      const label = queryItem.label?.toString().toLowerCase() || ''
      const original = queryItem.originalQuery?.toString().toLowerCase() || ''
      return label.includes(term) || original.includes(term)
    })
  })

  // --- Inlined SqlDatabaseList state for results panel ---
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
  const editableData = ref([])

  const selectedResultsView = ref({
    label: 'Table',
    value: 'table',
    icon: 'pi pi-table'
  })

  const sqlFilters = ref({
    global: { value: '', matchMode: FilterMatchMode.CONTAINS }
  })

  const sqlSelectedColumns = ref([])

  const resultsEmptyBlock = {
    title: 'Ready to execute',
    description: 'Execute a query to see the results here'
  }

  // --- useDataTable for export helpers ---
  const sqlTableProps = { columns: resultColumns, loadDisabled: true }
  const {
    handleExportTableDataToCSV: sqlExportCSV,
    exportTableAsJSON: sqlExportJSON,
    exportTableAsXLSX: sqlExportXLSX,
    fetchOnSearch: fetchOnSqlSearch,
    handleSearchValue: handleSqlSearchValue,
    filterBy: sqlFilterBy
  } = useDataTable(sqlTableProps, emit)

  const dataFiltered = computed(() => {
    return Array.isArray(resultRows.value) ? resultRows.value : []
  })

  // --- Watchers ---
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
        const availableColumns = (resultColumns.value || []).filter(
          (column) => column?.field !== 'actions'
        )
        if (availableColumns.length) {
          sqlSelectedColumns.value = [availableColumns[0]]
        }
      }
    },
    { deep: true }
  )

  watch(
    () => selectedResultsView.value?.value,
    (newValue, oldValue) => {
      if (!oldValue || newValue === oldValue) return
      resetSqlFilterState()
    }
  )

  watch(
    () => resultColumns.value,
    (newCols) => {
      sqlSelectedColumns.value = Array.isArray(newCols) ? [...newCols] : []
    },
    { deep: true }
  )

  watch(
    () => dataFiltered.value,
    (val) => {
      editableData.value = Array.isArray(val) ? val.map((row) => ({ ...row })) : []
    },
    { immediate: true, deep: true }
  )

  // --- Computed ---
  const sqlAllowedFilters = computed(() =>
    (resultColumns.value || [])
      .filter((col) => col?.field && col.field !== 'actions')
      .map((col) => ({ ...col, sortField: col?.sortField ?? col?.field }))
  )

  const displayDataForView = computed(() =>
    selectedResultsView.value?.value === 'json' ? [] : editableData.value
  )
  const notShowEmptyBlockComputed = computed(() => {
    return Boolean(selectedResultsView.value?.value === 'json')
  })
  const disabledActionsJsonView = computed(() => selectedResultsView.value?.value === 'json')

  const jsonPreview = computed(() => {
    try {
      return JSON.stringify(editableData.value ?? [], null, 2)
    } catch {
      return '[]'
    }
  })

  const viewerMonacoOptions = {
    readOnly: true,
    automaticLayout: true,
    wordWrap: 'on',
    minimap: { enabled: false }
  }

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
    sqlExportCSV('Query Results', editableData.value, sqlSelectedColumns.value)
  const exportAsJSON = () =>
    sqlExportJSON('Query Results', editableData.value, sqlSelectedColumns.value)
  const exportAsXLSX = () =>
    sqlExportXLSX('Query Results', editableData.value, sqlSelectedColumns.value)

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
          title: 'Data',
          deleteService: deleteService,
          closeCallback: (opt) => {
            if (opt?.data?.updated) reloadData()
          }
        })
      }
    })
    return base
  })

  // --- Insert row ---
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

    const idColumn = (resultColumns.value || []).find((col) => col?.field === 'id')
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
    const fields = (resultColumns.value || [])
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

  const splitButtonItems = computed(() => [
    {
      icon: 'pi pi-minus',
      label: 'Insert Data',
      command: () => insertRow()
    }
  ])

  // --- View change / sort / page ---
  const onResultsViewChange = ({ value }) => {
    if (!value) return
    resultsView.value = value.value || value
  }

  const onSort = () => {
    editableData.value = editableData.value.filter((row) => row?._isNew !== true)
    editingRows.value = []
    backups.value.clear()
  }

  const onPage = (event) => {
    sqlMinItemsPerPage.value = event.rows
    tableDefinitions.setNumberOfLinesPerPage(event.rows)
    sqlFirstItemIndex.value = event.first
  }

  // --- Original CodeEditor logic ---
  const deleteService = createDeleteService(
    (stmts) => executeQuery(stmts),
    () => activeTableName.value,
    () => resultSchema.value,
    () => reloadData()
  )

  const insertRowService = createInsertRowService(
    (databaseId, payload) => edgeSQLService.insertRow(databaseId, payload),
    () => currentDatabase.value.id,
    () => activeTableName.value,
    () => resultSchema.value,
    () => reloadData()
  )

  const updateRowService = createUpdateRowService(
    (databaseId, payload) => edgeSQLService.updatedRow(databaseId, payload),
    () => currentDatabase.value.id,
    () => activeTableName.value,
    () => resultSchema.value,
    () => reloadData()
  )

  const labelRunQuery = computed(() => {
    return selectedSqlText.value ? 'Run Selected' : 'Run Query'
  })

  const historyMenuItems = computed(() => [
    {
      label: 'Run query',
      icon: 'pi pi-play',
      command: runHistoryQuery
    },
    {
      label: 'Delete query',
      icon: 'pi pi-trash',
      command: deleteHistoryQuery
    }
  ])

  const selectQuery = (query) => {
    selectedQueryId.value = query.id
    sqlQueryText.value = query.originalQuery
  }

  const handleActionRowTable = async (action) => {
    if (!action) return
    const { newData, oldData } = action
    if (newData?._isNew) {
      await insertRowService(newData)
    } else {
      await updateRowService(newData, oldData)
    }
  }

  const isRunShortcut = (event) => event.key === 'Enter' && (event.metaKey || event.ctrlKey)

  const handleGlobalKeydown = (event) => {
    if (isRunShortcut(event)) {
      event.preventDefault()
      runQuery()
    }
  }

  const handleSelectionChange = () => {
    let sel = ''
    if (typeof window.getSelection != 'undefined') {
      sel = window.getSelection().toString()
    } else if (typeof document.selection != 'undefined' && document.selection.type == 'Text') {
      sel = document.selection.createRange().text
    }
    selectedSqlText.value = sel
  }

  const openHistoryMenu = (event, query) => {
    currentMenuQuery.value = query
    historyMenu.value?.hide()
    historyMenu.value?.show(event)
    nextTick(() => {
      const target = event?.currentTarget
      const overlay = document.querySelector('[data-history-menu="true"]')
      if (!target || !overlay) return

      const rect = target.getBoundingClientRect()
      const overlayRect = overlay.getBoundingClientRect()
      const offset = 8
      let top = window.scrollY + rect.top
      let left = window.scrollX + rect.right + offset
      let origin = 'top left'

      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      if (left + overlayRect.width > window.scrollX + viewportWidth) {
        left = window.scrollX + rect.left - overlayRect.width - offset
        origin = 'top right'
      }

      if (top + overlayRect.height > window.scrollY + viewportHeight) {
        top = window.scrollY + rect.bottom - overlayRect.height
      }

      overlay.style.top = `${Math.max(top, 0)}px`
      overlay.style.left = `${Math.max(left, 0)}px`
      overlay.style.transformOrigin = origin
    })
  }

  const onResizeEnd = (event) => {
    if (Array.isArray(event?.sizes) && event.sizes.length > 0) {
      editorPanelSize.value = event.sizes[0]
      panelSizes.value = [...event.sizes]
    }
  }

  const onUpdatePanelSizes = (sizes) => {
    if (Array.isArray(sizes) && sizes.length === 2) {
      panelSizes.value = [...sizes]
    }
  }

  watch(
    () => editorPanelSize.value,
    (val) => {
      const nextSize = Number(val)
      if (Number.isFinite(nextSize)) {
        panelSizes.value = [nextSize, 100 - nextSize]
      }
    }
  )

  watch(
    () => panelSizes.value,
    async () => {
      await nextTick()
      window.dispatchEvent(new Event('resize'))
    },
    { deep: true }
  )

  const runQuery = async (addToHistory = true) => {
    isLoadingQuery.value = true
    const contentToRun = selectedSqlText.value?.trim() ? selectedSqlText.value : sqlQueryText.value
    if (!contentToRun || isExecutingQuery.value) return

    isExecutingQuery.value = true
    try {
      shouldNotEditRow.value = addToHistory ? isNonEditableQuery(contentToRun) : false
      const { results, tableNameExecuted } = await executeQuery(contentToRun, { addToHistory })
      resultRows.value = Array.isArray(results?.[0]?.rows) ? results[0].rows : []
      const schemaRows = results[results.length - 1]?.rows
      if (schemaRows) {
        resultColumns.value = schemaRows.map((column) => ({
          field: column.name,
          tagType: column.type?.toLowerCase?.() ?? String(column.type || ''),
          header: column.name,
          sortable: true
        }))
      }

      resultSchema.value = schemaRows
      activeTableName.value = tableNameExecuted
      updateListHistory()
    } finally {
      isExecutingQuery.value = false
      isLoadingQuery.value = false
    }
  }

  const reloadData = async () => {
    const query = `SELECT * FROM "${activeTableName.value}"; PRAGMA table_info("${activeTableName.value}");`
    selectedSqlText.value = query
    await runQuery(false)
    selectedSqlText.value = ''
  }

  const runHistoryQuery = async () => {
    const query = currentMenuQuery.value
    if (!query || isExecutingQuery.value) return
    isExecutingQuery.value = true
    try {
      sqlQueryText.value = query.originalQuery
      await executeQuery(query.originalQuery)
      updateListHistory()
    } finally {
      isExecutingQuery.value = false
      historyMenu.value?.hide()
    }
  }

  const deleteHistoryQuery = () => {
    const query = currentMenuQuery.value
    if (!query) return
    removeQueryFromHistory(query.id)
    updateListHistory()
    historyMenu.value?.hide()
  }

  const handleUseTemplate = (template) => {
    sqlQueryText.value = template.query
    showTemplatesModal.value = false
  }

  onMounted(async () => {
    updateListHistory()
    window.addEventListener('keydown', handleGlobalKeydown)
    window.addEventListener('selectionchange', handleSelectionChange)
    await waitForMonaco()
    registerSqlAutocomplete(tablesTreeForAutocomplete.value)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleGlobalKeydown)
    window.removeEventListener('selectionchange', handleSelectionChange)
    disposeProvider()
  })

  const prettifyCode = () => {
    const content = sqlQueryText.value || ''
    if (!content.trim()) return
    sqlQueryText.value = formatSql(content)
  }

  watch(
    () => route.params.id,
    () => {
      updateListHistory()
    }
  )

  const tablesTreeForAutocomplete = computed(() => {
    const list = Array.isArray(props.listTables) ? props.listTables : []
    return list.map((table) => ({ key: table?.name || table?.key || String(table) }))
  })

  watch(
    () => tablesTreeForAutocomplete.value,
    (newVal) => {
      registerSqlAutocomplete(newVal)
    },
    { deep: true }
  )

  watch(
    () => props.showSnippetsCreateTable,
    async (newVal) => {
      if (newVal) {
        sqlQueryText.value = QUICK_TEMPLATES[0].query
        await nextTick()
        emit('update:show-snippets-create-table', false)
      }
    }
  )

  defineExpose({
    setSql: (query) => (sqlQueryText.value = query),
    run: runQuery
  })
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
