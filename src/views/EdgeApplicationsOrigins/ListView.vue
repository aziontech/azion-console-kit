<script setup>
  import { computed, inject, ref } from 'vue'
  import PrimeButton from 'primevue/button'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import ListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import { COLUMN_STYLES, columnStyles } from '@/helpers/column-styles'
  import { hasFlagBlockApiV4 } from '@/composables/user-flag'
  import DrawerOrigin from '@/views/EdgeApplicationsOrigins/Drawer'
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

  const listOriginsEdgeApplicationsRef = ref('')
  const drawerOriginsRef = ref('')

  const getColumns = computed(() => {
    return [
      {
        field: 'name',
        header: 'Name',
        style: columnStyles.priority(2, 200, 350)
      },
      {
        field: 'originType',
        header: 'Type',
        style: COLUMN_STYLES.FIT_CONTENT
      },
      {
        field: 'hostHeader',
        header: 'Header',
        style: COLUMN_STYLES.FIT_CONTENT
      },
      {
        field: 'addresses',
        header: 'Address',
        type: 'component',
        style: columnStyles.priority(3, 200, 300),
        component: (columnData) =>
          columnBuilder({ data: columnData, columnAppearance: 'text-array-with-popup' })
      },
      {
        field: 'originKey',
        header: 'Key',
        type: 'component',
        filterPath: 'originKey.content',
        style: COLUMN_STYLES.FIT_CONTENT,
        component: (columnData) => {
          return columnBuilder({
            data: columnData.content,
            columnAppearance: 'text-format-with-popup',
            dependencies: {
              showCopy: !!props.clipboardWrite
            }
          })
        }
      }
    ]
  })

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
    listOriginsEdgeApplicationsRef.value.reload()
  }

  defineExpose({
    openCreateDrawer: openCreateOriginDrawer
  })

  const actions = [
    {
      label: 'Delete',
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
    <ListTableBlock
      ref="listOriginsEdgeApplicationsRef"
      :listService="listOriginsWithDecorator"
      :columns="getColumns"
      :editInDrawer="openEditOriginDrawer"
      emptyListMessage="No origins found."
      :actions="actions"
      :lazy="false"
      isTabs
      exportFileName="Application Origins"
      :emptyBlock="{
        title: 'No origins yet',
        description: 'Create your first origin to define where your application retrieves content.'
      }"
    >
      <template #emptyBlockButton>
        <PrimeButton
          class="max-md:w-full w-fit"
          severity="secondary"
          icon="pi pi-plus"
          label="Origin"
          @click="openCreateOriginDrawer"
          data-testid="origins__add-button"
        />
      </template>
    </ListTableBlock>
  </div>
  <div
    v-else
    class="px-3 py-4 sm:px-8 sm:py-8 gap-4 flex flex-col xl:flex-row items-center xl:items-start justify-center lg:px-8 lg:py-16 max-w-screen-2xl-test mx-auto w-full"
  >
    <div class="flex-col gap-4 text-center items-center justify-center">
      <div class="text-xl font-medium">Origins is now Connectors!</div>
      <div class="text-sm text-color-secondary">
        All settings that were previously made in Origins will now be made in the new Edge
        Connectors menu.
      </div>
      <img
        class="mt-8"
        :src="edgeConnectorsGif"
        alt="Origins to Connectors"
      />
    </div>
  </div>
</template>
