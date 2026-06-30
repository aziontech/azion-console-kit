<script setup>
  import { onMounted, computed, ref, inject } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import PrimeButton from '@aziontech/webkit/button'
  import ListTable from '@/components/list-table/ListTable.vue'
  import { edgeApplicationFunctionService } from '@/services/v2/edge-app/edge-application-functions-service'
  import { useVersionContext } from '@/composables/versioning/use-version-context'
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
  const listTableRef = ref(null)

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
        filterPath: 'name.text',
        style: 'max-width: 300px'
      },
      {
        field: 'functionInstanced',
        header: 'Function',
        disableSort: true
      },
      {
        field: 'lastEditor',
        header: 'Last Editor',
        sortField: 'last_editor',
        filterPath: 'last_editor'
      },
      {
        field: 'lastModified',
        header: 'Last Modified',
        sortField: 'lastModified',
        filterPath: 'lastModified'
      }
    ]
  })

  const listEdgeApplicationFunctions = async (query) => {
    if (props.service) {
      return await props.service.list(query)
    }
    return await edgeApplicationFunctionService.listEdgeApplicationFunctions(
      props.edgeApplicationId,
      query
    )
  }

  const deleteFunctionsWithDecorator = async (functionId) => {
    if (props.service) {
      return await props.service.remove(functionId)
    }
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

  const actions = computed(() => {
    if (readOnly.value) {
      return []
    }
    return [
      {
        label: 'Delete',
        type: 'delete',
        title: 'function instance',
        icon: 'pi pi-trash',
        service: deleteFunctionsWithDecorator
      }
    ]
  })

  const editInDrawer = openEditFunctionDrawer

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

  const reloadList = () => {
    listTableRef.value?.reload()
  }

  const handleBeforeGoToEdit = () => {
    handleTrackClickToEdit()
  }

  defineExpose({
    openCreateDrawer: openCreateFunctionDrawer
  })

  onMounted(() => {
    openDrawerById({ id: route.query.id })
  })
</script>

<template>
  <DrawerFunction
    ref="drawerFunctionRef"
    :edgeApplicationId="edgeApplicationId"
    :service="service"
    :versionId="versionId"
    @onSuccess="reloadList"
  />
  <ListTable
    ref="listTableRef"
    :listService="listEdgeApplicationFunctions"
    :columns="getColumns"
    :editInDrawer="editInDrawer"
    :actions="actions"
    defaultOrderingFieldName="name"
    :apiFields="FUNCTIONS_API_FIELDS"
    exportFileName="Application Function Instances"
    :lazy="true"
    :isTabs="!isVersioned"
    :emptyBlock="{
      title: 'No Functions have been instantiated',
      description: 'Click the button below to instantiate your first Function.',
      createButtonLabel: 'Function Instance',
      createPagePath: '/edge-applications/functions/create',
      documentationService: props.documentationService
    }"
    @on-before-go-to-edit="handleBeforeGoToEdit"
  >
    <template #column-name="{ data }">
      <span
        class="block truncate"
        data-testid="list-table-block__column__name__row"
      >
        {{ data.name?.text ?? data.name }}
      </span>
    </template>
    <template #emptyBlockButton>
      <PrimeButton
        v-if="!readOnly"
        icon="pi pi-plus"
        data-testid="functions-instance__create-button"
        severity="secondary"
        label="Function Instance"
        @click="openCreateFunctionDrawer"
      />
    </template>
  </ListTable>
</template>
