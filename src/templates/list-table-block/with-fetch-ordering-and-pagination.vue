<script setup>
  import { computed, ref, useSlots } from 'vue'
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
    cellQuickActionsItens: {
      type: Array,
      default: () => []
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
    selectedItems,

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
    toggleColumnSelector,
    changeNumberOfLinesPerPage,
    fetchOnSort,
    sortByLastModified,
    fetchOnSearch,
    handleSearchValue,
    exportFunctionMapper,
    handleExportTableDataToCSV,
    extractFieldValue,
    onRowReorder
  } = useDataTable(props, emit)

  const slots = useSlots()

  // Last Modified Popup state
  const showPopup = ref(false)
  const popupPosition = ref({ posX: 0, posY: 0 })
  const popupData = ref({ lastEditor: '', lastModified: '' })
  const hoverTimeout = ref(null)

  // Additional computed properties specific to this component
  const havePagination = ref(true)
  const classActions = computed(() =>
    isRenderActions.value
      ? ''
      : 'background-color: transparent !important; cursor: pointer !important;'
  )
  const dataKey = ref('id')
  const columns = computed(() => props.columns)

  // Last Modified Popup functions
  const handleMouseEnter = (event, rowData) => {
    clearTimeout(hoverTimeout.value)

    hoverTimeout.value = setTimeout(() => {
      const rect = event.target.getBoundingClientRect()
      popupPosition.value = {
        posX: rect.right,
        posY: rect.top - 30
      }

      popupData.value = {
        lastEditor: rowData.lastEditor,
        lastModified: rowData.lastModified || rowData.lastModify
      }

      showPopup.value = true
    }, 1000)
  }

  const handleMouseLeave = () => {
    clearTimeout(hoverTimeout.value)
    showPopup.value = false
  }

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
      :showLastModifiedColumn="!hideLastModifiedColumn"
      :emptyBlock="emptyBlock"
      :hasEmptyBlockSlot="!!slots.emptyBlock"
    >
      <template
        #header
        v-if="!hiddenHeader"
      >
        <slot name="header">
          <div class="flex flex-col gap-2 w-full">
            <DataTable.Header>
              <template #first-line>
                <div class="flex flex-wrap justify-between gap-2 w-full">
                  <!-- We dont have this fun yet, but we will add -in the future -->
                  <!-- So comment the component for now, in the future change the justify to justify-between  -->
                  <!-- <PrimeButton
                    outlined
                    icon="pi pi-filter"
                    label="Filter"
                    size="small"
                    @click="toggleFilter"
                    data-testid="data-table-actions-column-header-toggle-filter"
                  /> -->
                  <DataTable.Search
                    v-model="filters.global.value"
                    @search="fetchOnSearch"
                    @input="handleSearchValue"
                  >
                    <slot name="select-buttons" />
                  </DataTable.Search>
                  <div class="flex gap-2">
                    <PrimeButton
                      outlined
                      icon="pi pi-refresh"
                      size="small"
                      @click="reload"
                      data-testid="data-table-actions-column-header-refresh"
                    />
                    <DataTable.Export @export="handleExportTableDataToCSV($event)" />
                    <PrimeButton
                      outlined
                      icon="ai ai-column"
                      size="small"
                      @click="toggleColumnSelector"
                      v-tooltip.top="{ value: 'Available Columns', showDelay: 200 }"
                      data-testid="data-table-actions-column-header-toggle-columns"
                    />
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
                </div>
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
          :frozen="frozenColumns.includes(col.field)"
          :alignFrozen="'left'"
          :headerStyle="frozenColumns.includes(col.field) ? 'width: 240px' : ''"
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
        style="width: 200px"
      >
        <template #header>
          <div
            v-if="!hideLastModifiedColumn"
            class="flex items-center gap-2 justify-start w-full"
            data-testid="data-table-actions-column-header"
          >
            Last Modified
            <span
              @click="sortByLastModified"
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
            </span>
          </div>
        </template>
        <template
          #body="{ data: rowData }"
          v-if="isRenderActions"
        >
          <div class="flex items-center gap-2 justify-end">
            <div
              v-if="!hideLastModifiedColumn"
              :data-testid="`list-table-block__column__lastModify__row`"
              class="cursor-pointer flex items-center max-w-[234px] overflow-hidden"
              @mouseenter="(event) => handleMouseEnter(event, rowData)"
              @mouseleave="handleMouseLeave"
            >
              <div class="text-ellipsis whitespace-nowrap overflow-hidden block">
                <span>{{ rowData.lastModify || rowData.lastModified }}</span>
                <span
                  v-if="rowData.lastEditor && rowData.lastEditor !== '-'"
                  class="text-xs"
                >
                  by {{ rowData.lastEditor }}</span
                >
              </div>
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
  </div>
</template>

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
