<script setup>
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import ContentBlock from '@/templates/content-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import { computed, inject } from 'vue'
  import { edgeFunctionService } from '@/services/v2/edge-function/edge-function-service'
  import { DataTableActionsButtons } from '@/components/DataTable'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  defineProps({
    documentationService: {
      required: true,
      type: Function
    }
  })

  const EDGE_FUNCTIONS_API_FIELDS = [
    'id',
    'name',
    'active',
    'runtime',
    'vendor',
    'execution_environment',
    'reference_count',
    'last_editor',
    'last_modified'
  ]
  const actions = [
    {
      label: 'Delete',
      type: 'delete',
      title: 'Function',
      icon: 'pi pi-trash',
      service: edgeFunctionService.deleteEdgeFunctionService
    }
  ]

  const handleCreateTrackEvent = () => {
    tracker.product.clickToCreate({
      productName: 'Edge Functions'
    })
  }

  const handleTrackEditEvent = () => {
    tracker.product.clickToEdit({
      productName: 'Edge Functions'
    })
  }

  const csvMapper = (rowData) => {
    return {
      name: rowData.data?.text || rowData.name,
      id: rowData.id,
      version: rowData.version,
      referenceCount: rowData.referenceCount,
      vendor: rowData.data?.vendor,
      runtime: rowData.data?.content,
      executionEnvironment: rowData.data?.executionEnvironment,
      lastEditor: rowData.data?.lastEditor,
      lastModified: rowData.data?.lastModified,
      status: rowData.data?.content
    }
  }
  const allowedFilters = [
    {
      header: 'Name',
      field: 'name'
    },
    {
      header: 'ID',
      field: 'id'
    },
    {
      header: 'Initiator Type',
      field: 'execution_environment'
    },
    {
      header: 'Status',
      field: 'active'
    }
  ]
  const getColumns = computed(() => [
    {
      field: 'name',
      header: 'Name',
      filterPath: 'name.text',
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
      field: 'version',
      header: 'Version'
    },
    {
      field: 'referenceCount',
      header: 'Ref. Count'
    },
    {
      field: 'vendor',
      header: 'Vendor',
      type: 'component',
      component: (columnData) => {
        return columnBuilder({
          data: {
            vendorData: columnData,
            iconClass: 'pi pi-shopping-cart text-xl'
          },
          columnAppearance: 'icon-with-tooltip'
        })
      }
    },
    {
      field: 'runtime',
      header: 'Language',
      filterPath: 'runtime.content',
      type: 'component',
      component: (columnData) => {
        return columnBuilder({
          data: columnData,
          columnAppearance: 'language-icon-with-text'
        })
      }
    },
    {
      field: 'executionEnvironment',
      header: 'Initiator Type'
    },
    {
      field: 'status',
      header: 'Status',
      sortField: 'status.content',
      filterPath: 'status.content',
      type: 'component',
      component: (columnData) => {
        return columnBuilder({
          data: columnData,
          columnAppearance: 'tag'
        })
      }
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
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        pageTitle="Functions"
        description="Manage serverless functions for applications."
      >
        <template #default>
          <DataTableActionsButtons
            size="small"
            label="Function"
            @click="handleCreateTrackEvent"
            createPagePath="functions/create?origin=list"
            data-testid="create_Function_button"
          />
        </template>
      </PageHeadingBlock>
    </template>
    <template #content>
      <FetchListTableBlock
        :listService="edgeFunctionService.listEdgeFunctionsService"
        :columns="getColumns"
        createPagePath="functions/create?origin=list"
        editPagePath="/functions/edit"
        @on-before-go-to-add-page="handleCreateTrackEvent"
        @on-before-go-to-edit="handleTrackEditEvent"
        emptyListMessage="No Functions found."
        :actions="actions"
        :apiFields="EDGE_FUNCTIONS_API_FIELDS"
        :defaultOrderingFieldName="'-last_modified'"
        :frozen-columns="['name']"
        exportFileName="Functions"
        :csvMapper="csvMapper"
        :allowedFilters="allowedFilters"
        :emptyBlock="{
          title: 'No Functions have been created',
          description: 'Click the button below to create your first Function.',
          createButtonLabel: 'Function',
          createPagePath: 'functions/create?origin=list',
          documentationService: documentationService
        }"
      />
    </template>
  </ContentBlock>
</template>
