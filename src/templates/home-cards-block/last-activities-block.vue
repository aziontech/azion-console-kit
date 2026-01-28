<script setup>
  import { ref, onMounted, h } from 'vue'
  import Tag from 'primevue/tag'
  import SimpleTable from '@/templates/list-table-block/simple-table.vue'
  import { activityHistoryService } from '@/services/v2/activity-history/activity-history-service'

  const columns = [
    {
      field: 'ts',
      header: 'Date'
    },
    {
      field: 'type',
      header: 'Operation',
      type: 'component',
      component: (value) => {
        if (!value) return null
        return h(Tag, {
          value: value.charAt(0).toUpperCase() + value.slice(1).toLowerCase(),
          severity: getOperationSeverity(value),
          class: 'text-[11px] font-semibold'
        })
      }
    },
    {
      field: 'title',
      header: 'Activity'
    },
    {
      field: 'authorEmail',
      header: 'User'
    }
  ]

  const activities = ref([])
  const isLoading = ref(false)

  const getOperationSeverity = (type) => {
    const severities = {
      created: 'success',
      updated: 'warn',
      deleted: 'danger'
    }
    return severities[type?.toLowerCase()] || 'info'
  }

  const loadActivities = async () => {
    isLoading.value = true
    try {
      const response = await activityHistoryService.listActivityHistoryEvents({
        offset: 0,
        limit: 5,
        search: ''
      })
      activities.value = response.body || []
    } catch (error) {
      activities.value = []
    } finally {
      isLoading.value = false
    }
  }

  onMounted(() => {
    loadActivities()
  })
</script>

<template>
  <div class="flex flex-col gap-3 w-full">
    <div class="flex gap-3 items-center h-7">
      <span class="text-base font-semibold">Last Activities</span>
    </div>
    <SimpleTable
      :data="activities"
      :columns="columns"
      :rows-limit="5"
      :loading="isLoading"
      view-all-link="/activity-history"
      view-all-label="View all Activities..."
      :empty-block="{
        title: 'No activities yet',
        description: 'Your recent activities will appear here.'
      }"
    />
  </div>
</template>
