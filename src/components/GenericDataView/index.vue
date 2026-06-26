<script setup>
  import { computed, ref, useSlots } from 'vue'
  import { useMediaQuery } from '@vueuse/core'
  import DataView from 'primevue/dataview'
  import PrimeButton from '@aziontech/webkit/button'
  import Dropdown from '@aziontech/webkit/dropdown'
  import InputText from '@aziontech/webkit/inputtext'
  import Skeleton from '@aziontech/webkit/skeleton'
  import Menu from '@aziontech/webkit/menu'
  import OverlayPanel from '@aziontech/webkit/overlaypanel'
  import DataTable from '@aziontech/webkit/list-data-table'
  import EmptyResultsBlock from '@aziontech/webkit/empty-results-block'
  import Illustration from '@/assets/svg/illustration-layers.vue'

  defineOptions({ name: 'generic-data-view' })

  const ACTIONS_TRACK_WIDTH = 44

  const props = defineProps({
    items: {
      type: Array,
      default: () => []
    },
    hasDeployments: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    },
    searchTerm: {
      type: String,
      default: ''
    },
    filters: {
      type: Array,
      default: () => []
    },
    filterValues: {
      type: Object,
      default: () => ({})
    },
    paginatorFirst: {
      type: Number,
      default: 0
    },
    paginatorRows: {
      type: Number,
      default: 10
    },
    columns: {
      type: Array,
      default: () => []
    },
    searchPlaceholder: {
      type: String,
      default: 'Search items'
    },
    refreshAriaLabel: {
      type: String,
      default: 'Refresh list'
    },
    exportAriaLabel: {
      type: String,
      default: 'Export list'
    },
    selectColumnsAriaLabel: {
      type: String,
      default: 'Select columns'
    },
    emptyTitle: {
      type: String,
      default: 'No items yet'
    },
    emptyDescription: {
      type: String,
      default: 'Items will appear here when available.'
    },
    filteredEmptyTitle: {
      type: String,
      default: 'No items found'
    },
    filteredEmptyDescription: {
      type: String,
      default: 'Try changing your search or filters.'
    },
    showRowActions: {
      type: Boolean,
      default: true
    },
    rowActionsAriaLabel: {
      type: String,
      default: 'Row actions'
    },
    toolbarMode: {
      type: String,
      default: 'inline',
      validator: (value) => ['inline', 'compact'].includes(value)
    },
    allowedFilters: {
      type: Array,
      default: () => []
    },
    appliedFilters: {
      type: Array,
      default: () => []
    },
    primaryColumnKey: {
      type: String,
      default: ''
    },
    lazy: {
      type: Boolean,
      default: false
    },
    totalRecords: {
      type: Number,
      default: 0
    },
    filterButtonAriaLabel: {
      type: String,
      default: 'Open filter panel'
    },
    overflowMenuAriaLabel: {
      type: String,
      default: 'More actions'
    },
    showHeader: {
      type: Boolean,
      default: true
    },
    documentationService: {
      type: Function,
      default: null
    },
    filtersButtonLabel: {
      type: String,
      default: 'Filters'
    },
    activeFilterCount: {
      type: Number,
      default: 0
    }
  })

  const emit = defineEmits([
    'update:searchTerm',
    'update:filterValues',
    'refresh',
    'page',
    'open-row-menu',
    'apply-filter',
    'remove-filter',
    'edit-filter',
    'row-primary-click'
  ])

  const searchValue = computed({
    get: () => props.searchTerm,
    set: (value) => emit('update:searchTerm', value)
  })

  const resolveFilterValue = (filter) => props.filterValues?.[filter?.key] ?? filter?.defaultValue

  const updateFilterValue = (key, value) => {
    emit('update:filterValues', {
      ...props.filterValues,
      [key]: value
    })
  }

  const dropdownPt = {
    panel: { class: 'dataview-dropdown-panel' },
    item: { class: 'dataview-dropdown-item' }
  }

  const resolveDisplayValue = (item, column) => {
    const value = item?.[column?.field || column?.key]
    if (value == null || value === '') return '--'
    return value
  }

  const resolveSize = (column) => column?.size || 'minmax(0, 1fr)'

  const extractMinPx = (size) => {
    if (!size) return 0
    const str = String(size)
    const minmaxMatch = str.match(/minmax\(\s*(\d+)px/)
    if (minmaxMatch) return parseInt(minmaxMatch[1], 10)
    const pxMatch = str.match(/^\s*(\d+)px\s*$/)
    if (pxMatch) return parseInt(pxMatch[1], 10)
    return 0
  }

  const gridTemplateColumns = computed(() => {
    const tracks = props.columns.map(resolveSize)
    if (props.showRowActions) tracks.push(`${ACTIONS_TRACK_WIDTH}px`)
    return tracks.join(' ')
  })

  const minTableWidth = computed(() => {
    const sum = props.columns.reduce((total, col) => total + extractMinPx(resolveSize(col)), 0)
    return sum + (props.showRowActions ? ACTIONS_TRACK_WIDTH : 0)
  })

  const tableInnerStyle = computed(() => ({
    '--min-table-width': `${minTableWidth.value}px`
  }))

  const rowStyle = computed(() => ({
    gridTemplateColumns: gridTemplateColumns.value
  }))

  const alignClass = (column) => {
    const align = column?.align
    if (align === 'end') return 'align-end'
    if (align === 'center') return 'align-center'
    return 'align-start'
  }

  // Card layout is the default responsive presentation (< lg). The card model is
  // derived from `columns`, so consumers don't have to declare a per-column
  // `mobileSlot`; explicit `mobileSlot` hints still win when provided.
  const cardPrimaryColumn = computed(() => {
    const explicit = props.columns.find((col) => col?.mobileSlot === 'primary')
    if (explicit) return explicit
    if (props.primaryColumnKey) {
      const match = props.columns.find((col) => col?.key === props.primaryColumnKey)
      if (match) return match
    }
    return props.columns[0] || null
  })

  const cardStatusColumn = computed(
    () =>
      props.columns.find((col) => col?.mobileSlot === 'status' || col?.mobileSlot === 'badge') ||
      null
  )

  const cardFieldColumns = computed(() => {
    const primaryKey = cardPrimaryColumn.value?.key
    const statusKey = cardStatusColumn.value?.key
    return props.columns.filter(
      (col) => col?.key !== primaryKey && col?.key !== statusKey && col?.mobileSlot !== 'hidden'
    )
  })

  const hasMobileCardLayout = computed(() => props.columns.length > 0)

  const isCompactMode = computed(() => props.toolbarMode === 'compact')
  const hasAllowedFilters = computed(() => props.allowedFilters?.length > 0)
  const hasAppliedFilters = computed(() => props.appliedFilters?.length > 0)

  // Below `lg` the slotted toolbar filters (`#toolbar-extras`) are collapsed
  // behind a single filter button + overlay so they don't crowd the toolbar.
  const slots = useSlots()
  const hasToolbarExtras = computed(() => !!slots['toolbar-extras'])
  const isCompactViewport = useMediaQuery('(max-width: 1023.98px)')

  const filtersOverlayRef = ref(null)
  const toggleFiltersOverlay = (event) => {
    filtersOverlayRef.value?.toggle?.(event)
  }

  const filterPanel = ref(null)
  const overflowMenuRef = ref(null)

  const toggleFilterPanel = (event) => {
    filterPanel.value?.toggle?.(event)
  }

  const handleApplyFilter = (applied) => {
    emit('apply-filter', applied)
  }

  const handleRemoveFilter = (filter) => {
    emit('remove-filter', filter)
  }

  const handleEditFilter = ({ filter, event }) => {
    filterPanel.value?.openForFilter?.(filter, event)
    emit('edit-filter', { filter, event })
  }

  const overflowMenuItems = computed(() => [
    {
      label: 'Refresh',
      icon: 'pi pi-refresh',
      command: () => emit('refresh')
    },
    {
      label: 'Export',
      icon: 'pi pi-download',
      disabled: true
    },
    {
      label: 'Select columns',
      icon: 'ai ai-column',
      disabled: true
    }
  ])

  const openOverflowMenu = (event) => {
    overflowMenuRef.value?.toggle?.(event)
  }

  const isPrimaryColumn = (column) =>
    !!props.primaryColumnKey && column?.key === props.primaryColumnKey

  const triggerPrimaryClick = (item) => emit('row-primary-click', item)
</script>

<template>
  <div
    :class="[
      'flex flex-col text-[var(--text-color)]',
      isCompactMode
        ? 'rounded-md border border-[var(--surface-border)] bg-[var(--surface-section)] overflow-hidden'
        : 'gap-4'
    ]"
  >
    <div
      v-if="!isCompactMode"
      class="flex flex-wrap items-center justify-between gap-2"
    >
      <div class="dataview-toolbar flex w-full flex-wrap items-center gap-2 md:w-auto">
        <span class="dataview-search p-input-icon-left w-full sm:min-w-80 sm:w-auto">
          <i class="pi pi-search text-[var(--text-color-secondary)]" />
          <InputText
            v-model="searchValue"
            :placeholder="searchPlaceholder"
            class="dataview-control w-full"
          />
        </span>
        <Dropdown
          v-for="filter in filters"
          :key="filter.key"
          :modelValue="resolveFilterValue(filter)"
          :options="filter.options"
          :pt="dropdownPt"
          :optionLabel="filter.optionLabel || 'label'"
          :optionValue="filter.optionValue || 'value'"
          class="dataview-control dataview-dropdown min-w-0 w-full sm:w-auto sm:min-w-[9.5rem]"
          :placeholder="filter.placeholder"
          @update:modelValue="updateFilterValue(filter.key, $event)"
        />
        <slot name="toolbar-extras" />
      </div>

      <div class="flex w-full items-center justify-end gap-2 sm:w-auto">
        <slot name="toolbar-actions">
          <PrimeButton
            icon="pi pi-refresh"
            outlined
            size="small"
            :aria-label="refreshAriaLabel"
            @click="emit('refresh')"
          />
          <PrimeButton
            icon="pi pi-download"
            outlined
            size="small"
            disabled
            :aria-label="exportAriaLabel"
          />
          <PrimeButton
            icon="ai ai-column"
            outlined
            size="small"
            disabled
            :aria-label="selectColumnsAriaLabel"
          />
        </slot>
      </div>
    </div>

    <div
      v-else
      class="compact-toolbar flex flex-wrap items-center gap-3 px-3 py-2 border-b border-[var(--surface-border)]"
    >
      <PrimeButton
        v-if="hasAllowedFilters"
        icon="pi pi-filter"
        outlined
        size="small"
        :aria-label="filterButtonAriaLabel"
        @click="toggleFilterPanel"
      />
      <span class="dataview-search p-input-icon-left flex-1 min-w-[12rem]">
        <i class="pi pi-search text-[var(--text-color-secondary)]" />
        <InputText
          v-model="searchValue"
          :placeholder="searchPlaceholder"
          class="dataview-control w-full"
        />
      </span>

      <slot
        v-if="!isCompactViewport"
        name="toolbar-extras"
      />

      <button
        v-if="hasToolbarExtras && isCompactViewport"
        type="button"
        class="filter-toggle"
        :aria-label="filterButtonAriaLabel"
        @click="toggleFiltersOverlay"
      >
        <i class="pi pi-filter" />
        <span class="filter-toggle-label">{{ filtersButtonLabel }}</span>
        <span
          v-if="activeFilterCount"
          class="filter-toggle-badge"
        >
          {{ activeFilterCount }}
        </span>
      </button>

      <PrimeButton
        icon="pi pi-ellipsis-h"
        outlined
        size="small"
        :aria-label="overflowMenuAriaLabel"
        @click="openOverflowMenu"
      />
      <Menu
        ref="overflowMenuRef"
        :popup="true"
        :model="overflowMenuItems"
      />
      <OverlayPanel ref="filtersOverlayRef">
        <div class="dataview-filters-overlay-content">
          <slot
            v-if="isCompactViewport"
            name="toolbar-extras"
          />
        </div>
      </OverlayPanel>
    </div>

    <DataTable.AppliedFilters
      v-if="hasAllowedFilters && hasAppliedFilters"
      :applied-filters="appliedFilters"
      :class="isCompactMode ? 'border-b border-[var(--surface-border)] px-3 py-2' : ''"
      @remove="handleRemoveFilter"
      @edit="handleEditFilter"
    />

    <div
      v-if="loading"
      :class="['flex flex-col gap-2', isCompactMode ? 'p-3' : '']"
    >
      <div
        v-for="item in 5"
        :key="item"
      >
        <Skeleton class="h-16 w-full rounded-md" />
      </div>
    </div>

    <template v-else-if="!hasDeployments">
      <slot
        name="empty"
        :title="emptyTitle"
        :description="emptyDescription"
      >
        <EmptyResultsBlock
          :title="emptyTitle"
          :description="emptyDescription"
          :documentationService="documentationService"
          :noBorder="isCompactMode"
          inTabs
        >
          <template #illustration>
            <Illustration />
          </template>
        </EmptyResultsBlock>
      </slot>
    </template>

    <div
      v-else-if="!items.length"
      :class="[
        'empty-state px-6 py-6 text-center text-[var(--text-color-secondary)]',
        isCompactMode ? '' : 'rounded-md border border-[var(--surface-border)]'
      ]"
    >
      <h3 class="m-0 text-base font-semibold leading-6 text-[var(--text-color)]">
        {{ filteredEmptyTitle }}
      </h3>
      <p class="m-0 mt-2 text-sm leading-6">{{ filteredEmptyDescription }}</p>
    </div>

    <div
      v-else
      :class="[
        'table-surface',
        { 'has-card-layout': hasMobileCardLayout },
        isCompactMode ? '' : 'overflow-hidden rounded-md border border-[var(--surface-border)]'
      ]"
    >
      <div class="table-scroll">
        <div
          class="table-inner"
          :style="tableInnerStyle"
        >
          <div
            v-if="showHeader"
            class="grid-row header-row"
            :style="rowStyle"
          >
            <span
              v-for="column in columns"
              :key="column.key"
              class="header-cell"
              :class="alignClass(column)"
            >
              {{ column.label }}
            </span>
            <span
              v-if="showRowActions"
              class="actions-cell"
              aria-hidden="true"
            />
          </div>

          <DataView
            :value="items"
            dataKey="id"
            :paginator="true"
            :lazy="lazy"
            :totalRecords="lazy ? totalRecords : undefined"
            :rows="paginatorRows"
            :first="paginatorFirst"
            :rowsPerPageOptions="[10, 20, 50]"
            paginator-template="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown JumpToPageInput"
            current-page-report-template="Showing {first} to {last} of {totalRecords} entries"
            @page="emit('page', $event)"
          >
            <template #list="{ data: deployment }">
              <div
                class="grid-row data-row"
                :class="{ 'card-row': hasMobileCardLayout }"
                :style="rowStyle"
              >
                <div
                  v-for="column in columns"
                  :key="column.key"
                  class="cell"
                  :class="alignClass(column)"
                >
                  <span class="mobile-label">{{ column.mobileLabel || column.label }}</span>
                  <div class="cell-content">
                    <slot
                      :name="`cell-${column.key}`"
                      :item="deployment"
                      :column="column"
                      :isPrimary="isPrimaryColumn(column)"
                      :onPrimaryClick="() => triggerPrimaryClick(deployment)"
                    >
                      <span
                        class="cell-default"
                        :class="{ 'cursor-pointer hover:underline': isPrimaryColumn(column) }"
                        @click="isPrimaryColumn(column) ? triggerPrimaryClick(deployment) : null"
                      >
                        {{ resolveDisplayValue(deployment, column) }}
                      </span>
                    </slot>
                  </div>
                </div>

                <div
                  v-if="showRowActions"
                  class="actions-cell"
                >
                  <PrimeButton
                    icon="pi pi-ellipsis-v"
                    text
                    size="small"
                    :aria-label="rowActionsAriaLabel"
                    @click="emit('open-row-menu', { event: $event, deployment })"
                  />
                </div>

                <div
                  v-if="hasMobileCardLayout"
                  class="card-view"
                  @click="triggerPrimaryClick(deployment)"
                >
                  <div class="card-head">
                    <div
                      v-if="cardPrimaryColumn"
                      class="card-title"
                    >
                      <slot
                        :name="`cell-${cardPrimaryColumn.key}`"
                        :item="deployment"
                        :column="cardPrimaryColumn"
                        :isPrimary="isPrimaryColumn(cardPrimaryColumn)"
                        :onPrimaryClick="() => triggerPrimaryClick(deployment)"
                        :cardMode="true"
                      >
                        <span class="cell-default">
                          {{ resolveDisplayValue(deployment, cardPrimaryColumn) }}
                        </span>
                      </slot>
                    </div>
                    <PrimeButton
                      v-if="showRowActions"
                      class="card-kebab"
                      icon="pi pi-ellipsis-v"
                      text
                      size="small"
                      :aria-label="rowActionsAriaLabel"
                      @click.stop="emit('open-row-menu', { event: $event, deployment })"
                    />
                  </div>

                  <div
                    v-if="cardStatusColumn"
                    class="card-status"
                  >
                    <slot
                      :name="`cell-${cardStatusColumn.key}`"
                      :item="deployment"
                      :column="cardStatusColumn"
                      :cardMode="true"
                    >
                      <span class="cell-default">
                        {{ resolveDisplayValue(deployment, cardStatusColumn) }}
                      </span>
                    </slot>
                  </div>

                  <div
                    v-if="cardFieldColumns.length"
                    class="card-divider"
                  />

                  <div
                    v-if="cardFieldColumns.length"
                    class="card-fields"
                  >
                    <div
                      v-for="col in cardFieldColumns"
                      :key="col.key"
                      class="card-field-row"
                    >
                      <span class="card-field-label">{{ col.mobileLabel || col.label }}</span>
                      <div class="card-field-value">
                        <slot
                          :name="`cell-${col.key}`"
                          :item="deployment"
                          :column="col"
                          :cardMode="true"
                        >
                          <span>{{ resolveDisplayValue(deployment, col) }}</span>
                        </slot>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </DataView>
        </div>
      </div>
    </div>

    <DataTable.Filter
      v-if="hasAllowedFilters"
      ref="filterPanel"
      :filters="allowedFilters"
      @apply="handleApplyFilter"
    />
  </div>
