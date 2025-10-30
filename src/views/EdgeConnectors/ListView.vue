<script setup>
  import ContentBlock from '@/templates/content-block'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import { computed, ref } from 'vue'
  import { edgeConnectorsService } from '@/services/v2/edge-connectors/edge-connectors-service'

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
      title: 'Connector',
      icon: 'pi pi-trash',
      service: edgeConnectorsService.deleteEdgeConnectorsService
    }
  ]

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const EDGE_CONNECTORS_API_FIELDS = []

  const csvMapper = (rowData) => {
    return {
      name: rowData.name,
      id: rowData.id,
      type: rowData.type,
      header: rowData.header,
      address: rowData.address,
      lastEditor: rowData.lastEditor,
      lastModified: rowData.lastModified,
      active: rowData.data?.content || rowData.active
    }
  }

  const getColumns = computed(() => {
    return [
      {
        field: 'name',
        header: 'Name',
        type: 'component',
        style: 'max-width: 240px',
        component: (columnData) => {
          return columnBuilder({
            data: columnData,
            columnAppearance: 'text-format-with-popup'
          })
        }
      },
      {
        field: 'id',
        header: 'ID',
        sortField: 'id',
        filterPath: 'id'
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
      }
    ]
  })
</script>
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
        :frozen-columns="['name']"
        exportFileName="Connectors"
        :csvMapper="csvMapper"
        :emptyBlock="{
          title: 'No Connectors have been created',
          description: 'Click the button below to create your first Connectors.',
          createButtonLabel: 'Connectors',
          createPagePath: 'connectors/create',
          documentationService: documentationService
        }"
      />
    </template>
  </ContentBlock>
</template>
