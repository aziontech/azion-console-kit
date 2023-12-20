<script setup>
  import ListTableBlock from '@/templates/list-table-block/no-header'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import PrimeButton from 'primevue/button'
  import { computed, ref } from 'vue'
  import DrawerOrigin from '@/views/EdgeApplicationsOrigins/Drawer'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  defineOptions({ name: 'list-edge-application-origins-tab' })

  const props = defineProps({
    edgeApplicationId: {
      required: true,
      type: String
    },
    listOriginsService: {
      required: true,
      type: Function
    },
    deleteOriginsService: {
      required: true,
      type: Function
    },
    createOriginService: {
      required: true,
      type: Function
    },
    editOriginService: {
      type: Function,
      required: true
    },
    loadOriginService: {
      type: Function,
      required: true
    },
    documentationService: {
      type: Function,
      required: true
    },
    clipboardWrite: {
      type: Function,
      required: true
    }
  })

  const hasContentToList = ref(true)
  const listOriginsEdgeApplicationsRef = ref('')
  const drawerOriginsRef = ref('')

  const getColumns = computed(() => {
    return [
      {
        field: 'name',
        header: 'Origin Name'
      },
      {
        field: 'originType',
        header: 'Origin Type'
      },
      {
        field: 'hostHeader',
        header: 'Host Header'
      },
      {
        field: 'addresses',
        header: 'Origin Address',
        type: 'component',
        component: (columnData) =>
          columnBuilder({ data: columnData, columnAppearance: 'expand-column' })
      },
      {
        field: 'addresses',
        header: 'Origin Address'
      },
      {
        field: 'originKey',
        header: 'Origin Key'
      }
    ]
  })

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const listOriginsWithDecorator = async () => {
    return await props.listOriginsService({ id: props.edgeApplicationId })
  }

  const deleteOriginWithDecorator = async (originKey) => {
    return await props.deleteOriginsService(originKey, props.edgeApplicationId)
  }

  const openCreateOriginDrawer = () => {
    drawerOriginsRef.value.openDrawerCreate()
  }

  const openEditOriginDrawer = (item) => {
    drawerOriginsRef.value.openDrawerEdit(item.id)
  }

  const reloadList = () => {
    if (hasContentToList.value) {
      listOriginsEdgeApplicationsRef.value.reload()
      return
    }
    hasContentToList.value = true
  }
</script>

<template>
  <DrawerOrigin
    ref="drawerOriginsRef"
    :edgeApplicationId="props.edgeApplicationId"
    :createOriginService="props.createOriginService"
    :editOriginService="props.editOriginService"
    :loadOriginService="props.loadOriginService"
    :documentationService="props.documentationService"
    :clipboardWrite="props.clipboardWrite"
    @onSuccess="reloadList"
  />
  <div v-if="hasContentToList">
    <ListTableBlock
      ref="listOriginsEdgeApplicationsRef"
      :listService="listOriginsWithDecorator"
      :deleteService="deleteOriginWithDecorator"
      :columns="getColumns"
      pageTitleDelete="Origin"
      :editInDrawer="openEditOriginDrawer"
      @on-load-data="handleLoadData"
    >
      <template #addButton>
        <PrimeButton
          icon="pi pi-plus"
          label="Origin"
          @click="openCreateOriginDrawer"
        />
      </template>
    </ListTableBlock>
  </div>
  <EmptyResultsBlock
    v-else
    title="No Origin has been created"
    description="Create your first Origin."
    createButtonLabel="Add"
    :documentationService="props.documentationService"
    :inTabs="true"
  >
    <template #default>
      <PrimeButton
        severity="secondary"
        icon="pi pi-plus"
        label="Add"
        @click="openCreateOriginDrawer"
      />
    </template>
  </EmptyResultsBlock>
</template>
