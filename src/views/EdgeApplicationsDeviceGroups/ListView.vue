<script setup>
  import { columnBuilder } from '@/components/list-table/columns/column-builder'
  import ListTable from '@/components/list-table/ListTable.vue'
  import DrawerDeviceGroups from '@/views/EdgeApplicationsDeviceGroups/Drawer'
  import { deviceGroupService } from '@/services/v2/edge-app/edge-app-device-group-service'
  import { useVersionContext } from '@/composables/versioning/use-version-context'
  import PrimeButton from '@aziontech/webkit/button'
  import { computed, ref, inject } from 'vue'

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
    service: {
      type: Object,
      default: null
    },
    versionId: {
      type: String,
      default: null
    }
  })

  const { readOnly, isVersioned } = useVersionContext()

  const drawerDeviceGroups = ref('')
  const listTableRef = ref(null)

  const getColumns = computed(() => {
    return [
      {
        field: 'name',
        header: 'Name',
        type: 'component',
        style: 'max-width: 300px',
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
        style: 'max-width: 300px',
        component: (columnData) => {
          return columnBuilder({
            data: columnData,
            columnAppearance: 'text-format-with-popup'
          })
        }
      }
    ]
  })

  const DEVICE_GROUP_API_FIELDS = ['id', 'name', 'user_agent']

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

  const listFn = props.service
    ? props.service.list
    : (params) => deviceGroupService.listDeviceGroupService(props.edgeApplicationId, params)

  const deleteFn = props.service
    ? props.service.remove
    : (id) => deviceGroupService.deleteDeviceGroupService(props.edgeApplicationId, id)

  const createDrawerService = props.service
    ? props.service.create
    : deviceGroupService.createDeviceGroupService

  const loadDrawerService = props.service
    ? props.service.load
    : deviceGroupService.loadDeviceGroupService

  const editDrawerService = props.service
    ? props.service.edit
    : deviceGroupService.editDeviceGroupService

  const listDeviceGroupsWithDecorator = async (params) => {
    return await listFn(params)
  }

  const deleteDeviceGroupsWithDecorator = async (id) => {
    return await deleteFn(id)
  }

  const actions = computed(() => {
    if (readOnly.value) {
      return []
    }

    return [
      {
        label: 'Delete',
        type: 'delete',
        title: 'device group',
        icon: 'pi pi-trash',
        service: deleteDeviceGroupsWithDecorator
      }
    ]
  })

  const editInDrawerHandler = computed(() =>
    readOnly.value ? undefined : openEditDeviceGroupDrawer
  )

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

  const reloadList = () => {
    listTableRef.value?.reload()
  }

  const handleBeforeGoToEdit = () => {
    handleTrackClickToEdit()
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
    :createDeviceGroupService="createDrawerService"
    :loadDeviceGroupService="loadDrawerService"
    :editDeviceGroupService="editDrawerService"
  />
  <ListTable
    ref="listTableRef"
    :listService="listDeviceGroupsWithDecorator"
    :columns="getColumns"
    :frozenColumns="['name']"
    :editInDrawer="editInDrawerHandler"
    :actions="actions"
    defaultOrderingFieldName="name"
    :apiFields="DEVICE_GROUP_API_FIELDS"
    exportFileName="Application Device Groups"
    :lazy="true"
    :isTabs="!isVersioned"
    :hideLastModifiedColumn="true"
    emptyListMessage="No device groups found."
    :emptyBlock="{
      title: 'No device groups yet',
      description:
        'Create your first device group to organize and manage custom application behaviors and cache policies.',
      createButtonLabel: 'Device Group',
      createPagePath: '/edge-applications/device-groups/create',
      documentationService: props.documentationService
    }"
    @on-before-go-to-edit="handleBeforeGoToEdit"
  >
    <template #emptyBlockButton>
      <PrimeButton
        v-if="!readOnly"
        class="max-md:w-full w-fit"
        data-testid="create-device-group-button"
        @click="openCreateDeviceGroupDrawer"
        severity="secondary"
        icon="pi pi-plus"
        label="Device Group"
      />
    </template>
  </ListTable>
</template>
