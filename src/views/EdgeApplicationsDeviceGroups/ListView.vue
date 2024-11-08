<script setup>
  import Illustration from '@/assets/svg/illustration-layers'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import DrawerDeviceGroups from '@/views/EdgeApplicationsDeviceGroups/Drawer'
  import PrimeButton from 'primevue/button'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import { computed, ref, inject } from 'vue'
  defineOptions({ name: 'list-edge-applications-device-groups-tab' })

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const props = defineProps({
    edgeApplicationId: {
      required: true,
      type: String
    },
    listDeviceGroupsService: {
      required: true,
      type: Function
    },
    createDeviceGroupService: {
      required: true,
      type: Function
    },
    loadDeviceGroupService: {
      required: true,
      type: Function
    },
    editDeviceGroupService: {
      required: true,
      type: Function
    },
    documentationService: {
      required: true,
      type: Function
    },
    clipboardWrite: {
      required: true,
      type: Function
    },
    deleteDeviceGroupService: {
      required: true,
      type: Function
    }
  })

  const drawerDeviceGroups = ref('')
  const listDeviceGroupsEdgeApplicationsRef = ref('')
  const hasContentToList = ref(true)

  const reloadList = () => {
    if (hasContentToList.value) {
      listDeviceGroupsEdgeApplicationsRef.value.reload()
      return
    }
    hasContentToList.value = true
  }

  const getColumns = computed(() => {
    return [
      {
        field: 'deviceId',
        header: 'ID',
        type: 'component',
        filterPath: 'id',
        sortField: 'id',
        component: (columnData) => {
          return columnBuilder({
            data: columnData,
            columnAppearance: 'text-with-clipboard',
            dependencies: {
              copyContentService: props.clipboardWrite
            }
          })
        }
      },
      {
        field: 'name',
        header: 'Name'
      },
      {
        field: 'userAgent',
        header: 'User Agent'
      }
    ]
  })

  const handleSuccess = () => {
    drawerDeviceGroups.value.closeDrawer()
    reloadList()
  }

  const openCreateDeviceGroupDrawer = () => {
    handleTrackClickToCreate()
    drawerDeviceGroups.value.openDrawerCreate()
  }

  const openEditDeviceGroupDrawer = (item) => {
    drawerDeviceGroups.value.openDrawerEdit(item.id)
  }

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const listDeviceGroupsWithDecorator = async (query) => {
    return await props.listDeviceGroupsService({ id: props.edgeApplicationId, ...query })
  }

  const deleteDeviceGroupsWithDecorator = async (id) => {
    return await props.deleteDeviceGroupService(id, props.edgeApplicationId)
  }

  const DEVICE_GROUP_API_FIELDS = ['id', 'name', 'user_agent']

  const actions = [
    {
      type: 'delete',
      title: 'device group',
      icon: 'pi pi-trash',
      service: deleteDeviceGroupsWithDecorator
    }
  ]

  const handleTrackClickToCreate = () => {
    tracker.product
      .clickToCreate({
        productName: 'Device Groups'
      })
      .track()
  }
  const handleTrackClickToEdit = () => {
    tracker.product
      .clickToEdit({
        productName: 'Device Groups'
      })
      .track()
  }
</script>

<template>
  <DrawerDeviceGroups
    ref="drawerDeviceGroups"
    @onSuccess="handleSuccess"
    :edgeApplicationId="edgeApplicationId"
    :createDeviceGroupService="createDeviceGroupService"
    :loadDeviceGroupService="loadDeviceGroupService"
    :editDeviceGroupService="editDeviceGroupService"
    :documentationService="documentationService"
  />
  <div v-if="hasContentToList">
    <FetchListTableBlock
      ref="listDeviceGroupsEdgeApplicationsRef"
      :listService="listDeviceGroupsWithDecorator"
      :editInDrawer="openEditDeviceGroupDrawer"
      :columns="getColumns"
      :defaultOrderingFieldName="'name'"
      :apiFields="DEVICE_GROUP_API_FIELDS"
      @on-load-data="handleLoadData"
      @on-before-go-to-edit="handleTrackClickToEdit"
      emptyListMessage="No device groups found."
      :actions="actions"
      isTabs
    >
      <template #addButton>
        <PrimeButton
          @click="openCreateDeviceGroupDrawer"
          icon="pi pi-plus"
          label="Device Group"
        />
      </template>
    </FetchListTableBlock>
  </div>
  <EmptyResultsBlock
    v-else
    title="No device groups have been created"
    description="Click the button below to create your first device group."
    createButtonLabel="Device Group"
    :documentationService="props.documentationService"
    :inTabs="true"
  >
    <template #default>
      <PrimeButton
        class="max-md:w-full w-fit"
        data-testid="create-device-group-button"
        @click="openCreateDeviceGroupDrawer"
        severity="secondary"
        icon="pi pi-plus"
        label="Device Group"
      />
    </template>
    <template #illustration>
      <Illustration />
    </template>
  </EmptyResultsBlock>
</template>
