<script setup>
  import { computed, ref } from 'vue'
  import DataTable from '@aziontech/webkit/list-data-table'
  const DataTableRowActions = DataTable.RowActions
  import { useRouter } from 'vue-router'

  defineOptions({ name: 'list-table-simple' })

  const props = defineProps({
    data: {
      type: Array,
      required: true
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
    viewAllLink: {
      type: [String, Object]
    },
    viewAllLabel: {
      type: String,
      default: 'View all...'
    },
    actions: {
      type: [Array, Function],
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

  const router = useRouter()
  const isHoverFooter = ref(false)

  const visibleData = computed(() => {
    return props.data.slice(0, props.rowsLimit)
  })

  const hasActions = computed(() => {
    if (typeof props.actions === 'function') return true
    return props.actions?.length > 0
  })

  function navigateToViewAll() {
    if (props.viewAllLink) {
      router.push(props.viewAllLink)
    }
  }
</script>

<template>
  <div
    class="max-w-full"
    data-testid="list-table-simple-container"
  >
    <DataTable
      :data="visibleData"
      :loading="loading"
      :paginator="false"
      :columns="columns"
      :dataKey="dataKey"
      :emptyBlock="emptyBlock"
      class="w-full overflow-hidden"
      :resizableColumns="false"
      :pt="{
        emptyState: 'py-4 h-[306px]'
      }"
      data-testid="list-table-simple"
    >
      <DataTable.Column
        v-for="col of columns"
        :key="col.field"
        :field="col.field"
        :header="col.header"
        :sortable="col.sortable || false"
        :style="col.style"
      >
        <template #body="{ data: rowData }">
          <slot
            :name="`column-${col.field}`"
            :data="rowData"
          >
            <template v-if="col.type === 'component'">
              <component :is="col.component(rowData[col.field], rowData)" />
            </template>
            <template v-else>
              <span>{{ rowData[col.field] }}</span>
            </template>
          </slot>
        </template>
      </DataTable.Column>

      <DataTable.Column
        v-if="hasActions"
        header=""
        :frozen="true"
        :alignFrozen="'right'"
        headerStyle="width: 40px"
        bodyStyle="text-align: center"
      >
        <template #body="{ data: rowData }">
          <DataTableRowActions
            v-if="!rowData.isSkeletonRow"
            :rowData="rowData"
            :actions="actions"
          />
        </template>
      </DataTable.Column>
      <template #footer>
        <div
          v-if="viewAllLink"
          class="flex justify-center items-center py-3 cursor-pointer bg-[var(--surface-ground)] border-[var(--surface-border)]"
          @click="navigateToViewAll"
          data-testid="list-table-simple-view-all"
          @mouseover="isHoverFooter = true"
          @mouseout="isHoverFooter = false"
        >
          <span
            class="text-xs font-normal text-[var(--text-color-link)]"
            :class="{ underline: isHoverFooter }"
          >
            {{ viewAllLabel }}
          </span>
        </div>
      </template>
    </DataTable>
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
