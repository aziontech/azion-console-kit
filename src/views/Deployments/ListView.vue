<script setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import DataView from 'primevue/dataview'
  import PrimeButton from '@aziontech/webkit/button'
  import Dropdown from '@aziontech/webkit/dropdown'
  import Menu from '@aziontech/webkit/menu'
  import Skeleton from '@aziontech/webkit/skeleton'
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
  const selectedStatus = ref('all')
  const selectedCurrent = ref('all')

  const rowMenuRef = ref(null)
  const rowMenuItems = ref([])

  const statusAllOption = { label: 'All Status', value: 'all' }
  const currentOptions = [
    { label: 'All Versions', value: 'all' },
    { label: 'Only Current', value: 'current' }
  ]

  const textKeys = ['text', 'content', 'value', 'label', 'name', 'email']

  const statusIconMap = {
    Ready: 'pi pi-check-circle',
    Building: 'pi pi-spin pi-spinner',
    Draft: 'pi pi-clock',
    Error: 'pi pi-times-circle',
    Canceled: 'pi pi-ban'
  }

  const resourcePackTypeMeta = [
    { key: 'application', label: 'Application', icon: 'ai ai-edge-application' },
    { key: 'firewall', label: 'Firewall', icon: 'ai ai-edge-firewall' },
    { key: 'workload', label: 'Workload', icon: 'ai ai-workloads' }
  ]

  const getStatusIcon = (status) => statusIconMap[status] || 'pi pi-info-circle'
  const getStatusClass = (deployment) =>
    `status-pill status-${deployment?.status?.severity || 'secondary'}`

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

  const filteredDeployments = computed(() => {
    const normalizedSearch = normalizeText(searchTerm.value)
    const normalizedStatus = normalizeText(selectedStatus.value)

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

      const matchesStatus =
        normalizedStatus === 'all' || normalizeText(deployment.status?.content) === normalizedStatus

      const matchesCurrent = selectedCurrent.value !== 'current' || deployment.isCurrent

      return matchesSearch && matchesStatus && matchesCurrent
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

  const handleRedeployDeployment = async (deployment) => {
    try {
      const { redeployDeploymentService } = await import('@/services/v2/deployment/deployment-mock')
      await redeployDeploymentService(deployment.id)
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Deployment re-deployed successfully'
      })
      await loadDeployments()
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to re-deploy'
      })
    }
  }

  const getActions = (deployment) => {
    const actions = []

    if (deployment.status?.content === 'Building') {
      actions.push({
        label: 'Cancel',
        icon: 'pi pi-times',
        commandAction: () => handleCancelDeployment(deployment)
      })
    }

    if (!deployment.isCurrent) {
      actions.push({
        label: 'Re-deploy',
        icon: 'pi pi-refresh',
        commandAction: () => handleRedeployDeployment(deployment)
      })
    }

    return actions
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

  watch([searchTerm, selectedStatus, selectedCurrent], () => {
    paginatorFirst.value = 0
  })

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
      <div class="deployments-wrapper">
        <div class="deployments-toolbar">
          <div class="toolbar-left">
            <span class="search-shell">
              <i class="pi pi-search" />
              <input
                v-model="searchTerm"
                type="text"
                placeholder="Search deployments"
              />
            </span>
            <Dropdown
              v-model="selectedStatus"
              :options="statusOptions"
              optionLabel="label"
              optionValue="value"
              class="quick-filter"
              placeholder="Status"
            />
            <Dropdown
              v-model="selectedCurrent"
              :options="currentOptions"
              optionLabel="label"
              optionValue="value"
              class="quick-filter"
              placeholder="Current"
            />
          </div>

          <div class="toolbar-right">
            <PrimeButton
              icon="pi pi-refresh"
              outlined
              size="small"
              aria-label="Refresh deployments"
              @click="loadDeployments"
            />
            <PrimeButton
              icon="pi pi-download"
              outlined
              size="small"
              disabled
              aria-label="Export deployments"
            />
            <PrimeButton
              icon="ai ai-column"
              outlined
              size="small"
              disabled
              aria-label="Select deployment columns"
            />
          </div>
        </div>

        <div
          v-if="loading"
          class="deployments-loading"
        >
          <div
            v-for="item in 5"
            :key="item"
            class="loading-row"
          >
            <Skeleton class="h-16 w-full" />
          </div>
        </div>

        <div
          v-else-if="!deployments.length"
          class="deployments-empty"
        >
          <h3>No Deployments yet</h3>
          <p>Deployments will appear here once you deploy your resources.</p>
        </div>

        <div
          v-else-if="!filteredDeployments.length"
          class="deployments-empty"
        >
          <h3>No deployments found</h3>
          <p>Try changing your search or filters.</p>
        </div>

        <div
          v-else
          class="deployments-table"
        >
          <div class="deployments-header">
            <span>Deployment</span>
            <span>Status</span>
            <span>Resource Pack</span>
            <span>Last Editor</span>
            <span>Last Modified</span>
            <span class="header-actions" />
          </div>

          <DataView
            :value="filteredDeployments"
            dataKey="id"
            paginator
            :rows="paginatorRows"
            :first="paginatorFirst"
            :rowsPerPageOptions="[10, 20, 50]"
            paginator-template="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown JumpToPageInput"
            current-page-report-template="Showing {first} to {last} of {totalRecords} entries"
            @page="onPage"
          >
            <template #list="{ data: deployment }">
              <div class="deployment-row">
                <div
                  class="cell deployment-cell"
                  data-label="Deployment"
                >
                  <p class="hash">{{ deployment.hash || '--' }}</p>
                  <div class="deployment-meta">
                    <span>{{ formatEnvironment(deployment.environment) }}</span>
                    <span
                      v-if="deployment.isCurrent"
                      class="current-badge"
                    >
                      <i class="pi pi-arrow-up" /> Current
                    </span>
                  </div>
                </div>

                <div
                  class="cell status-cell"
                  data-label="Status"
                >
                  <span :class="getStatusClass(deployment)">
                    <i
                      :class="getStatusIcon(deployment.status?.content)"
                      class="status-icon"
                    />
                    {{ deployment.status?.content || 'Unknown' }}
                  </span>
                </div>

                <div
                  class="cell resource-pack-cell"
                  data-label="Resource Pack"
                >
                  <div
                    v-for="resourceItem in getResourcePackRows(deployment)"
                    :key="`${deployment.id}-${resourceItem.key}`"
                    class="resource-pack-item"
                  >
                    <i :class="resourceItem.icon" />
                    <span class="resource-pack-label">{{ resourceItem.label }}:</span>
                    <span class="resource-pack-value">{{ resourceItem.name }}</span>
                    <span class="resource-pack-hash-tag">{{ resourceItem.hash }}</span>
                  </div>
                  <span
                    v-if="!getResourcePackRows(deployment).length"
                    class="resource-pack-empty"
                  >
                    --
                  </span>
                </div>

                <div
                  class="cell editor-cell"
                  data-label="Last Editor"
                >
                  <span>{{ deployment.lastEditor || '--' }}</span>
                </div>

                <div
                  class="cell modified-cell"
                  data-label="Last Modified"
                >
                  <span>{{ deployment.lastModified || '--' }}</span>
                </div>

                <div class="cell actions-cell">
                  <PrimeButton
                    icon="pi pi-ellipsis-v"
                    text
                    rounded
                    size="small"
                    aria-label="Deployment actions"
                    @click="openRowMenu($event, deployment)"
                  />
                </div>
              </div>
            </template>
          </DataView>
        </div>
      </div>

      <Menu
        ref="rowMenuRef"
        :popup="true"
        :model="rowMenuItems"
      />
    </template>
  </ContentBlock>
</template>

<style scoped>
  .deployments-wrapper {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    color: var(--text-color);
  }

  .deployments-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .toolbar-left,
  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .search-shell {
    min-height: 2.5rem;
    min-width: 20rem;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    border: 1px solid var(--surface-border);
    border-radius: 0.375rem;
    padding: 0.25rem 0.75rem;
    background: var(--surface-section);
    color: var(--text-color);
    transition: border-color 0.15s ease;
  }

  .search-shell:focus-within {
    border-color: var(--primary-color);
  }

  .quick-filter {
    min-width: 9.5rem;
  }

  .quick-filter:deep(.p-dropdown) {
    min-height: 2.5rem;
  }

  .search-shell input {
    width: 100%;
    background: transparent;
    border: none;
    color: var(--text-color);
    outline: none;
    font: inherit;
    font-size: 0.875rem;
    line-height: 1.5;
  }

  .search-shell input::placeholder {
    color: var(--text-color-secondary);
  }

  .deployments-loading {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .loading-row :deep(.p-skeleton) {
    border-radius: 0.375rem;
  }

  .deployments-empty {
    border: 1px solid var(--surface-border);
    border-radius: 0.375rem;
    padding: 1.5rem;
    background: var(--surface-section);
    text-align: center;
    color: var(--text-color-secondary);
  }

  .deployments-empty h3 {
    margin: 0;
    color: var(--text-color);
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.5;
  }

  .deployments-empty p {
    margin: 0.5rem 0 0;
    font-size: 0.875rem;
    line-height: 1.5;
  }

  .deployments-table {
    border: 1px solid var(--surface-border);
    border-radius: 0.375rem;
    background: var(--surface-section);
    overflow: hidden;
  }

  .deployments-header,
  .deployment-row {
    display: grid;
    grid-template-columns:
      minmax(170px, 2.1fr) minmax(120px, 1.3fr) minmax(320px, 2.5fr) minmax(180px, 1.5fr)
      minmax(170px, 1.4fr) 44px;
    gap: 0.75rem;
    align-items: center;
    padding: 0.75rem 1rem;
  }

  .deployments-header {
    background: var(--table-header-color, var(--surface-section));
    border-bottom: 1px solid var(--surface-border);
    font-family: 'Proto Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--text-color-secondary);
    text-transform: uppercase;
    letter-spacing: 0.0625rem;
  }

  .deployment-row {
    border-bottom: 1px solid var(--surface-border);
    min-height: 4.5rem;
    background: var(--surface-section);
    font-size: 0.875rem;
    line-height: 1.5;
  }

  .deployment-row:hover {
    background: var(--table-body-row-hover-bg, var(--surface-ground));
  }

  .deployment-row:last-child {
    border-bottom: none;
  }

  .cell {
    min-width: 0;
  }

  .hash {
    margin: 0;
    font-family: 'Roboto Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.875rem;
    font-weight: 400;
    line-height: 1.5;
    color: var(--text-color);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .deployment-meta {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.25rem;
    color: var(--text-color-secondary);
    font-size: 0.75rem;
    line-height: 1.5;
  }

  .current-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    border-radius: 0.25rem;
    padding: 0.125rem 0.375rem;
    background: #092435d9;
    color: #2287c5;
    font-size: 0.75rem;
    font-weight: 500;
    line-height: 1.5;
  }

  .status-pill {
    display: inline-flex;
    align-items: center;
    width: fit-content;
    gap: 0.375rem;
    border-radius: 0.25rem;
    padding: 0.125rem 0.5rem;
    font-size: 0.75rem;
    font-weight: 500;
    line-height: 1.5;
  }

  .status-pill i {
    font-size: 0.75rem;
  }

  .status-icon.pi-spinner {
    animation: status-icon-rotate 1s linear infinite;
  }

  @keyframes status-icon-rotate {
    from {
      transform: rotate(0deg);
    }

    to {
      transform: rotate(360deg);
    }
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

  .resource-pack-item i {
    color: var(--text-color-secondary);
    font-size: 0.875rem;
  }

  .resource-pack-cell {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    min-width: 0;
  }

  .resource-pack-item {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    min-width: 0;
  }

  .resource-pack-label {
    color: var(--text-color-secondary);
    font-size: 0.75rem;
    line-height: 1.5;
  }

  .resource-pack-value {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .resource-pack-hash-tag {
    border: 1px solid var(--surface-border);
    border-radius: 4px;
    padding: 0.0625rem 0.375rem;
    background: var(--surface-ground);
    color: var(--text-color-secondary);
    font-size: 0.6875rem;
    line-height: 1.5;
    white-space: nowrap;
    font-family: 'Roboto Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }

  .resource-pack-empty {
    font-size: 0.75rem;
    line-height: 1.5;
    color: var(--text-color-secondary);
  }

  .actions-cell {
    display: flex;
    justify-content: flex-end;
  }

  .deployments-table :deep(.p-dataview-content) {
    background: transparent;
    color: var(--text-color);
  }

  .deployments-table :deep(.p-dataview-emptymessage) {
    color: var(--text-color-secondary);
  }

  .deployments-table :deep(.p-paginator) {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    border: 0;
    border-top: 1px solid var(--surface-border);

    background: var(--surface-section);
    border-radius: 0;
    color: var(--text-color-secondary);
    min-height: 3rem;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    line-height: 1.5;
  }

  .deployments-table :deep(.p-paginator .p-paginator-current) {
    margin: 0 0.5rem 0 0;
    color: var(--text-color-secondary);
    font-weight: 400;
  }

  .deployments-table :deep(.p-paginator .p-paginator-page),
  .deployments-table :deep(.p-paginator .p-paginator-first),
  .deployments-table :deep(.p-paginator .p-paginator-prev),
  .deployments-table :deep(.p-paginator .p-paginator-next),
  .deployments-table :deep(.p-paginator .p-paginator-last) {
    min-width: 2rem;
    width: 2rem;
    height: 2rem;
    margin: 0;
    border: 0;
    border-radius: 0.375rem;
    background: transparent;
    color: var(--text-color-secondary);
  }

  .deployments-table :deep(.p-paginator .p-highlight) {
    background: var(--surface-hover);
    color: var(--text-color);
  }

  .deployments-table :deep(.p-dropdown) {
    height: 2rem;
    margin-left: 0.25rem;
    border-color: var(--surface-border);
    border-radius: 0.375rem;
    background: var(--surface-section);
    color: var(--text-color);
  }

  .deployments-table :deep(.p-dropdown .p-dropdown-label) {
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
    line-height: 1.5;
  }

  .deployments-table :deep(.p-paginator .p-inputtext) {
    width: 2rem;
    height: 2rem;
    padding: 0.25rem;
    border-color: var(--surface-border);
    border-radius: 0.375rem;
    background: var(--surface-section);
    color: var(--text-color);
    text-align: center;
  }

  @media (max-width: 1024px) {
    .deployments-header {
      display: none;
    }

    .deployment-row {
      grid-template-columns: 1fr;
      gap: 0.75rem;
      padding: 1rem;
      min-height: auto;
    }

    .cell {
      display: grid;
      grid-template-columns: minmax(7.5rem, 35%) 1fr;
      justify-content: space-between;
      align-items: start;
      gap: 1rem;
    }

    .cell::before {
      content: attr(data-label);
      font-family: 'Proto Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.625rem;
      font-weight: 400;
      line-height: 1.5;
      letter-spacing: 0.0625rem;
      text-transform: uppercase;
      color: var(--text-color-secondary);
    }

    .deployment-cell,
    .resource-pack-cell {
      align-items: flex-start;
    }

    .deployment-cell > *,
    .resource-pack-cell > * {
      grid-column: 2;
    }

    .deployment-cell::before,
    .resource-pack-cell::before {
      grid-column: 1;
      grid-row: 1 / span 2;
    }

    .actions-cell {
      display: flex;
      justify-content: flex-end;
    }

    .actions-cell::before {
      content: none;
    }
  }

  @media (max-width: 640px) {
    .search-shell {
      min-width: 0;
      width: 100%;
    }

    .quick-filter {
      width: 100%;
      min-width: 0;
    }

    .toolbar-left,
    .toolbar-right {
      width: 100%;
    }

    .toolbar-right {
      justify-content: flex-end;
    }

    .cell {
      grid-template-columns: 1fr;
      gap: 0.25rem;
    }

    .cell::before,
    .deployment-cell::before,
    .resource-pack-cell::before {
      grid-column: 1;
      grid-row: auto;
    }

    .deployment-cell > *,
    .resource-pack-cell > * {
      grid-column: 1;
    }
  }
</style>
