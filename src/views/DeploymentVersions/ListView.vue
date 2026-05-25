<script setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import Menu from '@aziontech/webkit/menu'
  import GenericDataView from '@/views/DeploymentVersions/components/GenericDataView.vue'
  import ResourcePackCell from '@/views/DeploymentVersions/components/ResourcePackCell.vue'
  import StatusTag from '@/views/DeploymentVersions/components/StatusTag.vue'
  import EnvironmentTag from '@/views/DeploymentVersions/components/EnvironmentTag.vue'
  import CurrentBadge from '@/views/DeploymentVersions/components/CurrentBadge.vue'
  import { useToast } from '@aziontech/webkit/use-toast'
  import { DataTableActionsButtons } from '@/components/list-table'
  import DeploymentVersionsDrawer from '@/views/DeploymentVersions/Drawer'
  import {
    getDeploymentStatus,
    getResourcePackRows,
    getResourcePackDisplay,
    normalizeText
  } from '@/views/DeploymentVersions/helpers/deployment-status'
  import { deploymentService } from '@/services/v2/deployment/deployment-service'

  defineOptions({ name: 'list-deployment-versions' })

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
      headerClass: 'min-w-[280px] flex-[2.5_1_280px]',
      cellClass:
        'min-w-[280px] flex-[2.5_1_280px] max-lg:flex max-lg:min-w-0 max-lg:items-start max-lg:gap-4 max-sm:flex-col max-sm:gap-1'
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

  const drawerRef = ref(null)

  const handleOpenCreateDrawer = () => {
    drawerRef.value?.openCreateDrawer()
  }

  const handleOpenEditDrawer = (deployment) => {
    drawerRef.value?.openEditDrawer(deployment)
  }

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
        deployment.name,
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

  const getResourcePackSearchText = (deployment) => {
    return getResourcePackRows(deployment)
      .map((entry) => `${entry.label} ${entry.name} ${entry.hash}`)
      .join(' ')
  }

  const formatEnvironment = (environment) => {
    if (!environment) return 'Environment'
    return environment.charAt(0).toUpperCase() + environment.slice(1)
  }

  const loadDeployments = async () => {
    loading.value = true

    try {
      const result = await deploymentService.listDeploymentsService()
      deployments.value = Array.isArray(result?.body) ? result.body : []

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

  const handleDeleteDeployment = async (deployment) => {
    try {
      await deploymentService.deleteDeploymentService(deployment.id)
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

  const getActions = (deployment) => {
    const status = getDeploymentStatus(deployment)

    if (status === 'draft') {
      return [
        {
          label: 'Delete',
          icon: 'pi pi-trash',
          commandAction: () => handleDeleteDeployment(deployment)
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
  <ContentBlock data-testid="deployment-versions-content-block">
    <template #heading>
      <PageHeadingBlock
        pageTitle="Deployment Versions"
        description="View and manage your deployment history."
        data-testid="deployment-versions-heading"
      >
        <template #default>
          <DataTableActionsButtons
            size="small"
            label="Deployment Version"
            @click="handleOpenCreateDrawer"
            data-testid="create_deployment_version_button"
          />
        </template>
      </PageHeadingBlock>
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
        emptyTitle="No Deployment Versions yet"
        emptyDescription="Deployment versions will appear here once you deploy your resources."
        filteredEmptyTitle="No deployment versions found"
        filteredEmptyDescription="Try changing your search or filters."
        rowActionsAriaLabel="Deployment actions"
        @refresh="loadDeployments"
        @page="onPage"
        @open-row-menu="({ event, deployment }) => openRowMenu(event, deployment)"
      >
        <template #cell-deployment="{ item: deployment }">
          <div class="min-w-0 flex flex-col gap-1">
            <div class="flex min-w-0 items-center gap-2">
              <button
                type="button"
                class="deployment-name-button m-0 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-left text-sm font-medium leading-6 text-[var(--text-color)] hover:text-[var(--primary-color)] focus-visible:text-[var(--primary-color)] focus-visible:outline-none"
                :data-testid="`deployment-row-open__${deployment.id}`"
                @click="handleOpenEditDrawer(deployment)"
              >
                {{ deployment.name || '--' }}
              </button>
              <CurrentBadge v-if="deployment.isCurrent" />
            </div>
          </div>
        </template>

        <template #cell-environment="{ item: deployment }">
          <EnvironmentTag :environment="deployment.environment" />
        </template>

        <template #cell-status="{ item: deployment }">
          <StatusTag :status="deployment.status" />
        </template>

        <template #cell-resource-pack="{ item: deployment }">
          <ResourcePackCell :display="getResourcePackDisplay(deployment)" />
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

  <DeploymentVersionsDrawer
    ref="drawerRef"
    @onSuccess="loadDeployments"
  />
</template>

<style scoped>
  .deployment-name-button {
    background: transparent;
    border: 0;
    padding: 0;
    cursor: pointer;
    font: inherit;
  }
</style>
