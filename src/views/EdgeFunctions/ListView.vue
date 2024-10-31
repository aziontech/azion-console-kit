<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Edge Functions" />
    </template>
    <template #content>
      <FetchListTableBlock
        v-if="hasContentToList"
        :listService="listEdgeFunctionsService"
        :columns="getColumns"
        addButtonLabel="Edge Function"
        createPagePath="edge-functions/create?origin=list"
        editPagePath="edge-functions/edit"
        @on-load-data="handleLoadData"
        @on-before-go-to-add-page="handleCreateTrackEvent"
        @on-before-go-to-edit="handleTrackEditEvent"
        emptyListMessage="No edge functions found."
        :actions="actions"
        :apiFields="EDGE_FUNCTIONS_API_FIELDS"
      />
      <EmptyResultsBlock
        v-else
        title="No functions have been created"
        description="Click the button below to create your first function."
        createButtonLabel="Edge Function"
        createPagePath="edge-functions/create"
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
  // import ListTableBlock from '@/templates/list-table-block'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { computed, ref, inject } from 'vue'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const props = defineProps({
    listEdgeFunctionsService: {
      required: true,
      type: Function
    },
    deleteEdgeFunctionsService: {
      required: true,
      type: Function
    },
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
    'language',
    'initiator_type',
    'reference_count',
    'last_editor'
  ]
  const actions = [
    {
      type: 'delete',
      title: 'edge function',
      icon: 'pi pi-trash',
      service: props.deleteEdgeFunctionsService
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
      header: 'Ref. Count'
    },
    {
      field: 'language',
      header: 'Language',
      filterPath: 'language.content',
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
  ])

  function handleLoadData(event) {
    hasContentToList.value = event
  }
</script>
