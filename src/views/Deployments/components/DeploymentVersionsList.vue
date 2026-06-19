<script setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import { watchDebounced } from '@vueuse/core'
  import { useToast } from '@aziontech/webkit/use-toast'
  import Menu from '@aziontech/webkit/menu'
  import Calendar from '@aziontech/webkit/calendar'
  import Dropdown from '@aziontech/webkit/dropdown'
  import GenericDataView from '@/components/GenericDataView'
  import { deploymentVersionService } from '@/services/v2/deployment/deployment-version-service'
  import InlineTag from '@/components/InlineTag'
  import StatusTag from '@/components/StatusTag'
  import DeploymentReleaseDrawer from '@/views/Deployments/components/DeploymentReleaseDrawer.vue'

  defineOptions({ name: 'deployment-versions-list' })

  const props = defineProps({
    deploymentId: {
      type: [String, Number],
      required: true
    }
  })

  const toast = useToast()

  const versions = ref([])
  const totalRecords = ref(0)
  const loading = ref(false)

  const paginatorFirst = ref(0)
  const paginatorRows = ref(10)
  const searchTerm = ref('')
  const filterValues = ref({ status: 'all', environment: 'all' })
  const dateRange = ref(null)

  const rowMenuRef = ref(null)
  const rowMenuItems = ref([])

  const drawerVisible = ref(false)
  const selectedVersion = ref(null)

  const statusAllOption = { label: 'Status', value: 'all' }
  const environmentAllOption = { label: 'Environment', value: 'all' }

  const columns = computed(() => [
    { key: 'deployment', label: 'Deployment', size: 'minmax(220px, 1.4fr)', align: 'start' },
    { key: 'status', label: 'Status', size: 'minmax(160px, 1fr)', align: 'start' },
    {
      key: 'lastModified',
      label: 'Last Modified',
      size: 'minmax(180px, 1.2fr)',
      align: 'end',
      field: 'lastModified'
    },
    {
      key: 'lastEditor',
      label: 'Last Editor',
      size: 'minmax(220px, 1.2fr)',
      align: 'end',
      field: 'lastEditor'
    }
  ])

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

  const environmentOptions = computed(() => {
    const labels = Array.from(
      new Set(versions.value.map((version) => version.environmentLabel).filter(Boolean))
    )

    return [
      environmentAllOption,
      ...labels.map((label) => ({
        label,
        value: label
      }))
    ]
  })

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

  const loadVersions = async () => {
    loading.value = true
    try {
      const status = filterValues.value.status
      const environment = filterValues.value.environment
      const result = await deploymentVersionService.listVersionsService(props.deploymentId, {
        page: Math.floor(paginatorFirst.value / paginatorRows.value) + 1,
        pageSize: paginatorRows.value,
        search: searchTerm.value?.trim() || undefined,
        state: status !== 'all' ? status : undefined,
        environment: environment !== 'all' ? environment : undefined
      })
      versions.value = Array.isArray(result?.body) ? result.body : []
      totalRecords.value = typeof result?.count === 'number' ? result.count : versions.value.length
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: 'Error',
        detail: error?.message || 'Failed to load deployment versions'
      })
      versions.value = []
      totalRecords.value = 0
    } finally {
      loading.value = false
    }
  }

  const openDrawer = (version) => {
    if (!version) return
    selectedVersion.value = version
    drawerVisible.value = true
  }

  const goToDetails = (version) => openDrawer(version)

  const openRowMenu = ({ event, version }) => {
    rowMenuItems.value = [
      {
        label: 'View details',
        icon: 'pi pi-eye',
        command: () => openDrawer(version)
      }
    ]
    rowMenuRef.value?.toggle?.(event)
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

  watch(
    () => props.deploymentId,
    () => {
      paginatorFirst.value = 0
      loadVersions()
    }
  )

  watchDebounced([searchTerm], () => loadVersions(), { debounce: 350, deep: true })

  watch([filterValues, paginatorFirst, paginatorRows], () => loadVersions(), { deep: true })

  onMounted(loadVersions)
</script>

<template>
  <div class="flex flex-col gap-4 mt-4">
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
      :toolbarMode="'compact'"
      :showHeader="false"
      searchPlaceholder="Placeholder"
      emptyTitle="No Deployment versions yet"
      emptyDescription="Deployment versions will appear here once you deploy your resources."
      filteredEmptyTitle="No versions found"
      filteredEmptyDescription="Try changing your search or filters."
      rowActionsAriaLabel="Version actions"
      overflowMenuAriaLabel="More version actions"
      @refresh="loadVersions"
      @page="onPage"
      @open-row-menu="({ event, deployment }) => openRowMenu({ event, version: deployment })"
    >
      <template #toolbar-extras>
        <Dropdown
          v-model="filterValues.status"
          :options="statusOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Status"
          class="dataview-control dataview-dropdown min-w-0 flex-1 sm:min-w-[9.5rem]"
        />
        <Calendar
          v-model="dateRange"
          selectionMode="range"
          placeholder="Select a Date"
          showIcon
          icon="pi pi-chevron-down"
          :manualInput="false"
          class="dataview-control dataview-dropdown min-w-0 flex-1 sm:min-w-[12rem]"
        />
        <Dropdown
          v-model="filterValues.environment"
          :options="environmentOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Environment"
          class="dataview-control dataview-dropdown min-w-0 flex-1 sm:min-w-[9.5rem]"
        />
      </template>

      <template #cell-deployment="{ item: version }">
        <div class="min-w-0 flex flex-col gap-1">
          <button
            type="button"
            class="version-name-button m-0 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-left text-sm font-medium leading-6 text-[var(--text-color)] hover:text-[var(--primary-color)] hover:underline focus-visible:text-[var(--primary-color)] focus-visible:outline-none"
            :data-testid="`version-row__name-${version.id}`"
            @click="goToDetails(version)"
          >
            {{ version.name || version.id || '--' }}
          </button>
          <div class="flex items-center gap-1">
            <span
              v-if="version.environmentLabel"
              class="text-xs leading-none text-[var(--text-color-secondary)] whitespace-nowrap"
            >
              {{ version.environmentLabel }}
            </span>
            <i
              v-if="version.environmentIcon"
              :class="[version.environmentIcon, 'text-xs text-[var(--text-color-secondary)]']"
              aria-hidden="true"
            />
            <InlineTag
              v-if="version.isCurrent"
              text="Current"
              type="info"
              icon="pi pi-arrow-circle-up"
            />
          </div>
        </div>
      </template>

      <template #cell-status="{ item: version }">
        <div class="flex items-center gap-3">
          <StatusTag :status="version.status" />
          <span
            v-if="version.duration"
            class="text-xs text-[var(--text-color-secondary)] whitespace-nowrap"
          >
            {{ version.duration }}
          </span>
        </div>
      </template>

      <template #cell-lastModified="{ item: version }">
        <span
          class="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-sm text-[var(--text-color-secondary)]"
        >
          {{ version.lastModified || '--' }}
        </span>
      </template>

      <template #cell-lastEditor="{ item: version }">
        <span
          class="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-sm text-[var(--text-color-secondary)]"
          data-sentry-mask
        >
          {{ version.lastEditor || '--' }}
        </span>
      </template>
    </GenericDataView>

    <Menu
      ref="rowMenuRef"
      :popup="true"
      :model="rowMenuItems"
    />

    <DeploymentReleaseDrawer
      v-model:visible="drawerVisible"
      :release="selectedVersion"
      @rollback="onRollback"
      @redeploy="onRedeploy"
    />
  </div>
</template>

<style scoped>
  .version-name-button {
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
