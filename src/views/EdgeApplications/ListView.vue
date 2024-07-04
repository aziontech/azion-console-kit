<script setup>
  import { computed, inject, ref } from 'vue'

  import Illustration from '@/assets/svg/illustration-layers.vue'
  import ContentBlock from '@/templates/content-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import ListTableBlock from '@/templates/list-table-block/index.vue'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import PageHeadingBlock from '@/templates/page-heading-block'

  defineOptions({ name: 'list-edge-applications' })
  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const props = defineProps({
    listEdgeApplicationsService: {
      required: true,
      type: Function
    },
    deleteEdgeApplicationService: {
      required: true,
      type: Function
    },
    documentationService: {
      required: true,
      type: Function
    }
  })

  const hasContentToList = ref(true)
  const actions = [
    {
      type: 'delete',
      title: 'edge application',
      icon: 'pi pi-trash',
      service: props.deleteEdgeApplicationService
    }
  ]

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }
  const handleTrackEvent = () => {
    tracker.product.clickToCreate({
      productName: 'Edge Application'
    })
  }
  const handleTrackEditEvent = () => {
    tracker.product.clickToEdit({
      productName: 'Edge Application'
    })
  }

  const getColumns = computed(() => {
    return [
      {
        field: 'name',
        header: 'Name'
      },
      {
        field: 'origins',
        header: 'Origins',
        type: 'component',
        component: (columnData) => {
          return columnBuilder({
            data: columnData,
            columnAppearance: 'expand-column'
          })
        }
      },
      {
        field: 'lastEditor',
        header: 'Last Editor'
      },
      {
        field: 'lastModify',
        sortField: 'lastModifyDate',
        header: 'Last Modified'
      }
    ]
  })
</script>

<template>
  <ContentBlock data-testid="edge-applications-content-block">
    <template #heading>
      <PageHeadingBlock
        pageTitle="Edge Applications"
        data-testid="edge-applications-heading"
      />
    </template>
    <template #content>
      <ListTableBlock
        v-if="hasContentToList"
        addButtonLabel="Edge Application"
        createPagePath="/edge-applications/create?origin=list"
        editPagePath="/edge-applications/edit"
        :listService="listEdgeApplicationsService"
        :columns="getColumns"
        @on-load-data="handleLoadData"
        @on-before-go-to-add-page="handleTrackEvent"
        @on-before-go-to-edit="handleTrackEditEvent"
        emptyListMessage="No edge applications found."
        data-testid="edge-applications-list-table-block"
        :actions="actions"
      />
      <EmptyResultsBlock
        v-else
        title="No edge applications have been created"
        description="Click the button below to create your first edge application."
        createButtonLabel="Edge Application"
        createPagePath="/edge-applications/create?origin=list"
        :documentationService="props.documentationService"
        data-testid="edge-applications-empty-results-block"
      >
        <template #illustration>
          <Illustration />
        </template>
      </EmptyResultsBlock>
    </template>
  </ContentBlock>
</template>
