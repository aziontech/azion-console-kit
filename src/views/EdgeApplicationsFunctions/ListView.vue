<script setup>
  import { onMounted, computed, ref, inject } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import { edgeApplicationFunctionService } from '@/services/v2/edge-app/edge-application-functions-service'
  import DrawerFunction from './Drawer'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  defineOptions({ name: 'list-edge-applications-functions-tab' })

  const props = defineProps({
    edgeApplicationId: {
      required: true,
      type: String
    },
    documentationService: {
      required: true,
      type: Function
    }
  })

  const router = useRouter()
  const route = useRoute()
  const FUNCTIONS_API_FIELDS = [
    'id',
    'name',
    'edge_function',
    'args',
    'last_modified',
    'last_editor'
  ]
  const drawerFunctionRef = ref('')
  const listFunctionsEdgeApplicationsRef = ref('')

  const getColumns = computed(() => {
    return [
      {
        field: 'id',
        header: 'ID',
        sortField: 'id',
        filterPath: 'id'
      },
      {
        field: 'name',
        header: 'Name',
        type: 'component',
        filterPath: 'name.text',
        component: (columnData) => {
          return columnBuilder({
            data: columnData,
            columnAppearance: 'text-with-tag'
          })
        }
      },
      {
        field: 'functionInstanced',
        header: 'Function',
        disableSort: true
      }
    ]
  })

  const listEdgeApplicationFunctions = async (query) => {
    return await edgeApplicationFunctionService.listEdgeApplicationFunctions(
      props.edgeApplicationId,
      query
    )
  }

  const deleteFunctionsWithDecorator = async (functionId) => {
    return await edgeApplicationFunctionService.deleteEdgeApplicationFunction(
      functionId,
      props.edgeApplicationId
    )
  }

  const openCreateFunctionDrawer = () => {
    handleTrackClickToCreate()
    drawerFunctionRef.value.openDrawerCreate()
  }

  const openEditFunctionDrawer = (data) => {
    openDrawer({ id: data.id })
    router.push({
      query: {
        id: data.id
      }
    })
  }

  const openDrawerById = (data) => {
    openDrawer({ id: data.id })
  }

  const openDrawer = (data) => {
    drawerFunctionRef.value.openDrawerEdit(data.id)
  }

  const reloadList = () => {
    listFunctionsEdgeApplicationsRef.value.reload()
  }

  const actions = [
    {
      type: 'delete',
      title: 'function instance',
      icon: 'pi pi-trash',
      service: deleteFunctionsWithDecorator
    }
  ]

  const handleTrackClickToCreate = () => {
    tracker.product
      .clickToCreate({
        productName: 'Function Instances'
      })
      .track()
  }
  const handleTrackClickToEdit = () => {
    tracker.product
      .clickToEdit({
        productName: 'Function Instances'
      })
      .track()
  }

  onMounted(() => {
    openDrawerById({ id: route.query.id })
  })
</script>

<template>
  <DrawerFunction
    ref="drawerFunctionRef"
    :edgeApplicationId="edgeApplicationId"
    @onSuccess="reloadList"
  />
  <FetchListTableBlock
    ref="listFunctionsEdgeApplicationsRef"
    :listService="listEdgeApplicationFunctions"
    :columns="getColumns"
    :editInDrawer="openEditFunctionDrawer"
    @on-load-data="handleLoadData"
    @on-before-go-to-edit="handleTrackClickToEdit"
    :actions="actions"
    isTabs
    :defaultOrderingFieldName="'name'"
    :apiFields="FUNCTIONS_API_FIELDS"
    exportFileName="Function Instances"
    :emptyBlock="{
      title: 'No Functions have been instantiated',
      description: 'Click the button below to instantiate your first Function.',
      createButtonLabel: 'Function Instance',
      createPagePath: '/edge-applications/functions/create',
      documentationService: props.documentationService
    }"
  >
    <template #emptyBlockButton>
      <PrimeButton
        icon="pi pi-plus"
        data-testid="functions-instance__create-button"
        severity="secondary"
        label="Function Instance"
        @click="openCreateFunctionDrawer"
      />
    </template>
  </FetchListTableBlock>
</template>
