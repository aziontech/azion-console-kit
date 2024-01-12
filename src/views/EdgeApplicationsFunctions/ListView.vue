<template>
  <DrawerFunction
    ref="drawerFunctionRef"
    :edgeApplicationId="props.edgeApplicationId"
    :createFunctionService="props.createFunctionService"
    :listEdgeFunctionsService="props.listEdgeFunctionsService"
    :loadEdgeFunctionsService="props.loadEdgeFunctionsService"
    :loadFunctionService="props.loadFunctionService"
    :editFunctionService="props.editFunctionService"
    @onSuccess="reloadList"
  />
  <div v-if="hasContentToList">
    <ListTableBlock
      ref="listFunctionsEdgeApplicationsRef"
      :listService="listFunctionsInstance"
      :deleteService="deleteFunctionsWithDecorator"
      :columns="getColumns"
      :editInDrawer="openEditFunctionDrawer"
      pageTitleDelete="Function"
      @on-load-data="handleLoadData"
    >
      <template #addButton>
        <PrimeButton
          icon="pi pi-plus"
          label="Edge Function"
          @click="openCreateFunctionDrawer"
        />
      </template>
    </ListTableBlock>
  </div>
  <EmptyResultsBlock
    v-else
    title="No Function added"
    description="Create your first Function."
    createButtonLabel="Add"
    :documentationService="props.documentationService"
    :inTabs="true"
  >
    <template #default>
      <PrimeButton
        severity="secondary"
        icon="pi pi-plus"
        label="Function"
        @click="openCreateFunctionDrawer"
      />
    </template>
    <template #illustration>
      <Illustration />
    </template>
  </EmptyResultsBlock>
</template>

<script setup>
  import Illustration from '@/assets/svg/illustration-layers'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import PrimeButton from 'primevue/button'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import ListTableBlock from '@/templates/list-table-block/no-header'
  import { computed, ref } from 'vue'

  defineOptions({ name: 'list-edge-applications-functions-tab' })

  const hasContentToList = ref(true)

  const props = defineProps({
    edgeApplicationId: {
      required: true,
      type: String
    },
    listEdgeApplicationFunctionsService: {
      required: true,
      type: Function
    },
    loadEdgeFunctionsService: {
      required: true,
      type: Function
    },
    listEdgeFunctionsService: {
      required: true,
      type: Function
    },
    loadFunctionService: {
      required: true,
      type: Function
    },
    createFunctionService: {
      required: true,
      type: Function
    },
    editFunctionService: {
      required: true,
      type: Function
    },
    deleteFunctionService: {
      required: true,
      type: Function
    },
  })

  const drawerFunctionRef = ref('')
  const listFunctionsEdgeApplicationsRef = ref('')

  const getColumns = computed(() => {
    return [
      {
        field: 'name',
        header: 'Name',
        type: 'component',
        component: (columnData) => {
          return columnBuilder({
            data: columnData,
            columnAppearance: 'text-with-tag'
          })
        }
      },
      {
        field: 'version',
        header: 'Version'
      },
      {
        field: 'referenceCount',
        header: 'Ref Count'
      },
      {
        field: 'languageIcon',
        header: 'Language',
        type: 'component',
        component: (columnData) => {
          return columnBuilder({
            data: columnData,
            columnAppearance: 'language-icon-with-text'
          })
        }
      },
      {
        field: 'initiatorType',
        header: 'Initiator Type'
      },
      {
        field: 'lastEditor',
        header: 'Last Editor'
      },
      {
        field: 'modified',
        sortField: 'lastModifiedDate',
        header: 'Last Modified'
      },
      {
        field: 'statusTag',
        header: 'Status',
        type: 'component',
        component: (columnData) => {
          return columnBuilder({
            data: columnData,
            columnAppearance: 'tag'
          })
        }
      }
    ]
  })

  const listFunctionsInstance = async () => {
    return await props.listEdgeApplicationFunctionsService(props.edgeApplicationId)
  }

  const deleteFunctionsWithDecorator = async (functionId) => {
    return await props.deleteFunctionService(functionId, props.edgeApplicationId)
  }

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const openCreateFunctionDrawer = () => {
    drawerFunctionRef.value.openDrawerCreate()
  }
  
  const openEditFunctionDrawer = (data) => {
    drawerFunctionRef.value.openDrawerEdit(data.id)
  }

  const reloadList = () => {
    if (hasContentToList.value) {
      listFunctionsEdgeApplicationsRef.value.reload()
      return
    }
    hasContentToList.value = true
  }
</script>

<template>
  <div v-if="hasContentToList">
    <ListTableBlock
      ref="listOriginsEdgeApplicationsRef"
      :listService="listFunctionsInstance"
      :deleteService="deleteFunctionsWithDecorator"
      :columns="getColumns"
      pageTitleDelete="Function"
      @on-load-data="handleLoadData"
      emptyListMessage="No Function found."
    >
      <template #addButton>
        <PrimeButton
          icon="pi pi-plus"
          label="Edge Function"
        />
      </template>
    </ListTableBlock>
  </div>
  <EmptyResultsBlock
    v-else
    title="No Function added"
    description="Create your first Function."
    createButtonLabel="Add"
    :documentationService="props.documentationService"
    :inTabs="true"
  >
    <template #default>
      <PrimeButton
        severity="secondary"
        icon="pi pi-plus"
        label="Function"
      />
    </template>
    <template #illustration>
      <Illustration />
    </template>
  </EmptyResultsBlock>
</template>
