<script setup>
  import DataTable from '@aziontech/webkit/datatable'
  import Column from '@aziontech/webkit/column'
  import PrimeButton from '@aziontech/webkit/button'
  import Skeleton from '@aziontech/webkit/skeleton'
  import EmptyResultsBlock from '@aziontech/webkit/empty-results-block'
  import EventDocumentView from './event-document-view.vue'
  import LogFieldBadges from './log-field-badges.vue'
  import { ref } from 'vue'

  defineOptions({ name: 'DiscoverDataTable' })

  defineProps({
    data: { type: Array, default: () => [] },
    selectedFields: { type: Array, default: () => [] },
    expandedRows: { type: Array, default: () => [] },
    detailViewMode: { type: String, default: 'inline' },
    isLoading: { type: Boolean, default: false },
    isDetailLoading: { type: Boolean, default: false },
    exportFilename: { type: String, default: 'logs' },
    exportFunction: { type: Function, default: undefined },
    rowClass: { type: Function, default: undefined },
    debouncedSearchQuery: { type: String, default: '' },
    dataset: { type: String, default: '' },
    highlightText: { type: Function, default: (value) => value },
    isRowActive: { type: Function, default: () => false },
    getFieldValue: { type: Function, required: true }
  })

  const emit = defineEmits([
    'update:expandedRows',
    'row-click',
    'select-row',
    'add-filter',
    'exclude-filter',
    'notify'
  ])

  const dataTableRef = ref(null)

  const exportCSV = () => dataTableRef.value?.exportCSV?.()

  defineExpose({ dataTableRef, exportCSV })
</script>

<template>
  <div class="discover-table-scroll-area">
    <div v-if="isLoading" class="flex flex-col gap-2 p-4 w-full">
      <Skeleton v-for="idx in 8" :key="idx" class="w-full h-10" />
    </div>
    <DataTable
      v-else
      ref="dataTableRef"
      :value="data"
      dataKey="id"
      :expandedRows="expandedRows"
      @update:expandedRows="emit('update:expandedRows', $event)"
      removableSort scrollable scrollHeight="flex" resizableColumns columnResizeMode="expand"
      :exportFilename="exportFilename"
      :exportFunction="exportFunction"
      :rowClass="rowClass"
      :pt="{ bodyRow: { 'data-testid': 'table-body-row' } }"
      class="discover-data-table"
      @row-click="emit('row-click', $event)"
    >
      <Column :style="{ width: '2.5rem', minWidth: '2.5rem', maxWidth: '2.5rem' }" frozen>
        <template #body="{ data: rowData }">
          <i
            :class="['pi pi-chevron-right expand-indicator', { 'expand-indicator--active': isRowActive(rowData) }]"
            @click.stop="emit('select-row', rowData)"
          />
        </template>
      </Column>
      <Column field="tsFormat" header="Time" sortable sortField="ts"
        :style="{ width: '185px', minWidth: '185px', maxWidth: '185px' }"
        frozen>
        <template #body="{ data: rowData }">
          <span class="timestamp-cell" @click="emit('select-row', rowData)">{{ rowData.tsFormat }}</span>
        </template>
      </Column>
      <Column v-for="fieldName in selectedFields" :key="'field-' + fieldName"
        :field="'field_' + fieldName" :header="fieldName"
        :style="{ minWidth: '120px', maxWidth: '300px' }">
        <template #body="{ data: rowData }">
          <span class="dynamic-field-cell group/dyn">
            <span class="dynamic-field-value"
              v-tooltip.top="{ value: getFieldValue(rowData, 'field_' + fieldName), showDelay: 500 }"
              v-html="highlightText(getFieldValue(rowData, 'field_' + fieldName))"
            />
            <span class="dynamic-field-actions">
              <PrimeButton icon="pi pi-filter" text size="small" class="!w-5 !h-5 !p-0"
                @click.stop="emit('add-filter', fieldName, getFieldValue(rowData, 'field_' + fieldName))" />
              <PrimeButton icon="pi pi-filter-slash" text size="small" class="!w-5 !h-5 !p-0"
                @click.stop="emit('exclude-filter', fieldName, getFieldValue(rowData, 'field_' + fieldName))" />
            </span>
          </span>
        </template>
      </Column>
      <Column v-if="selectedFields.length === 0" field="summary" header="Document" :style="{ minWidth: '400px' }">
        <template #body="{ data: rowData }">
          <LogFieldBadges
            :summary="rowData.summary" :highlightFields="selectedFields"
            :searchQuery="debouncedSearchQuery" :dataset="dataset"
            @toggle-expand="emit('select-row', rowData)"
            @add-filter="(f, v) => emit('add-filter', f, v)"
            @exclude-filter="(f, v) => emit('exclude-filter', f, v)"
          />
        </template>
      </Column>
      <template v-if="detailViewMode === 'inline'" #expansion="{ data: rowData }">
        <div class="expansion-content">
          <EventDocumentView
            :data="rowData" :onAddFilter="(f, v) => emit('add-filter', f, v)"
            :onExcludeFilter="(f, v) => emit('exclude-filter', f, v)"
            :isLoading="isDetailLoading" :compact="true"
            @notify="(payload) => emit('notify', payload)"
          />
        </div>
      </template>
      <template #empty>
        <EmptyResultsBlock title="No logs found" description="Try adjusting your time range or filters." :noBorder="true">
          <template #illustration><i class="pi pi-search text-5xl text-color-secondary" /></template>
          <template #default><span /></template>
        </EmptyResultsBlock>
      </template>
    </DataTable>
  </div>
