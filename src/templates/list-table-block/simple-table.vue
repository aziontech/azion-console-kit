<script setup>
  import { computed } from 'vue'
  import { useRouter } from 'vue-router'
  import DataTable from '@/components/DataTable/DataTable.vue'
  import Column from 'primevue/column'
  import PrimeButton from 'primevue/button'
  import Tag from 'primevue/tag'
  import Skeleton from 'primevue/skeleton'
  import { columnBuilder } from './columns/column-builder.js'

  const props = defineProps({
    data: {
      type: Array,
      default: () => []
    },
    columns: {
      type: Array,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    },
    rowsLimit: {
      type: Number,
      default: 5
    },
    showFilterButton: {
      type: Boolean,
      default: false
    },
    viewAllLink: {
      type: [String, Object],
      default: ''
    },
    viewAllLabel: {
      type: String,
      default: 'View all...'
    },
    actions: {
      type: Array,
      default: () => []
    },
    dataKey: {
      type: String,
      default: 'id'
    }
  })

  const emit = defineEmits(['row-click'])

  const router = useRouter()

  const displayData = computed(() => {
    if (props.loading) {
      //eslint-disable-next-line no-unused-vars
      return Array.from({ length: props.rowsLimit }, (item, index) => ({
        id: `skeleton-${index}`,
        isSkeletonRow: true
      }))
    }
    return props.data.slice(0, props.rowsLimit)
  })

  const handleRowClick = (event) => {
    if (event.data?.isSkeletonRow) return
    emit('row-click', event)
  }

  const handleViewAllClick = () => {
    if (props.viewAllLink) {
      if (typeof props.viewAllLink === 'string') {
        router.push(props.viewAllLink)
      } else {
        router.push(props.viewAllLink)
      }
    }
  }

  const getFieldValue = (rowData, field) => {
    if (!field) return null
    const keys = field.split('.')
    let value = rowData
    for (const key of keys) {
      value = value?.[key]
    }
    return value
  }

  const getTagSeverity = (status) => {
    const severityMap = {
      active: 'success',
      inactive: 'danger',
      pending: 'warning',
      default: 'info'
    }
    return severityMap[status?.toLowerCase()] || severityMap.default
  }
</script>

<template>
  <DataTable
    :data="displayData"
    :columns="columns"
    :loading="false"
    :dataKey="dataKey"
    :paginator="false"
    :rowHover="true"
    :notShowEmptyBlock="true"
    tableClass="overflow-clip rounded-md"
    scrollHeight="auto"
    @rowClick="handleRowClick"
    class="w-full border border-[var(--surface-border)] rounded-md overflow-hidden"
  >
    <Column
      v-for="col in columns"
      :key="col.field"
      :field="col.field"
      :header="col.header"
      :sortable="col.sortable || false"
      :class="{ 'hover:cursor-pointer': !col.disableClick }"
    >
      <template #body="{ data: rowData }">
        <template v-if="rowData.isSkeletonRow">
          <Skeleton
            class="h-[14px]"
            :width="col.skeletonWidth || '80%'"
          />
        </template>

        <template v-else-if="col.type === 'link'">
          <PrimeButton
            link
            @click.stop="$emit('row-click', { data: rowData })"
          >
            <p class="p-link underline text-xs">
              {{ getFieldValue(rowData, col.field) }}
            </p>
          </PrimeButton>
        </template>

        <template v-else-if="col.type === 'tag'">
          <Tag
            :value="getFieldValue(rowData, col.field)"
            :severity="getTagSeverity(getFieldValue(rowData, col.field))"
          />
        </template>

        <template v-else-if="col.type === 'text-array'">
          <component
            :is="
              columnBuilder({
                data: getFieldValue(rowData, col.field) || [],
                columnAppearance: 'text-array-with-popup',
                dependencies: { showCopy: false }
              })
            "
          />
        </template>

        <template v-else-if="col.type === 'component' && col.component">
          <component :is="col.component(getFieldValue(rowData, col.field))" />
        </template>

        <template v-else>
          <span class="text-xs">{{ getFieldValue(rowData, col.field) }}</span>
        </template>
      </template>
    </Column>

    <Column
      v-if="actions.length > 0"
      :frozen="true"
      :alignFrozen="'right'"
      headerStyle="width: 40px"
      bodyStyle="text-align: center"
    >
      <template #body="{ data: rowData }">
        <template v-if="rowData.isSkeletonRow">
          <Skeleton
            shape="circle"
            size="24px"
          />
        </template>
        <template v-else>
          <PrimeButton
            icon="pi pi-ellipsis-v"
            text
            size="small"
            severity="secondary"
            @click.stop="toggleMenu($event, rowData)"
            data-testid="resources-table-row-actions"
          />
        </template>
      </template>
    </Column>

    <template #footer>
      <div
        v-if="viewAllLink"
        class="flex justify-center items-center py-3 cursor-pointer bg-[var(--surface-section)] border-t border-[var(--surface-border)]"
        @click="handleViewAllClick"
        data-testid="resources-table-view-all"
      >
        <span class="text-xs text-[#93c5fd]">
          {{ viewAllLabel }}
        </span>
      </div>
    </template>
  </DataTable>
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
