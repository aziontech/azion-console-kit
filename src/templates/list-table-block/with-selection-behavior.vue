<template>
  <div
    class="max-w-full"
    :class="{ 'mt-4': isTabs }"
    data-testid="data-table-container"
  >
    <DataTable
      ref="dataTableRef"
      :data="data"
      :columns="columns"
      :loading="isLoading"
      :paginator="true"
      :rowsPerPageOptions="[10, 20, 50, 100]"
      :rows="minimumOfItemsPerPage"
      v-model:selection="selectedItems"
      @page="changeNumberOfLinesPerPage"
      :globalFilterFields="filterBy"
      :pt="parsedDatatablePt"
      :emptyListMessage="emptyListMessage"
      dataKey="id"
      data-testid="data-table"
    >
      <template
        #header
        v-if="!props.hiddenHeader"
      >
        <slot
          name="header"
          :exportTableCSV="handleExportTableDataToCSV"
        >
          <DataTable.Header>
            <template #first-line>
              <div class="flex flex-wrap justify-between gap-2 w-full">
                <DataTable.Search
                  v-model="filters.global.value"
                  placeholder="Search"
                  data-testid="data-table-search-input"
                />

                <DataTable.Actions>
                  <slot
                    name="addButton"
                    data-testid="data-table-add-button"
                  >
                    <DataTable.AddButton
                      v-if="addButtonLabel"
                      :label="addButtonLabel"
                      :disabled="disabledList"
                      @click="navigateToAddPage"
                      :data-testid="`create_${addButtonLabel}_button`"
                    />
                  </slot>
                </DataTable.Actions>
              </div>
            </template>
          </DataTable.Header>
        </slot>
      </template>
      <DataTable.Column
        :class="{ '!hover:cursor-pointer': !disabledList }"
        selectionMode="multiple"
        :pt="{
          rowCheckbox: { 'data-testid': 'data-table-row-checkbox' }
        }"
        headerStyle="width: 3rem"
      />
      <DataTable.Column
        :sortable="!col.disableSort"
        v-for="col of selectedColumns"
        :key="col.field"
        :field="col.field"
        :header="col.header"
        :sortField="col?.sortField"
        headerClass="p-highlight"
        :class="['hover:cursor-pointer', !disabledList ? 'hover:cursor-pointer' : '', col.class]"
        data-testid="data-table-column"
      >
        <template #body="{ data: rowData }">
          <template v-if="col.type !== 'component'">
            <div
              @click="!disableEditOnClick && editItemSelected($event, rowData)"
              :data-testid="`list-table-block__column__${col.field}__row`"
              :class="col.dynamicClass ? col.dynamicClass(rowData[col.field]) : ''"
            >
              {{ rowData[col.field] }}
            </div>
          </template>
          <template v-else>
            <component
              @click="!disableEditOnClick && editItemSelected($event, rowData)"
              :is="col.component(extractFieldValue(rowData, col.field))"
              :data-testid="`list-table-block__column__${col.field}__row`"
            />
          </template>
        </template>
      </DataTable.Column>
      <DataTable.Column
        :frozen="true"
        :alignFrozen="'right'"
        headerStyle="width: 13rem"
        :bodyStyle="classActions"
        data-testid="data-table-actions-column"
      >
        <template #header>
          <DataTable.ColumnSelector
            :columns="columns"
            v-model:selectedColumns="selectedColumns"
          />
        </template>
        <template
          #body="{ data: rowData }"
          v-if="isRenderActions"
        >
          <DataTable.RowActions
            :rowData="rowData"
            :actions="actionOptions"
            :singleAction="isRenderOneOption ? optionsOneAction : null"
            :onActionExecute="executeCommand"
            :onMenuToggle="toggleActionsMenu"
            :menuRefSetter="setMenuRefForRow"
          />
        </template>
      </DataTable.Column>
      <template #empty>
        <slot
          name="noRecordsFound"
          data-testid="data-table-empty-content"
        >
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
    </DataTable>
  </div>
