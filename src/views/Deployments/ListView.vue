<script setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import Menu from '@aziontech/webkit/menu'
  import GenericDataView from '@/views/Deployments/components/GenericDataView.vue'
  import { useToast } from '@aziontech/webkit/use-toast'

  defineOptions({ name: 'list-deployments' })

  const props = defineProps({
    listDeploymentsService: {
      required: true,
      type: Function
    },
    documentationService: {
      type: Function,
      required: false
    }
  })

  const toast = useToast()

  const deployments = ref([])
  const loading = ref(false)
  const paginatorFirst = ref(0)
  const paginatorRows = ref(10)

  const searchTerm = ref('')
  const filterValues = ref({
    status: 'all',
    environment: 'all',
    current: 'all'
  })

  const rowMenuRef = ref(null)
  const rowMenuItems = ref([])

  const statusAllOption = { label: 'All Status', value: 'all' }
  const environmentAllOption = { label: 'All Environments', value: 'all' }
  const currentOptions = [
    { label: 'All Versions', value: 'all' },
    { label: 'Only Current', value: 'current' }
  ]

  const columns = [
    {
      key: 'deployment',
      label: 'Deployment',
      headerClass: 'min-w-[170px] flex-[2_1_170px]',
      cellClass:
        'min-w-[170px] flex-[2_1_170px] max-lg:flex max-lg:min-w-0 max-lg:items-start max-lg:gap-4 max-sm:flex-col max-sm:gap-1'
    },
    {
      key: 'environment',
      label: 'Environment',
      headerClass: 'min-w-[130px] flex-[1.1_1_130px]',
      cellClass:
        'min-w-[130px] flex-[1.1_1_130px] max-lg:flex max-lg:min-w-0 max-lg:items-start max-lg:gap-4 max-sm:flex-col max-sm:gap-1',
      field: 'environment'
    },
    {
      key: 'status',
      label: 'Status',
      headerClass: 'min-w-[120px] flex-[1.25_1_120px]',
      cellClass:
        'min-w-[120px] flex-[1.25_1_120px] max-lg:flex max-lg:min-w-0 max-lg:items-start max-lg:gap-4 max-sm:flex-col max-sm:gap-1'
    },
    {
      key: 'resource-pack',
      label: 'Resource Pack',
      headerClass: 'min-w-[320px] flex-[2.5_1_320px]',
      cellClass:
        'min-w-[320px] flex-[2.5_1_320px] max-lg:flex max-lg:min-w-0 max-lg:items-start max-lg:gap-4 max-sm:flex-col max-sm:gap-1'
    },
    {
      key: 'lastEditor',
      label: 'Last Editor',
      headerClass: 'min-w-[180px] flex-[1.4_1_180px]',
      cellClass:
        'min-w-[180px] flex-[1.4_1_180px] max-lg:flex max-lg:min-w-0 max-lg:items-start max-lg:gap-4 max-sm:flex-col max-sm:gap-1',
      field: 'lastEditor'
    },
    {
      key: 'lastModified',
      label: 'Last Modified',
      headerClass: 'min-w-[170px] flex-[1.4_1_170px]',
      cellClass:
        'min-w-[170px] flex-[1.4_1_170px] max-lg:flex max-lg:min-w-0 max-lg:items-start max-lg:gap-4 max-sm:flex-col max-sm:gap-1',
      field: 'lastModified'
    }
  ]

  const textKeys = ['text', 'content', 'value', 'label', 'name', 'email']

  const statusIconMap = {
    ready: 'pi pi-check-circle',
    building: 'pi pi-spinner',
    draft: 'pi pi-clock',
    error: 'pi pi-times-circle',
    canceled: 'pi pi-ban'
  }

  const resourcePackTypeMeta = [
    { key: 'application', label: 'Application', icon: 'ai ai-edge-application' },
    { key: 'firewall', label: 'Firewall', icon: 'ai ai-edge-firewall' },
    { key: 'workload', label: 'Workload', icon: 'ai ai-workloads' }
  ]

  const getStatusIcon = (status) => {
    const normalizedStatus = String(status || '')
      .trim()
      .toLowerCase()
    const baseIcon = statusIconMap[normalizedStatus] || 'pi pi-info-circle'

    return normalizedStatus === 'building' ? `${baseIcon} animate-spin` : baseIcon
  }
  const getStatusClass = (deployment) => `status-${deployment?.status?.severity || 'secondary'}`
  const getDeploymentStatus = (deployment) => normalizeText(deployment?.status?.content)

  const normalizeText = (value) =>
    String(value || '')
      .trim()
      .toLowerCase()

  const statusOptions = computed(() => {
    const statuses = Array.from(
      new Set(deployments.value.map((deployment) => deployment.status?.content).filter(Boolean))
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
    const environments = Array.from(
      new Set(deployments.value.map((deployment) => deployment.environment).filter(Boolean))
    )

    return [
      environmentAllOption,
      ...environments.map((environment) => ({
        label: formatEnvironment(environment),
        value: environment
      }))
    ]
  })

  const filters = computed(() => [
    {
      key: 'status',
      field: 'status.content',
      placeholder: 'Status',
      options: statusOptions.value,
      optionLabel: 'label',
      optionValue: 'value',
      defaultValue: 'all',
      allValue: 'all'
    },
    {
      key: 'current',
      field: 'isCurrent',
      placeholder: 'Current',
      options: currentOptions,
      optionLabel: 'label',
      optionValue: 'value',
      defaultValue: 'all',
      allValue: 'all',
      matcher: (itemValue, selectedValue) => selectedValue !== 'current' || itemValue
    },
    {
      key: 'environment',
      field: 'environment',
      placeholder: 'Environment',
      options: environmentOptions.value,
      optionLabel: 'label',
      optionValue: 'value',
      defaultValue: 'all',
      allValue: 'all'
    }
  ])

  const getValueByPath = (item, path) => {
    if (!path) return undefined

    return path.split('.').reduce((value, key) => value?.[key], item)
  }

  const matchesDropdownFilters = (deployment) => {
    return filters.value.every((filter) => {
      const selectedValue = filterValues.value?.[filter.key] ?? filter.defaultValue

      if (selectedValue === filter.allValue) return true

      const itemValue = getValueByPath(deployment, filter.field)

      if (typeof filter.matcher === 'function') {
        return filter.matcher(itemValue, selectedValue, deployment)
      }

      return normalizeText(itemValue) === normalizeText(selectedValue)
    })
  }

  const filteredDeployments = computed(() => {
    const normalizedSearch = normalizeText(searchTerm.value)
    return deployments.value.filter((deployment) => {
      const searchableValues = [
        deployment.id,
        deployment.hash,
        deployment.environment,
        deployment.status?.content,
        getResourcePackSearchText(deployment),
        deployment.lastEditor,
        deployment.lastModified
      ]

      const matchesSearch =
        !normalizedSearch ||
        searchableValues.some((value) => normalizeText(value).includes(normalizedSearch))

      return matchesSearch && matchesDropdownFilters(deployment)
    })
  })

  const resolveResourcePackEntry = (value) => {
    if (value == null) return null

    if (typeof value === 'string' || typeof value === 'number') {
      return {
        name: String(value),
        hash: ''
      }
    }

    if (typeof value !== 'object') return null

    const name =
      resolvePrimitiveText(value?.name) ||
      resolvePrimitiveText(value?.label) ||
      resolvePrimitiveText(value?.resourceName)

    const hash =
      resolvePrimitiveText(value?.hash) ||
      resolvePrimitiveText(value?.versionHash) ||
      resolvePrimitiveText(value?.version) ||
      resolvePrimitiveText(value?.sourceHash)

    if (!name && !hash) return null

    return {
      name,
      hash
    }
  }

  const normalizeLegacyResourceType = (resource) => {
    const value = normalizeText(resource)
    if (value === 'application') return 'application'
    if (value === 'firewall' || value === 'waf') return 'firewall'
    if (value === 'workload') return 'workload'
    return ''
  }

  const normalizeResourcePack = (resourcePack, item) => {
    const normalized = {
      application: null,
      firewall: null,
      workload: null
    }

    if (resourcePack && typeof resourcePack === 'object') {
      for (const meta of resourcePackTypeMeta) {
        normalized[meta.key] = resolveResourcePackEntry(resourcePack?.[meta.key])
      }
    }

    if (!normalized.application && !normalized.firewall && !normalized.workload) {
      const legacyType = normalizeLegacyResourceType(item?.resource)
      if (legacyType) {
        normalized[legacyType] = {
          name: resolvePrimitiveText(item?.resource),
          hash: resolvePrimitiveText(item?.sourceHash)
        }
      }
    }

    return normalized
  }

  const getResourcePackRows = (deployment) => {
    return resourcePackTypeMeta
      .map((meta) => {
        const entry = deployment.resourcePack?.[meta.key]
        if (!entry) return null

        return {
          key: meta.key,
          label: meta.label,
          icon: meta.icon,
          name: entry.name || '--',
          hash: entry.hash || '--'
        }
      })
      .filter(Boolean)
  }

  const getResourcePackSearchText = (deployment) => {
    return getResourcePackRows(deployment)
      .map((entry) => `${entry.label} ${entry.name} ${entry.hash}`)
      .join(' ')
  }

  const resolvePrimitiveText = (value) => {
    if (value == null) return ''
    if (typeof value === 'string' || typeof value === 'number') return String(value)

    for (const key of textKeys) {
      const candidate = value?.[key]
      if (typeof candidate === 'string' || typeof candidate === 'number') {
        return String(candidate)
      }
    }

    return ''
  }

  const normalizeStatus = (statusValue) => {
    if (typeof statusValue === 'string') {
      return {
        content: statusValue,
        severity: 'secondary'
      }
    }

    if (statusValue && typeof statusValue === 'object') {
      return {
        content: resolvePrimitiveText(statusValue) || 'Unknown',
        severity: statusValue.severity || 'secondary'
      }
    }

    return {
      content: 'Unknown',
      severity: 'secondary'
    }
  }

  const normalizeDeployments = (list) => {
    return list.map((item, index) => ({
      id: resolvePrimitiveText(item?.id) || `deployment-${index}`,
      hash: resolvePrimitiveText(item?.hash),
      environment: resolvePrimitiveText(item?.environment),
      isCurrent: Boolean(item?.isCurrent),
      status: normalizeStatus(item?.status),
      resourcePack: normalizeResourcePack(item?.resourcePack, item),
      lastEditor: resolvePrimitiveText(item?.lastEditor),
      lastModified: resolvePrimitiveText(item?.lastModified)
    }))
  }

  const formatEnvironment = (environment) => {
    if (!environment) return 'Environment'
    return environment.charAt(0).toUpperCase() + environment.slice(1)
  }

  const loadDeployments = async () => {
    loading.value = true

    try {
      const result = await props.listDeploymentsService()
      const list = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
          ? result.data
          : Array.isArray(result?.body)
            ? result.body
            : []

      deployments.value = normalizeDeployments(list)

      if (paginatorFirst.value >= deployments.value.length && deployments.value.length > 0) {
        paginatorFirst.value = 0
      }
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to load deployments'
      })
      deployments.value = []
    } finally {
      loading.value = false
    }
  }

  const handleCancelDeployment = async (deployment) => {
    try {
      const { cancelDeploymentService } = await import('@/services/v2/deployment/deployment-mock')
      await cancelDeploymentService(deployment.id)
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Deployment canceled successfully'
      })
      await loadDeployments()
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to cancel deployment'
      })
    }
  }

  const handleCloneToDraftDeployment = async (deployment) => {
    try {
      const { cloneDeploymentToDraftService } =
        await import('@/services/v2/deployment/deployment-mock')
      await cloneDeploymentToDraftService(deployment.id)
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Deployment cloned to draft successfully'
      })
      await loadDeployments()
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to clone deployment to draft'
      })
    }
  }

  const handleBuildDeployment = async (deployment) => {
    try {
      const { buildDeploymentService } = await import('@/services/v2/deployment/deployment-mock')
      await buildDeploymentService(deployment.id)
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Deployment build started successfully'
      })
      await loadDeployments()
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to start deployment build'
      })
    }
  }

  const handleDeleteDeployment = async (deployment) => {
    try {
      const { deleteDeploymentService } = await import('@/services/v2/deployment/deployment-mock')
      await deleteDeploymentService(deployment.id)
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Deployment deleted successfully'
      })
      await loadDeployments()
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to delete deployment'
      })
    }
  }

  const handleReopenDeployment = async (deployment) => {
    try {
      const { reopenDeploymentService } = await import('@/services/v2/deployment/deployment-mock')
      await reopenDeploymentService(deployment.id)
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Deployment reopened as draft successfully'
      })
      await loadDeployments()
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to reopen deployment'
      })
    }
  }

  const handleRollbackDeployment = async (deployment) => {
    try {
      const { rollbackDeploymentService } = await import('@/services/v2/deployment/deployment-mock')
      await rollbackDeploymentService(deployment.id)
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Deployment rolled back successfully'
      })
      await loadDeployments()
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to rollback deployment'
      })
    }
  }

  const handlePromoteDeployment = async (deployment) => {
    try {
      const { promoteDeploymentService } = await import('@/services/v2/deployment/deployment-mock')
      await promoteDeploymentService(deployment.id)
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Deployment promoted successfully'
      })
      await loadDeployments()
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to promote deployment'
      })
    }
  }

  const getActions = (deployment) => {
    const status = getDeploymentStatus(deployment)

    if (status === 'ready') {
      const actions = [
        {
          label: 'Clone to draft',
          icon: 'pi pi-copy',
          commandAction: () => handleCloneToDraftDeployment(deployment)
        }
      ]

      actions.push(
        deployment.isCurrent
          ? {
              label: 'Rollback',
              icon: 'pi pi-undo',
              commandAction: () => handleRollbackDeployment(deployment)
            }
          : {
              label: 'Promote',
              icon: 'pi pi-arrow-up',
              commandAction: () => handlePromoteDeployment(deployment)
            }
      )

      return actions
    }

    if (status === 'draft') {
      return [
        {
          label: 'Build',
          icon: 'pi pi-play',
          commandAction: () => handleBuildDeployment(deployment)
        },
        {
          label: 'Delete',
          icon: 'pi pi-trash',
          commandAction: () => handleDeleteDeployment(deployment)
        }
      ]
    }

    if (status === 'error' || status === 'canceled') {
      return [
        {
          label: 'Reopen in draft',
          icon: 'pi pi-refresh',
          commandAction: () => handleReopenDeployment(deployment)
        }
      ]
    }

    if (status === 'building') {
      return [
        {
          label: 'Cancel',
          icon: 'pi pi-times',
          commandAction: () => handleCancelDeployment(deployment)
        }
      ]
    }

    return []
  }

  const openRowMenu = (event, deployment) => {
    const actions = getActions(deployment)

    rowMenuItems.value = actions.length
      ? actions.map((action) => ({
          label: action.label,
          icon: action.icon,
          command: action.commandAction
        }))
      : [{ label: 'No actions available', icon: 'pi pi-info-circle', disabled: true }]

    rowMenuRef.value?.toggle(event)
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

  onMounted(loadDeployments)
</script>

<template>
  <ContentBlock data-testid="deployments-content-block">
    <template #heading>
      <PageHeadingBlock
        pageTitle="Deployments"
        description="View and manage your deployment history."
        data-testid="deployments-heading"
      />
    </template>
    <template #content>
      <GenericDataView
        :items="filteredDeployments"
        :hasDeployments="Boolean(deployments.length)"
        :loading="loading"
        :columns="columns"
        v-model:searchTerm="searchTerm"
        v-model:filterValues="filterValues"
        :filters="filters"
        :paginatorFirst="paginatorFirst"
        :paginatorRows="paginatorRows"
        searchPlaceholder="Search deployments"
        refreshAriaLabel="Refresh deployments"
        exportAriaLabel="Export deployments"
        selectColumnsAriaLabel="Select deployment columns"
        emptyTitle="No Deployments yet"
        emptyDescription="Deployments will appear here once you deploy your resources."
        filteredEmptyTitle="No deployments found"
        filteredEmptyDescription="Try changing your search or filters."
        rowActionsAriaLabel="Deployment actions"
        @refresh="loadDeployments"
        @page="onPage"
        @open-row-menu="({ event, deployment }) => openRowMenu(event, deployment)"
      >
        <template #cell-deployment="{ item: deployment }">
          <div class="min-w-0 flex-1">
            <p
              class="m-0 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-sm font-normal leading-6 text-[var(--text-color)]"
            >
              {{ deployment.hash || '--' }}
            </p>
            <div
              v-if="deployment.isCurrent"
              class="mt-1 inline-flex items-center gap-2 text-xs leading-6 text-[var(--text-color-secondary)]"
            >
              <span
                class="current-badge inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium leading-6"
              >
                <i class="pi pi-arrow-up" />
                Current
              </span>
            </div>
          </div>
        </template>

        <template #cell-environment="{ item: deployment }">
          <span
            class="environment-tag inline-flex items-center whitespace-nowrap rounded border border-[var(--surface-border)] px-2 py-0.5 text-xs font-medium leading-6 text-[var(--text-color)]"
          >
            {{ formatEnvironment(deployment.environment) }}
          </span>
        </template>

        <template #cell-status="{ item: deployment }">
          <span
            :class="[
              'inline-flex w-fit items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium leading-6',
              getStatusClass(deployment)
            ]"
          >
            <i :class="[getStatusIcon(deployment.status?.content), 'text-xs']" />
            {{ deployment.status?.content || 'Unknown' }}
          </span>
        </template>

        <template #cell-resource-pack="{ item: deployment }">
          <div class="flex min-w-0 flex-1 flex-col gap-1.5">
            <div
              v-for="resourceItem in getResourcePackRows(deployment)"
              :key="`${deployment.id}-${resourceItem.key}`"
              class="inline-flex min-w-0 items-center gap-1.5"
            >
              <i
                :class="resourceItem.icon"
                class="text-sm text-[var(--text-color-secondary)]"
              />
              <span class="text-xs leading-6 text-[var(--text-color-secondary)]"
                >{{ resourceItem.label }}:</span
              >
              <span class="overflow-hidden text-ellipsis whitespace-nowrap">{{
                resourceItem.name
              }}</span>
              <span
                class="resource-hash-tag whitespace-nowrap rounded border border-[var(--surface-border)] px-1.5 py-px font-mono text-[0.6875rem] leading-6 text-[var(--text-color-secondary)]"
              >
                {{ resourceItem.hash }}
              </span>
            </div>
            <span
              v-if="!getResourcePackRows(deployment).length"
              class="text-xs leading-6 text-[var(--text-color-secondary)]"
            >
              --
            </span>
          </div>
        </template>

        <template #cell-lastEditor="{ item: deployment }">
          <span class="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
            {{ deployment.lastEditor || '--' }}
          </span>
        </template>

        <template #cell-lastModified="{ item: deployment }">
          <span class="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
            {{ deployment.lastModified || '--' }}
          </span>
        </template>
      </GenericDataView>

      <Menu
        ref="rowMenuRef"
        :popup="true"
        :model="rowMenuItems"
      />
    </template>
  </ContentBlock>
</template>

<style scoped>
  .environment-tag,
  .resource-hash-tag {
    background: var(--surface-ground);
  }

  .status-success {
    background: color-mix(in srgb, var(--green-500, #22c55e) 12%, transparent);
    color: var(--green-500, #22c55e);
  }

  .status-warning {
    background: color-mix(in srgb, var(--yellow-500, #f59e0b) 12%, transparent);
    color: var(--yellow-500, #f59e0b);
  }

  .status-danger {
    background: color-mix(in srgb, var(--red-600, #dc2626) 12%, transparent);
    color: var(--red-600, #dc2626);
  }

  .status-info {
    background: color-mix(in srgb, var(--blue-500, #3b82f6) 12%, transparent);
    color: var(--blue-500, #3b82f6);
  }

  .status-secondary {
    background: color-mix(in srgb, var(--text-color-secondary) 12%, transparent);
    color: var(--text-color-secondary);
  }

  .current-badge {
    background: color-mix(in srgb, var(--blue-500, #3b82f6) 15%, transparent);
    color: var(--blue-500, #3b82f6);
  }
</style>
