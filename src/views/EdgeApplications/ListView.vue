<script setup>
  import { computed, inject, ref } from 'vue'

  import Illustration from '@/assets/svg/illustration-layers.vue'
  import ContentBlock from '@/templates/content-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import ListTableBlock from '@/templates/list-table-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import PageHeadingBlock from '@/templates/page-heading-block'

  defineOptions({ name: 'list-edge-applications' })
  /**@type {import('@/plugins/adapters/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
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

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }
  const handleTrackEvent = () => {
    tracker.clickToCreate({
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
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Edge Applications"></PageHeadingBlock>
    </template>
    <template #content>
      <ListTableBlock
        v-if="hasContentToList"
        pageTitleDelete="Edge Application"
        addButtonLabel="Edge Application"
        createPagePath="/edge-applications/create"
        editPagePath="/edge-applications/edit"
        :listService="props.listEdgeApplicationsService"
        :deleteService="props.deleteEdgeApplicationService"
        :columns="getColumns"
        @on-load-data="handleLoadData"
        @on-before-go-to-add-page="handleTrackEvent"
        emptyListMessage="No Edge Application found."
      />
      <EmptyResultsBlock
        v-else
        title="No edge applications have been created"
        description="Click the button below to initiate the setup process and create your first edge application."
        createButtonLabel="Edge Application"
        createPagePath="/edge-applications/create"
        :documentationService="props.documentationService"
      >
        <template #illustration>
          <Illustration />
        </template>
      </EmptyResultsBlock>
    </template>
  </ContentBlock>
</template>
