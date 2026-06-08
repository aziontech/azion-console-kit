<script setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import { watchDebounced } from '@vueuse/core'
  import { useToast } from '@aziontech/webkit/use-toast'
  import Dropdown from '@aziontech/webkit/dropdown'
  import Calendar from '@aziontech/webkit/calendar'
  import GenericDataView from '@/components/GenericDataView'
  import StatusTag from '@/components/StatusTag'
  import CurrentBadge from '@/components/CurrentBadge'
  import DeploymentVersionDrawer from '@/views/Deployments/components/DeploymentVersionDrawer.vue'
  import { listGlobalDeploymentVersionsMock } from '@/services/v2/deployment/deployment-version-mock'

  defineOptions({ name: 'deployments-list-section' })

  const props = defineProps({
    workloadId: { type: [String, Number], required: true },
    workloadDeploymentId: { type: [String, Number], default: null }
  })

  const toast = useToast()

  const versions = ref([])
  const totalRecords = ref(0)
  const loading = ref(false)

  const paginatorFirst = ref(0)
  const paginatorRows = ref(10)
  const searchTerm = ref('')
  const filterValues = ref({ state: 'all' })
  const dateRange = ref(null)

  const drawerVisible = ref(false)
  const selectedVersion = ref(null)

  const statusAllOption = { label: 'Status', value: 'all' }

  const goToDetails = (version) => {
    if (!version) return
    selectedVersion.value = version
    drawerVisible.value = true
  }

  const onRollback = (version) => {
    toast.add({
      closable: true,
      severity: 'info',
      summary: 'Rollback',
      detail: `Rollback requested for "${version?.name || version?.id || 'version'}"`
    })
  }

  const onRedeploy = (version) => {
    toast.add({
      closable: true,
      severity: 'info',
      summary: 'Redeploy',
      detail: `Redeploy requested for "${version?.name || version?.id || 'version'}"`
    })
  }

  const matchesDateRange = (version) => {
    const [from, to] = Array.isArray(dateRange.value) ? dateRange.value : []
    if (!from && !to) return true

    const reference = version.created_at ? new Date(version.created_at) : null
    if (!reference || Number.isNaN(reference.getTime())) return false

    if (from && reference < new Date(new Date(from).setHours(0, 0, 0, 0))) return false
    if (to && reference > new Date(new Date(to).setHours(23, 59, 59, 999))) return false
    return true
  }

  const filteredVersions = computed(() => versions.value.filter(matchesDateRange))

  const statusOptions = computed(() => {
    const statuses = Array.from(
      new Set(versions.value.map((version) => version.status?.content).filter(Boolean))
    )

    return [
      statusAllOption,
      ...statuses.map((status) => ({
        label: status,
        value: status
      }))
    ]
  })

  const loadVersions = async () => {
    loading.value = true
    try {
      const state = filterValues.value.state
      const result = await listGlobalDeploymentVersionsMock({
        page: Math.floor(paginatorFirst.value / paginatorRows.value) + 1,
        pageSize: paginatorRows.value,
        search: searchTerm.value?.trim() || undefined,
        state: state !== 'all' ? state : undefined
      })
      versions.value = Array.isArray(result?.body) ? result.body : []
      totalRecords.value = typeof result?.count === 'number' ? result.count : versions.value.length
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: 'Error',
        detail: error?.message || 'Failed to load deployments'
      })
      versions.value = []
      totalRecords.value = 0
    } finally {
      loading.value = false
    }
  }

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

  const columns = [
    { key: 'deployment', label: 'Deployment', size: 'minmax(0, 1fr)', align: 'start' },
    { key: 'status', label: 'Status', size: 'minmax(0, 1fr)', align: 'start' },
    { key: 'createdAt', label: 'Date', size: 'minmax(0, 1fr)', align: 'start' },
    { key: 'author', label: 'Author', size: 'minmax(0, 1fr)', align: 'start' }
  ]

  const onPage = (event) => {
    paginatorFirst.value = event.first
    paginatorRows.value = event.rows
  }

  const dropdownPt = {
    panel: { class: 'dataview-dropdown-panel' },
    item: { class: 'dataview-dropdown-item' }
  }

  watch(
    [searchTerm, filterValues, dateRange],
    () => {
      paginatorFirst.value = 0
    },
    { deep: true }
  )

  watchDebounced([searchTerm], () => loadVersions(), { debounce: 350, deep: true })

  watch(
    [filterValues, paginatorFirst, paginatorRows, () => props.workloadDeploymentId],
    () => loadVersions(),
    { deep: true }
  )

  onMounted(loadVersions)
</script>

