<script setup>
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import ListTableBlock from '@/templates/list-table-block/no-header'
  import DrawerOrigin from '@/views/EdgeApplicationsOrigins/Drawer'
  import PrimeButton from 'primevue/button'
  import { computed, inject, ref } from 'vue'
  /**@type {import('@/plugins/adapters/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')
  defineOptions({ name: 'list-edge-applications-origins-tab' })

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
    },
    isLoadBalancerEnabled: {
      type: Boolean,
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
        header: 'Name'
      },
      {
        field: 'originType',
        header: 'Type'
      },
      {
        field: 'hostHeader',
        header: 'Header'
      },
      {
        field: 'addresses',
        header: 'Address',
        type: 'component',
        component: (columnData) =>
          columnBuilder({ data: columnData, columnAppearance: 'expand-column' })
      },
      {
        field: 'originKey',
        header: 'Key',
        type: 'component',
        filterPath: 'originKey.content',
        component: (columnData) => {
          return columnBuilder({
            data: columnData,
            columnAppearance: 'text-with-clipboard',
            dependencies: {
              copyContentService: props.clipboardWrite
            }
          })
        }
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
    tracker.product
      .clickToCreate({
        productName: 'Origin'
      })
      .track()
    drawerOriginsRef.value.openDrawerCreate()
  }

  const openEditOriginDrawer = (item) => {
    tracker.product
      .clickToEdit({
        productName: 'Origin'
      })
      .track()

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
    :isLoadBalancerEnabled="props.isLoadBalancerEnabled"
    @onSuccess="reloadList"
  />
  <div v-if="hasContentToList">
    <ListTableBlock
      ref="listOriginsEdgeApplicationsRef"
      :listService="listOriginsWithDecorator"
      :deleteService="deleteOriginWithDecorator"
      :columns="getColumns"
      pageTitleDelete="origin"
      :editInDrawer="openEditOriginDrawer"
      @on-load-data="handleLoadData"
      emptyListMessage="No origins found."
    >
      <template #addButton>
        <PrimeButton
          icon="pi pi-plus"
          label="Origin"
          @click="openCreateOriginDrawer"
          class="w-full sm:w-auto"
        />
      </template>
    </ListTableBlock>
  </div>
  <EmptyResultsBlock
    v-else
    title="No origins have been created"
    description="Click the button below to create your first origin."
    createButtonLabel="Origin"
    :documentationService="props.documentationService"
    :inTabs="true"
  >
    <template #default>
      <PrimeButton
        class="max-md:w-full w-fit"
        severity="secondary"
        icon="pi pi-plus"
        label="Origin"
        @click="openCreateOriginDrawer"
      />
    </template>
  </EmptyResultsBlock>
</template>
