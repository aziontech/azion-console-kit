<script setup>
  import { ref, onMounted, h } from 'vue'
  import { useRouter } from 'vue-router'
  import { useToast } from 'primevue/usetoast'
  import SimpleTable from '@/templates/list-table-block/simple-table.vue'
  import OperationTag from '@/views/ActivityHistory/components/OperationTag.vue'
  import { activityHistoryService } from '@/services/v2/activity-history/activity-history-service'
  import { resolveActivityHistoryRoute } from '@/services/v2/activity-history/activity-history-routing'

  const router = useRouter()
  const toast = useToast()

  const columns = [
    {
      field: 'date',
      header: 'Date'
    },
    {
      field: 'operation',
      header: 'Operation',
      type: 'component',
      component: (value) => {
        if (!value) return null
        return h(OperationTag, { operation: value })
      }
    },
    {
      field: 'resourceType',
      header: 'Type'
    },
    {
      field: 'resourceName',
      header: 'Resource',
      enableClick: true
    },
    {
      field: 'authorEmail',
      header: 'Author Email'
    }
  ]

  const activities = ref([])
  const isLoading = ref(false)

  const loadActivities = async () => {
    isLoading.value = true
    try {
      const response = await activityHistoryService.listActivityHistoryEvents({
        offset: 0,
        limit: 5,
        search: '',
        ordering: '-ts'
      })
      activities.value = response.body || []
    } catch (error) {
      activities.value = []
    } finally {
      isLoading.value = false
    }
  }

  const handleRowClick = async (event) => {
    const rowData = event?.data || event
    const location = resolveActivityHistoryRoute(rowData)
    if (!location) {
      toast.add({
        closable: true,
        severity: 'warn',
        summary: 'No route available for this activity',
        life: 5000
      })
      return
    }

    try {
      await router.push(location)
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: error?.message || 'Navigation error',
        life: 5000
      })
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
      @row-click="handleRowClick"
    />
  </div>
</template>
