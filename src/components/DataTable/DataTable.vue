<template>
  <div
    class="max-w-full"
    :class="containerClass"
    data-testid="data-table-container"
  >
    <DataTable
      v-if="shouldRenderTable"
      ref="dataTableRef"
      :value="displayData"
      :lazy="lazy"
      :rowHover="rowHover"
      :dataKey="dataKey"
      :showGridlines="showGridlines"
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
      v-model:selection="internalSelection"
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
      resizableColumns
      columnResizeMode="fit"
      @columnResizeEnd="applyDirtyColumnResizeFix"
      :scrollHeight="scrollHeight"
      :frozenValue="frozenValue"
      paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown JumpToPageInput"
      currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
    >
      <template
        v-if="hasHeaderSlot"
        #header
      >
        <slot name="header" />
      </template>

      <template v-if="shouldShowFullSkeleton">
        <Column
          v-for="(col, index) in columns"
          :key="col.field"
          :field="col.field"
          :header="col.header"
        >
          <template #body>
            <div class="flex gap-10 items-center">
              <Skeleton
                v-if="isSelectable && index === 0"
                width="1.5rem"
                height="1.5rem"
              />
              <Skeleton class="h-[12px]" />
            </div>
          </template>
        </Column>
      </template>
      <slot v-else />

      <template #paginatorstart>
        <div class="flex-1"></div>
      </template>
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
    <template v-else>
      <div v-if="hasEmptyBlockSlot"><slot name="emptyBlock" /></div>
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
        <template #default>
          <slot name="emptyBlockButton" />
        </template>
      </EmptyResultsBlock>
    </template>
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
    showGridlines: {
      type: Boolean,
      default: false
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
    scrollable: {
      type: Boolean,
      default: true
    },
    scrollHeight: {
      type: String,
      default: 'calc(100vh - 300px)'
    },
    showLastModifiedColumn: {
      type: Boolean,
      default: true
    },
    hasEmptyBlockSlot: {
      type: Boolean,
      default: false
    },
    appliedFilters: {
      type: Array,
      default: () => []
    },
    notShowEmptyBlock: {
      type: Boolean,
      default: false
    },
    frozenValue: {
      type: Array,
      default: () => []
    },
    isSelectable: {
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
    'update:selection',
    'update:editingRows',
    'rowEditSave',
    'rowEditCancel',
    'click-to-create'
  ])

  const slots = useSlots()
  const dataTableRef = ref(null)
  const cellQuickActionsVisible = ref(false)
  const hasEmptySlot = computed(() => !!slots.empty)

  const shouldRenderTable = computed(() => {
    if (props.notShowEmptyBlock) {
      return true
    }
    return props.data.length || props.loading || props.appliedFilters.length
  })

  const hasHeaderSlot = computed(() => !!slots.header)

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

  const internalSelection = computed({
    get: () => props.selection,
    set: (value) => emit('update:selection', value)
  })

  const internalEditingRows = computed({
    get: () => props.editingRows,
    set: (value) => emit('update:editingRows', value)
  })

  const hasFooterSlot = computed(() => !!slots.footer)

  const hasSkeletonRows = computed(() => {
    return props.data.some((row) => row.isSkeletonRow)
  })

  const shouldShowFullSkeleton = computed(() => {
    return props.loading && !hasSkeletonRows.value
  })

  const displayData = computed(() => {
    if (shouldShowFullSkeleton.value && props.columns.length) {
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

  const applyDirtyColumnResizeFix = () => {
    const pvIdAttribute = Array.from(dataTableRef.value?.$el?.attributes).find((attr) =>
      attr.name.startsWith('pv_id_')
    )?.name
    const columnSizesStyle = Array.from(document.querySelectorAll('style')).find((style) =>
      style.textContent.includes('data-pc-name="datatable"')
    )
    if (columnSizesStyle) {
      columnSizesStyle.textContent = columnSizesStyle.textContent.replace(
        /\[pv_id_[0-9]+\]/gim,
        `[${pvIdAttribute}]`
      )
    }
  }
</script>

<style scoped lang="scss">
  .table-with-orange-borders :deep(.p-datatable-tbody > tr > td) {
    transition: color 0.2s ease !important;
    height: 44px;
    padding: 0 14px;
    // font-size: 12px;
  }

  .table-with-orange-borders :deep(.p-datatable-tbody > tr) {
    height: 44px;
  }

  .table-with-orange-borders :deep(.p-datatable-thead > tr) {
    height: 44px;
  }

  .table-with-orange-borders.outline-visible
    :deep(.p-datatable-tbody > tr > td:hover:not(.p-frozen-column)),
  .table-with-orange-borders.outline-visible :deep(.p-datatable-tbody > tr > td.cell-active-hover) {
    outline: 2px solid #f97316 !important;
    outline-offset: -2px;
    transition-delay: 0.3s;
    border-radius: 0 6px 6px 6px;
  }

  /* Paginator styling */
  :deep(.p-paginator) {
    height: 48px;
    padding: 8px 12px;
    font-size: 12px;
    line-height: 21px;
  }

  :deep(.p-paginator .p-paginator-current) {
    margin: 0;
  }

  /* Paginator buttons styling */
  :deep(.p-paginator .p-paginator-first),
  :deep(.p-paginator .p-paginator-prev),
  :deep(.p-paginator .p-paginator-next),
  :deep(.p-paginator .p-paginator-last),
  :deep(.p-paginator .p-paginator-page) {
    width: 24px;
    height: 24px;
    font-size: 14px;
    line-height: 21px;
    margin: 0;
  }

  :deep(.p-paginator .p-dropdown) {
    width: 61px;
    height: 26px;
    font-size: 12px;
    line-height: 21px;
    margin: 0;
    .p-dropdown-label {
      width: fit-content;
      padding-top: 0;
      padding-bottom: 0;
      display: flex;
      align-items: center;
    }
    .p-dropdown-trigger {
      width: 16px;
      padding-right: 6px;
    }
  }
  :deep(.p-paginator-page-input .p-inputtext) {
    width: fit-content;
    height: 26px;
    font-size: 12px;
    line-height: 21px;
    text-align: center;
  }

  :deep(.p-datatable-wrapper) {
    scrollbar-width: thin;
  }
  :deep(.p-datatable-header) {
    padding-left: 0;
    padding-right: 0;
  }
  :deep(.p-icon.p-sortable-column-icon) {
    width: 12px;
  }
  :deep(.p-paginator-current) {
    cursor: auto;
  }
  :deep(.p-frozen-column) {
    z-index: 50;
  }
</style>
