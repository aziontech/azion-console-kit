<script setup>
  import { computed, inject, onMounted, ref, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import { watchDebounced } from '@vueuse/core'
  import { useToast } from '@aziontech/webkit/use-toast'
  import Tag from '@aziontech/webkit/prime-tag'
  import Menu from '@aziontech/webkit/menu'
  import { CellExpand } from '@aziontech/webkit/list-data-table/cells'

  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import GenericDataView from '@/views/DeploymentVersions/components/GenericDataView.vue'
  import { DataTableActionsButtons } from '@/components/list-table'
  import { useDeleteDialog } from '@/composables/useDeleteDialog'

  import { workloadService } from '@/services/v2/workload/workload-service'
  import { deleteDomainService } from '@/services/domains-services'

  import { INFORMATION_TEXTS, TEXT_DOMAIN_WORKLOAD } from '@/helpers'

  defineOptions({ name: 'list-workloads' })

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const router = useRouter()
  const toast = useToast()
  const { openDeleteDialog } = useDeleteDialog()

  const textDomain = TEXT_DOMAIN_WORKLOAD()
  const isWorkload = computed(() => textDomain.singularLabel === 'workload')
  const createDomainPath = `${textDomain.pluralLabel}/create?origin=list`
  const editBasePath = `/${textDomain.pluralLabel}/edit`

  const workloads = ref([])
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
    { field: 'name', header: 'Name', filterPath: 'name.text' },
    { field: 'id', header: 'ID', filterPath: 'id' },
    { field: 'infrastructure', header: 'Infrastructure' },
    { field: 'active', header: 'Status' },
    { field: 'last_editor', header: 'Last Editor' }
  ]

  const columns = computed(() => [
    {
      key: 'workload',
      label: 'Name',
      headerClass: 'min-w-[220px] flex-[2_1_220px]',
      cellClass:
        'min-w-[220px] flex-[2_1_220px] max-lg:flex max-lg:min-w-0 max-lg:items-start max-lg:gap-4 max-sm:flex-col max-sm:gap-1'
    },
    {
      key: 'domain',
      label: 'Domain',
      headerClass: 'min-w-[200px] flex-[2_1_200px]',
      cellClass:
        'min-w-[200px] flex-[2_1_200px] max-lg:flex max-lg:min-w-0 max-lg:items-start max-lg:gap-4 max-sm:flex-col max-sm:gap-1'
    },
    {
      key: 'status',
      label: 'Status',
      headerClass: 'min-w-[120px] flex-[1_1_120px] flex items-center justify-end',
      cellClass:
        'min-w-[120px] flex-[1_1_120px] flex justify-end max-lg:flex max-lg:min-w-0 max-lg:items-start max-lg:gap-4 max-lg:justify-start max-sm:flex-col max-sm:gap-1'
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
      headerClass: 'min-w-[200px] flex-[1.2_1_200px] flex items-center justify-end',
      cellClass:
        'min-w-[200px] flex-[1.2_1_200px] flex justify-end max-lg:flex max-lg:min-w-0 max-lg:items-start max-lg:gap-4 max-lg:justify-start max-sm:flex-col max-sm:gap-1'
    }
  ])

  const titleEmptyPage = computed(() => `No ${textDomain.pluralTitle} yet`)
  const descriptionEmptyPage = computed(() =>
    isWorkload.value
      ? `Create your first Workload to configure domains, protocols, security, and application execution for incoming traffic.`
      : `Create your first Domain to configure firewalls and applications execution for incoming traffic.`
  )
  const pageDescription = computed(() =>
    isWorkload.value
      ? "Deploy and manage workloads that bind domains, protocols, security, and application on Azion's global infrastructure."
      : "Deploy and manage domains that execute firewalls and applications on Azion's global infrastructure."
  )

  const sortFieldMap = {
    workload: 'name',
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

  const loadWorkloads = async () => {
    loading.value = true
    try {
      const filterParams = buildFilterParams()
      const result = await workloadService.listWorkloads({
        page: Math.floor(paginatorFirst.value / paginatorRows.value) + 1,
        pageSize: paginatorRows.value,
        search: searchTerm.value?.trim() || undefined,
        ordering: buildOrdering(),
        hasFilter: appliedFilters.value.length > 0,
        skipCache: appliedFilters.value.length > 0 || !!searchTerm.value?.trim(),
        ...filterParams
      })
      workloads.value = Array.isArray(result?.body) ? result.body : []
      totalRecords.value = typeof result?.count === 'number' ? result.count : workloads.value.length
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: 'Error',
        detail: error?.message || `Failed to load ${textDomain.pluralTitle}`
      })
      workloads.value = []
      totalRecords.value = 0
    } finally {
      loading.value = false
    }
  }

  const hasDomains = (workload) => Array.isArray(workload?.domains) && workload.domains.length > 0

  const goToEdit = (workload) => {
    if (!workload) return
    if (workload.isLocked) {
      toast.add({
        closable: true,
        severity: 'warn',
        summary: 'Warning',
        detail: INFORMATION_TEXTS.LOCKED_MESSAGE_TOAST
      })
      return
    }
    tracker.product.clickToEdit({ productName: 'Workload' })
    router.push(`${editBasePath}/${workload.id}`)
  }

  const handleTrackCreate = () => {
    tracker.product.clickToCreate({ productName: 'Workload' })
  }

  const deleteService = isWorkload.value ? workloadService.deleteWorkload : deleteDomainService

  const openRowMenu = ({ event, deployment }) => {
    const workload = deployment
    rowMenuItems.value = [
      {
        label: 'Delete',
        icon: 'pi pi-trash',
        command: () => {
          openDeleteDialog({
            title: textDomain.singularTitle,
            id: workload.id,
            data: workload,
            deleteService,
            successCallback: loadWorkloads
          })
        }
      }
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

  watchDebounced([searchTerm], () => loadWorkloads(), { debounce: 350, deep: true })

  watch(
    [appliedFilters, sortField, sortOrder, paginatorFirst, paginatorRows],
    () => loadWorkloads(),
    { deep: true }
  )

  onMounted(loadWorkloads)
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        :pageTitle="textDomain.pluralTitle"
        :description="pageDescription"
      >
        <template #default>
          <DataTableActionsButtons
            size="small"
            :label="textDomain.singularTitle"
            :createPagePath="createDomainPath"
            :data-testid="`create_${textDomain.singularTitle}_button`"
            @click="handleTrackCreate"
          />
        </template>
      </PageHeadingBlock>
    </template>

    <template #content>
      <GenericDataView
        :items="workloads"
        :hasDeployments="Boolean(workloads.length) || appliedFilters.length > 0 || !!searchTerm"
        :loading="loading"
        :columns="columns"
        :allowedFilters="allowedFilters"
        :appliedFilters="appliedFilters"
        :primaryColumnKey="'workload'"
        :lazy="true"
        :totalRecords="totalRecords"
        :paginatorFirst="paginatorFirst"
        :paginatorRows="paginatorRows"
        :toolbarMode="'compact'"
        v-model:searchTerm="searchTerm"
        :searchPlaceholder="`Search ${textDomain.pluralTitle}`"
        :emptyTitle="titleEmptyPage"
        :emptyDescription="descriptionEmptyPage"
        :filteredEmptyTitle="`No ${textDomain.pluralTitle} found`"
        filteredEmptyDescription="Try changing your search or filters."
        :rowActionsAriaLabel="`${textDomain.singularTitle} actions`"
        :filterButtonAriaLabel="`Filter ${textDomain.pluralTitle}`"
        :overflowMenuAriaLabel="`More ${textDomain.singularTitle} actions`"
        @refresh="loadWorkloads"
        @page="onPage"
        @apply-filter="onApplyFilter"
        @remove-filter="onRemoveFilter"
        @row-primary-click="goToEdit"
        @open-row-menu="openRowMenu"
      >
        <template #cell-workload="{ item: workload, onPrimaryClick }">
          <div class="min-w-0 flex flex-col gap-1">
            <div class="flex min-w-0 items-center gap-2">
              <button
                type="button"
                class="workload-name-button m-0 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-left text-sm font-medium leading-6 text-[var(--text-color)] hover:text-[var(--primary-color)] hover:underline focus-visible:text-[var(--primary-color)] focus-visible:outline-none"
                :data-testid="`workload-row-open__${workload.id}`"
                @click="onPrimaryClick"
              >
                {{ workload?.name?.text || workload?.name || '--' }}
              </button>
              <Tag
                v-if="workload?.isLocked && workload?.name?.tagProps"
                v-bind="workload.name.tagProps"
              />
            </div>
            <span
              class="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-xs leading-5 text-[var(--text-color-secondary)]"
            >
              {{ workload.id }}
            </span>
          </div>
        </template>

        <template #cell-domain="{ item: workload }">
          <div class="flex min-w-0 items-center gap-2">
            <i class="ai ai-domains text-[var(--text-color-secondary)]" />
            <CellExpand
              v-if="hasDomains(workload)"
              :value="workload.domains"
              variant="popup"
              :showCopy="true"
            />
            <span
              v-else-if="workload?.workloadHostname?.content"
              class="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap"
            >
              {{ workload.workloadHostname.content }}
            </span>
            <span v-else>--</span>
          </div>
        </template>

        <template #cell-status="{ item: workload }">
          <Tag
            v-if="workload?.active?.content"
            :value="workload.active.content"
            :severity="workload.active.severity"
          />
          <span v-else>--</span>
        </template>

        <template #cell-lastModified="{ item: workload }">
          <span class="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-right">
            {{ workload.lastModified || '--' }}
          </span>
        </template>

        <template #cell-lastEditor="{ item: workload }">
          <span class="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-right">
            {{ workload.lastEditor || '--' }}
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
  .workload-name-button {
    background: transparent;
    border: 0;
    padding: 0;
    cursor: pointer;
    font: inherit;
  }
</style>
