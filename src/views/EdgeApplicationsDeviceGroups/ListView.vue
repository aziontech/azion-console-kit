<script setup>
  import ListTableBlock from '@/templates/list-table-block/no-header'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import PrimeButton from 'primevue/button'
  import Illustration from '@/assets/svg/illustration-layers'
  import DrawerDeviceGroups from '@/views/EdgeApplicationsDeviceGroups/Drawer'
  import { computed, ref } from 'vue'
  defineOptions({ name: 'list-edge-applications-device-groups-tab' })

  const props = defineProps({
    edgeApplicationId: {
      required: true,
      type: String
    },
    listDeviceGroupsService: {
      required: true,
      type: Function
    },
    createDeviceGroupsService: {
      required: true,
      type: Function
    },
    documentationService: {
      required: true,
      type: Function
    },
    deleteDeviceGroupsService: {
      required: true,
      type: Function
    }
  })

  const drawerDeviceGroups = ref('')
  const hasContentToList = ref(true)

  const getColumns = computed(() => {
    return [
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

  const openCreateDeviceGroupsDrawer = () => {
    drawerDeviceGroups.value.openDrawerCreate()
  }

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const listDeviceGroupsWithDecorator = async () => {
    return await props.listDeviceGroupsService({ id: props.edgeApplicationId })
  }

  const deleteDeviceGroupsWithDecorator = async (originKey) => {
    return await props.deleteDeviceGroupsService(originKey, props.edgeApplicationId)
  }
</script>

<template>
  oii
  {{ props}}
  <DrawerDeviceGroups 
    ref="drawerDeviceGroups"
    :edgeApplicationId="props.edgeApplicationId"
    :createDeviceGroupsService="props.createDeviceGroupsService"
    :documentationService="props.documentationService"
  />
  <div v-if="hasContentToList">
    <ListTableBlock
      ref="listOriginsEdgeApplicationsRef"
      pageTitleDelete="Device Groups"
      :listService="listDeviceGroupsWithDecorator"
      :deleteService="deleteDeviceGroupsWithDecorator"
      :columns="getColumns"
      @on-load-data="handleLoadData"
    >
      <template #addButton>
        <PrimeButton
          @click="openCreateDeviceGroupsDrawer"
          icon="pi pi-plus"
          label="Device Group"
        />
      </template>
    </ListTableBlock>
  </div>
  <EmptyResultsBlock
    v-else
    title="No Device Group have been created"
    description="Create your first Device Group."
    createButtonLabel="Add"
    :documentationService="props.documentationService"
    :inTabs="true"
  >
    <template #default>
      <PrimeButton
        @click="openCreateDeviceGroupsDrawer"
        severity="secondary"
        icon="pi pi-plus"
        label="Add"
      />
    </template>
    <template #illustration>
      <Illustration />
    </template>
  </EmptyResultsBlock>
</template>
