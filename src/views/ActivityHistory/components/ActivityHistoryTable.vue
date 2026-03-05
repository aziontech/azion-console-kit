<script setup>
  import { ref, computed, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { useToast } from 'primevue/usetoast'
  import PrimeButton from 'primevue/button'

  import DataTable from '@/components/DataTable'
  import DataTimeRange from '@/components/base/dataTimeRange'
  import OperationTag from './OperationTag.vue'
  import { createStartOfDay } from '@utils/date.js'
  import { resolveActivityHistoryRoute } from '@/services/v2/activity-history/activity-history-routing'
  import { listTimezonesService } from '@/services/users-services'

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

  const router = useRouter()
  const toast = useToast()
  const filterRef = ref(null)
  const isLoading = ref(false)
  const data = ref([])
  const totalRecords = ref(0)
  const searchValue = ref('')
  const now = new Date()
  const startDate = createStartOfDay(now)
  const endDate = now
  const dateRange = ref({
    startDate,
    endDate,
    label: 'Today',
    labelStart: 'Today',
    labelEnd: 'Today',
    relative: {
      direction: 'last',
      value: 0,
      unit: 'days'
    }
  })
  const appliedFilters = ref([])
  const first = ref(0)
  const rows = ref(100)
  const sortField = ref('date')
  const sortOrder = ref(-1)

  const SORT_FIELD_MAP = {
    date: 'ts',
    operation: 'type',
    resourceType: 'resourceType',
    resourceName: 'resourceName',
    resourceId: 'resourceId',
    authorEmail: 'authorEmail',
    authorIp: 'userIp',
    authorName: 'authorName',
    accountId: 'accountId',
    userAgent: 'userAgent',
    remotePort: 'remotePort',
    comment: 'comment',
    uuid: 'uuid'
  }

  const ordering = computed(() => {
    if (!sortField.value) return null
    const apiField = SORT_FIELD_MAP[sortField.value] || null
    if (!apiField) return null
    return sortOrder.value === -1 ? `-${apiField}` : apiField
  })

  const allColumns = ref([
    { field: 'date', header: 'Date', visible: true, sortable: true },
    { field: 'operation', header: 'Operation', visible: true, sortable: true },
    { field: 'resourceType', header: 'Resource Type', visible: true },
    { field: 'resourceName', header: 'Resource Name', visible: true },
    { field: 'parentResourceType', header: 'Parent Resource Type', visible: true, sortable: true },
    { field: 'parentResourceName', header: 'Parent Resource Name', visible: true, sortable: true },
    { field: 'authorEmail', header: 'Author Email', visible: true, sortable: true },
    { field: 'authorIp', header: 'Author IP', visible: false },
    { field: 'authorName', header: 'Author Name', visible: false },
    { field: 'accountId', header: 'Account ID', visible: false },
    { field: 'userAgent', header: 'User Agent', visible: false },
    { field: 'requestData', header: 'Request Data', visible: false },
    { field: 'remotePort', header: 'Remote Port', visible: false },
    { field: 'comment', header: 'Comment', visible: false },
    { field: 'uuid', header: 'UUID', visible: false },
    { field: 'resourceId', header: 'Resource ID', visible: false }
  ])

  const selectedColumns = ref(allColumns.value.filter((col) => col.visible))

  const visibleColumns = computed(() => {
    return allColumns.value.filter((col) =>
      selectedColumns.value.some((selected) => selected.field === col.field)
    )
  })

  const filterableColumns = computed(() => {
    return visibleColumns.value.filter((col) => col.field !== 'date')
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
        end,
        filter: appliedFilters.value,
        ordering: ordering.value
      })

      data.value = response.body || []

      totalRecords.value = await props.getTotalRecordsService({
        search: searchValue.value,
        begin,
        end,
        filter: appliedFilters.value
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

  const handleSort = (event) => {
    sortField.value = event.sortField
    sortOrder.value = event.sortOrder
    first.value = 0
    loadData()
  }

  const toggleFilter = (event) => {
    filterRef.value?.toggle(event)
  }

  const handleEditFilter = ({ filter, event }) => {
    filterRef.value?.openForFilter?.(filter, event)
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

  const handleRowClick = async (payload) => {
    const rowData = payload?.data || payload
    const location = resolveActivityHistoryRoute(rowData)
    if (!location) {
      toast.add({
        closable: true,
        severity: 'warn',
        summary: 'No route available for this activity'
      })
      return
    }

    try {
      await router.push(location)
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: error?.message || 'Navigation error'
      })
    }
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
    :sortField="sortField"
    :sortOrder="sortOrder"
    :appliedFilters="appliedFilters"
    :searchValue="searchValue"
    :notShowEmptyBlock="true"
    emptyListMessage="Has no data"
    dataKey="id"
    @page="handlePage"
    @sort="handleSort"
    :empty-block="{
      title: 'No activity has been recorded',
      description: 'No activities found.',
      documentationService: props.documentationService
    }"
  >
    <template #header>
      <DataTable.Header :showDivider="hasAppliedFilters">
        <template #first-line>
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
                placeholder="Search by author or resource..."
                class="flex-1 w-full"
                @search="handleSearch"
              />
            </div>
            <DataTable.Actions>
              <DataTimeRange
                v-model="dateRange"
                :maxDays="183"
                :listTimezonesService="listTimezonesService"
                @select="handleDateRangeChange"
              />
              <DataTable.ColumnSelector
                :columns="allColumns"
                v-model:selectedColumns="selectedColumns"
              />
            </DataTable.Actions>
          </div>
        </template>
        <template #second-line>
          <DataTable.AppliedFilters
            :appliedFilters="appliedFilters"
            @remove="handleRemoveFilter"
            @edit="handleEditFilter"
          />
        </template>
      </DataTable.Header>
    </template>

    <DataTable.Column
      v-for="col in visibleColumns"
      :key="col.field"
      :field="col.field"
      :header="col.header"
      :sortable="!!col.sortable"
      :style="getColumnStyle(col.field)"
    >
      <template #body="{ data: rowData }">
        <template v-if="col.field === 'operation'">
          <OperationTag :operation="rowData.operation" />
        </template>
        <template v-else-if="col.field === 'resourceName' || col.field === 'parentResourceName'">
          <span
            v-if="rowData[col.field]"
            @click="handleRowClick({ data: rowData })"
            class="text-color cursor-pointer hover:underline"
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
      :filters="filterableColumns"
      @apply="handleApplyFilter"
    />
    <template #emptyBlockButton>
      <slot name="emptyBlockButton" />
    </template>
  </DataTable>
</template>
