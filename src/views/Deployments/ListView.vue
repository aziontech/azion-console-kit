<script setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import Menu from '@aziontech/webkit/menu'
  import Dropdown from '@aziontech/webkit/dropdown'
  import Calendar from '@aziontech/webkit/calendar'
  import PrimeButton from '@aziontech/webkit/button'
  import { useToast } from '@aziontech/webkit/use-toast'
  import GenericDataView from '@/views/DeploymentVersions/components/GenericDataView.vue'
  import { normalizeText } from '@/views/DeploymentVersions/helpers/deployment-status'
  import { deploymentService } from '@/services/v2/deployment/deployment-service'
  import DeploymentRowCell from '@/views/Deployments/components/DeploymentRowCell.vue'
  import StatusDurationCell from '@/views/Deployments/components/StatusDurationCell.vue'

  defineOptions({ name: 'list-deployments' })

  const toast = useToast()

  const deployments = ref([])
  const loading = ref(false)
  const paginatorFirst = ref(0)
  const paginatorRows = ref(10)

  const searchTerm = ref('')
  const filterValues = ref({
    status: 'all',
    environment: 'all'
  })
  const dateRange = ref(null)
  const sortBy = ref('lastModified')

  const rowMenuRef = ref(null)
  const rowMenuItems = ref([])
  const actionsMenuRef = ref(null)

  const statusAllOption = { label: 'All Status', value: 'all' }
  const environmentAllOption = { label: 'All Environments', value: 'all' }
  const sortOptions = [
    { label: 'Last modification', value: 'lastModified' },
    { label: 'Status', value: 'status' },
    { label: 'ID', value: 'id' }
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
      key: 'status',
      label: 'Status',
      headerClass: 'min-w-[160px] flex-[1.25_1_160px]',
      cellClass:
        'min-w-[160px] flex-[1.25_1_160px] max-lg:flex max-lg:min-w-0 max-lg:items-start max-lg:gap-4 max-sm:flex-col max-sm:gap-1'
    },
    {
      key: 'lastModified',
      label: 'Last Modified',
      headerClass: 'min-w-[170px] flex-[1.4_1_170px]',
      cellClass:
        'min-w-[170px] flex-[1.4_1_170px] max-lg:flex max-lg:min-w-0 max-lg:items-start max-lg:gap-4 max-sm:flex-col max-sm:gap-1',
      field: 'lastModified'
    },
    {
      key: 'lastEditor',
      label: 'Last Editor',
      headerClass: 'min-w-[180px] flex-[1.4_1_180px]',
      cellClass:
        'min-w-[180px] flex-[1.4_1_180px] max-lg:flex max-lg:min-w-0 max-lg:items-start max-lg:gap-4 max-sm:flex-col max-sm:gap-1',
      field: 'lastEditor'
    }
  ]

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
      key: 'environment',
      field: 'environment',
      placeholder: 'All Environments',
      options: environmentOptions.value,
      optionLabel: 'label',
      optionValue: 'value',
      defaultValue: 'all',
      allValue: 'all'
    },
    {
      key: 'status',
      field: 'status.content',
      placeholder: 'All Status',
      options: statusOptions.value,
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
      return normalizeText(itemValue) === normalizeText(selectedValue)
    })
  }

  const matchesDateRange = (deployment) => {
    const [from, to] = Array.isArray(dateRange.value) ? dateRange.value : []
    if (!from && !to) return true

    const reference = deployment.updated_at ? new Date(deployment.updated_at) : null
    if (!reference || Number.isNaN(reference.getTime())) return false

    if (from && reference < new Date(new Date(from).setHours(0, 0, 0, 0))) return false
    if (to && reference > new Date(new Date(to).setHours(23, 59, 59, 999))) return false
    return true
  }

  const compareDeployments = (deploymentA, deploymentB) => {
    switch (sortBy.value) {
      case 'status':
        return normalizeText(deploymentA.status?.content).localeCompare(
          normalizeText(deploymentB.status?.content)
        )
      case 'id':
        return normalizeText(deploymentA.id).localeCompare(normalizeText(deploymentB.id))
      case 'lastModified':
      default: {
        const dateA = deploymentA.updated_at ? new Date(deploymentA.updated_at).getTime() : 0
        const dateB = deploymentB.updated_at ? new Date(deploymentB.updated_at).getTime() : 0
        return dateB - dateA
      }
    }
  }

  const filteredDeployments = computed(() => {
    const normalizedSearch = normalizeText(searchTerm.value)
    const list = deployments.value.filter((deployment) => {
      const searchableValues = [
        deployment.id,
        deployment.name,
        deployment.environment,
        deployment.status?.content,
        deployment.lastEditor,
        deployment.lastModified
      ]

      const matchesSearch =
        !normalizedSearch ||
        searchableValues.some((value) => normalizeText(value).includes(normalizedSearch))

      return matchesSearch && matchesDropdownFilters(deployment) && matchesDateRange(deployment)
    })

    return [...list].sort(compareDeployments)
  })

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

  const openRowMenu = (event) => {
    rowMenuItems.value = [{ label: 'View details', icon: 'pi pi-eye', disabled: true }]
    rowMenuRef.value?.toggle(event)
  }

  const openActionsMenu = (event) => {
    actionsMenuRef.value?.toggle(event)
  }

  const actionsMenuItems = computed(() => [
    {
      label: 'Refresh',
      icon: 'pi pi-refresh',
      command: () => loadDeployments()
    },
    {
      label: 'Export',
      icon: 'pi pi-download',
      disabled: true
    },
    {
      label: 'Select Columns',
      icon: 'ai ai-column',
      disabled: true
    }
  ])

  const onPage = (event) => {
    paginatorFirst.value = event.first
    paginatorRows.value = event.rows
  }

  watch(
    [searchTerm, filterValues, dateRange, sortBy],
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
        searchPlaceholder="Search Deployments"
        refreshAriaLabel="Refresh deployments"
        exportAriaLabel="Export deployments"
        selectColumnsAriaLabel="Select deployment columns"
        emptyTitle="No Deployments yet"
        emptyDescription="Deployments will appear here once you trigger a deploy."
        filteredEmptyTitle="No deployments found"
        filteredEmptyDescription="Try changing your search or filters."
        rowActionsAriaLabel="Deployment actions"
        @refresh="loadDeployments"
        @page="onPage"
        @open-row-menu="({ event }) => openRowMenu(event)"
      >
        <template #toolbar-extras>
          <Calendar
            v-model="dateRange"
            selectionMode="range"
            placeholder="Select Date Range"
            showIcon
            :manualInput="false"
            class="dataview-control w-full sm:w-auto sm:min-w-[12rem]"
          />
          <Dropdown
            v-model="sortBy"
            :options="sortOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Last modification"
            class="dataview-control dataview-dropdown min-w-0 w-full sm:w-auto sm:min-w-[9.5rem]"
          />
        </template>

        <template #toolbar-actions>
          <PrimeButton
            icon="pi pi-ellipsis-h"
            outlined
            size="small"
            aria-label="More options"
            data-testid="deployments-more-actions"
            @click="openActionsMenu"
          />
        </template>

        <template #cell-deployment="{ item: deployment }">
          <DeploymentRowCell :deployment="deployment" />
        </template>

        <template #cell-status="{ item: deployment }">
          <StatusDurationCell
            :status="deployment.status"
            :duration="deployment.duration"
          />
        </template>

        <template #cell-lastModified="{ item: deployment }">
          <span class="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
            {{ deployment.lastModified || '--' }}
          </span>
        </template>

        <template #cell-lastEditor="{ item: deployment }">
          <span class="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
            {{ deployment.lastEditor || '--' }}
          </span>
        </template>
      </GenericDataView>

      <Menu
        ref="actionsMenuRef"
        :popup="true"
        :model="actionsMenuItems"
      />

      <Menu
        ref="rowMenuRef"
        :popup="true"
        :model="rowMenuItems"
      />
    </template>
  </ContentBlock>
</template>
