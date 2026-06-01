<script setup>
  import { ref, computed } from 'vue'
  import { useRouter } from 'vue-router'
  import GenericDataView from '@/components/GenericDataView'
  import StatusTag from '@/components/StatusTag'
  import CurrentBadge from '@/components/CurrentBadge'
  import Dropdown from '@aziontech/webkit/dropdown'
  import {
    MOCK_DEPLOYMENTS,
    STATUS_TAG,
    statusTag
  } from '@/views/Workload/Tabs/sections/deployments.mock'

  defineOptions({ name: 'deployments-list-section' })

  const props = defineProps({
    workloadId: { type: [String, Number], required: true }
  })

  const router = useRouter()

  const goToDetails = (item) =>
    router.push({
      name: 'workload-deployment-details',
      params: { id: props.workloadId, deploymentId: item.id }
    })

  const ALL = 'all'
  const dateOptions = [
    { label: 'All time', value: ALL },
    { label: 'Last 7 days', value: '7d' },
    { label: 'Last 30 days', value: '30d' }
  ]

  const searchTerm = ref('')
  const filterValues = ref({
    status: ALL,
    author: ALL,
    date: ALL
  })
  const paginatorFirst = ref(0)
  const paginatorRows = ref(10)

  const normalize = (value) =>
    String(value ?? '')
      .toLowerCase()
      .trim()

  const statusOptions = computed(() => {
    const statuses = Array.from(
      new Set(MOCK_DEPLOYMENTS.map((item) => item.status).filter(Boolean))
    )
    return [
      { label: 'All statuses', value: ALL },
      ...statuses.map((status) => ({
        label: STATUS_TAG[status]?.content || status,
        value: status
      }))
    ]
  })

  const authorOptions = computed(() => {
    const authors = Array.from(new Set(MOCK_DEPLOYMENTS.map((item) => item.author).filter(Boolean)))
    return [
      { label: 'All authors', value: ALL },
      ...authors.map((author) => ({ label: author, value: author }))
    ]
  })

  const filters = computed(() => [
    {
      key: 'status',
      field: 'status',
      placeholder: 'Status',
      options: statusOptions.value,
      optionLabel: 'label',
      optionValue: 'value',
      defaultValue: ALL,
      allValue: ALL
    },
    {
      key: 'author',
      field: 'author',
      placeholder: 'Authors',
      options: authorOptions.value,
      optionLabel: 'label',
      optionValue: 'value',
      defaultValue: ALL,
      allValue: ALL
    },
    {
      key: 'date',
      field: 'createdAt',
      placeholder: 'Select a Date',
      options: dateOptions,
      optionLabel: 'label',
      optionValue: 'value',
      defaultValue: ALL,
      allValue: ALL,
      matcher: (itemValue, selectedValue) => {
        if (selectedValue === ALL) return true
        if (!itemValue) return false
        const days = selectedValue === '7d' ? 7 : 30
        const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
        return new Date(itemValue).getTime() >= cutoff
      }
    }
  ])

  const matchesFilters = (item) => {
    return filters.value.every((filter) => {
      const selectedValue = filterValues.value?.[filter.key] ?? filter.defaultValue
      if (selectedValue === filter.allValue) return true

      const itemValue = item?.[filter.field]
      if (typeof filter.matcher === 'function') {
        return filter.matcher(itemValue, selectedValue, item)
      }
      return normalize(itemValue) === normalize(selectedValue)
    })
  }

  const filteredItems = computed(() => {
    const search = normalize(searchTerm.value)
    return MOCK_DEPLOYMENTS.filter((item) => {
      const searchable = [item.deploymentId, item.environment, item.status, item.author]
      const matchesSearch = !search || searchable.some((value) => normalize(value).includes(search))
      return matchesSearch && matchesFilters(item)
    })
  })

  const columns = [
    { key: 'deployment', label: 'Deployment', cellClass: 'flex-1 min-w-0' },
    { key: 'status', label: 'Status', cellClass: 'flex-1 min-w-0' },
    { key: 'createdAt', label: 'Date', cellClass: 'flex-1 min-w-0' },
    { key: 'author', label: 'Author', cellClass: 'flex-1 min-w-0' }
  ]

  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  })

  const formatDate = (iso) => {
    if (!iso) return '—'
    try {
      return dateFormatter.format(new Date(iso))
    } catch {
      return iso
    }
  }

  const onPage = (event) => {
    paginatorFirst.value = event.first
    paginatorRows.value = event.rows
  }

  const dropdownPt = {
    panel: { class: 'dataview-dropdown-panel' },
    item: { class: 'dataview-dropdown-item' }
  }

  const onFilterChange = (key, value) => {
    filterValues.value = { ...filterValues.value, [key]: value }
  }
</script>

<template>
  <GenericDataView
    :items="filteredItems"
    :hasDeployments="true"
    :columns="columns"
    v-model:searchTerm="searchTerm"
    v-model:filterValues="filterValues"
    :paginatorFirst="paginatorFirst"
    :paginatorRows="paginatorRows"
    toolbarMode="compact"
    searchPlaceholder="Search Deployments"
    emptyTitle="No deployments yet"
    emptyDescription="Deployments will appear here when triggered for this Workload."
    filteredEmptyTitle="No deployments found"
    filteredEmptyDescription="Try changing your search or filters."
    @page="onPage"
  >
    <template #toolbar-extras>
      <Dropdown
        v-for="filter in filters"
        :key="filter.key"
        :modelValue="filterValues[filter.key] ?? filter.defaultValue"
        :options="filter.options"
        :pt="dropdownPt"
        :optionLabel="filter.optionLabel"
        :optionValue="filter.optionValue"
        :placeholder="filter.placeholder"
        class="dataview-control dataview-dropdown min-w-0 w-full sm:w-auto sm:min-w-[9.5rem]"
        @update:modelValue="onFilterChange(filter.key, $event)"
      />
    </template>
    <template #cell-deployment="{ item }">
      <div class="flex flex-col gap-0.5 min-w-0">
        <button
          type="button"
          class="deployment-id-button m-0 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-left text-sm font-medium leading-6 text-[var(--text-color)] hover:text-[var(--primary-color)] hover:underline focus-visible:text-[var(--primary-color)] focus-visible:outline-none"
          :data-testid="`workload-deployments__row__id-${item.id}`"
          @click="goToDetails(item)"
        >
          {{ item.deploymentId }}
        </button>
        <div class="flex items-center gap-2 min-w-0">
          <span class="text-xs text-color-secondary truncate">{{ item.environment }}</span>
          <i
            v-if="item.isRollback"
            class="pi pi-history text-color-secondary text-xs"
            title="Rollback"
          />
          <CurrentBadge v-if="item.isCurrent" />
        </div>
      </div>
    </template>

    <template #cell-status="{ item }">
      <div class="flex flex-col gap-0.5 min-w-0">
        <StatusTag :status="statusTag(item.status)" />
        <span
          v-if="item.duration"
          class="text-xs text-color-secondary pl-4"
        >
          {{ item.duration }}
        </span>
      </div>
    </template>

    <template #cell-createdAt="{ item }">
      <span class="text-sm truncate">{{ formatDate(item.createdAt) }}</span>
    </template>

    <template #cell-author="{ item }">
      <span class="text-sm truncate">{{ item.author }}</span>
    </template>
  </GenericDataView>
</template>

<style scoped>
  .deployment-id-button {
    background: transparent;
    border: 0;
    padding: 0;
    cursor: pointer;
    font: inherit;
  }
</style>
