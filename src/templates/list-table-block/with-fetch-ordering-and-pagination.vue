<script setup>
  import { computed, ref, useSlots } from 'vue'
  import DataTable from '@/components/DataTable'
  import DataTableColumnSelector from '@/components/DataTable/DataTableColumnSelector.vue'
  import PrimeButton from 'primevue/button'
  import { useDataTable } from '@/composables/useDataTable'

  defineOptions({ name: 'list-table-block-new' })

  const emit = defineEmits([
    'on-load-data',
    'on-reorder',
    'on-before-go-to-add-page',
    'on-before-go-to-edit',
    'update:selectedItensData',
    'force-update'
  ])

  const props = defineProps({
    hiddenHeader: {
      type: Boolean
    },
    columns: {
      type: Array,
      default: () => [{ field: 'name', header: 'Name' }]
    },
    hiddenByDefault: {
      type: Array,
      default: () => []
    },
    loadDisabled: {
      type: Boolean
    },
    disabledAddButton: {
      type: Boolean
    },
    disabledList: {
      type: Boolean
    },
    isGraphql: {
      type: Boolean
    },
    createPagePath: {
      type: String,
      default: () => '/'
    },
    editPagePath: {
      type: String,
      default: () => '/'
    },
    editInDrawer: {
      type: Function
    },
    addButtonLabel: {
      type: String,
      default: () => ''
    },
    listService: {
      required: true,
      type: Function
    },
    enableEditClick: {
      type: Boolean,
      default: true
    },
    reorderableRows: {
      type: Boolean
    },
    emptyListMessage: {
      type: String,
      default: () => 'No registers found.'
    },
    actions: {
      type: Array,
      default: () => []
    },
    isTabs: {
      type: Boolean,
      default: false
    },
    showSelectionMode: {
      type: Boolean
    },
    selectedItensData: {
      type: Array,
      default: () => []
    },
    csvMapper: {
      type: Function,
      default: (rowData) => {
        return {
          name: rowData.data?.text || rowData.data,
          id: rowData.data,
          lastEditor: rowData.data,
          lastModify: rowData.data,
          active: rowData.data?.content || rowData.data
        }
      }
    },
    exportFileName: {
      type: String
    },
    pt: {
      type: Object,
      default: () => ({})
    },
    apiFields: {
      type: Array,
      default: () => []
    },
    defaultOrderingFieldName: {
      type: String,
      default: () => 'id'
    },
    rowsPerPageOptions: {
      type: Array,
      default: () => [10, 20, 50, 100]
    },
    lazy: {
      type: Boolean,
      default: true
    },
    frozenColumns: {
      type: Array,
      default: () => []
    },
    documentationLink: {
      type: String,
      default: () => ''
    },
    emptyBlock: {
      type: Object,
      default: () => ({})
    },
    hideLastModifiedColumn: {
      type: Boolean,
      default: false
    },
    allowedFilters: {
      type: Array,
      default: () => []
    },
    paginator: {
      type: Boolean,
      default: true
    }
  })
  // Use the composable for all data table functionality
  const {
    // Reactive variables
    isLoading,
    data,
    selectedColumns,
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
    showPopup,
    popupPosition,
    popupData,
    savedSearch,

    // Computed properties
    isRenderActions,
    isRenderOneOption,
    filterBy,
    getRowClass,

    // Functions
    reload,
    editItemSelected,
    actionOptions,
    executeCommand,
    optionsOneAction,
    toggleActionsMenu,
    setMenuRefForRow,
    changeNumberOfLinesPerPage,
    fetchOnSort,
    fetchOnSearch,
    handleSearchValue,
    toggleFilter,
    handleApplyFilter,
    handleRemoveFilter,
    handleMouseEnter,
    handleMouseLeave,
    exportFunctionMapper,
    handleExportTableDataToCSV,
    extractFieldValue,
    onRowReorder
  } = useDataTable(props, emit)

  const slots = useSlots()

  // Additional computed properties specific to this component
  const classActions = computed(() =>
    isRenderActions.value
      ? ''
      : 'background-color: transparent !important; cursor: pointer !important;'
  )
  const dataKey = ref('id')
  const columns = computed(() => props.columns)

  defineExpose({ reload, handleExportTableDataToCSV })

  const filterWithoutLastModified = computed(() => {
    return props.allowedFilters.filter((filter) => filter.field !== 'last_modified')
  })

  const rowClick = (event, col, rowData) => {
    if (!props.frozenColumns.length) {
      return editItemSelected(event, rowData)
    } else if (props.frozenColumns.includes(col.field)) {
      return editItemSelected(event, rowData)
    }
    return null
  }
</script>