</template>

<style scoped>
  .discover-table-scroll-area {
    flex: 1;
    min-height: 0;
    min-width: 0;
    width: 100%;
    overflow: hidden;
  }

  /* ── DataTable overrides ── */
  :deep(.discover-data-table) {
    width: 100%;
    table-layout: auto;
  }
  :deep(.discover-data-table .p-datatable-wrapper) {
    overflow: auto !important;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  :deep(.discover-data-table .p-datatable-table) {
    table-layout: auto;
    width: 100%;
  }
  :deep(.discover-data-table .p-datatable-thead > tr > th) {
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    color: var(--text-color-secondary);
    background: var(--surface-ground);
    border-bottom: 2px solid var(--surface-border);
    position: sticky;
    top: 0;
    z-index: 1;
    white-space: nowrap;
  }
  :deep(.discover-data-table .p-datatable-tbody > tr > td) {
    padding: 0.65rem 0.75rem;
    vertical-align: top;
    border-bottom: 1px solid var(--surface-border);
    font-size: 0.8rem;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: background-color 0.15s, box-shadow 0.15s;
  }
  :deep(.discover-data-table .p-datatable-tbody > tr:nth-child(even) > td) {
    background: var(--table-body-row-even-bg);
  }
  :deep(.discover-data-table .p-datatable-tbody > tr:nth-child(odd) > td) {
    background: var(--surface-card);
  }
  :deep(.discover-data-table .p-datatable-tbody > tr:hover > td) {
    background: var(--table-body-row-hover-bg) !important;
    cursor: pointer;
  }
  :deep(.discover-data-table .p-datatable-tbody > tr.row--active > td) {
    background: color-mix(in srgb, var(--primary-color) 6%, transparent) !important;
  }
  :deep(.discover-data-table .p-datatable-tbody > tr.row--active > td:first-child) {
    box-shadow: none;
  }
  /* Remove PrimeVue default selection outline/border */
  :deep(.discover-data-table .p-datatable-tbody > tr:focus),
  :deep(.discover-data-table .p-datatable-tbody > tr.p-highlight) {
    outline: none !important;
    box-shadow: none !important;
  }
  :deep(.discover-data-table .p-datatable-tbody > tr.p-highlight > td) {
    background: inherit !important;
    border-color: transparent !important;
  }
  :deep(.discover-data-table .p-datatable-tbody > tr.row--active:hover > td) {
    background: color-mix(in srgb, var(--primary-color) 10%, transparent) !important;
  }
  :deep(.discover-data-table .p-datatable-tbody > tr.row--expanded > td) {
    background: var(--surface-100) !important;
    border-bottom-color: transparent;
  }
  :deep(.discover-data-table .p-datatable-tbody > tr.row--focused > td) {
    background: var(--surface-hover) !important;
  }
  :deep(.discover-data-table .p-datatable-tbody > tr.p-datatable-row-expansion > td) {
    padding: 0;
    background: var(--surface-ground);
  }
  :deep(.discover-data-table .p-datatable-header) {
    display: none;
  }
  :deep(.discover-data-table .p-datatable-emptymessage) {
    flex: 1;
  }
  :deep(.discover-data-table .p-datatable-emptymessage > td) {
    height: 100%;
  }
  /* First column (expand chevron): no ellipsis, no overflow */
  :deep(.discover-data-table .p-datatable-tbody > tr > td:first-child) {
    overflow: visible;
    text-overflow: clip;
  }
  /* Subtle row divider */
  :deep(.discover-data-table .p-datatable-tbody > tr > td) {
    border-bottom: 1px solid color-mix(in srgb, var(--surface-border) 50%, transparent);
  }
  /* Frozen columns: keep background consistent */
  :deep(.discover-data-table .p-datatable-tbody > tr:nth-child(even) > td.p-frozen-column) {
    background: var(--table-body-row-even-bg);
  }
  :deep(.discover-data-table .p-datatable-tbody > tr:nth-child(odd) > td.p-frozen-column) {
    background: var(--surface-card);
  }
  :deep(.discover-data-table .p-datatable-tbody > tr:hover > td.p-frozen-column) {
    background: var(--table-body-row-hover-bg) !important;
  }
  :deep(.discover-data-table .p-datatable-tbody > tr.row--active > td.p-frozen-column) {
    background: color-mix(in srgb, var(--primary-color) 6%, transparent) !important;
  }
  :deep(.discover-data-table .p-datatable-thead > tr > th.p-frozen-column) {
    background: var(--surface-ground);
    z-index: 2;
  }
  /* Timestamp: no truncation */
  .timestamp-cell {
    white-space: nowrap;
    overflow: visible;
  }

  /* ── Cell styles ── */
  .expand-indicator {
    font-size: 0.7rem;
    color: var(--text-color-secondary);
    cursor: pointer;
    padding: 4px;
    border-radius: var(--border-radius);
    transition: color 0.15s, transform 0.2s, background-color 0.15s;
  }
  .expand-indicator:hover {
    color: var(--text-color);
    background: var(--surface-hover);
  }
  .expand-indicator--active {
    color: var(--primary-color);
    transform: rotate(90deg);
  }
  .timestamp-cell {
    font-family: var(--rte-font-mono, ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace);
    font-size: 0.72rem;
    color: var(--text-color-secondary);
    white-space: nowrap;
    cursor: pointer;
    padding: 2px 4px;
    border-radius: var(--border-radius);
    transition: background-color 0.15s;
    overflow: visible;
    text-overflow: unset;
  }
  .timestamp-cell:hover {
    background: var(--surface-hover);
    color: var(--text-color);
  }
  .dynamic-field-cell {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    max-width: 100%;
    position: relative;
    font-family: var(--rte-font-mono, ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace);
    font-size: 0.75rem;
  }
  .dynamic-field-value {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    min-width: 0;
  }
  .dynamic-field-value :deep(.search-highlight),
  :deep(.search-highlight) {
    background: var(--yellow-500, #eab308);
    color: var(--surface-ground);
    border-radius: 2px;
    padding: 0 1px;
  }
  .dynamic-field-actions {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
    visibility: hidden;
    opacity: 0;
    transition: opacity 0.1s;
  }
  .dynamic-field-cell:hover .dynamic-field-actions {
    visibility: visible;
    opacity: 1;
  }
  .expansion-content {
    padding: 1rem 2rem 1rem 3rem;
    border-left: 3px solid var(--series-one-color, #fba86f);
    animation: expandIn 0.25s ease-out;
  }
  @keyframes expandIn {
    from { opacity: 0; max-height: 0; transform: translateY(-8px); }
    to { opacity: 1; max-height: 600px; transform: translateY(0); }
  }
</style>