<template>
  <GenericDataView
    :items="filteredVersions"
    :hasDeployments="Boolean(versions.length)"
    :loading="loading"
    :columns="columns"
    v-model:searchTerm="searchTerm"
    :paginatorFirst="paginatorFirst"
    :paginatorRows="paginatorRows"
    :lazy="true"
    :totalRecords="totalRecords"
    toolbarMode="compact"
    searchPlaceholder="Search Deployments"
    emptyTitle="No deployments yet"
    emptyDescription="Deployments will appear here when triggered for this Workload."
    filteredEmptyTitle="No deployments found"
    filteredEmptyDescription="Try changing your search or filters."
    @refresh="loadVersions"
    @page="onPage"
  >
    <template #toolbar-extras>
      <Dropdown
        v-model="filterValues.state"
        :options="statusOptions"
        :pt="dropdownPt"
        optionLabel="label"
        optionValue="value"
        placeholder="Status"
        class="dataview-control dataview-dropdown min-w-0 w-full sm:w-auto sm:min-w-[9.5rem]"
      />
      <Calendar
        v-model="dateRange"
        selectionMode="range"
        placeholder="Select a Date"
        showIcon
        icon="pi pi-chevron-down"
        :manualInput="false"
        class="dataview-control dataview-dropdown min-w-0 w-full sm:w-auto sm:min-w-[12rem]"
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
          {{ item.name || item.id }}
        </button>
        <div class="flex items-center gap-2 min-w-0">
          <span
            v-if="item.environmentLabel"
            class="text-xs text-color-secondary truncate"
            >{{ item.environmentLabel }}</span
          >
          <i
            v-if="item.environmentIcon"
            :class="[item.environmentIcon, 'text-color-secondary text-xs']"
            title="Rollback"
          />
          <CurrentBadge v-if="item.isCurrent" />
        </div>
      </div>
    </template>

    <template #cell-status="{ item }">
      <div class="flex flex-col gap-0.5 min-w-0">
        <StatusTag :status="item.status" />
        <span
          v-if="item.duration"
          class="text-xs text-color-secondary pl-4"
        >
          {{ item.duration }}
        </span>
      </div>
    </template>

    <template #cell-createdAt="{ item }">
      <span class="text-sm truncate">{{ formatDate(item.created_at) }}</span>
    </template>

    <template #cell-author="{ item }">
      <span class="text-sm truncate">{{ item.lastEditor || '--' }}</span>
    </template>
  </GenericDataView>

  <DeploymentVersionDrawer
    v-model:visible="drawerVisible"
    :version="selectedVersion"
    @rollback="onRollback"
    @redeploy="onRedeploy"
  />
</template>

<style scoped>
  .deployment-id-button {
    background: transparent;
    border: 0;
    padding: 0;
    cursor: pointer;
    font: inherit;
  }

  :deep(.dataview-control.p-calendar) {
    display: inline-flex;
    align-items: center;
    min-height: 2.5rem;
    border: 1px solid var(--surface-border);
    border-radius: 0.375rem;
    background: var(--surface-section);
    box-shadow: none;
    overflow: hidden;
  }

  :deep(.dataview-control.p-calendar:hover) {
    border-color: var(--surface-border);
    background: var(--surface-ground);
  }

  :deep(.dataview-control.p-calendar:focus-within) {
    border-color: var(--primary-color);
  }

  :deep(.dataview-control.p-calendar .p-inputtext) {
    flex: 1;
    width: 100%;
    min-height: auto;
    border: 0;
    background: transparent;
    color: var(--text-color);
    font-size: 0.875rem;
    line-height: 1.5rem;
    box-shadow: none;
    padding-block: 0.5rem;
  }

  :deep(.dataview-control.p-calendar .p-inputtext:hover),
  :deep(.dataview-control.p-calendar .p-inputtext:enabled:focus) {
    border: 0;
    background: transparent;
    box-shadow: none;
  }

  :deep(.dataview-control.p-calendar .p-inputtext::placeholder) {
    color: var(--text-color-secondary);
  }

  :deep(.dataview-control.p-calendar .p-datepicker-trigger),
  :deep(.dataview-control.p-calendar > button) {
    flex-shrink: 0;
    background: transparent;
    border: 0;
    box-shadow: none;
    color: var(--text-color-secondary);
    padding: 0 0.75rem;
    width: auto;
    min-width: 0;
    height: 100%;
  }

  :deep(.dataview-control.p-calendar .p-datepicker-trigger:hover),
  :deep(.dataview-control.p-calendar > button:hover) {
    background: transparent;
    color: var(--text-color-secondary);
  }

  :deep(.dataview-control.p-calendar .p-datepicker-trigger:focus) {
    outline: none;
    box-shadow: none;
  }
</style>
