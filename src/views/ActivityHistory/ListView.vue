<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Activity History"></PageHeadingBlock>
    </template>
    <template #content>
      <div v-if="hasContentToList">
        <ActivityHistoryBlock
          :listEventsService="listEventsService"
          @on-load-data="handleLoadData"
        />
      </div>
      <EmptyResultsBlock
        v-else
        title="No activity has been recorded"
        description="Start using services and products to view your account activity."
        :documentationService="documentationService"
      >
        <template #illustration>
          <Illustration />
        </template>
        <template #default>
          <PrimeButton
            class="max-md:w-full w-fit"
            severity="secondary"
            label="Go to Home"
            @click="navigateToHomePage"
          />
        </template>
      </EmptyResultsBlock>
    </template>
  </ContentBlock>
</template>

<script>
  import ActivityHistoryBlock from '@templates/activity-history-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import PrimeButton from 'primevue/button'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'

  export default {
    name: 'activity-history-view',
    components: {
      PageHeadingBlock,
      ActivityHistoryBlock,
      EmptyResultsBlock,
      Illustration,
      PrimeButton,
      ContentBlock
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
      },
      navigateToHomePage() {
        this.$router.push('/')
      }
    }
  }
</script>
