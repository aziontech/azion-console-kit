<script setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import { watchDebounced } from '@vueuse/core'
  import { useToast } from '@aziontech/webkit/use-toast'
  import Menu from '@aziontech/webkit/menu'
  import GenericDataView from '@/components/GenericDataView'
  import { deploymentService } from '@/services/v2/deployment/deployment-service'
  import { mapPolicyToLabel } from '@/services/v2/deployment/deployment-adapter'
  import { useDeleteDialog } from '@/composables/useDeleteDialog'
  import MessageCard from '@/components/MessageCard'
  import InlineTag from '@/components/InlineTag'
  import ResourceTypesList from '@/views/Deployments/components/ResourceTypesList.vue'
  import EditorAvatarCell from '@/views/Deployments/components/EditorAvatarCell.vue'

  defineOptions({ name: 'deployments-overview-tab' })

  const toast = useToast()
  const router = useRouter()
  const { openDeleteDialog } = useDeleteDialog()

  const deployments = ref([])
  const totalRecords = ref(0)
  const loading = ref(false)

  const paginatorFirst = ref(0)
  const paginatorRows = ref(10)
  const searchTerm = ref('')
  const appliedFilters = ref([])
  const sortField = ref('lastModified')
  const sortOrder = ref(-1)

  const rowMenuRef = ref(null)
  const rowMenuItems = ref([])

  const allowedFilters = [
    { field: 'name', header: 'Name', filterPath: 'name' },
    { field: 'id', header: 'ID', filterPath: 'id' },
    { field: 'policy', header: 'Policy' },
    { field: 'state', header: 'Status' },
    { field: 'last_editor', header: 'Last Editor' }
  ]

  const columns = computed(() => [
    {
      key: 'deployment',
      label: 'Deployment',
      headerClass: 'min-w-[220px] flex-[2_1_220px]',
      cellClass:
        'min-w-[220px] flex-[2_1_220px] max-lg:flex max-lg:min-w-0 max-lg:items-start max-lg:gap-4 max-sm:flex-col max-sm:gap-1'
    },
    {
      key: 'resources',
      label: 'Resources',
      headerClass: 'min-w-[200px] flex-[1.6_1_200px]',
      cellClass:
        'min-w-[200px] flex-[1.6_1_200px] max-lg:flex max-lg:min-w-0 max-lg:items-start max-lg:gap-4 max-sm:flex-col max-sm:gap-1'
    },
    {
      key: 'lastModified',
      label: 'Last Modified',
      headerClass: 'min-w-[180px] flex-[1.2_1_180px] flex items-center justify-end',
      cellClass:
        'min-w-[180px] flex-[1.2_1_180px] flex justify-end max-lg:flex max-lg:min-w-0 max-lg:items-start max-lg:gap-4 max-lg:justify-start max-sm:flex-col max-sm:gap-1'
    },
    {
      key: 'lastEditor',
      label: 'Last Editor',
      headerClass: 'min-w-[220px] flex-[1.4_1_220px] flex items-center justify-end',
      cellClass:
        'min-w-[220px] flex-[1.4_1_220px] flex justify-end max-lg:flex max-lg:min-w-0 max-lg:items-start max-lg:gap-4 max-lg:justify-start max-sm:flex-col max-sm:gap-1'
    }
  ])

  const sortFieldMap = {
    deployment: 'name',
    lastModified: 'last_modified',
    status: 'active',
    lastEditor: 'last_editor'
  }

  const buildOrdering = () => {
    if (!sortField.value) return undefined
    const backendField = sortFieldMap[sortField.value] || sortField.value
    return sortOrder.value === -1 ? `-${backendField}` : backendField
  }

  const buildFilterParams = () =>
    appliedFilters.value.reduce((acc, filter) => {
      if (filter?.field !== undefined && filter?.value !== undefined && filter?.value !== '') {
        acc[filter.field] = filter.value
      }
      return acc
    }, {})

  const loadDeployments = async () => {
    loading.value = true
    try {
      const filterParams = buildFilterParams()
      const result = await deploymentService.listDeploymentsService({
        page: Math.floor(paginatorFirst.value / paginatorRows.value) + 1,
        pageSize: paginatorRows.value,
        search: searchTerm.value?.trim() || undefined,
        ordering: buildOrdering(),
        hasFilter: appliedFilters.value.length > 0,
        skipCache: appliedFilters.value.length > 0 || !!searchTerm.value?.trim(),
        ...filterParams
      })
      deployments.value = Array.isArray(result?.body) ? result.body : []
      totalRecords.value =
        typeof result?.count === 'number' ? result.count : deployments.value.length
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: 'Error',
        detail: error?.message || 'Failed to load deployments'
      })
      deployments.value = []
      totalRecords.value = 0
    } finally {
      loading.value = false
    }
  }

  const goToDetails = (deployment) => {
    if (!deployment?.id) return
    router.push(`/deployments/edit/${deployment.id}`)
  }

  const cloneDeployment = (deployment) => {
    if (!deployment?.id) return
    router.push({ path: '/deployments/create', query: { cloneFrom: deployment.id } })
  }

  const handleDelete = (deployment) => {
    if (!deployment?.id) return
    openDeleteDialog({
      title: 'Deployment',
      id: deployment.id,
      data: deployment,
      deleteService: deploymentService.deleteDeploymentService,
      successCallback: loadDeployments
    })
  }

  const openRowMenu = ({ event, deployment }) => {
    rowMenuItems.value = [
      { label: 'Edit', icon: 'pi pi-pencil', command: () => goToDetails(deployment) },
      { label: 'Clone', icon: 'pi pi-copy', command: () => cloneDeployment(deployment) },
      { label: 'Delete', icon: 'pi pi-trash', command: () => handleDelete(deployment) }
    ]
    rowMenuRef.value?.toggle?.(event)
  }

  const onPage = (event) => {
    paginatorFirst.value = event.first
    paginatorRows.value = event.rows
  }

  const onApplyFilter = (filterData) => {
    if (!filterData?.field) return
    const hasValue =
      filterData.value !== null && filterData.value !== undefined && filterData.value !== ''
    if (!hasValue) return

    const next = {
      field: filterData.field,
      label: filterData.label,
      value: filterData.value,
      matchMode: filterData.label === 'name' ? 'contains' : 'is'
    }
    const idx = appliedFilters.value.findIndex((entry) => entry.field === filterData.field)
    if (idx !== -1) {
      const copy = [...appliedFilters.value]
      copy[idx] = next
      appliedFilters.value = copy
    } else {
      appliedFilters.value = [...appliedFilters.value, next]
    }
  }

  const onRemoveFilter = (payload) => {
    const field = typeof payload === 'string' ? payload : payload?.field
    if (!field) return
    appliedFilters.value = appliedFilters.value.filter((entry) => entry.field !== field)
  }

  watch([searchTerm, appliedFilters], () => {
    paginatorFirst.value = 0
  })

  watchDebounced([searchTerm], () => loadDeployments(), { debounce: 350, deep: true })

  watch(
    [appliedFilters, sortField, sortOrder, paginatorFirst, paginatorRows],
    () => loadDeployments(),
    { deep: true }
  )

  onMounted(loadDeployments)
