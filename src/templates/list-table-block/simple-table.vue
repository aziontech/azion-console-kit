<script setup>
  import { computed, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import DataTable from '@/components/DataTable'
  import Skeleton from 'primevue/skeleton'

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
    },
    emptyBlock: {
      type: Object,
      default: () => ({})
    }
  })

  const emit = defineEmits(['row-click'])

  const router = useRouter()
  const menuRefs = ref({})

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

  const setMenuRef = (rowId) => (el) => {
    menuRefs.value[rowId] = el
  }

  const handleMenuToggle = (event, rowId) => {
    menuRefs.value[rowId]?.toggle(event)
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
    tableClass="overflow-clip rounded-md"
    scrollHeight="auto"
    @rowClick="handleRowClick"
    class="w-full border border-[var(--surface-border)] rounded-md overflow-hidden"
    :emptyBlock="emptyBlock"
    :pt="{
      emptyState: 'py-4 h-[306px]'
    }"
  >
    <DataTable.Column
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
        <template v-if="col.type === 'component' && col.component">
          <component :is="col.component(getFieldValue(rowData, col.field))" />
        </template>
        <template v-else>
          <span>{{ getFieldValue(rowData, col.field) }}</span>
        </template>
      </template>
    </DataTable.Column>

    <DataTable.Column
      v-if="actions.length > 0"
      :frozen="true"
      :alignFrozen="'right'"
      headerStyle="width: 40px"
      bodyStyle="text-align: center"
    >
      <template #body="{ data: rowData }">
        <DataTable.RowActions
          :rowData="rowData"
          :actions="actions"
          :onMenuToggle="handleMenuToggle"
          :menuRefSetter="setMenuRef"
        />
      </template>
    </DataTable.Column>

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
