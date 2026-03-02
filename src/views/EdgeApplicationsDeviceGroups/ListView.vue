<script setup>
  import { computed, ref, inject } from 'vue'
  import PrimeButton from 'primevue/button'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import { deviceGroupService } from '@/services/v2/edge-app/edge-app-device-group-service'
  import { COLUMN_STYLES, columnStyles } from '@/helpers/column-styles'
  import DrawerDeviceGroups from '@/views/EdgeApplicationsDeviceGroups/Drawer'
  defineOptions({ name: 'list-edge-applications-device-groups-tab' })

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const props = defineProps({
    edgeApplicationId: {
      required: true,
      type: String
    },
    documentationService: {
      required: true,
      type: Function
    },
    clipboardWrite: {
      required: true,
      type: Function
    }
  })

  const drawerDeviceGroups = ref('')
  const listDeviceGroupsEdgeApplicationsRef = ref('')

  const reloadList = () => {
    listDeviceGroupsEdgeApplicationsRef.value.reload()
  }

  const getColumns = computed(() => {
    return [
      {
        field: 'name',
        header: 'Name',
        type: 'component',
        style: columnStyles.priority(2, 200, 350),
        component: (columnData) => {
          return columnBuilder({
            data: columnData,
            columnAppearance: 'text-format-with-popup'
          })
        }
      },
      {
        field: 'deviceId',
        header: 'ID',
        type: 'component',
        filterPath: 'id',
        sortField: 'id',
        style: COLUMN_STYLES.FIT_CONTENT,
        component: (columnData) => {
          return columnBuilder({
            data: columnData,
            columnAppearance: 'text-with-clipboard'
          })
        }
      },
      {
        field: 'userAgent',
        header: 'User Agent',
        type: 'component',
        style: columnStyles.priority(3, 200, 350),
        component: (columnData) => {
          return columnBuilder({
            data: columnData,
            columnAppearance: 'text-format-with-popup'
          })
        }
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

  const listDeviceGroupsWithDecorator = async (params) => {
    return await deviceGroupService.listDeviceGroupService(props.edgeApplicationId, params)
  }

  const deleteDeviceGroupsWithDecorator = async (id) => {
    return await deviceGroupService.deleteDeviceGroupService(props.edgeApplicationId, id)
  }

  const DEVICE_GROUP_API_FIELDS = ['id', 'name', 'user_agent']

  const actions = [
    {
      label: 'Delete',
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

  defineExpose({
    openCreateDrawer: openCreateDeviceGroupDrawer
  })
</script>

<template>
  <DrawerDeviceGroups
    ref="drawerDeviceGroups"
    @onSuccess="handleSuccess"
    :edgeApplicationId="edgeApplicationId"
    :createDeviceGroupService="deviceGroupService.createDeviceGroupService"
    :loadDeviceGroupService="deviceGroupService.loadDeviceGroupService"
    :editDeviceGroupService="deviceGroupService.editDeviceGroupService"
  />
  <FetchListTableBlock
    ref="listDeviceGroupsEdgeApplicationsRef"
    :listService="listDeviceGroupsWithDecorator"
    :editInDrawer="openEditDeviceGroupDrawer"
    :columns="getColumns"
    :defaultOrderingFieldName="'name'"
    :apiFields="DEVICE_GROUP_API_FIELDS"
    @on-before-go-to-edit="handleTrackClickToEdit"
    emptyListMessage="No device groups found."
    :actions="actions"
    isTabs
    :frozen-columns="['name']"
    exportFileName="Application Device Groups"
    hideLastModifiedColumn
    :emptyBlock="{
      title: 'No device groups yet',
      description:
        'Create your first device group to organize and manage custom application behaviors and cache policies.',
      createButtonLabel: 'Device Group',
      createPagePath: '/edge-applications/device-groups/create',
      documentationService: props.documentationService
    }"
  >
    <template #emptyBlockButton>
      <PrimeButton
        class="max-md:w-full w-fit"
        data-testid="create-device-group-button"
        @click="openCreateDeviceGroupDrawer"
        severity="secondary"
        icon="pi pi-plus"
        label="Device Group"
      />
    </template>
  </FetchListTableBlock>
</template>
