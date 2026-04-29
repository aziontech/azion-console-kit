<script setup>
  import { computed, useSlots } from 'vue'
  import DataTable from '@aziontech/webkit/list-data-table'
  const DataTableColumnSelector = DataTable.ColumnSelector
  import PrimeButton from '@aziontech/webkit/button'
  import { useDataTable } from '@/composables/useDataTable'

  defineOptions({ name: 'list-table' })

  const slots = useSlots()

  const emit = defineEmits([
    'on-load-data',
    'on-reorder',
    'on-before-go-to-add-page',
    'on-before-go-to-edit',
    'update:selectedItensData',
    'force-update',
    'click-to-create'
  ])

  const props = defineProps({
    listService: {
      required: true,
      type: Function
    },
    columns: {
      type: Array,
      default: () => [{ field: 'name', header: 'Name' }]
    },
    editPagePath: {
      type: String,
      default: '/'
    },
    createPagePath: {
      type: String,
      default: '/'
    },
    editInDrawer: {
      type: Function
    },
    enableEditClick: {
      type: Boolean,
      default: true
    },
    actions: {
      type: Array,
      default: () => []
    },
    lazy: {
      type: Boolean,
      default: true
    },
    isGraphql: {
      type: Boolean,
      default: false
    },
    apiFields: {
      type: Array,
      default: () => []
    },
    defaultOrderingFieldName: {
      type: String,
      default: 'id'
    },
    emptyListMessage: {
      type: String,
      default: 'No registers found.'
    },
    emptyBlock: {
      type: Object,
      default: () => ({})
    },
    frozenColumns: {
      type: Array,
      default: () => []
    },
    frozenSize: {
      type: String,
      default: '13rem'
    },
    hiddenByDefault: {
      type: Array,
      default: () => []
    },
    hideLastModifiedColumn: {
      type: Boolean,
      default: false
    },
    showSelectionMode: {
      type: Boolean,
      default: false
    },
    selectedItensData: {
      type: Array,
      default: () => []
    },
    reorderableRows: {
      type: Boolean,
      default: false
    },
    paginator: {
      type: Boolean,
      default: true
    },
    rowsPerPageOptions: {
      type: Array,
      default: () => [10, 20, 50, 100]
    },
    exportFileName: {
      type: String
    },
    csvMapper: {
      type: Function
    },
    allowedFilters: {
      type: Array,
      default: () => []
    },
    hiddenHeader: {
      type: Boolean,
      default: false
    },
    pt: {
      type: Object,
      default: () => ({})
    },
    isTabs: {
      type: Boolean,
      default: false
    },
    loadDisabled: {
      type: Boolean,
      default: false
    },
    disabledAddButton: {
      type: Boolean,
      default: false
    },
    disabledList: {
      type: Boolean,
      default: false
    },
    showColumnSelector: {
      type: Boolean,
      default: true
    },
    documentationLink: {
      type: String,
      default: ''
    },
    /**
     * When set, renders a single inline action button per row instead of the ellipsis menu.
     * Accepts an object: { icon: 'pi pi-trash', label: 'Delete', command: fn(rowData), disabled: boolean|fn(rowData) }
     * Or a function: (rowData) => ({ icon, label, command, disabled })
     */
    inlineAction: {
      type: [Boolean, Object, Function],
      default: null
    }
  })

  const {
    isLoading,
    data,
    selectedColumns,
    dataTableRef,
    filters,
    filtersDynamically,
    appliedFilters,
    filterPanel,
    totalRecords,
    firstItemIndex,
    itemsByPage,
    sortFieldValue,
    sortOrderValue,
    selectedItems,
    savedSearch,
    isRenderActions,
    hasExportToCsvMapper,
    filterBy,
    getRowClass,
    loadData,
    reload,
    editItemSelected,
    actionOptions,
    executeCommand,
    toggleActionsMenu,
    setMenuRefForRow,
    changeNumberOfLinesPerPage,
    fetchOnSort,
    fetchOnSearch,
    handleSearchValue,
    toggleFilter,
    handleApplyFilter,
    handleRemoveFilter,
    exportFunctionMapper,
    handleExportTableDataToCSV,
    extractFieldValue,
    onRowReorder
  } = useDataTable(props, emit)

  // Computed
  const hasEmptyBlock = computed(() => {
    return !!slots.emptyBlock || !!(props.emptyBlock?.title || props.emptyBlock?.createPagePath)
  })

  const hasAllowedFilters = computed(() => props.allowedFilters?.length > 0)

  const filterWithoutLastModified = computed(() => {
    return props.allowedFilters.filter((filter) => filter.field !== 'last_modified')
  })

  const columnsWithoutLastModified = computed(() => {
    if (props.hideLastModifiedColumn) {
      return props.columns.filter((col) => col.field !== 'lastModified')
    }
    return props.columns
  })

  const classActions = computed(() =>
    isRenderActions.value
      ? ''
      : 'background-color: transparent !important; cursor: pointer !important;'
  )

  // Methods
  function isFrozenColumn(field) {
    return props.frozenColumns?.includes(field)
  }

  function handleRowClick(event) {
    if (props.disabledList) return
    if (!props.enableEditClick) return

    const rowData = event.data
    const originalEvent = event.originalEvent

    // Don't navigate when clicking inside a component column (e.g., CopyBlock, Tag, etc.)
    const clickedCell = originalEvent.target.closest('td')
    if (clickedCell) {
      const columnIndex = Array.from(clickedCell.parentElement.children).indexOf(clickedCell)
      const adjustedIndex =
        columnIndex - (props.reorderableRows ? 1 : 0) - (props.showSelectionMode ? 1 : 0)
      const col = selectedColumns.value[adjustedIndex]
      if (col?.type === 'component') return null
    }

    if (!props.frozenColumns.length) {
      return editItemSelected(originalEvent, rowData)
    }
    return null
  }

  function handleColumnClick(event, col, rowData) {
    if (isFrozenColumn(col.field)) {
      return editItemSelected(event, rowData)
    }
    if (col?.type === 'component') return null
    if (!props.frozenColumns.length && props.enableEditClick) {
      return editItemSelected(event, rowData)
    }
    return null
  }

  function resolvedInlineAction(rowData) {
    if (!props.inlineAction) return null

    // inlineAction: true → use first action from actionOptions (includes delete dialog)
    if (props.inlineAction === true) {
      const actions = actionOptions(rowData)
      if (!actions.length) return null
      const first = actions[0]
      return {
        icon: first.icon || 'pi pi-ellipsis-v',
        label: first.label || first.tooltip,
        disabled: first.disabled,
        command: () => first.command?.()
      }
    }

    // inlineAction: function → resolve per row
    if (typeof props.inlineAction === 'function') {
      return props.inlineAction(rowData)
    }

    // inlineAction: object → use as-is
    return props.inlineAction
  }

  function handleEditFilter({ filter, event }) {
    filterPanel.value?.openForFilter?.(filter, event)
  }

  defineExpose({
    reload,
    loadData,
    dataTableRef,
    handleExportTableDataToCSV,
    data
  })
