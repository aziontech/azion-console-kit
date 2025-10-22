<template>
  <div
    class="max-w-full"
    :class="{ 'mt-4': isTabs }"
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
      :paginator="havePagination"
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
      :cellQuickActionsItens="cellQuickActionsItens"
      :columns="columns"
      @rowReorder="onRowReorder"
      @page="changeNumberOfLinesPerPage"
      @sort="fetchOnSort"
      :emptyBlock="emptyBlock"
    >
      <template
        #header
        v-if="!hiddenHeader"
      >
        <slot
          name="header"
          :exportTableCSV="handleExportTableDataToCSV"
        >
          <DataTable.Header>
            <DataTable.Search
              v-model="filters.global.value"
              @search="fetchOnSearch"
              @input="handleSearchValue"
            >
              <slot name="select-buttons" />
            </DataTable.Search>

            <DataTable.Actions>
              <DataTable.Export
                v-if="hasExportToCsvMapper"
                @click="handleExportTableDataToCSV"
              />

              <slot
                name="addButton"
                data-testid="data-table-add-button"
                :reload="reload"
                :data="data"
              >
                <DataTable.AddButton
                  v-if="addButtonLabel"
                  :disabled="disabledAddButton"
                  @click="navigateToAddPage"
                  :label="addButtonLabel"
                  :data-testid="`create_${addButtonLabel}_button`"
                />
              </slot>
            </DataTable.Actions>
          </DataTable.Header>
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
          :frozen="frozenColumns.includes(col.field)"
          :alignFrozen="'left'"
          :headerStyle="frozenColumns.includes(col.field) ? 'width: 10px' : ''"
        >
          <template #body="{ data: rowData }">
            <div
              class="flex items-center gap-2 text-[12px]"
              :class="{
                'cursor-pointer hover:underline': frozenColumns.includes(col.field),
                'cursor-pointer': !frozenColumns.length
              }"
              @click="(event) => rowClick(event, col, rowData)"
            >
              <template v-if="col.type !== 'component'">
                <div
                  v-html="rowData[col.field]"
                  :data-testid="`list-table-block__column__${col.field}__row`"
                  class="overflow-hidden whitespace-nowrap text-ellipsis"
                />
              </template>
              <template v-else>
                <component
                  :is="col.component(extractFieldValue(rowData, col.field), rowData)"
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
      >
        <template #header>
          <div
            class="flex items-center gap-2 justify-end w-full"
            data-testid="data-table-actions-column-header"
          >
            <span
              @click="sortByLastModified"
              v-if="showLastModified"
              class="cursor-pointer select-none flex items-center gap-2 group"
              data-testid="last-modified-header-sort"
            >
              <i
                v-if="sortFieldValue === 'lastModified'"
                :class="{
                  'pi pi-sort-amount-up-alt': sortOrderValue === 1,
                  'pi pi-sort-amount-down': sortOrderValue === -1
                }"
              />
              <i
                v-else
                class="pi pi-sort-alt opacity-0 group-hover:opacity-100 transition-opacity"
              />
              Last Modified
            </span>
            <PrimeButton
              outlined
              icon="ai ai-column"
              class="table-button"
              size="small"
              @click="toggleColumnSelector"
              v-tooltip.top="{ value: 'Available Columns', showDelay: 200 }"
              data-testid="data-table-actions-column-header-toggle-columns"
            >
            </PrimeButton>
            <OverlayPanel
              ref="columnSelectorPanel"
              :pt="{
                content: { class: 'p-0' }
              }"
              data-testid="data-table-actions-column-header-toggle-columns-panel"
            >
              <Listbox
                v-model="selectedColumns"
                multiple
                :options="[{ label: 'Available Columns', items: columns }]"
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
          </div>
        </template>
        <template
          #body="{ data: rowData }"
          v-if="isRenderActions"
        >
          <div class="flex items-center gap-2 justify-end">
            <div
              v-if="showLastModified"
              :data-testid="`list-table-block__column__lastModify__row`"
              class="cursor-pointer"
              @click.stop="toggleLastModifiedDisplay"
            >
              <div
                v-if="!lastModifiedToggled"
                v-html="rowData.lastModify || rowData.lastModified"
                v-tooltip.top="{ value: rowData.lastModified, showDelay: 300 }"
              />
              <div
                v-else
                v-html="rowData.lastModified"
                v-tooltip.top="{
                  value: rowData.lastModify || rowData.lastModified,
                  showDelay: 300
                }"
              />
            </div>
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
      <template #emptyBlockButton>
        <slot name="emptyBlockButton" />
      </template>
    </DataTable>
  </div>
</template>
<script setup>
  import { computed, ref } from 'vue'
  import DataTable from '@/components/DataTable'
  import PrimeButton from 'primevue/button'
  import OverlayPanel from 'primevue/overlaypanel'
  import Listbox from 'primevue/listbox'
  import { useDataTable } from '@/composables/useDataTable'

  defineOptions({ name: 'list-table-block-new' })

  const emit = defineEmits([
    'on-load-data',
    'on-reorder',
    'on-before-go-to-add-page',
    'on-before-go-to-edit',
    'update:selectedItensData'
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
    onReorderService: {
      type: Function
    },
    isReorderAllEnabled: {
      type: Boolean,
      default: false
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
      type: Function
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
    showLastModified: {
      type: Boolean,
      default: false
    },
    cellQuickActionsItens: {
      type: Array,
      default: () => []
    },
    frozenColumns: {
      type: Array,
      default: () => []
    },
    emptyBlock: {
      type: Object,
      default: () => ({})
    }
  })

  // Use the composable for all data table functionality
  const {
    // Reactive variables
    isLoading,
    data,
    selectedColumns,
    dataTableRef,
    columnSelectorPanel,
    filters,
    filtersDynamically,
    totalRecords,
    firstItemIndex,
    itemsByPage,
    sortFieldValue,
    sortOrderValue,
    lastModifiedToggled,
    selectedItems,

    // Computed properties
    isRenderActions,
    isRenderOneOption,
    hasExportToCsvMapper,
    filterBy,
    getRowClass,

    // Functions
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
    fetchOnSort,
    sortByLastModified,
    fetchOnSearch,
    handleSearchValue,
    toggleLastModifiedDisplay,
    exportFunctionMapper,
    handleExportTableDataToCSV,
    extractFieldValue,
    onRowReorder
  } = useDataTable(props, emit)

  // Additional computed properties specific to this component
  const havePagination = ref(true)
  const classActions = computed(() =>
    isRenderActions.value
      ? ''
      : 'background-color: transparent !important; cursor: pointer !important;'
  )
  const dataKey = ref('id')
  const columns = computed(() => props.columns)

  defineExpose({ reload, handleExportTableDataToCSV })

  const rowClick = (event, col, rowData) => {
    if (!props.frozenColumns.length) {
      return editItemSelected(event, rowData)
    } else if (props.frozenColumns.includes(col.field)) {
      return editItemSelected(event, rowData)
    }
    return null
  }
</script>
<style scoped lang="scss">
  .table-with-orange-borders :deep(.p-datatable-tbody > tr > td) {
    transition: color 0.2s ease;
  }

  .table-with-orange-borders.outline-visible
    :deep(.p-datatable-tbody > tr > td:hover:not(.p-frozen-column)),
  .table-with-orange-borders.outline-visible :deep(.p-datatable-tbody > tr > td.cell-active-hover) {
    outline: 2px dashed #f97316 !important;
    outline-offset: -2px;
    transition-delay: 0.3s;
    border-radius: 0 6px 6px 6px;
  }
</style>
