<template>
  <div>
    <PageHeadingBlock :pageTitle="pageTitle" />
    <ActivityHistoryBlock :listEventsService="listEventsService" />
  </div>
</template>

<script>
  import PageHeadingBlock from '@templates/page-heading-block'
  import ActivityHistoryBlock from '@templates/activity-history-block'

  export default {
    name: 'activity-history-view',
    components: {
      PageHeadingBlock,
      ActivityHistoryBlock
    },
    data: () => ({
      pageTitle: 'Activity History'
    }),
    props: {
      listEventsService: {
        type: Function,
        required: true
      }
    }
  }
</script>
