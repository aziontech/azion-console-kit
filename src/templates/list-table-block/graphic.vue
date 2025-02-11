<template>
  <div
    class="max-w-full"
    :class="{ 'mt-4': isTabs }"
    data-testid="data-table-container"
  >
    <DataTable
      ref="dataTableRef"
      class="overflow-clip rounded-md"
      :pt="pt"
      scrollable
      :scrollHeight="scrollHeight"
      :value="data"
      dataKey="id"
      :rowHover="!disabledList"
      :paginator="false"
      :rows="10"
      data-testid="data-table"
    >
      <Column
        :sortable="!col.disableSort"
        v-for="col of selectedColumns"
        :key="col.field"
        :field="col.field"
        :header="col.header"
        :sortField="col?.sortField"
        :class="computedClass"
        :style="sizeColumn"
        data-testid="data-table-column"
      >
        <template #body="{ data: rowData }">
          <template v-if="isNotComponent(col.type)">
            <div
              v-html="rowData[col.field]"
              :data-testid="`list-table-block__column__${col.field}__row`"
            />
          </template>
          <template v-else>
            <component
              :is="col.component(extractFieldValue(rowData, col.field))"
              :data-testid="`list-table-block__column__${col.field}__row`"
            />
          </template>
        </template>
      </Column>
      <template #empty>
        <slot
          name="noRecordsFound"
          data-testid="data-table-empty-content"
        >
          <div class="my-4 flex flex-col gap-3 justify-center items-start">
            <p
              class="text-md font-normal text-secondary"
              data-testid="list-table-block__empty-message__text"
            >
              {{ emptyListMessage }}
            </p>
          </div>
        </slot>
      </template>
    </DataTable>
  </div>
</template>

<script setup>
  import Column from 'primevue/column'
  import DataTable from 'primevue/datatable'
  import { ref, onMounted, computed } from 'vue'
  defineOptions({ name: 'list-table-block-graphic' })

  const props = defineProps({
    disabledList: {
      type: Boolean
    },
    hiddenHeader: {
      type: Boolean
    },
    columns: {
      type: Array,
      default: () => [{ field: 'name', header: 'Name' }]
    },
    lazyLoad: {
      type: Boolean
    },
    scrollHeight: {
      type: String,
      default: () => ''
    },
    emptyListMessage: {
      type: String,
      default: () => 'No registers found.'
    },
    isTabs: {
      type: Boolean,
      default: false
    },
    pt: {
      type: Object,
      default: () => ({})
    },
    data: {
      type: Array,
      default: () => []
    },
    smallRow: {
      type: Boolean,
      default: false
    }
  })

  const dataTableRef = ref(null)
  const selectedColumns = ref([])

  const extractFieldValue = (rowData, field) => {
    return rowData[field]
  }
  const isNotComponent = (type) => type !== 'component'

  const computedClass = computed(() => ({
    'hover:cursor-pointer': !props.disabledList,
    'px-[0.875rem] py-[0.395rem]': props.smallRow
  }))

  const sizeColumn = computed(() => {
    const amountColumn = props.columns.length
    const columnSize = 100 / amountColumn
    return `width: ${columnSize}%`
  })

  onMounted(() => {
    selectedColumns.value = props.columns
  })
</script>
