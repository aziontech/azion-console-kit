<script setup>
  import Illustration from '@/assets/svg/illustration-layers'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import ListTableBlock from '@/templates/list-table-block/no-header'
  import PrimeButton from 'primevue/button'
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
    deleteFunctionService: {
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
