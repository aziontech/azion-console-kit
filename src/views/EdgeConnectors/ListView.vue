<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Edge Connectors" />
    </template>
    <template #content>
      <ListTableBlock
        v-if="hasContentToList"
        :listService="listEdgeConnectorsService"
        :columns="getColumns"
        ref="refListTable"
        @on-load-data="handleLoadData"
        emptyListMessage="No edge connectors found."
        :actions="actions"
        :enableEditClick="false"
        addButtonLabel="Edge Connectors"
        createPagePath="/edge-connectors/create"
      />
      <EmptyResultsBlock
        v-else
        title="No edge connectors have been created"
        description="Click the button below to create your first edge connectors."
        createButtonLabel="Edge Connectors"
        createPagePath="edge-connectors/create"
        @click-to-create="handleTrackEvent"
        :documentationService="documentationService"
      >
        <template #illustration>
          <Illustration />
        </template>
      </EmptyResultsBlock>
    </template>
  </ContentBlock>
</template>

<script setup>
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import ContentBlock from '@/templates/content-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import ListTableBlock from '@/templates/list-table-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { computed, ref } from 'vue'

  defineOptions({ name: 'edge-connectors-view' })

  const props = defineProps({
    listEdgeConnectorsService: {
      required: true,
      type: Function
    },
    documentationService: {
      required: true,
      type: Function
    },
    deleteEdgeConnectorsService: {
      required: true,
      type: Function
    }
  })

  const refListTable = ref()
  const hasContentToList = ref(true)

  const actions = [
    {
      type: 'delete',
      title: 'Edge Connectors',
      icon: 'pi pi-trash',
      service: props.deleteEdgeConnectorsService
    }
  ]

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const getColumns = computed(() => {
    return [
      {
        field: 'name',
        header: 'Name'
      },
      {
        field: 'type',
        header: 'Type'
      },
      {
        field: 'header',
        header: 'Header'
      },
      {
        field: 'address',
        header: 'Address'
      }
    ]
  })
</script>
