<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        pageTitle="Activity History"
        description="View recorded account actions and configuration changes."
      />
    </template>
    <template #content>
      <div v-if="hasContentToList">
        <ActivityHistoryBlock
          :listActivityHistoryEventsService="activityHistoryService.listActivityHistoryEvents"
          :getActivityHistoryTotalRecords="activityHistoryService.getTotalRecords"
          @on-load-data="handleLoadData"
        />
      </div>
      <EmptyResultsBlock
        v-else
        title="No activity has been recorded"
        description="No activities found."
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

<script setup>
  import { ref, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import ActivityHistoryBlock from '@templates/activity-history-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import PrimeButton from 'primevue/button'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { activityHistoryService } from '@/services/v2/activity-history/activity-history-service'

  defineProps({
    documentationService: {
      type: Function,
      required: true
    }
  })

  const hasContentToList = ref(true)
  const router = useRouter()

  onMounted(() => {
    if (!activityHistoryService.listActivityHistoryEvents) {
      hasContentToList.value = false
    }
  })

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const navigateToHomePage = () => {
    router.push('/')
  }
</script>
