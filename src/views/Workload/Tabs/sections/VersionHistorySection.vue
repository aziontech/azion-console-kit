<script setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import Menu from '@aziontech/webkit/menu'
  import { useToast } from '@aziontech/webkit/use-toast'
  import Tag from '@aziontech/webkit/prime-tag'
  import GenericDataView from '@/components/GenericDataView'
  import ResourcePackCell from '@/components/ResourcePackCell'
  import StatusTag from '@/components/StatusTag'
  import CurrentBadge from '@/components/CurrentBadge'
  import {
    getDeploymentStatus,
    getResourcePackDisplay,
    normalizeText
  } from '@/helpers/deployment-status'
  import { listWorkloadVersionsService } from '@/services/v2/workload/workload-versions-mock'

  defineOptions({ name: 'workload-version-history-section' })

  const props = defineProps({
    workloadId: { type: [String, Number], required: true }
  })

  const toast = useToast()

  const versions = ref([])
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
    { label: 'Only Live', value: 'current' }
  ]

  const columns = [
    { key: 'version', label: 'Version', size: 'minmax(260px, 2.5fr)', align: 'start' },
    {
      key: 'environment',
      label: 'Environment',
      size: 'minmax(130px, 1.1fr)',
      align: 'start',
      field: 'environment'
    },
    { key: 'status', label: 'Status', size: 'minmax(120px, 1.25fr)', align: 'start' },
    {
      key: 'resource-pack',
      label: 'Resource Pack',
      size: 'minmax(320px, 2.5fr)',
      align: 'start'
    },
    {
      key: 'author',
      label: 'Created by',
      size: 'minmax(180px, 1.4fr)',
      align: 'start',
      field: 'author'
    },
    {
      key: 'createdAt',
      label: 'Last Modified',
      size: 'minmax(170px, 1.4fr)',
      align: 'start',
      field: 'createdAt'
    }
  ]

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
    const environments = Array.from(
      new Set(versions.value.map((version) => version.environment).filter(Boolean))
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
      placeholder: 'Live',
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

  const matchesDropdownFilters = (version) => {
    return filters.value.every((filter) => {
      const selectedValue = filterValues.value?.[filter.key] ?? filter.defaultValue

      if (selectedValue === filter.allValue) return true

      const itemValue = getValueByPath(version, filter.field)

      if (typeof filter.matcher === 'function') {
        return filter.matcher(itemValue, selectedValue, version)
      }

      return normalizeText(itemValue) === normalizeText(selectedValue)
    })
  }

  const getResourcePackSearchText = (version) => {
    const pack = version?.resourcePack || {}
    return Object.entries(pack)
      .map(([kind, entry]) => `${kind} ${entry?.name || ''} ${entry?.hash || ''}`)
      .join(' ')
  }

  const filteredVersions = computed(() => {
    const normalizedSearch = normalizeText(searchTerm.value)
    return versions.value.filter((version) => {
      const searchableValues = [
        version.id,
        version.tag,
        version.name,
        version.note,
        version.environment,
        version.status?.content,
        version.author,
        version.createdAt,
        getResourcePackSearchText(version)
      ]

      const matchesSearch =
        !normalizedSearch ||
        searchableValues.some((value) => normalizeText(value).includes(normalizedSearch))

      return matchesSearch && matchesDropdownFilters(version)
    })
  })

  const formatEnvironment = (environment) => {
    if (!environment) return 'Environment'
    return environment.charAt(0).toUpperCase() + environment.slice(1)
  }

  const loadVersions = async () => {
    loading.value = true
    try {
      const result = await listWorkloadVersionsService(props.workloadId)
      versions.value = Array.isArray(result?.body) ? result.body : []

      if (paginatorFirst.value >= versions.value.length && versions.value.length > 0) {
        paginatorFirst.value = 0
      }
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error?.message || 'Failed to load versions'
      })
      versions.value = []
    } finally {
      loading.value = false
    }
  }

  const handlePromoteVersion = (version) => {
    toast.add({
      severity: 'info',
      summary: 'Coming soon',
      detail: `Promote ${version.tag} — mock action`,
      life: 2000
    })
  }

  const handleRollbackVersion = (version) => {
    toast.add({
      severity: 'info',
      summary: 'Coming soon',
      detail: `Rollback to ${version.tag} — mock action`,
      life: 2000
    })
  }

  const handleViewVersion = (version) => {
    toast.add({
      severity: 'info',
      summary: 'Coming soon',
      detail: `Open ${version.tag} details — mock action`,
      life: 2000
    })
  }

  const handleDeleteVersion = (version) => {
    toast.add({
      severity: 'info',
      summary: 'Coming soon',
      detail: `Delete ${version.tag} — mock action`,
      life: 2000
    })
  }

  const getActions = (version) => {
    const status = getDeploymentStatus(version)
    const actions = [
      { label: 'View details', icon: 'pi pi-eye', commandAction: () => handleViewVersion(version) }
    ]

    if (status === 'ready') {
      actions.push(
        version.isCurrent
          ? {
              label: 'Rollback',
              icon: 'pi pi-undo',
              commandAction: () => handleRollbackVersion(version)
            }
          : {
              label: 'Promote',
              icon: 'pi pi-arrow-up',
              commandAction: () => handlePromoteVersion(version)
            }
      )
    }

    if (status === 'draft' || status === 'canceled' || status === 'error') {
      actions.push({
        label: 'Delete',
        icon: 'pi pi-trash',
        commandAction: () => handleDeleteVersion(version)
      })
    }

    return actions
  }

  const openRowMenu = (event, version) => {
    const actions = getActions(version)

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

  watch(() => props.workloadId, loadVersions)

  onMounted(loadVersions)
</script>

<template>
  <GenericDataView
    :items="filteredVersions"
    :hasDeployments="Boolean(versions.length)"
    :loading="loading"
    :columns="columns"
    v-model:searchTerm="searchTerm"
    v-model:filterValues="filterValues"
    :filters="filters"
    :paginatorFirst="paginatorFirst"
    :paginatorRows="paginatorRows"
    searchPlaceholder="Search versions"
    refreshAriaLabel="Refresh versions"
    exportAriaLabel="Export versions"
    selectColumnsAriaLabel="Select version columns"
    emptyTitle="No versions yet"
    emptyDescription="Versions will appear here once you build them for this Workload."
    filteredEmptyTitle="No versions found"
    filteredEmptyDescription="Try changing your search or filters."
    rowActionsAriaLabel="Version actions"
    @refresh="loadVersions"
    @page="onPage"
    @open-row-menu="({ event, deployment }) => openRowMenu(event, deployment)"
  >
    <template #cell-version="{ item: version }">
      <div class="min-w-0 flex flex-col gap-1">
        <div class="flex min-w-0 items-center gap-2">
          <Tag
            severity="primary"
            :value="version.tag"
          />
          <CurrentBadge
            v-if="version.isCurrent"
            label="Live"
          />
        </div>
        <span
          v-if="version.note"
          class="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-xs text-[var(--text-color-secondary)]"
          :title="version.note"
        >
          {{ version.note }}
        </span>
      </div>
    </template>

    <template #cell-environment="{ item: version }">
      <Tag
        severity="info"
        :value="formatEnvironment(version.environment)"
      />
    </template>

    <template #cell-status="{ item: version }">
      <StatusTag :status="version.status" />
    </template>

    <template #cell-resource-pack="{ item: version }">
      <ResourcePackCell :display="getResourcePackDisplay(version)" />
    </template>

    <template #cell-author="{ item: version }">
      <span class="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
        {{ version.author || '--' }}
      </span>
    </template>

    <template #cell-createdAt="{ item: version }">
      <span class="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
        {{ version.createdAt || '--' }}
      </span>
    </template>
  </GenericDataView>

  <Menu
    ref="rowMenuRef"
    :popup="true"
    :model="rowMenuItems"
  />
</template>