</script>

<template>
  <div
    class="w-full max-w-full"
    :class="[isTabs ? 'mt-4' : '', { 'disabled-list': disabledList }]"
    data-testid="data-table-container"
  >
    <DataTable
      ref="dataTableRef"
      :data="data"
      :lazy="lazy"
      :loading="isLoading"
      :paginator="paginator"
      :rows="itemsByPage"
      :totalRecords="totalRecords"
      :first="firstItemIndex"
      :columns="selectedColumns"
      v-model:filters="filtersDynamically"
      v-model:sortField="sortFieldValue"
      v-model:sortOrder="sortOrderValue"
      :rowsPerPageOptions="rowsPerPageOptions"
      :reorderableRows="reorderableRows"
      :emptyListMessage="emptyListMessage"
      :emptyBlock="emptyBlock"
      :hasEmptyBlockSlot="!!slots.emptyBlock"
      :notShowEmptyBlock="!hasEmptyBlock"
      :rowClass="getRowClass"
      :rowHover="!disabledList"
      :appliedFilters="appliedFilters"
      :searchValue="savedSearch"
      :pt="pt"
      :selection="selectedItems"
      :globalFilterFields="filterBy"
      :exportFilename="exportFileName"
      :exportFunction="exportFunctionMapper"
      :showLastModifiedColumn="!hideLastModifiedColumn"
      dataKey="id"
      data-testid="data-table"
      @update:selection="(val) => emit('update:selectedItensData', val)"
      @page="changeNumberOfLinesPerPage"
      @sort="fetchOnSort"
      @rowReorder="onRowReorder"
      @rowClick="handleRowClick"
      @click-to-create="emit('click-to-create')"
    >
      <!-- HEADER -->
      <template
        #header
        v-if="!hiddenHeader"
      >
        <slot name="header">
          <DataTable.Header :showDivider="!!appliedFilters.length">
            <template #first-line>
              <div
                class="flex flex-wrap justify-between gap-2 w-full"
                data-testid="data-table-header"
              >
                <span
                  class="flex flex-row items-center gap-2 max-sm:w-full"
                  data-testid="data-table-search"
                >
                  <PrimeButton
                    v-if="hasAllowedFilters"
                    outlined
                    icon="pi pi-filter"
                    size="small"
                    @click="toggleFilter"
                    data-testid="data-table-actions-column-header-toggle-filter"
                  />
                  <DataTable.Search
                    class="w-full md:min-w-[20rem]"
                    v-model="filters.global.value"
                    @search="fetchOnSearch"
                    @input="handleSearchValue"
                  >
                    <slot name="select-buttons" />
                  </DataTable.Search>
                </span>
                <div class="flex gap-2 max-sm:w-full">
                  <slot name="header-actions" />
                  <PrimeButton
                    outlined
                    icon="pi pi-refresh"
                    size="small"
                    @click="reload({ page: 1, skipCache: true })"
                    v-tooltip.top="{ value: 'Reload', showDelay: 200 }"
                    data-testid="data-table-actions-column-header-refresh"
                  />
                  <DataTable.Export
                    v-if="hasExportToCsvMapper || exportFileName"
                    @export="handleExportTableDataToCSV(exportFileName)"
                  />
                  <DataTableColumnSelector
                    v-if="showColumnSelector"
                    :columns="columnsWithoutLastModified"
                    v-model:selectedColumns="selectedColumns"
                  />
                </div>
              </div>
            </template>
            <template
              #second-line
              v-if="appliedFilters.length"
            >
              <DataTable.AppliedFilters
                :applied-filters="appliedFilters"
                @remove="handleRemoveFilter"
                @edit="handleEditFilter"
              />
            </template>
          </DataTable.Header>
        </slot>
      </template>

      <!-- REORDER COLUMN -->
      <DataTable.Column
        v-if="reorderableRows"
        rowReorder
        headerStyle="width: 3rem"
        data-testid="data-table-reorder-column"
      />

      <!-- SELECTION COLUMN -->
      <DataTable.Column
        v-if="showSelectionMode"
        selectionMode="multiple"
        headerStyle="width: 3rem"
      />

      <!-- DATA COLUMNS -->
      <DataTable.Column
        v-for="col of selectedColumns"
        :key="col.field"
        :sortable="!col.disableSort"
        :field="col.field"
        :header="col.header"
        :sortField="col?.sortField"
        :class="{
          'hover:cursor-pointer': !disabledList && (enableEditClick || isFrozenColumn(col.field))
        }"
        data-testid="data-table-column"
        :style="col.style"
        :frozen="isFrozenColumn(col.field)"
        :alignFrozen="'left'"
        :headerStyle="
          col.headerStyle !== undefined
            ? col.headerStyle
            : isFrozenColumn(col.field)
              ? 'width: 300px'
              : ''
        "
      >
        <template #body="{ data: rowData }">
          <slot
            :name="`column-${col.field}`"
            :data="rowData"
            :value="extractFieldValue(rowData, col.field)"
          >
            <template v-if="col.type !== 'component'">
              <div
                :data-testid="`list-table-block__column__${col.field}__row`"
                :class="{
                  'cursor-pointer hover:underline': isFrozenColumn(col.field)
                }"
                @click="(event) => handleColumnClick(event, col, rowData)"
              >
                {{ rowData[col.field] }}
              </div>
            </template>
            <template v-else>
              <component
                :is="col.component(extractFieldValue(rowData, col.field))"
                :data-testid="`list-table-block__column__${col.field}__row`"
                :class="{
                  'cursor-pointer hover:underline': isFrozenColumn(col.field)
                }"
                @click="(event) => handleColumnClick(event, col, rowData)"
              />
            </template>
          </slot>
        </template>
      </DataTable.Column>

      <!-- ACTIONS COLUMN -->
      <DataTable.Column
        :frozen="true"
        :alignFrozen="'right'"
        :headerStyle="`width: ${frozenSize}`"
        :bodyStyle="classActions"
        data-testid="data-table-actions-column"
        :reorderableColumn="false"
      >
        <template
          #body="{ data: rowData }"
          v-if="isRenderActions"
        >
          <div class="flex items-center gap-2 justify-end">
            <DataTable.RowActions
              :rowData="rowData"
              :actions="actionOptions(rowData)"
              :inlineAction="resolvedInlineAction(rowData)"
              :onActionExecute="executeCommand"
              :onMenuToggle="toggleActionsMenu"
              :menuRefSetter="setMenuRefForRow"
            />
          </div>
        </template>
      </DataTable.Column>

      <!-- EMPTY INLINE MESSAGE (always show table, like old template) -->
      <template #empty>
        <slot name="noRecordsFound">
          <div class="my-4 flex flex-col gap-3 justify-center items-start">
            <p
              class="text-md font-normal text-secondary"
              data-testid="list-table-block__empty-message__text"
            >
              {{ emptyListMessage }}
            </p>
          </div>
        </slot>
      </template>

      <!-- EMPTY BLOCK SLOTS -->
      <template #illustration>
        <slot name="illustration" />
      </template>
      <template #emptyBlock>
        <slot name="emptyBlock" />
      </template>
      <template #emptyBlockButton>
        <slot name="emptyBlockButton" />
      </template>
    </DataTable>

    <!-- FILTER PANEL -->
    <DataTable.Filter
      v-if="hasAllowedFilters"
      ref="filterPanel"
      :filters="filterWithoutLastModified"
      @apply="handleApplyFilter"
    />
  </div>
</template>

<style scoped>
  /* Disabled list: frozen columns should not highlight on hover */
  .disabled-list :deep(.p-datatable-tbody > tr:hover .p-frozen-column) {
    background: var(--table-body-row-even-bg) !important;
  }
</style>