</template>

<style scoped>
  :deep(.dataview-control.p-inputtext),
  :deep(.dataview-dropdown.p-dropdown) {
    min-height: 2.5rem;
    border-color: var(--surface-border);
    border-radius: 0.375rem;
    background: var(--surface-section);
    color: var(--text-color);
    font-size: 0.875rem;
    line-height: 1.5rem;
    box-shadow: none;
  }

  :deep(.dataview-control.p-inputtext:hover),
  :deep(.dataview-dropdown.p-dropdown:hover) {
    border-color: var(--surface-border);
    background: var(--surface-ground);
  }

  :deep(.dataview-control.p-inputtext:enabled:focus),
  :deep(.dataview-dropdown.p-dropdown.p-focus) {
    border-color: var(--primary-color);
    box-shadow: none;
  }

  :deep(.dataview-control.p-inputtext::placeholder) {
    color: var(--text-color-secondary);
  }

  .dataview-search > i {
    color: var(--text-color-secondary);
  }

  :deep(.dataview-dropdown .p-dropdown-label) {
    color: var(--text-color);
    padding-block: 0.5rem;
    font-size: 0.875rem;
    line-height: 1.5rem;
  }

  :deep(.dataview-dropdown .p-dropdown-trigger) {
    color: var(--text-color-secondary);
  }

  :deep(.dataview-dropdown-panel) {
    border: 1px solid var(--surface-border);
    border-radius: 0.5rem;
    background: var(--surface-section);
    color: var(--text-color);
    box-shadow: 0 8px 24px color-mix(in srgb, var(--surface-900, #111827) 16%, transparent);
  }

  :deep(.dataview-dropdown-panel .p-dropdown-items) {
    padding: 0.375rem;
  }

  :deep(.dataview-dropdown-panel .dataview-dropdown-item) {
    border-radius: 0.375rem;
    color: var(--text-color);
    font-size: 0.875rem;
    line-height: 1.5rem;
  }

  :deep(.dataview-dropdown-panel .p-dropdown-item:hover) {
    background: var(--surface-hover);
    color: var(--text-color);
  }

  :deep(.dataview-dropdown-panel .p-dropdown-item.p-highlight) {
    background: color-mix(in srgb, var(--primary-color) 14%, transparent);
    color: var(--text-color);
    font-weight: 500;
  }

  :deep(.p-dataview-content) {
    background: transparent;
    color: var(--text-color);
  }

  :deep(.p-dataview-emptymessage) {
    color: var(--text-color-secondary);
  }

  .table-surface {
    background: var(--surface-section);
  }

  .table-scroll {
    overflow-x: auto;
  }

  .table-inner {
    min-width: var(--min-table-width, 0);
    display: flex;
    flex-direction: column;
  }

  .grid-row {
    display: grid;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: var(--surface-section);
    border-bottom: 1px solid var(--surface-border);
  }

  .header-row {
    font-size: 0.875rem;
    font-weight: 400;
    line-height: 1.5rem;
    letter-spacing: 0.0625rem;
    color: var(--text-color-secondary);
    background: var(--table-header-color, var(--surface-section));
  }

  .data-row {
    min-height: 4.5rem;
    font-size: 0.875rem;
    line-height: 1.5rem;
    color: var(--text-color);
  }

  .data-row:hover {
    background: var(--table-body-row-hover-bg, var(--surface-ground));
  }

  :deep(.p-grid) > .grid-row:last-child {
    border-bottom: 0;
  }

  .cell,
  .header-cell {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .cell-content {
    min-width: 0;
    flex: 1 1 auto;
  }

  .cell.align-start,
  .header-cell.align-start {
    justify-content: flex-start;
    text-align: left;
  }

  .cell.align-end,
  .header-cell.align-end {
    justify-content: flex-end;
    text-align: right;
  }

  .cell.align-end .cell-content,
  .cell.align-center .cell-content {
    flex: 0 1 auto;
  }

  .cell.align-center,
  .header-cell.align-center {
    justify-content: center;
    text-align: center;
  }

  .actions-cell {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    min-width: 0;
  }

  .cell-default {
    display: block;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mobile-label {
    display: none;
  }

  .card-view {
    display: none;
  }

  .filter-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    height: 2.5rem;
    padding: 0 0.875rem;
    border: 1px solid var(--surface-border);
    border-radius: 0.375rem;
    background: var(--surface-section);
    color: var(--text-color);
    font-size: 0.875rem;
    font-weight: 500;
    line-height: 1.5rem;
    white-space: nowrap;
    cursor: pointer;
  }

  .filter-toggle:hover {
    background: var(--surface-ground);
  }

  .filter-toggle-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.125rem;
    height: 1.125rem;
    padding: 0 0.3125rem;
    border-radius: 9999px;
    background: var(--primary-color);
    color: var(--primary-color-text);
    font-size: 0.6875rem;
    font-weight: 600;
  }

  .dataview-filters-overlay-content {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    min-width: 13rem;
  }

  @media (max-width: 1023.98px) {
    .table-scroll {
      overflow-x: visible;
    }

    .table-inner {
      min-width: 0;
    }

    .header-row {
      display: none;
    }

    .has-card-layout .data-row.card-row {
      display: block;
      padding: 0;
      background: transparent;
      border: 0;
      min-height: 0;
      min-width: 0;
      max-width: 100%;
    }

    .has-card-layout :deep(.p-grid) > * {
      min-width: 0;
    }

    .has-card-layout .data-row.card-row > .cell,
    .has-card-layout .data-row.card-row > .actions-cell {
      display: none;
    }

    .has-card-layout .card-view {
      display: flex;
      flex-direction: column;
      padding: 0.875rem;
      border: 1px solid var(--surface-border);
      border-radius: 0.75rem;
      background: var(--surface-section);
      cursor: pointer;
      transition: border-color 0.12s ease;
      min-width: 0;
    }

    .has-card-layout .card-view:hover {
      border-color: var(--text-color-secondary);
    }

    .card-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.5rem;
      min-width: 0;
    }

    .card-title {
      flex: 1;
      min-width: 0;
      font-size: 0.9375rem;
      font-weight: 600;
    }

    .card-title :deep(.workload-name-button),
    .card-title :deep(.version-name-button),
    .card-title :deep(.release-name-button) {
      font-size: 0.9375rem;
      font-weight: 600;
    }

    .card-kebab {
      flex: none;
      margin: -0.25rem -0.25rem 0 0;
    }

    .card-status {
      margin-top: 0.75rem;
    }

    .card-divider {
      height: 1px;
      background: var(--surface-border);
      margin: 0.875rem 0;
    }

    .card-fields {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      min-width: 0;
    }

    .card-field-row {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 0.75rem;
      min-width: 0;
      font-size: 0.8125rem;
    }

    .card-field-label {
      flex: none;
      color: var(--text-color-secondary);
    }

    .card-field-value {
      min-width: 0;
      text-align: right;
      color: var(--text-color);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .card-field-value :deep(*) {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  /* Tablet: two-column card grid */
  @media (min-width: 768px) and (max-width: 1023.98px) {
    .has-card-layout :deep(.p-grid) {
      display: grid;
      grid-template-columns: 1fr 1fr;
      align-content: start;
      gap: 0.75rem;
      padding: 1rem;
      margin: 0;
    }
  }

  /* Mobile: single-column cards + icon-only filter button */
  @media (max-width: 767.98px) {
    .has-card-layout :deep(.p-grid) {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.625rem;
      padding: 0.75rem;
      margin: 0;
    }

    .filter-toggle {
      position: relative;
      width: 2.5rem;
      padding: 0;
      justify-content: center;
    }

    .filter-toggle-label {
      display: none;
    }

    .filter-toggle-badge {
      position: absolute;
      top: -0.25rem;
      right: -0.25rem;
      min-width: 1rem;
      height: 1rem;
      padding: 0;
    }
  }

  :deep(.p-paginator) {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    border: 0;
    border-top: 1px solid var(--surface-border);
    background: var(--surface-section);
    border-radius: 0;
    color: var(--text-color-secondary);
    min-height: 3rem;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    line-height: 1.5;
  }

  :deep(.p-paginator .p-paginator-current) {
    margin: 0 0.5rem 0 0;
    color: var(--text-color-secondary);
    font-weight: 400;
  }

  :deep(.p-paginator .p-paginator-page),
  :deep(.p-paginator .p-paginator-first),
  :deep(.p-paginator .p-paginator-prev),
  :deep(.p-paginator .p-paginator-next),
  :deep(.p-paginator .p-paginator-last) {
    min-width: 2rem;
    width: 2rem;
    height: 2rem;
    margin: 0;
    border: 0;
    border-radius: 0.375rem;
    background: transparent;
    color: var(--text-color-secondary);
  }

  :deep(.p-paginator .p-highlight) {
    background: var(--surface-hover);
    color: var(--text-color);
  }

  :deep(.p-paginator .p-dropdown) {
    height: 2rem;
    width: auto;
    min-width: 4rem;
    margin-left: 0.25rem;
    border-color: var(--surface-border);
    border-radius: 0.375rem;
    background: var(--surface-section);
    color: var(--text-color);
  }

  :deep(.p-paginator .p-dropdown .p-dropdown-label) {
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
    line-height: 1.5;
  }

  :deep(.p-paginator .p-paginator-page-input .p-inputtext) {
    width: 2rem;
    height: 2rem;
    padding: 0.25rem;
    border-color: var(--surface-border);
    border-radius: 0.375rem;
    background: var(--surface-section);
    color: var(--text-color);
    text-align: center;
  }
</style>
