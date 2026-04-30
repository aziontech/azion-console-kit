<script setup>
  import DataTable from '@aziontech/webkit/list-data-table'

  defineOptions({ name: 'list-table-graphic' })

  defineProps({
    data: {
      type: Array,
      required: true
    },
    columns: {
      type: Array,
      required: true
    },
    smallRow: {
      type: Boolean,
      default: false
    },
    emptyListMessage: {
      type: String,
      default: 'No registers found.'
    },
    scrollHeight: {
      type: String,
      default: ''
    }
  })
</script>

<template>
  <div
    class="max-w-full"
    :class="{ 'small-row': smallRow }"
    data-testid="list-table-graphic-container"
  >
    <DataTable
      :data="data"
      :paginator="false"
      :columns="columns"
      :scrollable="!!scrollHeight"
      :scrollHeight="scrollHeight"
      :emptyListMessage="emptyListMessage"
      :rowHover="false"
      :resizableColumns="false"
      :pt="{}"
      data-testid="list-table-graphic"
    >
      <DataTable.Column
        v-for="col of columns"
        :key="col.field"
        :field="col.field"
        :header="col.header"
        :style="{ width: `${100 / columns.length}%` }"
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
    </DataTable>
  </div>
</template>

<style scoped>
  .small-row :deep(.p-datatable-tbody > tr) {
    height: auto !important;
  }
  .small-row :deep(.p-datatable-tbody > tr > td) {
    height: auto !important;
    padding: 0.295rem 0.875rem !important;
  }
</style>
