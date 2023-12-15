<script setup>
  import { ref, computed } from 'vue'
  import ListTableBlock from '@/templates/list-table-block/no-header'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import PrimeButton from 'primevue/button'

  defineOptions({ name: 'list-edge-service-resources-tab' })

  const hasContentToList = ref(true)

  const props = defineProps({
    edgeApplicationId: {
      required: true,
      type: String
    },
    listFunctionsService: {
      required: true,
      type: Function
    },
    loadEdgeFunctionsService: {
      required: true,
      type: Function
    },
    deleteFunctionsService: {
      required: true,
      type: Function
    },
    documentationService: {
      type: Function,
      required: true
    }
  })

  const getColumns = computed(() => {
    return [
      {
        field: 'name',
        header: 'Name'
      },
      {
        field: 'language',
        header: 'Language'
      },
      {
        field: 'reference_count',
        header: 'Ref Count'
      },
      {
        field: 'initiator_type',
        header: 'Initiator Type'
      },
      {
        field: 'last_editor',
        header: 'Last Editor'
      },
    ]
  })

  const listFunctionsInstances = async () => {
    const functionsInstances = await props.listFunctionsService({ id: props.edgeApplicationId })

    const functionsList = await Promise.all(functionsInstances.map(async (func) => {
      let functionData = await props.loadEdgeFunctionsService({id:func.edge_function_id})

      return {
        name : func.name,
        language: functionData.language,
        reference_count: functionData.referenceCount,
        initiator_type: functionData.initiatorType,
        last_editor: functionData.lastEditor,
      }
    }))

    return await functionsList
  }

  const deleteFunctionsWithDecorator = async (functionId) => {
    return await props.deleteFunctionsService(functionId, props.edgeApplicationId)
  }
</script>
<template>
  <div v-if="hasContentToList">
    <ListTableBlock
      ref="listOriginsEdgeApplicationsRef"
      :listService="listFunctionsInstances"
      :deleteService="deleteFunctionsWithDecorator"
      :columns="getColumns"
      pageTitleDelete="Function"
      @on-load-data="handleLoadData"
    >
      <template #addButton>
        <PrimeButton
          icon="pi pi-plus"
          label="Origin"
        />
      </template>
    </ListTableBlock>
  </div>
  <EmptyResultsBlock
    v-else
    title="No Functions added"
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
