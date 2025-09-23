<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        pageTitle="Connectors"
        data-testid="edge-connectors-heading"
      />
    </template>
    <template #content>
      <FetchListTableBlock
        v-if="hasContentToList"
        :listService="edgeConnectorsService.listEdgeConnectorsService"
        :columns="getColumns"
        ref="refListTable"
        @on-load-data="handleLoadData"
        emptyListMessage="No Connectors found."
        :actions="actions"
        addButtonLabel="Connectors"
        createPagePath="/connectors/create"
        editPagePath="/connectors/edit"
        data-testid="edge-connectors-list-table-block"
        :apiFields="EDGE_CONNECTORS_API_FIELDS"
        :defaultOrderingFieldName="'-last_modified'"
      />
      <EmptyResultsBlock
        v-else
        title="No Connectors have been created"
        description="Click the button below to create your first Connectors."
        createButtonLabel="Connectors"
        createPagePath="connectors/create"
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
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import { computed, ref } from 'vue'
  import { edgeConnectorsService } from '@/services/v2'

  defineOptions({ name: 'edge-connectors-view' })

  defineProps({
    documentationService: {
      required: true,
      type: Function
    }
  })

  const refListTable = ref()
  const hasContentToList = ref(true)

  const actions = [
    {
      type: 'delete',
      title: 'Connectors',
      icon: 'pi pi-trash',
      service: edgeConnectorsService.deleteEdgeConnectorsService
    }
  ]

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const EDGE_CONNECTORS_API_FIELDS = []

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
      },
      {
        field: 'active',
        header: 'Status',
        type: 'component',
        sortField: 'active',
        component: (columnData) =>
          columnBuilder({
            data: columnData,
            columnAppearance: 'tag'
          })
      },
      {
        field: 'lastEditor',
        header: 'Last Editor'
      },
      {
        field: 'lastModified',
        header: 'Last Modified'
      }
    ]
  })
</script>
