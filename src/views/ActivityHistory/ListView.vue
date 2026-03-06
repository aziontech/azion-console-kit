<script setup>
  import { useRouter } from 'vue-router'
  import { activityHistoryService } from '@/services/v2/activity-history/activity-history-service'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import ActivityHistoryTable from './components/ActivityHistoryTable.vue'
  import PrimeButton from 'primevue/button'

  const router = useRouter()

  defineProps({
    documentationService: {
      type: Function,
      required: true
    }
  })

  const goToHome = () => {
    router.push('/')
  }
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        pageTitle="Activity History"
        description="View recorded account actions and configuration changes."
      />
    </template>
    <template #content>
      <ActivityHistoryTable
        :listService="activityHistoryService.listActivityHistoryEvents"
        :getTotalRecordsService="activityHistoryService.getTotalRecords"
        :documentationService="documentationService"
      >
        <template #emptyBlockButton>
          <PrimeButton
            label="Go to Home"
            severity="secondary"
            @click="goToHome"
          />
        </template>
      </ActivityHistoryTable>
    </template>
  </ContentBlock>
</template>