<template>
  <div
    class="max-w-full"
    data-testid="data-table-container"
  >
    <DataTable
      :data="data"
      :lazy="lazy"
      :rowHover="!disabledList"
      ref="dataTableRef"
      :dataKey="dataKey"
      data-testid="data-table"
      :loading="isLoading"
      :pt="pt"
      :containerClass="{ 'mt-4': isTabs }"
      v-model:filters="filtersDynamically"
      v-model:sortField="sortFieldValue"
      v-model:sortOrder="sortOrderValue"
      :paginator="paginator"
      :rowsPerPageOptions="rowsPerPageOptions"
      :rows="itemsByPage"
      :globalFilterFields="filterBy"
      :selection="selectedItems"
      :exportFilename="exportFileName"
      :exportFunction="exportFunctionMapper"
      :totalRecords="totalRecords"
      :first="firstItemIndex"
      :rowClass="getRowClass"
      :emptyListMessage="emptyListMessage"
      :columns="selectedColumns"
      @rowReorder="onRowReorder"
      @page="changeNumberOfLinesPerPage"
      @sort="fetchOnSort"
      :showLastModifiedColumn="!hideLastModifiedColumn"
      :emptyBlock="emptyBlock"
      :hasEmptyBlockSlot="!!slots.emptyBlock"
      :appliedFilters="appliedFilters"
      :searchValue="savedSearch"
    >
      <template
        #header
        v-if="!hiddenHeader"
      >
        <slot name="header">
          <div class="flex flex-col gap-2 w-full">
            <DataTable.Header :showDivider="!!appliedFilters.length">
              <template #first-line>
                <div class="flex justify-between gap-2 w-full">
                  <div class="flex gap-2 w-[400px]">
                    <PrimeButton
                      v-if="allowedFilters.length"
                      outlined
                      icon="pi pi-filter"
                      size="small"
                      @click="toggleFilter"
                      data-testid="data-table-actions-column-header-toggle-filter"
                    />

                    <DataTable.Search
                      v-model="filters.global.value"
                      @search="fetchOnSearch"
                      @input="handleSearchValue"
                    >
                      <slot name="select-buttons" />
                    </DataTable.Search>
                  </div>
                  <div class="flex gap-2">
                    <PrimeButton
                      outlined
                      icon="pi pi-refresh"
                      size="small"
                      @click="reload({ page: 1, skipCache: true })"
                      v-tooltip.top="{ value: 'Reload', showDelay: 200 }"
                      data-testid="data-table-actions-column-header-refresh"
                    />
                    <DataTable.Export @export="handleExportTableDataToCSV(exportFileName)" />
                    <DataTableColumnSelector
                      :columns="columns"
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
                />
              </template>
            </DataTable.Header>
          </div>
        </slot>
      </template>

      <DataTable.Column
        v-if="reorderableRows"
        rowReorder
        headerStyle="width: 3rem"
        data-testid="data-table-reorder-column"
      />

      <DataTable.Column
        v-if="showSelectionMode"
        selectionMode="multiple"
        headerStyle="width: 3rem"
      />
      <template
        v-for="col of selectedColumns"
        :key="col.field"
      >
        <DataTable.Column
          :sortable="!col.disableSort"
          :field="col.field"
          :header="col.header"
          :sortField="col?.sortField"
          data-testid="data-table-column"
          :style="col.style"
          :class="col.class"
          :frozen="frozenColumns.includes(col.field)"
          :alignFrozen="'left'"
          :headerStyle="frozenColumns.includes(col.field) ? 'width: 300px' : ''"
        >
          <template #body="{ data: rowData }">
            <div
              class="flex items-center gap-2"
              :class="{
                'cursor-pointer hover:underline': frozenColumns.includes(col.field),
                'cursor-pointer': !frozenColumns.length && enableEditClick
              }"
              @click="(event) => rowClick(event, col, rowData)"
            >
              <template v-if="col.type !== 'component'">
                <div
                  :data-testid="`list-table-block__column__${col.field}__row`"
                  class="overflow-hidden whitespace-nowrap text-ellipsis"
                  :class="col.dynamicClass ? col.dynamicClass(rowData[col.field]) : ''"
                >
                  {{ rowData[col.field] }}
                </div>
              </template>
              <template v-else>
                <component
                  :is="
                    col.component(extractFieldValue(rowData, col.field), rowData, {
                      handleMouseEnter,
                      handleMouseLeave
                    })
                  "
                  :data-testid="`list-table-block__column__${col.field}__row`"
                  class="overflow-hidden whitespace-nowrap text-ellipsis"
                />
              </template>
            </div>
          </template>
        </DataTable.Column>
      </template>

      <DataTable.Column
        :frozen="true"
        :alignFrozen="'right'"
        :bodyStyle="classActions"
        data-testid="data-table-actions-column"
        :reorderableColumn="false"
        style="width: 200px"
      >
        <template
          #body="{ data: rowData }"
          v-if="isRenderActions"
        >
          <div class="flex items-center gap-2 justify-end">
            <DataTable.RowActions
              :rowData="rowData"
              :actions="actionOptions(rowData)"
              :singleAction="isRenderOneOption ? optionsOneAction(rowData) : null"
              :onActionExecute="executeCommand"
              :onMenuToggle="toggleActionsMenu"
              :menuRefSetter="setMenuRefForRow"
            />
          </div>
        </template>
      </DataTable.Column>
      <template #emptyBlock>
        <slot name="emptyBlock" />
      </template>
      <template #emptyBlockButton>
        <slot name="emptyBlockButton" />
      </template>
    </DataTable>

    <!-- Last Modified Popup -->
    <DataTable.LastModifiedPopup
      :visible="showPopup"
      :last-editor="popupData.lastEditor"
      :last-modified="popupData.lastModified"
      :position="popupPosition"
    />

    <!-- Filter Panel -->
    <DataTable.Filter
      v-if="allowedFilters.length"
      ref="filterPanel"
      :filters="filterWithoutLastModified"
      @apply="handleApplyFilter"
    />
  </div>
</template>
