<script setup>
  import { ref, computed } from 'vue'
  import { useRouter } from 'vue-router'
  import PrimeMenu from 'primevue/menu'
  import PrimeButton from 'primevue/button'
  import SimpleTable from '@/templates/list-table-block/simple-table.vue'

  const router = useRouter()

  const selectedResource = ref('workloads')
  const filterMenu = ref()

  const resourceTypes = [
    { label: 'Workloads', value: 'workloads' },
    { label: 'Edge DNS', value: 'edge-dns' },
    { label: 'Object Storage', value: 'object-storage' },
    { label: 'Functions', value: 'functions' }
  ]

  const filterMenuItems = computed(() => [
    {
      label: 'Filter by resource',
      items: resourceTypes.map((resource) => ({
        label: resource.label,
        icon: selectedResource.value === resource.value ? 'pi pi-check' : undefined,
        command: () => {
          selectedResource.value = resource.value
        }
      }))
    }
  ])

  const toggleFilterMenu = (event) => {
    filterMenu.value.toggle(event)
  }

  const workloadsColumns = [
    { field: 'name', header: 'Workload Name', type: 'link', sortable: true },
    { field: 'domains', header: 'Domain', type: 'text-array', sortable: false },
    { field: 'status', header: 'Status', type: 'tag', sortable: false },
    { field: 'lastModified', header: 'Last Modified', type: 'text', sortable: true }
  ]

  const edgeDnsColumns = [
    { field: 'name', header: 'Zone Name', type: 'link', sortable: true },
    { field: 'domain', header: 'Domain', type: 'text', sortable: false },
    { field: 'status', header: 'Status', type: 'tag', sortable: false },
    { field: 'lastModified', header: 'Last Modified', type: 'text', sortable: true }
  ]

  const objectStorageColumns = [
    { field: 'name', header: 'Bucket Name', type: 'link', sortable: true },
    { field: 'objects', header: 'Objects', type: 'text', sortable: false },
    { field: 'size', header: 'Size', type: 'text', sortable: false },
    { field: 'lastModified', header: 'Last Modified', type: 'text', sortable: true }
  ]

  const functionsColumns = [
    { field: 'name', header: 'Function Name', type: 'link', sortable: true },
    { field: 'language', header: 'Language', type: 'text', sortable: false },
    { field: 'status', header: 'Status', type: 'tag', sortable: false },
    { field: 'lastModified', header: 'Last Modified', type: 'text', sortable: true }
  ]

  const currentColumns = computed(() => {
    const columnsMap = {
      workloads: workloadsColumns,
      'edge-dns': edgeDnsColumns,
      'object-storage': objectStorageColumns,
      functions: functionsColumns
    }
    return columnsMap[selectedResource.value] || workloadsColumns
  })

  const workloadsData = ref([
    {
      id: 1,
      name: 'Azion Store Frontend',
      domains: ['store.azionstore.com', 'www.azionstore.com', 'cdn.azionstore.com'],
      status: 'Active',
      lastModified: 'Dec 15, 2025, 09:15:15 PM'
    },
    {
      id: 2,
      name: 'Azion Store Checkout',
      domains: ['checkout.azionstore.com'],
      status: 'Active',
      lastModified: 'Dec 12, 2025, 10:19:15 AM'
    },
    {
      id: 3,
      name: 'Azion Store Assets',
      domains: ['9oljy1u03ji.map.azionedge.net'],
      status: 'Active',
      lastModified: 'Dec 12, 2025, 10:03:15 PM'
    },
    {
      id: 4,
      name: 'Azion Store API',
      domains: ['api.azionstore.com'],
      status: 'Active',
      lastModified: 'Dec 10, 2025, 7:24:15 PM'
    },
    {
      id: 5,
      name: 'Azion Store Admin',
      domains: ['admin.azionstore.com'],
      status: 'Active',
      lastModified: 'Dec 10, 2025, 7:24:15 PM'
    }
  ])

  const edgeDnsData = ref([
    {
      id: 1,
      name: 'azionstore.com',
      domain: 'azionstore.com',
      status: 'Active',
      lastModified: 'Dec 14, 2025, 10:30:00 AM'
    },
    {
      id: 2,
      name: 'api.azionstore.com',
      domain: 'api.azionstore.com',
      status: 'Active',
      lastModified: 'Dec 13, 2025, 02:15:00 PM'
    },
    {
      id: 3,
      name: 'cdn.azionstore.com',
      domain: 'cdn.azionstore.com',
      status: 'Active',
      lastModified: 'Dec 12, 2025, 08:45:00 AM'
    }
  ])

  const objectStorageData = ref([
    {
      id: 1,
      name: 'azion-store-assets',
      objects: '1,234',
      size: '2.5 GB',
      lastModified: 'Dec 15, 2025, 11:00:00 AM'
    },
    {
      id: 2,
      name: 'azion-store-backups',
      objects: '56',
      size: '15.2 GB',
      lastModified: 'Dec 14, 2025, 03:30:00 PM'
    },
    {
      id: 3,
      name: 'azion-store-logs',
      objects: '10,567',
      size: '890 MB',
      lastModified: 'Dec 15, 2025, 09:00:00 AM'
    }
  ])

  const functionsData = ref([
    {
      id: 1,
      name: 'auth-handler',
      language: 'JavaScript',
      status: 'Active',
      lastModified: 'Dec 14, 2025, 04:20:00 PM'
    },
    {
      id: 2,
      name: 'image-optimizer',
      language: 'JavaScript',
      status: 'Active',
      lastModified: 'Dec 13, 2025, 10:15:00 AM'
    },
    {
      id: 3,
      name: 'rate-limiter',
      language: 'JavaScript',
      status: 'Active',
      lastModified: 'Dec 12, 2025, 02:45:00 PM'
    },
    {
      id: 4,
      name: 'geo-redirect',
      language: 'JavaScript',
      status: 'Inactive',
      lastModified: 'Dec 10, 2025, 09:30:00 AM'
    }
  ])

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
      workloads: '/workload',
      'edge-dns': '/edge-dns',
      'object-storage': '/object-storage/buckets',
      functions: '/edge-functions'
    }
    return linksMap[selectedResource.value] || '/'
  })

  const currentViewAllLabel = computed(() => {
    const labelsMap = {
      workloads: 'View all Workloads...',
      'edge-dns': 'View all Edge DNS...',
      'object-storage': 'View all Buckets...',
      functions: 'View all Functions...'
    }
    return labelsMap[selectedResource.value] || 'View all...'
  })

  const currentActions = computed(() => {
    const actionsMap = {
      workloads: [
        {
          label: 'Edit',
          icon: 'pi pi-pencil',
          command: (rowData) => router.push({ name: 'edit-workload', params: { id: rowData.id } })
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

  const handleRowClick = (event) => {
    const routeMap = {
      workloads: { name: 'edit-workload', params: { id: event.data.id } },
      'edge-dns': { name: 'edit-edge-dns', params: { id: event.data.id } },
      'object-storage': { name: 'edge-storage-bucket', params: { bucketName: event.data.name } },
      functions: { name: 'edit-edge-functions', params: { id: event.data.id } }
    }
    const route = routeMap[selectedResource.value]
    if (route) router.push(route)
  }
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
    <SimpleTable
      :data="currentData"
      :columns="currentColumns"
      :rows-limit="5"
      :actions="currentActions"
      :view-all-link="currentViewAllLink"
      :view-all-label="currentViewAllLabel"
      @row-click="handleRowClick"
    />
  </div>
</template>
