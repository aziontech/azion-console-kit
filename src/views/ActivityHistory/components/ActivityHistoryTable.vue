<script setup>
  import { ref, computed, onMounted } from 'vue'
  import { useToast } from 'primevue/usetoast'
  import PrimeButton from 'primevue/button'

  import DataTable from '@/components/DataTable'
  import DataTimeRange from '@/components/base/dataTimeRange'
  import OperationTag from './OperationTag.vue'
  import { createRelativeRange } from '@utils/date.js'

  const props = defineProps({
    listService: {
      type: Function,
      required: true
    },
    getTotalRecordsService: {
      type: Function,
      required: true
    },
    documentationService: {
      type: Function,
      required: true
    }
  })

  const emit = defineEmits(['on-load-data'])

  const toast = useToast()
  const filterRef = ref(null)
  const isLoading = ref(false)
  const data = ref([])
  const totalRecords = ref(0)
  const searchValue = ref('')
  const dateRange = ref(null)
  const appliedFilters = ref([])
  const first = ref(0)
  const rows = ref(10)

  const allColumns = ref([
    { field: 'date', header: 'Date', visible: true },
    { field: 'operation', header: 'Operation', visible: true },
    { field: 'title', header: 'Title', visible: true },
    // { field: 'resourceName', header: 'Resource Name', visible: true },
    // { field: 'resourceItem', header: 'Resource Item', visible: true },
    // { field: 'resourceItemName', header: 'Resource Item Name', visible: true },
    { field: 'authorName', header: 'Author Name', visible: true },
    { field: 'authorEmail', header: 'Author Email', visible: true }
    // { field: 'authorIp', header: 'Author IP', visible: false }
  ])

  const selectedColumns = ref(allColumns.value.filter((col) => col.visible))

  const visibleColumns = computed(() => {
    return allColumns.value.filter((col) =>
      selectedColumns.value.some((selected) => selected.field === col.field)
    )
  })

  const hasAppliedFilters = computed(() => appliedFilters.value.length > 0)

  const loadData = async () => {
    try {
      isLoading.value = true

      const begin = dateRange.value?.startDate
      const end = dateRange.value?.endDate

      const response = await props.listService({
        limit: rows.value,
        offset: first.value,
        search: searchValue.value,
        begin,
        end
      })

      data.value = response.body || []

      totalRecords.value = await props.getTotalRecordsService({
        search: searchValue.value,
        begin,
        end
      })

      emit('on-load-data', data.value.length > 0 || searchValue.value.length > 0)
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: error.message || 'Error loading data'
      })
      data.value = []
    } finally {
      isLoading.value = false
    }
  }

  const handleSearch = () => {
    first.value = 0
    loadData()
  }

  const handleDateRangeChange = () => {
    first.value = 0
    loadData()
  }

  const handlePage = (event) => {
    first.value = event.first
    rows.value = event.rows
    loadData()
  }

  const toggleFilter = (event) => {
    filterRef.value?.toggle(event)
  }

  const handleApplyFilter = (filter) => {
    const existingIndex = appliedFilters.value.findIndex((item) => item.field === filter.field)
    if (existingIndex >= 0) {
      appliedFilters.value[existingIndex] = filter
    } else {
      appliedFilters.value.push(filter)
    }
    first.value = 0
    loadData()
  }

  const handleRemoveFilter = (field) => {
    appliedFilters.value = appliedFilters.value.filter((item) => item.field !== field)
    first.value = 0
    loadData()
  }

  const getColumnStyle = (field) => {
    const styles = {
      date: { width: '189px' },
      operation: { width: '94px' },
      resource: { width: '152px' },
      resourceName: { minWidth: '260px' },
      resourceItem: { width: '152px' },
      resourceItemName: { minWidth: '260px' },
      authorEmail: { width: '333px' },
      authorIp: { width: '120px' }
    }
    return styles[field] || {}
  }

  onMounted(() => {
    const now = new Date()
    const { startDate, endDate } = createRelativeRange(30, 'days', 'last', now)
    dateRange.value = {
      startDate,
      endDate,
      label: 'Last 30 days',
      labelStart: 'Last 30 days',
      labelEnd: 'Last 30 days',
      relative: {
        direction: 'last',
        value: 30,
        unit: 'days'
      }
    }
    loadData()
  })
</script>

<template>
  <DataTable
    :data="data"
    :loading="isLoading"
    :totalRecords="totalRecords"
    :first="first"
    :rows="rows"
    :columns="visibleColumns"
    :paginator="true"
    :lazy="true"
    :appliedFilters="appliedFilters"
    :searchValue="searchValue"
    dataKey="id"
    @page="handlePage"
    :empty-block="{
      title: 'No activity has been recorded',
      description: 'No activities found.',
      documentationService: props.documentationService
    }"
  >
    <template #header>
      <DataTable.Header :showDivider="hasAppliedFilters">
        <template #first-line>
          <DataTable.AppliedFilters
            :appliedFilters="appliedFilters"
            @remove="handleRemoveFilter"
          />
        </template>
        <template #second-line>
          <div class="flex items-center justify-between w-full gap-3">
            <div class="flex w-full items-center gap-2 flex-1">
              <PrimeButton
                outlined
                icon="pi pi-filter"
                class="h-8"
                @click="toggleFilter"
                v-tooltip.top="{ value: 'Filter', showDelay: 200 }"
              />
              <DataTable.Search
                v-model="searchValue"
                placeholder="Search by date, operation or resource..."
                class="flex-1 w-full"
                @search="handleSearch"
              />
            </div>
            <DataTable.Actions>
              <DataTimeRange
                v-model="dateRange"
                @select="handleDateRangeChange"
              />
              <DataTable.ColumnSelector
                :columns="allColumns"
                v-model:selectedColumns="selectedColumns"
              />
            </DataTable.Actions>
          </div>
        </template>
      </DataTable.Header>
    </template>

    <DataTable.Column
      v-for="col in visibleColumns"
      :key="col.field"
      :field="col.field"
      :header="col.header"
      :sortable="col.field === 'date'"
      :style="getColumnStyle(col.field)"
    >
      <template #body="{ data: rowData }">
        <template v-if="col.field === 'operation'">
          <OperationTag :operation="rowData.operation" />
        </template>
        <template v-else-if="col.field === 'resourceName' || col.field === 'resourceItemName'">
          <span
            v-if="rowData[col.field]"
            class="text-[var(--text-color-link)] cursor-pointer hover:underline"
          >
            {{ rowData[col.field] }}
          </span>
          <span
            v-else
            class="text-color-secondary"
            >-</span
          >
        </template>
        <template v-else>
          {{ rowData[col.field] || '-' }}
        </template>
      </template>
    </DataTable.Column>

    <DataTable.Filter
      ref="filterRef"
      :filters="visibleColumns"
      @apply="handleApplyFilter"
    />
    <template #emptyBlockButton>
      <slot name="emptyBlockButton" />
    </template>
  </DataTable>
</template>
