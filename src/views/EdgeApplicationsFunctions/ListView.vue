<template>
  <DrawerFunction
    ref="drawerFunctionRef"
    :edgeApplicationId="edgeApplicationId"
    @onSuccess="reloadList"
  />
  <div v-if="hasContentToList">
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
    >
      <template #addButton>
        <PrimeButton
          icon="pi pi-plus"
          data-testid="functions-instance__create-button"
          label="Function Instance"
          @click="openCreateFunctionDrawer"
        />
      </template>
    </FetchListTableBlock>
  </div>
  <EmptyResultsBlock
    v-else
    title="No Functions have been instantiated"
    description="Click the button below to instantiate your first Function."
    createButtonLabel="Function Instance"
    :documentationService="props.documentationService"
    :inTabs="true"
  >
    <template #default>
      <PrimeButton
        data-testid="functions-instance__create-button"
        class="max-md:w-full w-fit"
        severity="secondary"
        icon="pi pi-plus"
        label="Function Instance"
        @click="openCreateFunctionDrawer"
      />
    </template>
    <template #illustration>
      <Illustration />
    </template>
  </EmptyResultsBlock>
</template>

<script setup>
  import { onMounted, computed, ref, inject } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import PrimeButton from 'primevue/button'
  import Illustration from '@/assets/svg/illustration-layers'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import { edgeApplicationFunctionService } from '@/services/v2'
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
  const hasContentToList = ref(true)
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
      },
      {
        field: 'lastEditor',
        header: 'Last Editor',
        sortField: 'last_editor'
      },
      {
        field: 'lastModified',
        sortField: 'last_modified',
        header: 'Last Modified'
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

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const openCreateFunctionDrawer = () => {
    handleTrackClickToCreate()
    drawerFunctionRef.value.openDrawerCreate()
  }

  const openEditFunctionDrawer = (data) => {
    openDrawer({ id: data.id })
    router.push({ query: {
      id: data.id
    }})
  }
  
  const openDrawerById = (data) => {
    openDrawer({ id: data.id })
  }

  const openDrawer = (data) => {
    drawerFunctionRef.value.openDrawerEdit(data.id)
  }

  const reloadList = () => {
    if (hasContentToList.value) {
      listFunctionsEdgeApplicationsRef.value.reload()
      return
    }
    hasContentToList.value = true
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
