<script setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import Dropdown from '@aziontech/webkit/dropdown'
  import Calendar from '@aziontech/webkit/calendar'
  import GenericDataView from '@/components/GenericDataView'
  import CurrentBadge from '@/components/CurrentBadge'
  import VersionStateBadge from '@/templates/version-shell-block/components/VersionStateBadge.vue'
  import DeploymentReleaseDrawer from '@/views/Deployments/components/DeploymentReleaseDrawer.vue'
  import { useWorkloadReleases } from '@/views/Workload/composables/useWorkloadReleases'
  import { useReleaseDrawerController } from '@/composables/versioning/use-deployment-release-drawer'

  defineOptions({ name: 'workload-releases-section' })

  const props = defineProps({
    workloadId: { type: [String, Number], required: true },
    workload: { type: Object, default: () => null }
  })

  const { releases, loading, reload } = useWorkloadReleases({
    workloadId: props.workloadId,
    getWorkload: () => props.workload
  })

  const searchTerm = ref('')
  const filterValues = ref({ status: 'all' })
  const dateRange = ref(null)
  const paginatorFirst = ref(0)
  const paginatorRows = ref(10)

  // Read-only context (no rollback/redeploy here), so the drawer action is
  // hidden rather than wired to a handler that does nothing.
  const {
    visible: drawerVisible,
    selectedRelease,
    openRelease
  } = useReleaseDrawerController({ actionable: false })

  const statusAllOption = { label: 'Status', value: 'all' }

  const statusOptions = computed(() => {
    const statuses = Array.from(
      new Set(releases.value.map((release) => release.status?.content).filter(Boolean))
    )

    return [statusAllOption, ...statuses.map((status) => ({ label: status, value: status }))]
  })

  const matchesSearch = (release) => {
    const term = searchTerm.value.trim().toLowerCase()
    if (!term) return true
    return String(release.name || release.id || '')
      .toLowerCase()
      .includes(term)
  }

  const matchesStatus = (release) => {
    const status = filterValues.value.status
    if (!status || status === 'all') return true
    return release.status?.content === status
  }

  const matchesDateRange = (release) => {
    const [from, to] = Array.isArray(dateRange.value) ? dateRange.value : []
    if (!from && !to) return true

    const reference = release.created_at ? new Date(release.created_at) : null
    if (!reference || Number.isNaN(reference.getTime())) return false

    if (from && reference < new Date(new Date(from).setHours(0, 0, 0, 0))) return false
    if (to && reference > new Date(new Date(to).setHours(23, 59, 59, 999))) return false
    return true
  }

  const filteredReleases = computed(() =>
    releases.value.filter(
      (release) => matchesSearch(release) && matchesStatus(release) && matchesDateRange(release)
    )
  )

  const activeFilterCount = computed(() => {
    const statusActive = filterValues.value.status && filterValues.value.status !== 'all' ? 1 : 0
    const dateActive = Array.isArray(dateRange.value) && dateRange.value.some(Boolean) ? 1 : 0
    return statusActive + dateActive
  })

  const rowSubtitle = (release) => {
    const parts = []
    if (release.environmentLabel) parts.push(release.environmentLabel)
    if (release.deploymentName) parts.push(release.deploymentName)
    return parts.join(' · ')
  }

  const goToDetails = (release) => openRelease(release)

  const columns = [
    { key: 'release', label: 'Release', size: 'minmax(0, 1fr)', align: 'start' },
    {
      key: 'status',
      label: 'Status',
      size: 'minmax(0, 1fr)',
      align: 'start',
      mobileSlot: 'status'
    },
    { key: 'createdAt', label: 'Date', size: 'minmax(0, 1fr)', align: 'start' },
    { key: 'author', label: 'Author', size: 'minmax(0, 1fr)', align: 'start' }
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

  const dropdownPt = {
    panel: { class: 'dataview-dropdown-panel' },
    item: { class: 'dataview-dropdown-item' }
  }

  const onPage = (event) => {
    paginatorFirst.value = event.first
    paginatorRows.value = event.rows
  }

  watch(
    [searchTerm, filterValues, dateRange],
    () => {
      paginatorFirst.value = 0
    },
    { deep: true }
  )

  watch(() => props.workloadId, reload)
  watch(() => props.workload, reload)

  onMounted(reload)
</script>

<template>
  <GenericDataView
    :items="filteredReleases"
    :hasDeployments="Boolean(releases.length)"
    :loading="loading"
    :columns="columns"
    v-model:searchTerm="searchTerm"
    :paginatorFirst="paginatorFirst"
    :paginatorRows="paginatorRows"
    toolbarMode="compact"
    primaryColumnKey="release"
    :activeFilterCount="activeFilterCount"
    searchPlaceholder="Search Releases"
    emptyTitle="No releases yet"
    emptyDescription="Releases will appear here once the Workload's deployments have them."
    filteredEmptyTitle="No releases found"
    filteredEmptyDescription="Try changing your search or filters."
    @refresh="reload"
    @page="onPage"
    @row-primary-click="goToDetails"
    @open-row-menu="({ deployment }) => goToDetails(deployment)"
  >
    <template #toolbar-extras>
      <Dropdown
        v-model="filterValues.status"
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

    <template #cell-release="{ item }">
      <div class="flex flex-col gap-0.5 min-w-0">
        <button
          type="button"
          class="release-name-button m-0 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-left text-sm font-medium leading-6 text-[var(--text-color)] hover:text-[var(--primary-color)] hover:underline focus-visible:text-[var(--primary-color)] focus-visible:outline-none"
          :data-testid="`workload-releases__row__id-${item.id}`"
          @click="goToDetails(item)"
        >
          <span class="font-mono">{{ item.name || item.id }}</span>
        </button>
        <div class="flex items-center gap-2 min-w-0">
          <span
            v-if="rowSubtitle(item)"
            class="text-xs text-color-secondary truncate"
          >
            {{ rowSubtitle(item) }}
          </span>
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
      <div class="flex gap-0.5 min-w-0">
        <VersionStateBadge :state="item.state" />
        <span
          v-if="item.duration"
          class="flex items-center text-xs text-color-secondary pl-4"
        >
          Deployed in {{ item.duration }}
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

  <DeploymentReleaseDrawer
    v-model:visible="drawerVisible"
    :release="selectedRelease"
    :actionable="false"
  />
</template>

<style scoped>
  .release-name-button {
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
