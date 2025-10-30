<template>
  <div
    class="max-w-full"
    :class="containerClass"
    data-testid="data-table-container"
  >
    <DataTable
      v-if="notShowEmptyBlockComputed"
      ref="dataTableRef"
      :value="displayData"
      :lazy="lazy"
      :rowHover="rowHover"
      :dataKey="dataKey"
      :pt="pt"
      :class="[
        tableClass,
        'overflow-clip rounded-md table-with-orange-borders',
        { 'outline-visible': cellQuickActionsVisible }
      ]"
      v-model:filters="internalFilters"
      v-model:sortField="internalSortField"
      v-model:sortOrder="internalSortOrder"
      :editMode="editMode"
      v-model:editingRows="internalEditingRows"
      :paginator="paginator"
      :rowsPerPageOptions="rowsPerPageOptions"
      :rows="rows"
      :globalFilterFields="globalFilterFields"
      :selection="selection"
      :exportFilename="exportFilename"
      :exportFunction="exportFunction"
      :totalRecords="totalRecords"
      :first="first"
      :rowClass="rowClass"
      :expandableRowGroups="expandableRowGroups"
      :rowGroupMode="rowGroupMode"
      :groupRowsBy="groupRowsBy"
      :sortMode="sortMode"
      v-model:expandedRowGroups="internalExpandedGroups"
      @rowReorder="emit('rowReorder', $event)"
      @row-click="emit('rowClick', $event)"
      @page="emit('page', $event)"
      @sort="emit('sort', $event)"
      @row-edit-save="emit('rowEditSave', $event)"
      @row-edit-cancel="emit('rowEditCancel', $event)"
      scrollable
      removableSort
    >
      <template #header>
        <slot name="header" />
      </template>

      <template v-if="loading">
        <Column
          v-for="col in columns"
          :key="col.field"
          :field="col.field"
          :header="col.header"
        >
          <template #body>
            <Skeleton />
          </template>
        </Column>
      </template>
      <slot v-else />

      <template
        v-if="hasFooterSlot"
        #footer
      >
        <slot name="footer" />
      </template>

      <template #empty>
        <slot
          name="empty"
          v-if="hasEmptySlot"
        />
        <div
          v-else
          class="my-4 flex flex-col gap-3 justify-center items-start"
        >
          <p
            class="text-md font-normal text-secondary"
            data-testid="list-table-block__empty-message__text"
          >
            {{ emptyListMessage }}
          </p>
        </div>
      </template>

      <CellQuickActionsPopup
        :columns="columns"
        :data="data"
        :cellQuickActionsItens="cellQuickActionsItens"
        :tableRef="dataTableRef"
        @quick-actions-visible="(event) => (cellQuickActionsVisible = event)"
      />
    </DataTable>
    <EmptyResultsBlock
      v-else
      :title="emptyBlock.title"
      :description="emptyBlock.description"
      :createButtonLabel="emptyBlock.createButtonLabel"
      :createPagePath="emptyBlock.createPagePath"
      :documentationService="emptyBlock.documentationService"
      data-testid="edge-applications-empty-results-block"
    >
      <template #illustration>
        <Illustration />
      </template>
    </EmptyResultsBlock>
  </div>
</template>

