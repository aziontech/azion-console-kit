<script setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import { watchDebounced } from '@vueuse/core'
  import { useToast } from '@aziontech/webkit/use-toast'
  import Menu from '@aziontech/webkit/menu'
  import Calendar from '@aziontech/webkit/calendar'
  import Dropdown from '@aziontech/webkit/dropdown'
  import PrimeDialog from '@aziontech/webkit/dialog'
  import PrimeButton from '@aziontech/webkit/button'
  import GenericDataView from '@/components/GenericDataView'
  import { deploymentReleaseService } from '@/services/v2/deployment/deployment-release-service'
  import InlineTag from '@/components/InlineTag'
  import VersionStateBadge from '@/templates/version-shell-block/components/VersionStateBadge.vue'
  import DeploymentReleaseDrawer from '@/views/Deployments/components/DeploymentReleaseDrawer.vue'
  import { useReleaseDrawerController } from '@/composables/versioning/use-deployment-release-drawer'

  defineOptions({ name: 'deployment-releases-tab' })

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
  const filterValues = ref({ status: 'all' })
  const dateRange = ref(null)

  const rowMenuRef = ref(null)
  const rowMenuItems = ref([])

  // This context can rollback/redeploy, so the drawer action stays enabled.
  const {
    visible: drawerVisible,
    selectedRelease: selectedVersion,
    openRelease,
    closeDrawer
  } = useReleaseDrawerController({ actionable: true })

  const confirmDialog = ref({
    visible: false,
    action: null,
    version: null,
    loading: false
  })

  const statusAllOption = { label: 'Status', value: 'all' }

  const columns = computed(() => [
    { key: 'deployment', label: 'Deployment', size: 'minmax(220px, 1.4fr)', align: 'start' },
    {
      key: 'status',
      label: 'Status',
      size: 'minmax(160px, 1fr)',
      align: 'start',
      mobileSlot: 'status'
    },
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

  const matchesDateRange = (version) => {
    const [from, to] = Array.isArray(dateRange.value) ? dateRange.value : []
    if (!from && !to) return true

    const reference = version.created_at ? new Date(version.created_at) : null
    if (!reference || Number.isNaN(reference.getTime())) return false

    if (from && reference < new Date(new Date(from).setHours(0, 0, 0, 0))) return false
    if (to && reference > new Date(new Date(to).setHours(23, 59, 59, 999))) return false
    return true
  }

  const filteredVersions = computed(() =>
    versions.value.filter((version) => matchesDateRange(version))
  )

  const activeFilterCount = computed(() => {
    const statusActive = filterValues.value.status && filterValues.value.status !== 'all' ? 1 : 0
    const dateActive = Array.isArray(dateRange.value) && dateRange.value.some(Boolean) ? 1 : 0
    return statusActive + dateActive
  })

  const loadVersions = async () => {
    if (!props.deploymentId) {
      versions.value = []
      totalRecords.value = 0
      return
    }

    loading.value = true
    try {
      const status = filterValues.value.status
      const result = await deploymentReleaseService.listReleasesService(props.deploymentId, {
        page: Math.floor(paginatorFirst.value / paginatorRows.value) + 1,
        pageSize: paginatorRows.value,
        search: searchTerm.value?.trim() || undefined,
        state: status !== 'all' ? status : undefined
      })
      versions.value = Array.isArray(result?.body) ? result.body : []
      totalRecords.value = typeof result?.count === 'number' ? result.count : versions.value.length
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: 'Error',
        detail: error?.message || 'Failed to load deployment history'
      })
      versions.value = []
      totalRecords.value = 0
    } finally {
      loading.value = false
    }
  }

  const goToDetails = (version) => openRelease(version)

  const openRowMenu = ({ event, version }) => {
    rowMenuItems.value = [
      {
        label: 'View details',
        icon: 'pi pi-eye',
        command: () => openRelease(version)
      }
    ]
    rowMenuRef.value?.toggle?.(event)
  }

  const onRequestRollback = (version) => {
    confirmDialog.value = {
      visible: true,
      action: 'rollback',
      version,
      loading: false
    }
  }

  const onRequestRedeploy = (version) => {
    confirmDialog.value = {
      visible: true,
      action: 'redeploy',
      version,
      loading: false
    }
  }

  const confirmDialogTitle = computed(() =>
    confirmDialog.value.action === 'rollback' ? 'Roll back version' : 'Redeploy version'
  )

  const confirmDialogMessage = computed(() => {
    const name =
      confirmDialog.value.version?.name || confirmDialog.value.version?.id || 'this version'
    return confirmDialog.value.action === 'rollback'
      ? `Roll back to "${name}"? Traffic will move to the previous active version.`
      : `Redeploy "${name}"? It will become the active version for its environment.`
  })

  const closeConfirmDialog = () => {
    confirmDialog.value = { visible: false, action: null, version: null, loading: false }
  }

  const runConfirmedAction = async () => {
    const { action, version } = confirmDialog.value
    if (!action || !version?.id || !version?.deployment_id) return

    confirmDialog.value.loading = true
    try {
      if (action === 'rollback') {
        await deploymentReleaseService.rollbackReleaseService(version.deployment_id, version.id)
      } else {
        await deploymentReleaseService.activateReleaseService(version.deployment_id, version.id)
      }
      toast.add({
        closable: true,
        severity: 'success',
        summary: 'Success',
        detail:
          action === 'rollback'
            ? 'Rollback requested successfully'
            : 'Redeploy requested successfully'
      })
      closeConfirmDialog()
      closeDrawer()
      await loadVersions()
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: 'Error',
        detail:
          error?.message ||
          (action === 'rollback' ? 'Failed to roll back version' : 'Failed to redeploy version')
      })
      confirmDialog.value.loading = false
    }
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
      primaryColumnKey="deployment"
      :activeFilterCount="activeFilterCount"
      searchPlaceholder="Placeholder"
      emptyTitle="No releases yet"
      emptyDescription="Releases will appear here once you deploy a version of this deployment."
      filteredEmptyTitle="No releases found"
      filteredEmptyDescription="Try changing your search or filters."
      rowActionsAriaLabel="Release actions"
      overflowMenuAriaLabel="More release actions"
      @refresh="loadVersions"
      @page="onPage"
      @row-primary-click="goToDetails"
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
      </template>

      <template #cell-deployment="{ item: version }">
        <div class="min-w-0 flex flex-col gap-1">
          <button
            type="button"
            class="version-name-button m-0 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-left text-sm font-medium leading-6 text-[var(--text-color)] hover:text-[var(--primary-color)] hover:underline focus-visible:text-[var(--primary-color)] focus-visible:outline-none"
            :data-testid="`version-row__name-${version.id}`"
            @click="goToDetails(version)"
          >
            <span class="font-mono">{{ version.name || version.id || '--' }}</span>
          </button>
          <div
            v-if="version.isCurrent"
            class="flex items-center gap-1"
          >
            <InlineTag
              text="Current"
              type="info"
              icon="pi pi-arrow-circle-up"
            />
          </div>
        </div>
      </template>

      <template #cell-status="{ item: version }">
        <div class="flex items-center gap-3">
          <VersionStateBadge :state="version.state" />
          <span
            v-if="version.duration"
            class="text-xs text-[var(--text-color-secondary)] whitespace-nowrap"
          >
            Deployed in {{ version.duration }}
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
      :actionable="true"
      @rollback="onRequestRollback"
      @redeploy="onRequestRedeploy"
    />

    <PrimeDialog
      v-model:visible="confirmDialog.visible"
      modal
      :closable="!confirmDialog.loading"
      :header="confirmDialogTitle"
      class="max-w-md w-full"
      :pt="{
        headerTitle: { 'data-testid': 'deployment-releases__confirm-dialog__title' }
      }"
    >
      <p class="text-sm text-[var(--text-color-secondary)]">
        {{ confirmDialogMessage }}
      </p>
      <template #footer>
        <PrimeButton
          label="Cancel"
          outlined
          :disabled="confirmDialog.loading"
          @click="closeConfirmDialog"
        />
        <PrimeButton
          :label="confirmDialog.action === 'rollback' ? 'Rollback' : 'Redeploy'"
          :loading="confirmDialog.loading"
          @click="runConfirmedAction"
        />
      </template>
    </PrimeDialog>
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