</template>
<script setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import DataTable from '@/components/DataTable'
  import { useDataTable } from '@/composables/useDataTable'
  import { useTableDefinitionsStore } from '@/stores/table-definitions'

  defineOptions({ name: 'list-table-block-new' })

  const emit = defineEmits([
    'on-load-data',
    'on-before-go-to-add-page',
    'on-before-go-to-edit',
    'update:selectedItensData'
  ])

  const props = defineProps({
    disabledList: {
      type: Boolean
    },
    disableEditOnClick: {
      type: Boolean,
      default: false
    },
    hiddenHeader: {
      type: Boolean
    },
    columns: {
      type: Array,
      default: () => [{ field: 'name', header: 'Name' }]
    },
    lazyLoad: {
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
    listService: {
      required: true,
      type: Function
    },
    addButtonLabel: {
      type: String,
      default: () => ''
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
    selectedItensData: {
      type: Array,
      default: () => []
    },
    exportFileName: {
      type: String
    },
    csvMapper: {
      type: Function
    },
    pt: {
      type: Object,
      default: () => ({})
    }
  })

  const tableDefinitions = useTableDefinitionsStore()

  const minimumOfItemsPerPage = ref(tableDefinitions.getNumberOfLinesPerPage)
  const isRenderActions = !!props.actions?.length
  const isRenderOneOption = props.actions?.length === 1
  const classActions = isRenderActions
    ? ''
    : 'background-color: transparent !important; cursor: pointer !important;'

  const {
    data,
    isLoading,
    filters,
    selectedColumns,
    actionOptions,
    toggleActionsMenu,
    setMenuRefForRow,
    executeCommand,
    optionsOneAction,
    navigateToAddPage,
    editItemSelected,
    handleExportTableDataToCSV,
    reload
  } = useDataTable(props, emit)

  const dataTableRef = ref(null)

  const selectedItems = computed({
    get: () => {
      return props.selectedItensData
    },
    set: (value) => {
      emit('update:selectedItensData', value)
    }
  })

  const parsedDatatablePt = computed(() => ({
    ...props.pt,
    rowCheckbox: { 'data-testid': 'data-table-row-checkbox' }
  }))

  onMounted(() => {
    if (!props.lazyLoad) {
      reload({ page: 1 })
    }
    selectedColumns.value = props.columns
  })

  defineExpose({ reload, data, handleExportTableDataToCSV })

  const extractFieldValue = (rowData, field) => {
    return rowData[field]
  }

  const changeNumberOfLinesPerPage = (event) => {
    const numberOfLinesPerPage = event.rows
    tableDefinitions.setNumberOfLinesPerPage(numberOfLinesPerPage)
    minimumOfItemsPerPage.value = numberOfLinesPerPage
  }

  const filterBy = computed(() => {
    const filtersPath = props.columns.filter((el) => el.filterPath).map((el) => el.filterPath)
    const columnFilters = props.columns.map((item) => item.field)

    return [...columnFilters, ...filtersPath]
  })

  watch(data, (currentState) => {
    const hasData = currentState?.length > 0
    emit('on-load-data', !!hasData)
  })
</script>

<style scoped lang="scss">
  /* Paginator styling */
  :deep(.p-paginator) {
    height: 48px;
    padding: 8px 12px;
    font-size: 12px;
    line-height: 21px;
  }

  :deep(.p-paginator .p-paginator-current) {
    margin: 0;
  }

  /* Paginator buttons styling */
  :deep(.p-paginator .p-paginator-first),
  :deep(.p-paginator .p-paginator-prev),
  :deep(.p-paginator .p-paginator-next),
  :deep(.p-paginator .p-paginator-last),
  :deep(.p-paginator .p-paginator-page) {
    width: 24px;
    height: 24px;
    font-size: 14px;
    line-height: 21px;
    margin: 0;
  }

  :deep(.p-paginator .p-dropdown) {
    width: 61px;
    height: 32px;
    font-size: 12px;
    line-height: 21px;
    .p-dropdown-label {
      width: fit-content;
    }
    .p-dropdown-trigger {
      width: 16px;
      padding-right: 6px;
    }
  }
  :deep(.p-paginator-page-input .p-inputtext) {
    width: fit-content;
    height: 32px;
    font-size: 12px;
    line-height: 21px;
    text-align: center;
  }
</style>
