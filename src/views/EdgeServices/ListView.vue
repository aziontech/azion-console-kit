<script setup>
  import ListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import ContentBlock from '@/templates/content-block'
  import EdgeServicesToggleStatus from '@/views/EdgeServices/Dialog/EdgeServicesToggleStatus'
  import { computed, inject } from 'vue'
  import { DataTableActionsButtons } from '@/components/DataTable'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  defineOptions({ name: 'list-edge-service' })

  const props = defineProps({
    listEdgeServiceServices: {
      type: Function,
      required: true
    },
    deleteEdgeServiceServices: {
      type: Function,
      required: true
    },
    editEdgeServiceServices: {
      type: Function,
      required: true
    },
    documentationService: {
      type: Function,
      required: true
    }
  })

  const csvMapper = (rowData) => {
    return {
      name: rowData.name,
      id: rowData.id,
      lastEditor: rowData.lastEditor,
      lastModified: rowData.lastModified,
      labelActive: rowData.data?.content
    }
  }

  const getColumns = computed(() => [
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
      field: 'labelActive',
      header: 'Status',
      filterPath: 'labelActive.content',
      type: 'component',
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
  ])

  const actions = [
    {
      type: 'dialog',
      label: 'Activate',
      icon: 'pi pi-plus-circle',
      visibleAction: (item) => !item.active,
      dialog: {
        component: EdgeServicesToggleStatus,
        body: (item, updatedTable) => ({
          data: {
            selectRow: item,
            service: props.editEdgeServiceServices
          },
          onClose: (opt) => opt.data.updated && updatedTable()
        })
      }
    },
    {
      type: 'dialog',
      label: 'Deactivate',
      icon: 'pi pi-minus-circle',
      visibleAction: (item) => item.active,
      dialog: {
        component: EdgeServicesToggleStatus,
        body: (item, updatedTable) => ({
          data: {
            selectRow: item,
            service: props.editEdgeServiceServices
          },
          onClose: (opt) => opt.data.updated && updatedTable()
        })
      }
    },
    {
      type: 'delete',
      label: 'Delete',
      title: 'service',
      icon: 'pi pi-trash',
      service: props.deleteEdgeServiceServices
    }
  ]

  const handleTrackEventGoToCreate = () => {
    tracker.product.clickToCreate({
      productName: 'Edge Service'
    })
  }

  const handleTrackEventGoToEdit = () => {
    tracker.product.clickToEdit({
      productName: 'Edge Services'
    })
  }
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        pageTitle="Edge Services"
        description="Manage reusable variables and resources that are orchestrated to your Edge Nodes."
      >
        <template #default>
          <DataTableActionsButtons
            size="small"
            label="Edge Service"
            @click="handleTrackEventGoToCreate"
            createPagePath="edge-services/create"
            data-testid="create_Service_button"
          />
        </template>
      </PageHeadingBlock>
    </template>
    <template #content>
      <ListTableBlock
        :listService="listEdgeServiceServices"
        :columns="getColumns"
        createPagePath="edge-services/create"
        editPagePath="/edge-services/edit"
        @on-load-data="handleLoadData"
        :actions="actions"
        emptyListMessage="No services found."
        @on-before-go-to-add-page="handleTrackEventGoToCreate"
        @on-before-go-to-edit="handleTrackEventGoToEdit"
        :defaultOrderingFieldName="'-last_modified'"
        exportFileName="Edge Services"
        :csvMapper="csvMapper"
        :emptyBlock="{
          title: 'No Edge Services yet',
          description:
            'Create your first service to orchestrate variables and resources to your Edge Nodes.',
          createButtonLabel: 'Edge Service',
          createPagePath: 'edge-services/create',
          documentationService: documentationService
        }"
      />
    </template>
  </ContentBlock>
</template>
