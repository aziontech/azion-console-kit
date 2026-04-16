<script setup>
  import { computed, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { columnBuilder } from '@/components/list-table/columns/column-builder'
  import { edgeConnectorsService } from '@/services/v2/edge-connectors/edge-connectors-service'
  import ListTable from '@/components/list-table'
  import { DataTableActionsButtons } from '@/components/list-table'

  defineOptions({ name: 'edge-connectors-view' })

  defineProps({
    documentationService: {
      required: true,
      type: Function
    }
  })

  const router = useRouter()
  const listTableRef = ref()

  const handleNavigateToCreate = () => {
    router.push('connectors/create')
  }

  const actions = [
    {
      label: 'Delete',
      type: 'delete',
      title: 'Connector',
      icon: 'pi pi-trash',
      service: edgeConnectorsService.deleteEdgeConnectorsService
    }
  ]

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
        style: 'max-width: 300px',
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

  const allowedFilters = computed(() => {
    return getColumns.value.filter((col) => col.header && col.header !== 'Last Modified')
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
      <ListTable
        ref="listTableRef"
        emptyListMessage="No connectors found."
        :listService="edgeConnectorsService.listEdgeConnectorsService"
        :columns="getColumns"
        :actions="actions"
        editPagePath="/connectors/edit"
        defaultOrderingFieldName="-last_modified"
        exportFileName="Connectors"
        :csvMapper="csvMapper"
        :lazy="true"
        :frozenColumns="['name']"
        :allowedFilters="allowedFilters"
        :emptyBlock="{
          title: 'No Connectors yet',
          description:
            'Create your first connector to define how traffic is routed from Azion to an origin or external service.',
          createButtonLabel: 'Connectors',
          documentationService: documentationService
        }"
        @click-to-create="handleNavigateToCreate"
      />
    </template>
  </ContentBlock>
</template>
