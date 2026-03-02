<script setup>
  import { computed, ref } from 'vue'
  import ContentBlock from '@/templates/content-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { edgeConnectorsService } from '@/services/v2/edge-connectors/edge-connectors-service'
  import { COLUMN_STYLES, columnStyles } from '@/helpers/column-styles'
  import { DataTableActionsButtons } from '@/components/DataTable'

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
      label: 'Delete',
      type: 'delete',
      title: 'Connector',
      icon: 'pi pi-trash',
      service: edgeConnectorsService.deleteEdgeConnectorsService
    }
  ]

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

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
        style: columnStyles.priority(2, 200, 350),
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
        filterPath: 'id',
        style: COLUMN_STYLES.FIT_CONTENT
      },
      {
        field: 'type',
        header: 'Type',
        style: COLUMN_STYLES.FIT_CONTENT
      },
      {
        field: 'header',
        header: 'Header',
        style: COLUMN_STYLES.FIT_CONTENT
      },
      {
        field: 'address',
        header: 'Address',
        style: COLUMN_STYLES.FIT_CONTENT
      },
      {
        field: 'active',
        header: 'Status',
        type: 'component',
        sortField: 'active',
        style: COLUMN_STYLES.FIT_CONTENT,
        component: (columnData) =>
          columnBuilder({
            data: columnData,
            columnAppearance: 'tag'
          })
      },
      {
        field: 'lastEditor',
        header: 'Last Editor',
        sortField: 'last_editor',
        filterPath: 'last_editor',
        style: COLUMN_STYLES.PRIORITY_SM
      },
      {
        field: 'lastModified',
        header: 'Last Modified',
        sortField: 'lastModified',
        filterPath: 'lastModified',
        style: COLUMN_STYLES.FIT_CONTENT
      }
    ]
  })
</script>
<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        pageTitle="Connectors"
        description="Define and manage connectors that control how applications connect to origins and external services."
      >
        <template #default>
          <DataTableActionsButtons
            size="small"
            label="Connectors"
            createPagePath="/connectors/create"
            data-testid="create_Connectors_button"
          />
        </template>
      </PageHeadingBlock>
    </template>
    <template #content>
      <FetchListTableBlock
        :listService="edgeConnectorsService.listEdgeConnectorsService"
        :columns="getColumns"
        ref="refListTable"
        @on-load-data="handleLoadData"
        emptyListMessage="No Connectors found."
        :actions="actions"
        createPagePath="/connectors/create"
        editPagePath="/connectors/edit"
        data-testid="edge-connectors-list-table-block"
        :defaultOrderingFieldName="'-last_modified'"
        :frozen-columns="['name']"
        exportFileName="Connectors"
        :csvMapper="csvMapper"
        :emptyBlock="{
          title: 'No Connectors yet',
          description:
            'Create your first connector to define how traffic is routed from Azion to an origin or external service.',
          createButtonLabel: 'Connectors',
          createPagePath: 'connectors/create',
          documentationService: documentationService
        }"
      />
    </template>
  </ContentBlock>
</template>
