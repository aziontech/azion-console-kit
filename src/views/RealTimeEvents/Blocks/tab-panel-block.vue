<script setup>
  import { computed, onBeforeMount, onMounted, ref } from 'vue'
  // TODO: migrate import to @aziontech/webkit/list-data-table when published
  import DataTable from '@aziontech/webkit/list-data-table'
  import AdvancedFilterSystem from '@/components/base/advanced-filter-system/index.vue'
  import { useRouteFilterManager } from '@/helpers'
  import * as Drawer from '@/views/RealTimeEvents/Drawer'
  import { eventsPlaygroundOpener } from '@/helpers'
  import PrimeButton from '@aziontech/webkit/button'
  import PrimeTag from '@aziontech/webkit/tag'
  import { useToast } from '@aziontech/webkit/use-toast'
  import { useTableDefinitionsStore } from '@/stores/table-definitions'
  import { FilterMatchMode } from '@aziontech/webkit/api'
  import { getCsvCellContentFromRowData } from '@/helpers'

  defineOptions({ name: 'TabPanelBlock' })

  const toast = useToast()
  const tableDefinitions = useTableDefinitionsStore()

  const props = defineProps({
    loadService: {
      type: Function,
      required: true
    },
    getTotalRecords: {
      type: Function,
      required: true
    },
    listService: {
      type: Function
    },
    tabSelected: {
      type: Object
    },
    filterFields: {
      type: Array,
      default: () => []
    }
  })

  const { getFiltersFromHash, setFilterInHash } = useRouteFilterManager()
  const dataTableRef = ref(null)
  const drawerRef = ref(null)
  const filterData = ref(null)
  const recordsFound = ref(0)

  // Table state (migrated from index.vue)
  const data = ref([])
  const isLoading = ref(false)
  const selectedColumns = ref([])
  const minimumOfItemsPerPage = ref(tableDefinitions.getNumberOfLinesPerPage)
  const firstItemIndex = ref(0)
  const filters = ref({
    global: { value: '', matchMode: FilterMatchMode.CONTAINS }
  })

  const filterBy = computed(() => {
    const columns = props.tabSelected?.columns || []
    const filtersPath = columns.filter((el) => el.filterPath).map((el) => el.filterPath)
    const columnFilters = columns.map((item) => item.field)
    return [...columnFilters, ...filtersPath]
  })

  const hasExportToCsvMapper = computed(() => !!props.tabSelected?.customColumnMapper)

  const formatSummaryToCSV = (summary) => {
    const summaryValue = summary
      .map((item) => `${item.key}: ${item.value.toString().replace(/"/g, '""')}`)
      .join(' | ')
    return `"${summaryValue}"`
  }

  const exportFunctionMapper = (rowData) => {
    if (!hasExportToCsvMapper.value) return
    const columnMapper = props.tabSelected.customColumnMapper(rowData)
    if (rowData.field === 'summary') {
      const values = [...columnMapper.summary]
      columnMapper.summary = formatSummaryToCSV(values)
    }
    return getCsvCellContentFromRowData({ columnMapper, rowData })
  }

  const handleExportTableDataToCSV = () => {
    dataTableRef.value?.exportCSV?.()
  }

  const changeNumberOfLinesPerPage = (event) => {
    const numberOfLinesPerPage = event.rows
    tableDefinitions.setNumberOfLinesPerPage(numberOfLinesPerPage)
    minimumOfItemsPerPage.value = numberOfLinesPerPage
    firstItemIndex.value = event.first
  }

  const defaultFilter = {
    tsRange: {
      tsRangeBegin: new Date(new Date().setMinutes(new Date().getMinutes() - 5)),
      tsRangeEnd: new Date(),
      label: 'Last 5 minutes'
    },
    fields: [],
    dataset: ''
  }

  const drawerComponent = computed(() => {
    return Drawer[props.tabSelected.panel]
  })

  const isTabSelected = computed(() => {
    return !!props.tabSelected?.tabRouter
  })

  const openDetailDrawer = (row) => {
    drawerRef.value.openDetailDrawer({
      ...filterData.value,
      ...row
    })
  }

  const editItemSelected = ({ data: item }) => {
    openDetailDrawer(item)
  }

  const loadData = async () => {
    try {
      isLoading.value = true
      const response = await listProvider()
      data.value = response
    } catch (error) {
      if (error && typeof error.showErrors === 'function') {
        error.showErrors(toast)
      } else {
        const errorMessage = error?.message || error
        toast.add({
          closable: true,
          severity: 'error',
          summary: 'Error',
          detail: errorMessage
        })
      }
    } finally {
      isLoading.value = false
    }
  }

  const reload = () => {
    loadData()
  }

  const reloadListTableWithHash = async () => {
    await setFilterInHash({
      ...filterData.value,
      dataset: props.tabSelected.dataset
    })
    reload()
  }

  const refreshFilterData = () => {
    const filter = getFiltersFromHash()
    filterData.value = defaultFilter
    if (filter) {
      filterData.value = filter
      filterData.value.fields = filter.dataset === props.tabSelected.dataset ? filter.fields : []
    }
  }

  const listProvider = async () => {
    try {
      const [response, total] = await Promise.all([
        props.listService({ ...filterData.value }),
        props.getTotalRecords({
          filter: { ...filterData.value },
          dataset: props.tabSelected.dataset
        })
      ])

      recordsFound.value = total
      return response.data
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: 'Error',
        detail: error
      })
      recordsFound.value = 0
      return []
    }
  }

  onBeforeMount(() => {
    refreshFilterData()
  })

  const totalRecordsFound = computed(() => {
    return `${recordsFound.value} records found`
  })

  onMounted(() => {
    selectedColumns.value = props.tabSelected?.columns || []
    reload()
  })
