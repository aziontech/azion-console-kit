<script setup>
  import { ref, computed, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import PrimeMenu from 'primevue/menu'
  import PrimeButton from 'primevue/button'
  import TEXT_DOMAIN_WORKLOAD from '@/helpers/handle-text-workload-domain-flag'
  import { workloadService } from '@/services/v2/workload/workload-service'
  import { clipboardWrite } from '@/helpers/clipboard'
  import { edgeDNSService } from '@/services/v2/edge-dns/edge-dns-service'
  import { edgeStorageService } from '@/services/v2/edge-storage/edge-storage-service'
  import { edgeFunctionService } from '@/services/v2/edge-function/edge-function-service'
  import SimpleTable from '@/templates/list-table-block/simple-table.vue'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import WorkloadsEmptyState from './workloads-empty-state.vue'

  const router = useRouter()
  const isLoading = ref(false)

  const handleTextDomainWorkload = TEXT_DOMAIN_WORKLOAD()

  const edgeDnsColumns = [
    {
      field: 'name',
      header: 'Name',
      type: 'component',
      component: (columnData) => {
        if (!columnData) return null
        return columnBuilder({
          data: columnData,
          columnAppearance: 'text-format-with-popup'
        })
      }
    },
    {
      field: 'domain',
      header: 'Domain',
      type: 'component',
      component: (columnData) => {
        if (!columnData) return null
        return columnBuilder({
          data: columnData?.content || columnData,
          columnAppearance: 'text-format-with-popup'
        })
      }
    },
    {
      field: 'active',
      header: 'Status',
      type: 'component',
      component: (columnData) => {
        if (!columnData) return null
        return columnBuilder({
          data: columnData,
          columnAppearance: 'tag'
        })
      }
    },
    { field: 'lastModified', header: 'Last Modified' }
  ]

  const objectStorageColumns = [
    {
      field: 'name',
      header: 'Name',
      type: 'component',
      component: (columnData) => {
        if (!columnData) return null
        return columnBuilder({
          data: columnData,
          columnAppearance: 'text-format-with-popup'
        })
      }
    },
    { field: 'size', header: 'Size' },
    { field: 'lastModified', header: 'Last Modified' }
  ]

  const functionsColumns = [
    {
      field: 'name',
      header: 'Name',
      type: 'component',
      component: (columnData) => {
        if (!columnData) return null
        return columnBuilder({
          data: columnData,
          columnAppearance: 'text-format-with-popup'
        })
      }
    },
    {
      field: 'runtime',
      header: 'Language',
      type: 'component',
      component: (columnData) => {
        if (!columnData) return null
        return columnBuilder({
          data: columnData,
          columnAppearance: 'language-icon-with-text'
        })
      }
    },
    {
      field: 'status',
      header: 'Status',
      type: 'component',
      component: (columnData) => {
        if (!columnData) return null
        return columnBuilder({
          data: columnData,
          columnAppearance: 'tag'
        })
      }
    },
    { field: 'lastModified', header: 'Last Modified' }
  ]

  const selectedResource = ref('workloads')
  const filterMenu = ref()
  const workloadsData = ref([])
  const edgeDnsData = ref([])
  const objectStorageData = ref([])
  const functionsData = ref([])

  const isWorkload = computed(() => handleTextDomainWorkload.singularLabel === 'workload')
  const resourceTypes = computed(() => [
    { label: handleTextDomainWorkload.pluralTitle, value: 'workloads' },
    { label: 'Edge DNS', value: 'edge-dns' },
    { label: 'Object Storage', value: 'object-storage' },
    { label: 'Functions', value: 'functions' }
  ])

  const filterMenuItems = computed(() => [
    {
      label: 'Filter by resource',
      items: resourceTypes.value.map((resource) => ({
        label: resource.label,
        icon: selectedResource.value === resource.value ? 'pi pi-check' : undefined,
        command: () => {
          selectedResource.value = resource.value
        }
      }))
    }
  ])
  const domainNameColumn = computed(() => {
    if (handleTextDomainWorkload.singularLabel === 'workload') {
      return 'Workload Domain'
    }
    return 'Domain name'
  })

  const workloadsColumns = computed(() => [
    {
      field: 'name',
      header: 'Name',
      type: 'component',
      component: (columnData) => {
        if (!columnData) return null
        return columnBuilder({
          data: columnData,
          columnAppearance: 'text-format-with-popup'
        })
      }
    },
    {
      field: 'workloadHostname',
      header: domainNameColumn.value,
      filterPath: 'workloadHostname',
      disableSort: true,
      type: 'component',
      component: (columnData) => {
        if (!columnData || !columnData?.content) return null
        return columnBuilder({
          data: columnData.content,
          columnAppearance: 'text-format-with-popup',
          dependencies: {
            copyContentService: clipboardWrite,
            showCopy: !!clipboardWrite
          }
        })
      }
    },
    {
      field: 'active',
      header: 'Status',
      type: 'component',
      component: (columnData) => {
        if (!columnData) return null
        return columnBuilder({
          data: columnData,
          columnAppearance: 'tag'
        })
      }
    },
    {
      field: 'lastModified',
      header: 'Last Modified'
    }
  ])

  const currentColumns = computed(() => {
    const columnsMap = {
      workloads: workloadsColumns.value,
      'edge-dns': edgeDnsColumns,
      'object-storage': objectStorageColumns,
      functions: functionsColumns
    }
    return columnsMap[selectedResource.value] || workloadsColumns.value
  })

  const currentData = computed(() => {
    const dataMap = {
      workloads: workloadsData.value,
      'edge-dns': edgeDnsData.value,
      'object-storage': objectStorageData.value,
      functions: functionsData.value
    }
    return dataMap[selectedResource.value] || []
  })

  const currentViewAllLink = computed(() => {
    const linksMap = {
      workloads: `/${handleTextDomainWorkload.pluralLabel}`,
      'edge-dns': '/edge-dns',
      'object-storage': '/object-storage/buckets',
      functions: '/edge-functions'
    }
    return linksMap[selectedResource.value] || '/'
  })

  const currentViewAllLabel = computed(() => {
    const labelsMap = {
      workloads: `View all ${handleTextDomainWorkload.pluralTitle}...`,
      'edge-dns': 'View all Edge DNS...',
      'object-storage': 'View all Buckets...',
      functions: 'View all Functions...'
    }
    return labelsMap[selectedResource.value] || 'View all...'
  })

  const editWorkloadRouteName = computed(() => (isWorkload.value ? 'edit-workload' : 'edit-domain'))

  const emptyBlock = computed(() => {
    const emptyBlockMap = {
      workloads: {
        title: `No ${handleTextDomainWorkload.pluralTitle} yet`,
        description: isWorkload.value
          ? 'Create your first Workload to configure domains, protocols, security, and application execution for incoming traffic.'
          : 'Create your first Domain to configure firewalls and applications execution for incoming traffic.',
        createButtonLabel: handleTextDomainWorkload.singularTitle,
        createPagePath: `${handleTextDomainWorkload.pluralLabel}/create`
      },
      'edge-dns': {
        title: 'No DNS Zones yet',
        description:
          'Create your first DNS zone to host authoritative records and control domain name resolution.',
        createButtonLabel: 'Zone',
        createPagePath: 'edge-dns/create'
      },
      'object-storage': {
        title: 'No Buckets yet',
        description: 'Create your first bucket to store, organize, and access data.',
        createButtonLabel: 'Bucket',
        createPagePath: '/object-storage/create'
      },
      functions: {
        title: 'No Functions yet',
        description: "Create your first function to execute code at Azion's global infrastructure.",
        createButtonLabel: 'Function',
        createPagePath: 'functions/create?origin=list'
      }
    }
    return emptyBlockMap[selectedResource.value] || emptyBlockMap.workloads
  })

  const currentActions = computed(() => {
    const actionsMap = {
      workloads: [
        {
          label: 'Edit',
          icon: 'pi pi-pencil',
          command: (rowData) =>
            router.push({ name: editWorkloadRouteName.value, params: { id: rowData.id } })
        },
        {
          label: 'Delete',
          icon: 'pi pi-trash'
        }
      ],
      'edge-dns': [
        {
          label: 'Edit',
          icon: 'pi pi-pencil',
          command: (rowData) => router.push({ name: 'edit-edge-dns', params: { id: rowData.id } })
        },
        {
          label: 'Delete',
          icon: 'pi pi-trash'
        }
      ],
      'object-storage': [
        {
          label: 'View',
          icon: 'pi pi-eye',
          command: (rowData) =>
            router.push({ name: 'edge-storage-bucket', params: { bucketName: rowData.name } })
        },
        {
          label: 'Delete',
          icon: 'pi pi-trash'
        }
      ],
      functions: [
        {
          label: 'Edit',
          icon: 'pi pi-pencil',
          command: (rowData) =>
            router.push({ name: 'edit-edge-functions', params: { id: rowData.id } })
        },
        {
          label: 'Delete',
          icon: 'pi pi-trash'
        }
      ]
    }
    return actionsMap[selectedResource.value] || []
  })

  const toggleFilterMenu = (event) => {
    filterMenu.value.toggle(event)
  }

  const loadWorkloads = async () => {
    try {
      const response = await workloadService.listWorkloads({
        pageSize: 5,
        ordering: '-last_modified',
        fields: [
          'name',
          'domains',
          'workload_domain',
          'infrastructure',
          'active',
          'last_modified',
          'id',
          'last_editor',
          'product_version',
          'workload_domain'
        ]
      })
      workloadsData.value = response.body
    } catch (error) {
      workloadsData.value = []
    }
  }

  const loadEdgeDns = async () => {
    try {
      const response = await edgeDNSService.listEdgeDNSService({
        pageSize: 5,
        ordering: '-last_modified',
        fields: ['id', 'name', 'domain', 'active', 'last_modified']
      })
      edgeDnsData.value = response.body
    } catch (error) {
      edgeDnsData.value = []
    }
  }

  const loadObjectStorage = async () => {
    try {
      const response = await edgeStorageService.listEdgeStorageBuckets({
        pageSize: 5,
        ordering: '-last_modified'
      })
      objectStorageData.value = response.body.map((item) => ({
        ...item,
        id: item.name,
        size: item.size || '-'
      }))
    } catch (error) {
      objectStorageData.value = []
    }
  }

  const loadFunctions = async () => {
    try {
      const response = await edgeFunctionService.listEdgeFunctionsService({
        pageSize: 5,
        ordering: '-last_modified'
      })
      functionsData.value = response.body
    } catch (error) {
      functionsData.value = []
    }
  }

  const loadDataForResource = async (resource) => {
    isLoading.value = true
    try {
      const loaderMap = {
        workloads: loadWorkloads,
        'edge-dns': loadEdgeDns,
        'object-storage': loadObjectStorage,
        functions: loadFunctions
      }
      await loaderMap[resource]?.()
    } finally {
      isLoading.value = false
    }
  }

  const handleRowClick = (event) => {
    const routeMap = {
      workloads: { name: editWorkloadRouteName.value, params: { id: event.data.id } },
      'edge-dns': { name: 'edit-edge-dns', params: { id: event.data.id } },
      'object-storage': { name: 'edge-storage-bucket', params: { bucketName: event.data.name } },
      functions: { name: 'edit-edge-functions', params: { id: event.data.id } }
    }
    const route = routeMap[selectedResource.value]
    if (route) router.push(route)
  }

  watch(
    selectedResource,
    (newResource) => {
      loadDataForResource(newResource)
    },
    { immediate: true }
  )
</script>

<template>
  <div class="flex flex-col gap-3 w-full">
    <div class="flex gap-3 items-center h-7">
      <span class="text-base font-semibold">Resources</span>
      <div class="relative">
        <PrimeButton
          icon="ai ai-filter-alt"
          severity="secondary"
          text
          @click="toggleFilterMenu"
        />
        <PrimeMenu
          ref="filterMenu"
          :model="filterMenuItems"
          :popup="true"
          :pt="{
            submenuHeader: { class: 'text-[10px]' }
          }"
        >
          <template #submenulabel="{ item }">
            <span class="text-[12px] uppercase tracking-[1px] text-color-secondary font-medium">
              {{ item.label }}
            </span>
          </template>
          <template #item="{ item, props }">
            <a
              v-bind="props.action"
              class="flex items-center justify-between w-full px-3 py-2 text-xs"
            >
              <span>{{ item.label }}</span>
              <i
                v-if="item.icon"
                :class="item.icon"
                class="text-sm"
              />
            </a>
          </template>
        </PrimeMenu>
      </div>
    </div>
    <WorkloadsEmptyState
      v-if="selectedResource === 'workloads' && currentData.length === 0 && !isLoading"
    />
    <SimpleTable
      v-else
      :data="currentData"
      :columns="currentColumns"
      :rows-limit="5"
      :loading="isLoading"
      :actions="currentActions"
      :view-all-link="currentViewAllLink"
      :view-all-label="currentViewAllLabel"
      @row-click="handleRowClick"
      :empty-block="emptyBlock"
    />
  </div>
</template>
