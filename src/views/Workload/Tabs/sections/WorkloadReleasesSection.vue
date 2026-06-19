<script setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import Dropdown from '@aziontech/webkit/dropdown'
  import GenericDataView from '@/components/GenericDataView'
  import StatusTag from '@/components/StatusTag'
  import CurrentBadge from '@/components/CurrentBadge'
  import DeploymentReleaseDrawer from '@/views/Deployments/components/DeploymentReleaseDrawer.vue'
  import { useWorkloadReleases } from '@/views/Workload/composables/useWorkloadReleases'

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
  const paginatorFirst = ref(0)
  const paginatorRows = ref(10)

  const drawerVisible = ref(false)
  const selectedRelease = ref(null)

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

  const filteredReleases = computed(() =>
    releases.value.filter((release) => matchesSearch(release) && matchesStatus(release))
  )

  const rowSubtitle = (release) => {
    const parts = []
    if (release.environmentLabel) parts.push(release.environmentLabel)
    if (release.deploymentName) parts.push(release.deploymentName)
    return parts.join(' · ')
  }

  const goToDetails = (release) => {
    if (!release) return
    selectedRelease.value = release
    drawerVisible.value = true
  }

  const columns = [
    { key: 'release', label: 'Release', size: 'minmax(0, 1fr)', align: 'start' },
    { key: 'status', label: 'Status', size: 'minmax(0, 1fr)', align: 'start' },
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
    [searchTerm, filterValues],
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
    searchPlaceholder="Search Releases"
    emptyTitle="No releases yet"
    emptyDescription="Releases will appear here once the Workload's deployments have them."
    filteredEmptyTitle="No releases found"
    filteredEmptyDescription="Try changing your search or filters."
    @refresh="reload"
    @page="onPage"
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
    </template>

    <template #cell-release="{ item }">
      <div class="flex flex-col gap-0.5 min-w-0">
        <button
          type="button"
          class="release-name-button m-0 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-left text-sm font-medium leading-6 text-[var(--text-color)] hover:text-[var(--primary-color)] hover:underline focus-visible:text-[var(--primary-color)] focus-visible:outline-none"
          :data-testid="`workload-releases__row__id-${item.id}`"
          @click="goToDetails(item)"
        >
          {{ item.name || item.id }}
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

  <DeploymentReleaseDrawer
    v-model:visible="drawerVisible"
    :release="selectedRelease"
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
</style>
