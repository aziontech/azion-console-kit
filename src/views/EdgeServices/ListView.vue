<script setup>
  import { computed, inject } from 'vue'
  import ContentBlock from '@/templates/content-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import ListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { edgeServiceService } from '@/services/v2/edge-service/edge-service-service'
  import { COLUMN_STYLES, columnStyles } from '@/helpers/column-styles'
  import { DataTableActionsButtons } from '@/components/DataTable'
  import EdgeServicesToggleStatus from '@/views/EdgeServices/Dialog/EdgeServicesToggleStatus'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  defineOptions({ name: 'list-edge-service' })

  defineProps({
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
      field: 'labelActive',
      header: 'Status',
      filterPath: 'labelActive.content',
      type: 'component',
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
            service: edgeServiceService.editEdgeServiceService
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
            service: edgeServiceService.editEdgeServiceService
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
      service: edgeServiceService.deleteEdgeServiceService
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
        :listService="edgeServiceService.listEdgeServiceService"
        :columns="getColumns"
        createPagePath="edge-services/create"
        editPagePath="/edge-services/edit"
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