</script>

<template>
  <div class="flex flex-col gap-4 mt-4">
    <MessageCard
      type="info"
      title="Deployment Settings are reusable across Workloads"
      description="Create and manage deployment configurations once, then apply them to multiple workloads and environments."
      data-testid="deployments-overview__notice"
    />

    <GenericDataView
      :items="deployments"
      :hasDeployments="Boolean(deployments.length) || appliedFilters.length > 0 || !!searchTerm"
      :loading="loading"
      :columns="columns"
      :allowedFilters="allowedFilters"
      :appliedFilters="appliedFilters"
      :primaryColumnKey="'deployment'"
      :lazy="true"
      :totalRecords="totalRecords"
      :paginatorFirst="paginatorFirst"
      :paginatorRows="paginatorRows"
      :toolbarMode="'compact'"
      :showHeader="false"
      v-model:searchTerm="searchTerm"
      searchPlaceholder="Search Deployments"
      emptyTitle="No Deployments yet"
      emptyDescription="Deployments will appear here once you trigger a deploy."
      filteredEmptyTitle="No deployments found"
      filteredEmptyDescription="Try changing your search or filters."
      rowActionsAriaLabel="Deployment actions"
      filterButtonAriaLabel="Filter Deployments"
      overflowMenuAriaLabel="More deployment actions"
      @refresh="loadDeployments"
      @page="onPage"
      @apply-filter="onApplyFilter"
      @remove-filter="onRemoveFilter"
      @row-primary-click="goToDetails"
      @open-row-menu="openRowMenu"
    >
      <template #cell-deployment="{ item: deployment, onPrimaryClick }">
        <div class="min-w-0 flex flex-col gap-1">
          <button
            type="button"
            class="deployment-name-button m-0 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-left text-sm font-medium leading-6 text-[var(--text-color)] hover:text-[var(--primary-color)] hover:underline focus-visible:text-[var(--primary-color)] focus-visible:outline-none"
            :data-testid="`deployment-row__name-${deployment.id}`"
            @click="onPrimaryClick"
          >
            {{ deployment.name || '--' }}
          </button>
          <InlineTag
            :text="mapPolicyToLabel(deployment.policy)"
            type="info"
          />
        </div>
      </template>

      <template #cell-resources="{ item: deployment }">
        <ResourceTypesList :items="deployment.resourceTypes" />
      </template>

      <template #cell-lastModified="{ item: deployment }">
        <span
          class="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-right text-sm text-[var(--text-color-secondary)]"
        >
          {{ deployment.lastModified || '--' }}
        </span>
      </template>

      <template #cell-lastEditor="{ item: deployment }">
        <EditorAvatarCell :email="deployment.lastEditor" />
      </template>
    </GenericDataView>

    <Menu
      ref="rowMenuRef"
      :popup="true"
      :model="rowMenuItems"
    />
  </div>
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
