<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Functions" />
    </template>
    <template #content>
      <FetchListTableBlock
        v-if="hasContentToList"
        :listService="edgeFunctionService.listEdgeFunctionsService"
        :columns="getColumns"
        addButtonLabel="Function"
        createPagePath="functions/create?origin=list"
        editPagePath="functions/edit"
        @on-load-data="handleLoadData"
        @on-before-go-to-add-page="handleCreateTrackEvent"
        @on-before-go-to-edit="handleTrackEditEvent"
        emptyListMessage="No Functions found."
        :actions="actions"
        :apiFields="EDGE_FUNCTIONS_API_FIELDS"
        :defaultOrderingFieldName="'-last_modified'"
        showLastModified
      />
      <EmptyResultsBlock
        v-else
        title="No Functions have been created"
        description="Click the button below to create your first Function."
        createButtonLabel="Function"
        createPagePath="functions/create"
        @click-to-create="handleCreateTrackEvent"
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
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { computed, ref, inject } from 'vue'
  import { edgeFunctionService } from '@/services/v2/edge-function/edge-function-service'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  defineProps({
    documentationService: {
      required: true,
      type: Function
    }
  })

  let hasContentToList = ref(true)
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

  const getColumns = computed(() => [
    {
      field: 'name',
      header: 'Name',
      filterPath: 'name.text',
      type: 'component',
      quickActions: true,
      showInactiveTag: true,
      component: (columnData) => {
        return columnBuilder({
          data: { text: columnData.text },
          columnAppearance: 'text-format'
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
      quickActions: true,
      component: (columnData) => {
        return columnBuilder({
          data: columnData,
          columnAppearance: 'language-icon-with-text'
        })
      }
    },
    {
      field: 'executionEnvironment',
      header: 'Initiator Type',
      quickActions: true
    },
    {
      field: 'lastEditor',
      header: 'Last Editor'
    },
    { field: 'lastModified', header: 'Last Modified' },
    {
      field: 'lastModified',
      header: 'Last Modified'
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
    }
    // { field: 'lastModified', header: 'Last Modified' },
    // {
    //   field: 'status',
    //   header: 'Status',
    //   sortField: 'status.content',
    //   filterPath: 'status.content',
    //   type: 'component',
    //   component: (columnData) => {
    //     return columnBuilder({
    //       data: columnData,
    //       columnAppearance: 'tag'
    //     })
    //   }
    // }
  ])

  function handleLoadData(event) {
    hasContentToList.value = event
  }
</script>
