<template>
  <div v-if="hasContentToList">
    <PageHeadingBlock :pageTitle="pageTitle" />
    <ActivityHistoryBlock
      :listEventsService="listEventsService"
      @on-load-data="handleLoadData"
    />
  </div>
  <EmptyResultsBlock
    v-else
    :pageTitle="pageTitle"
    title="No activity has been recorded yet."
    description="Start using services and products to view your account's activity."
    createButtonLabel="Quick Start"
    createPagePath="edge-applications/create"
    :documentationService="documentationService"
  >
    <template #illustration>
      <Illustration />
    </template>
  </EmptyResultsBlock>
</template>

<script>
  import PageHeadingBlock from '@templates/page-heading-block'
  import ActivityHistoryBlock from '@templates/activity-history-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import Illustration from '@/assets/svg/illustration-layers.vue'

  export default {
    name: 'activity-history-view',
    components: {
      PageHeadingBlock,
      ActivityHistoryBlock,
      EmptyResultsBlock,
      Illustration
    },
    data: () => ({
      pageTitle: 'Activity History',
      hasContentToList: true
    }),
    props: {
      listEventsService: {
        type: Function,
        required: true
      },
      documentationService: {
        type: Function,
        required: true
      }
    },
    methods: {
      handleLoadData(event) {
        this.hasContentToList = event
      }
    }
  }
</script>
