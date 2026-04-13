<script setup>
  import { ref, computed, onMounted, h } from 'vue'
  import { useRouter } from 'vue-router'
  import { useToast } from '@aziontech/webkit/use-toast'
  import ListTableSimple from '@/components/list-table/ListTableSimple.vue'
  import Skeleton from '@aziontech/webkit/skeleton'
  import OperationTag from '@/views/ActivityHistory/components/OperationTag.vue'
  import { activityHistoryService } from '@/services/v2/activity-history/activity-history-service'
  import { resolveActivityHistoryRoute } from '@/services/v2/activity-history/activity-history-routing'

  const router = useRouter()
  const toast = useToast()

  const ROWS_LIMIT = 5

  const columns = [
    {
      field: 'date',
      header: 'Date',
      style: 'width: 13rem; max-width: 13rem',
      truncate: true
    },
    {
      field: 'operation',
      header: 'Operation',
      type: 'component',
      style: 'width: 8rem; max-width: 8rem',
      component: (value) => {
        if (!value) return null
        return h(OperationTag, { operation: value })
      }
    },
    {
      field: 'resourceType',
      header: 'Type',
      style: 'width: 12rem; max-width: 10rem',
      truncate: true
    },
    {
      field: 'resourceName',
      header: 'Resource',
      style: 'width: 14rem; max-width: 14rem',
      enableClick: true,
      truncate: true
    },
    {
      field: 'authorEmail',
      header: 'Author Email',
      style: 'width: 14rem; max-width: 14rem',
      truncate: true
    }
  ]

  const activities = ref([])
  const isLoading = ref(false)

  const displayData = computed(() => {
    if (isLoading.value) {
      return Array.from({ length: ROWS_LIMIT }, (_unused, index) => ({
        id: `skeleton-${index}`,
        isSkeletonRow: true
      }))
    }
    return activities.value.slice(0, ROWS_LIMIT)
  })

  const getFieldValue = (rowData, field) => {
    if (!field) return null
    const keys = field.split('.')
    let value = rowData
    for (const key of keys) {
      value = value?.[key]
    }
    return value
  }

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
    if (event.data?.isSkeletonRow) return
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
    <ListTableSimple
      :data="displayData"
      :columns="columns"
      :loading="false"
      :rowsLimit="ROWS_LIMIT"
      viewAllLink="/activity-history"
      viewAllLabel="View all Activities..."
      :emptyBlock="{
        title: 'No activities yet',
        description: 'Your recent activities will appear here.'
      }"
    >
      <template
        v-for="col in columns"
        :key="col.field"
        #[`column-${col.field}`]="{ data: rowData }"
      >
        <div
          :class="{ 'cursor-pointer hover:underline': col.enableClick && !rowData.isSkeletonRow }"
          @click.stop="
            col.enableClick && !rowData.isSkeletonRow && handleRowClick({ data: rowData })
          "
        >
          <template v-if="rowData.isSkeletonRow">
            <Skeleton
              class="h-[14px]"
              :width="col.skeletonWidth || '80%'"
            />
          </template>
          <template v-else-if="col.type === 'component' && col.component">
            <component :is="col.component(getFieldValue(rowData, col.field))" />
          </template>
          <template v-else>
            <span :class="{ 'block truncate': col.truncate }">{{
              getFieldValue(rowData, col.field)
            }}</span>
          </template>
        </div>
      </template>
    </ListTableSimple>
  </div>
</template>

<style scoped lang="scss">
  :deep(.p-datatable-footer) {
    padding: 0;
    border: none;
  }

  :deep(.p-datatable-tbody > tr > td) {
    height: 44px;
    padding: 0 12px;
  }

  :deep(.p-datatable-thead > tr > th) {
    height: 44px;
    padding: 0 12px;
  }
</style>
