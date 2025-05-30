<script setup>
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import ListTableBlock from '@/templates/list-table-block'
  import DrawerOrigin from '@/views/EdgeApplicationsOrigins/Drawer'
  import PrimeButton from 'primevue/button'
  import { computed, inject, ref } from 'vue'
  import { hasFlagBlockApiV4 } from '@/composables/user-flag'
  import edgeConnectorsGif from '@/assets/images/edgeConnectors.gif'

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

  const actions = [
    {
      type: 'delete',
      title: 'origin',
      icon: 'pi pi-trash',
      service: deleteOriginWithDecorator
    }
  ]
</script>

<template>
  <div v-if="hasFlagBlockApiV4()">
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
        :columns="getColumns"
        pageTitleDelete="origin"
        :editInDrawer="openEditOriginDrawer"
        @on-load-data="handleLoadData"
        emptyListMessage="No origins found."
        :actions="actions"
        isTabs
      >
        <template #addButton>
          <PrimeButton
            icon="pi pi-plus"
            label="Origin"
            data-testid="origins__add-button"
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
  </div>
  <div
    v-else
    class="px-3 py-4 sm:px-8 sm:py-8 gap-4 flex flex-col xl:flex-row items-center xl:items-start justify-center lg:px-8 lg:py-16 max-w-screen-2xl-test mx-auto w-full"
  >
    <div class="flex-col gap-4 text-center items-center justify-center">
      <div class="text-xl font-medium">Origins is now Edge Connectors!</div>
      <div class="text-sm text-color-secondary">
        All settings that were previously made in Origins will now be made in the new Edge
        Connectors menu.
      </div>
      <img
        class="mt-8"
        :src="edgeConnectorsGif"
        alt="Origins to Edge Connectors"
      />
    </div>
  </div>
</template>