<script setup>
  import { ref, computed, provide, useSlots } from 'vue'
  import DataTable from 'primevue/datatable'
  import Column from 'primevue/column'
  import Skeleton from 'primevue/skeleton'
  import CellQuickActionsPopup from '../CellQuickActionsPopup.vue'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import Illustration from '@/assets/svg/illustration-layers.vue'

  const props = defineProps({
    data: {
      type: Array,
      default: () => []
    },
    lazy: {
      type: Boolean,
      default: false
    },
    rowHover: {
      type: Boolean,
      default: true
    },
    dataKey: {
      type: String,
      default: 'id'
    },
    pt: {
      type: Object,
      default: () => ({})
    },
    containerClass: {
      type: [String, Object, Array],
      default: ''
    },
    tableClass: {
      type: [String, Object, Array],
      default: 'overflow-clip rounded-md table-with-orange-borders'
    },
    filters: {
      type: Object,
      default: () => ({})
    },
    sortField: {
      type: String,
      default: ''
    },
    sortOrder: {
      type: Number,
      default: 1
    },
    editMode: {
      type: String,
      default: 'row'
    },
    editingRows: {
      type: Array,
      default: () => []
    },
    paginator: {
      type: Boolean,
      default: false
    },
    rowsPerPageOptions: {
      type: Array,
      default: () => [10, 25, 50, 100]
    },
    rows: {
      type: Number,
      default: 10
    },
    globalFilterFields: {
      type: Array,
      default: () => []
    },
    selection: {
      type: [Object, Array],
      default: null
    },
    exportFilename: {
      type: String,
      default: 'export'
    },
    exportFunction: {
      type: Function,
      default: null
    },
    loading: {
      type: Boolean,
      default: false
    },
    totalRecords: {
      type: Number,
      default: 0
    },
    first: {
      type: Number,
      default: 0
    },
    rowClass: {
      type: Function,
      default: null
    },
    hideHeader: {
      type: Boolean,
      default: false
    },
    expandableRowGroups: {
      type: Boolean,
      default: false
    },
    rowGroupMode: {
      type: String,
      default: 'subheader'
    },
    groupRowsBy: {
      type: String,
      default: ''
    },
    sortMode: {
      type: String,
      default: 'single'
    },
    expandedRowGroups: {
      type: Array,
      default: () => []
    },
    columns: {
      type: Array,
      default: () => []
    },
    skeletonRows: {
      type: Number,
      default: 5
    },
    emptyListMessage: {
      type: String,
      default: 'No data available'
    },
    cellQuickActionsItens: {
      type: Array,
      default: () => []
    },
    emptyBlock: {
      type: Object,
      default: () => ({
        title: 'No data has been created',
        description: 'No data has been created.',
        createButtonLabel: 'Create',
        createPagePath: null,
        documentationService: null
      })
    },
    notShowEmptyBlock: {
      type: Boolean,
      default: false
    }
  })

  const emit = defineEmits([
    'rowReorder',
    'rowClick',
    'page',
    'sort',
    'update:filters',
    'update:sortField',
    'update:sortOrder',
    'update:expandedRowGroups',
    'update:editingRows',
    'rowEditSave',
    'rowEditCancel'
  ])

  const slots = useSlots()
  const dataTableRef = ref(null)
  const cellQuickActionsVisible = ref(false)
  const hasEmptySlot = computed(() => !!slots.empty)

  const notShowEmptyBlockComputed = computed(() => {
    if (props.notShowEmptyBlock) {
      return true
    }
    return props.data.length || props.loading
  })

  const internalFilters = computed({
    get: () => props.filters,
    set: (value) => emit('update:filters', value)
  })

  const internalSortField = computed({
    get: () => props.sortField,
    set: (value) => emit('update:sortField', value)
  })

  const internalSortOrder = computed({
    get: () => props.sortOrder,
    set: (value) => emit('update:sortOrder', value)
  })

  const internalExpandedGroups = computed({
    get: () => props.expandedRowGroups,
    set: (value) => emit('update:expandedRowGroups', value)
  })

  const internalEditingRows = computed({
    get: () => props.editingRows,
    set: (value) => emit('update:editingRows', value)
  })

  // const hasHeaderSlot = computed(() => !!slots.header)
  const hasFooterSlot = computed(() => !!slots.footer)

  const displayData = computed(() => {
    if (props.loading && props.columns.length) {
      // eslint-disable-next-line no-unused-vars
      return Array.from({ length: props.rows }, (aux, index) => {
        const row = { id: index }
        props.columns.forEach((col) => {
          row[col.field] = null
        })
        return row
      })
    }
    return props.data
  })

  provide('dataTable', {
    dataTableRef,
    filters: internalFilters,
    exportCSV: () => {
      dataTableRef.value?.exportCSV()
    }
  })

  defineExpose({
    dataTableRef,
    exportCSV: () => dataTableRef.value?.exportCSV()
  })
</script>

<style scoped lang="scss">
  .table-with-orange-borders :deep(.p-datatable-tbody > tr > td) {
    transition: color 0.2s ease !important;
  }

  .table-with-orange-borders.outline-visible
    :deep(.p-datatable-tbody > tr > td:hover:not(.p-frozen-column)),
  .table-with-orange-borders.outline-visible :deep(.p-datatable-tbody > tr > td.cell-active-hover) {
    outline: 2px solid #f97316 !important;
    outline-offset: -2px;
    transition-delay: 0.3s;
    border-radius: 0 6px 6px 6px;
  }
</style>