</script>

<template>
  <data v-if="isTabSelected">
    <component
      :is="drawerComponent"
      ref="drawerRef"
      :loadService="loadService"
    />
    <div class="flex flex-col gap-8 my-4">
      <div class="flex gap-1">
        <p class="text-xs text-color font-medium leading-4">Specification</p>
        <p class="text-xs text-color-secondary font-normal leading-4">
          {{ props.tabSelected.description }}
        </p>
      </div>
    </div>
    <div class="border-1 p-4 surface-border rounded-md mb-2">
      <AdvancedFilterSystem
        v-model:filterData="filterData"
        :fieldsInFilter="props.filterFields"
        :filterDateRangeMaxDays="365"
        @updatedFilter="reloadListTableWithHash"
      />
    </div>
    <div class="flex flex-col gap-2">
      <div class="flex gap-2 justify-end">
        <PrimeTag
          :value="totalRecordsFound"
          severity="info"
        />
        <PrimeButton
          outlined
          icon="ai ai-graphql"
          class="min-w-max"
          @click="eventsPlaygroundOpener"
          v-tooltip.left="{ value: 'View on GraphQL', showDelay: 200 }"
          data-testid="data-table-actions-column-header-toggle-columns"
        />
      </div>
      <div
        class="max-w-full"
        data-testid="data-table-container"
      >
        <DataTable
          ref="dataTableRef"
          class="overflow-clip rounded-md"
          scrollable
          removableSort
          :data="data"
          :columns="selectedColumns"
          dataKey="id"
          @rowClick="editItemSelected"
          :rowHover="true"
          v-model:filters="filters"
          :paginator="true"
          :rowsPerPageOptions="[10, 20, 50, 100]"
          :rows="minimumOfItemsPerPage"
          @page="changeNumberOfLinesPerPage"
          :globalFilterFields="filterBy"
          :exportFilename="`${props.tabSelected.tabRouter}-logs`"
          :exportFunction="exportFunctionMapper"
          :loading="isLoading"
          :notShowEmptyBlock="true"
          scrollHeight="auto"
          :pt="{ bodyRow: { 'data-testid': 'table-body-row' } }"
          data-testid="table-tab-panel-block"
          :first="firstItemIndex"
        >
          <DataTable.Column
            :sortable="!col.disableSort"
            v-for="col of selectedColumns"
            :key="col.field"
            :field="col.field"
            :header="col.header"
            :sortField="col?.sortField"
            :class="{ 'hover:cursor-pointer': true }"
            data-testid="data-table-column"
          >
            <template #body="{ data: rowData }">
              <template v-if="col.type !== 'component'">
                <div :data-testid="`list-table-block__column__${col.field}__row`">
                  {{ rowData[col.field] }}
                </div>
              </template>
              <template v-else>
                <component
                  :is="col.component(rowData[col.field])"
                  :data-testid="`list-table-block__column__${col.field}__row`"
                />
              </template>
            </template>
          </DataTable.Column>
          <DataTable.Column
            :frozen="true"
            :alignFrozen="'right'"
            headerStyle="width: 3rem"
            data-testid="data-table-actions-column"
          >
            <template #header>
              <div
                class="flex justify-end w-full gap-2"
                data-testid="data-table-actions-column-header"
              >
                <PrimeButton
                  v-if="hasExportToCsvMapper"
                  outlined
                  icon="pi pi-download"
                  class="min-w-max"
                  @click="handleExportTableDataToCSV"
                  v-tooltip.left="{ value: 'Export to CSV', showDelay: 200 }"
                  data-testid="data-table-actions-column-header-toggle-columns"
                />
              </div>
            </template>
          </DataTable.Column>
          <template #empty>
            <div class="my-4 flex flex-col gap-3 justify-center items-start">
              <p
                class="text-md font-normal text-secondary"
                data-testid="list-table-block__empty-message__text"
              >
                No logs have been found for this period.
              </p>
            </div>
          </template>
        </DataTable>
      </div>
    </div>
  </data>
</template>
