<script setup>
  import { computed, ref, useSlots } from 'vue'
  import DataView from 'primevue/dataview'
  import PrimeButton from '@aziontech/webkit/button'
  import Dropdown from '@aziontech/webkit/dropdown'
  import InputText from '@aziontech/webkit/inputtext'
  import Skeleton from '@aziontech/webkit/skeleton'
  import Menu from '@aziontech/webkit/menu'
  import EmptyResultsBlock from '@aziontech/webkit/empty-results-block'
  import Illustration from '@/assets/svg/illustration-layers.vue'

  import VersionStateBadge from '@/templates/version-shell-block/components/VersionStateBadge.vue'
  import { getRowActions, metaFor } from '@/composables/versioning/version-actions'
  import { formatDateToDayMonthYearHour } from '@/helpers/convert-date'

  defineOptions({ name: 'version-list-data-view' })

  const ACTIONS_TRACK_WIDTH = 44

  const props = defineProps({
    items: {
      type: Array,
      default: () => []
    },
    columns: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    },
    isError: {
      type: Boolean,
      default: false
    },
    hasVersions: {
      type: Boolean,
      default: false
    },
    emptyState: {
      type: Object,
      default: () => ({})
    },
    errorState: {
      type: Object,
      default: () => ({})
    },
    searchTerm: {
      type: String,
      default: ''
    },
    searchPlaceholder: {
      type: String,
      default: 'Search versions'
    },
    filters: {
      type: Array,
      default: () => []
    },
    filterValues: {
      type: Object,
      default: () => ({})
    },
    sort: {
      type: String,
      default: ''
    },
    sortOptions: {
      type: Array,
      default: () => []
    },
    showRowActions: {
      type: Boolean,
      default: true
    },
    rowActionsAriaLabel: {
      type: String,
      default: 'Version actions'
    },
    refreshAriaLabel: {
      type: String,
      default: 'Refresh versions'
    },
    sortAriaLabel: {
      type: String,
      default: 'Sort versions'
    },
    paginatorRows: {
      type: Number,
      default: 20
    },
    lazy: {
      type: Boolean,
      default: false
    },
    totalRecords: {
      type: Number,
      default: 0
    },
    filteredEmptyTitle: {
      type: String,
      default: 'No versions found'
    },
    filteredEmptyDescription: {
      type: String,
      default: 'Try changing your search or filters.'
    },
    documentationService: {
      type: Function,
      default: null
    }
  })

  const emit = defineEmits([
    'update:searchTerm',
    'update:filterValues',
    'update:sort',
    'refresh',
    'page',
    'row-click',
    'row-action'
  ])

  const slots = useSlots()

  const searchValue = computed({
    get: () => props.searchTerm,
    set: (value) => emit('update:searchTerm', value)
  })

  const sortValue = computed({
    get: () => props.sort,
    set: (value) => emit('update:sort', value)
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

  const columnHasData = (column) => {
    const path = column?.field || column?.key
    return props.items.some((item) => {
      const value = item?.[path]
      return value != null && value !== ''
    })
  }

  const isColumnVisible = (column) => {
    if (!column?.optional) return true
    if (slots[`cell-${column.key}`]) return true
    return columnHasData(column)
  }

  const visibleColumns = computed(() => props.columns.filter(isColumnVisible))

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
    const tracks = visibleColumns.value.map(resolveSize)
    if (props.showRowActions) tracks.push(`${ACTIONS_TRACK_WIDTH}px`)
    return tracks.join(' ')
  })

  const minTableWidth = computed(() => {
    const sum = visibleColumns.value.reduce(
      (total, col) => total + extractMinPx(resolveSize(col)),
      0
    )
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

  const mobileSlotMap = computed(() => {
    const map = { primary: null, secondary: null, badge: null, body: [], footer: [] }
    for (const col of visibleColumns.value) {
      const slot = col?.mobileSlot
      if (!slot || slot === 'hidden') continue
      if (slot === 'body' || slot === 'footer') {
        map[slot].push(col)
      } else if (slot in map) {
        map[slot] = col
      }
    }
    return map
  })

  const hasMobileCardLayout = computed(() =>
    visibleColumns.value.some((col) => col?.mobileSlot && col.mobileSlot !== 'hidden')
  )

  const isPrimaryColumn = (column) => column?.key === 'version'

  const triggerRowClick = (item) => emit('row-click', item)

  const hasErrorAction = computed(
    () => !!(props.errorState?.buttonLabel && props.errorState?.buttonAction)
  )
  const hasEmptyAction = computed(
    () => !!(props.emptyState?.buttonLabel && props.emptyState?.buttonAction)
  )

  const runErrorAction = () => props.errorState?.buttonAction?.()
  const runEmptyAction = () => props.emptyState?.buttonAction?.()

  const ICON_FOR = {
    BUILD: 'pi pi-cog',
    NEW_DRAFT_FROM: 'pi pi-copy',
    ARCHIVE: 'pi pi-inbox',
    DELETE: 'pi pi-trash'
  }

  const hasRowActions = (version) => getRowActions(version?.state).length > 0

  const overflowMenuRef = ref(null)
  const rowMenuModel = ref([])

  const openRowMenu = (event, version) => {
    rowMenuModel.value = getRowActions(version.state).map((action) => ({
      label: metaFor(action).label,
      icon: ICON_FOR[action],
      command: () => emit('row-action', { action, item: version })
    }))
    overflowMenuRef.value?.toggle?.(event)
  }
</script>

<template>
  <div
    class="flex flex-col gap-4 text-[var(--text-color)]"
    data-testid="version-list-data-view"
  >
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="dataview-toolbar flex w-full flex-wrap items-center gap-2 md:flex-1">
        <span class="dataview-search p-input-icon-left w-full sm:min-w-80 sm:flex-1">
          <i class="pi pi-search text-[var(--text-color-secondary)]" />
          <InputText
            v-model="searchValue"
            :placeholder="searchPlaceholder"
            :aria-label="searchPlaceholder"
            class="dataview-control w-full"
            data-testid="version-list-data-view__search"
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
          :aria-label="filter.placeholder"
          class="dataview-control dataview-dropdown dataview-dropdown-min min-w-0 w-full sm:w-auto"
          :placeholder="filter.placeholder"
          :data-testid="`version-list-data-view__filter-${filter.key}`"
          @update:modelValue="updateFilterValue(filter.key, $event)"
        />
        <Dropdown
          v-if="sortOptions.length"
          v-model="sortValue"
          :options="sortOptions"
          :pt="dropdownPt"
          optionLabel="label"
          optionValue="value"
          :aria-label="sortAriaLabel"
          class="dataview-control dataview-dropdown dataview-dropdown-min min-w-0 w-full sm:w-auto"
          :placeholder="sortAriaLabel"
          data-testid="version-list-data-view__sort"
        />
        <slot name="toolbar-extras" />
      </div>

      <div class="flex w-full items-center justify-end gap-2 sm:w-auto">
        <slot name="toolbar-actions"> </slot>
      </div>
    </div>

    <div
      v-if="loading"
      class="flex flex-col gap-2"
      data-testid="version-list-data-view__loading"
    >
      <div
        v-for="item in 5"
        :key="item"
      >
        <Skeleton class="h-16 w-full rounded-md" />
      </div>
    </div>

    <div
      v-else-if="isError"
      class="error-state flex flex-col items-center justify-center gap-3 rounded-md border border-[var(--surface-border)] bg-[var(--surface-section)] px-6 py-12 text-center text-[var(--text-color-secondary)]"
      data-testid="version-list-data-view__error"
    >
      <h3 class="m-0 text-base font-semibold leading-6 text-[var(--text-color)]">
        {{ errorState.title || 'Something went wrong' }}
      </h3>
      <p class="m-0 max-w-md text-sm leading-6">
        {{ errorState.description || 'We could not load the versions. Try again.' }}
      </p>
      <PrimeButton
        v-if="hasErrorAction"
        :label="errorState.buttonLabel"
        icon="pi pi-refresh"
        size="small"
        data-testid="version-list-data-view__error-action"
        @click="runErrorAction"
      />
    </div>

    <template v-else-if="!hasVersions">
      <EmptyResultsBlock
        :title="emptyState.title || 'No versions yet'"
        :description="
          emptyState.description || 'Versions will appear here once this resource has any.'
        "
        :documentationService="documentationService"
        inTabs
        data-testid="version-list-data-view__empty"
      >
        <template #illustration>
          <Illustration />
        </template>
        <template
          v-if="hasEmptyAction"
          #default
        >
          <PrimeButton
            :label="emptyState.buttonLabel"
            icon="pi pi-plus"
            size="small"
            data-testid="version-list-data-view__empty-action"
            @click="runEmptyAction"
          />
        </template>
      </EmptyResultsBlock>
    </template>

    <div
      v-else-if="!items.length"
      class="filtered-empty-state rounded-md border border-[var(--surface-border)] px-6 py-6 text-center text-[var(--text-color-secondary)]"
      data-testid="version-list-data-view__filtered-empty"
    >
      <h3 class="m-0 text-base font-semibold leading-6 text-[var(--text-color)]">
        {{ filteredEmptyTitle }}
      </h3>
      <p class="m-0 mt-2 text-sm leading-6">{{ filteredEmptyDescription }}</p>
    </div>

    <div
      v-else
      class="table-surface overflow-hidden rounded-md border border-[var(--surface-border)]"
      :class="{ 'has-card-layout': hasMobileCardLayout }"
      data-testid="version-list-data-view__table"
    >
      <div class="table-scroll">
        <div
          class="table-inner"
          :style="tableInnerStyle"
        >
          <div
            class="grid-row header-row"
            :style="rowStyle"
          >
            <span
              v-for="column in visibleColumns"
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
            :rowsPerPageOptions="[10, 20, 50]"
            paginator-template="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown JumpToPageInput"
            current-page-report-template="Showing {first} to {last} of {totalRecords} entries"
            @page="emit('page', $event)"
          >
            <template #list="{ data: version }">
              <div
                class="grid-row data-row"
                :class="{ 'card-row': hasMobileCardLayout }"
                :style="rowStyle"
                :data-testid="`version-list-data-view__row-${version.id}`"
              >
                <div
                  v-for="column in visibleColumns"
                  :key="column.key"
                  class="cell"
                  :class="alignClass(column)"
                >
                  <span class="mobile-label">{{ column.mobileLabel || column.label }}</span>
                  <div class="cell-content">
                    <slot
                      :name="`cell-${column.key}`"
                      :item="version"
                      :column="column"
                      :isPrimary="isPrimaryColumn(column)"
                      :onPrimaryClick="() => triggerRowClick(version)"
                    >
                      <button
                        v-if="column.key === 'version'"
                        type="button"
                        class="version-cell-button inline-flex max-w-full min-w-0 flex-wrap items-center gap-2 border-0 bg-transparent p-0 text-left text-[var(--text-color)]"
                        :data-testid="`version-list-data-view__row-${version.id}__primary`"
                        @click="triggerRowClick(version)"
                      >
                        <span class="version-hash font-mono text-sm font-semibold leading-5">
                          {{ version.id }}
                        </span>
                        <span
                          v-if="version.state === 'active'"
                          class="version-current-tag inline-flex items-center gap-1 rounded text-xs font-medium leading-4"
                        >
                          <i class="pi pi-circle-on" />
                          Current
                        </span>
                        <span
                          v-if="version.comment"
                          class="version-comment min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-xs text-[var(--text-color-secondary)]"
                        >
                          {{ version.comment }}
                        </span>
                      </button>

                      <button
                        v-else-if="column.key === 'status'"
                        type="button"
                        class="status-cell-button inline-flex min-w-0 max-w-full items-center border-0 bg-transparent p-0 text-left"
                        @click="triggerRowClick(version)"
                      >
                        <VersionStateBadge :state="version.state" />
                      </button>

                      <button
                        v-else-if="column.key === 'created'"
                        type="button"
                        class="created-cell-button flex max-w-full min-w-0 flex-col items-start gap-0.5 border-0 bg-transparent p-0 text-left"
                        @click="triggerRowClick(version)"
                      >
                        <span
                          class="block max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm text-[var(--text-color)]"
                        >
                          {{
                            version.createdAt
                              ? formatDateToDayMonthYearHour(version.createdAt)
                              : '--'
                          }}
                        </span>
                        <span
                          class="block max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-xs text-[var(--text-color-secondary)]"
                          data-sentry-mask
                        >
                          {{ version.lastEditor || 'azion@azion.com' }}
                        </span>
                      </button>

                      <span
                        v-else
                        class="cell-default"
                        :class="{ 'cursor-pointer hover:underline': isPrimaryColumn(column) }"
                        @click="isPrimaryColumn(column) ? triggerRowClick(version) : null"
                      >
                        {{ resolveDisplayValue(version, column) }}
                      </span>
                    </slot>
                  </div>
                </div>

                <div
                  v-if="showRowActions && hasRowActions(version)"
                  class="actions-cell"
                >
                  <PrimeButton
                    icon="pi pi-ellipsis-v"
                    text
                    size="small"
                    :aria-label="rowActionsAriaLabel"
                    :data-testid="`version-list-data-view__row-${version.id}__menu`"
                    @click="openRowMenu($event, version)"
                  />
                </div>

                <div
                  v-if="hasMobileCardLayout"
                  class="card-view"
                >
                  <div class="card-top">
                    <div
                      v-if="mobileSlotMap.primary"
                      class="card-primary"
                    >
                      <slot
                        :name="`cell-${mobileSlotMap.primary.key}`"
                        :item="version"
                        :column="mobileSlotMap.primary"
                        :isPrimary="isPrimaryColumn(mobileSlotMap.primary)"
                        :onPrimaryClick="() => triggerRowClick(version)"
                      />
                    </div>
                    <div
                      v-if="mobileSlotMap.badge"
                      class="card-badge"
                    >
                      <slot
                        :name="`cell-${mobileSlotMap.badge.key}`"
                        :item="version"
                        :column="mobileSlotMap.badge"
                      />
                    </div>
                    <PrimeButton
                      v-if="showRowActions && hasRowActions(version)"
                      class="card-more"
                      icon="pi pi-ellipsis-v"
                      text
                      size="small"
                      :aria-label="rowActionsAriaLabel"
                      @click="openRowMenu($event, version)"
                    />
                  </div>
                  <div
                    v-if="slots['mobile-secondary']"
                    class="card-secondary"
                  >
                    <slot
                      name="mobile-secondary"
                      :item="version"
                    />
                  </div>
                  <div
                    v-else-if="mobileSlotMap.secondary"
                    class="card-secondary"
                  >
                    <slot
                      :name="`cell-${mobileSlotMap.secondary.key}`"
                      :item="version"
                      :column="mobileSlotMap.secondary"
                    />
                  </div>
                  <div
                    v-if="mobileSlotMap.body.length"
                    class="card-body"
                  >
                    <div
                      v-for="col in mobileSlotMap.body"
                      :key="col.key"
                      class="card-body-row"
                    >
                      <slot
                        :name="`cell-${col.key}`"
                        :item="version"
                        :column="col"
                      />
                    </div>
                  </div>
                  <div
                    v-if="mobileSlotMap.footer.length"
                    class="card-divider"
                  />
                  <div
                    v-if="mobileSlotMap.footer.length"
                    class="card-footer"
                  >
                    <div
                      v-for="col in mobileSlotMap.footer.slice(0, 2)"
                      :key="col.key"
                      class="card-field"
                    >
                      <span class="card-field-label">{{ col.mobileLabel || col.label }}</span>
                      <div class="card-field-value">
                        <slot
                          :name="`cell-${col.key}`"
                          :item="version"
                          :column="col"
                        />
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

    <Menu
      ref="overflowMenuRef"
      :popup="true"
      :model="rowMenuModel"
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

  :deep(.dataview-toolbar-action.p-button) {
    width: 2.5rem !important;
    height: 2.5rem !important;
    padding: 0;
    border-radius: 0.375rem;
  }

  @media (min-width: 640px) {
    .dataview-dropdown-min {
      min-width: 9.5rem;
    }
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
    box-shadow: 0 8px 24px color-mix(in srgb, var(--surface-border) 60%, transparent);
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

  .version-cell-button {
    cursor: pointer;
  }

  .version-hash {
    display: inline-flex;
    align-items: center;
    white-space: nowrap;
    padding: 0.0625rem 0.4375rem;
    border-radius: 0.3125rem;
    border: 1px solid var(--surface-border);
    background: var(--surface-section);
    color: var(--text-color);
  }

  .version-current-tag {
    padding: 0.125rem 0.4375rem;
    background: color-mix(in srgb, var(--primary-color) 15%, transparent);
    color: var(--primary-color);
  }

  .version-current-tag .pi {
    font-size: 0.5625rem;
  }

  .version-comment {
    display: inline-block;
  }

  .created-cell-button {
    cursor: pointer;
  }

  .status-cell-button {
    cursor: pointer;
  }

  .mobile-label {
    display: none;
  }

  .card-view {
    display: none;
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

    .data-row {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
      min-height: 0;
      padding: 1rem;
    }

    .cell {
      align-items: flex-start;
      justify-content: flex-start;
      text-align: left;
      gap: 1rem;
    }

    .cell .cell-content {
      flex: 1 1 auto;
      min-width: 0;
    }

    .mobile-label {
      display: block;
      width: min(35%, 7.5rem);
      flex-shrink: 0;
      font-size: 0.625rem;
      font-weight: 400;
      line-height: 1.25rem;
      text-transform: uppercase;
      letter-spacing: 0.0625rem;
      color: var(--text-color-secondary);
    }

    .actions-cell {
      width: 100%;
      justify-content: flex-end;
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
      gap: 0.5625rem;
      padding: 0.8125rem 0.875rem;
      border: 1px solid var(--surface-border);
      border-radius: 0.75rem;
      background: var(--surface-section);
      transition: border-color 0.12s ease;
      min-width: 0;
    }

    .has-card-layout .card-view:active {
      border-color: var(--text-color-secondary);
    }

    .card-top {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      min-width: 0;
    }

    .card-primary {
      flex: 1;
      min-width: 0;
      font-size: 0.9375rem;
      font-weight: 600;
    }

    .card-badge {
      flex-shrink: 0;
    }

    .card-more {
      flex-shrink: 0;
    }

    .card-secondary {
      font-family: var(--font-mono, ui-monospace, monospace);
      font-size: 0.6875rem;
      color: var(--text-color-secondary);
      margin-top: -0.1875rem;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .card-body {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      min-width: 0;
    }

    .card-body-row {
      min-width: 0;
      font-size: 0.8125rem;
      color: var(--text-color-secondary);
    }

    .card-divider {
      height: 1px;
      background: var(--surface-border);
      margin: 0.0625rem 0;
    }

    .card-footer {
      display: grid;
      grid-template-columns: 1fr 1.3fr;
      gap: 0.625rem 0.875rem;
    }

    .card-field {
      min-width: 0;
    }

    .card-field-label {
      display: block;
      font-size: 0.625rem;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--text-color-secondary);
      margin-bottom: 0.1875rem;
    }

    .card-field-value {
      font-size: 0.78125rem;
      color: var(--text-color);
      min-width: 0;
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

  @media (min-width: 640px) and (max-width: 1023.98px) {
    .has-card-layout :deep(.p-grid) {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      align-content: start;
      gap: 0.75rem;
      padding: 1rem;
      margin: 0;
    }
  }

  @media (max-width: 639.98px) {
    .cell {
      flex-direction: column;
      gap: 0.25rem;
    }

    .mobile-label {
      width: 100%;
    }

    .has-card-layout :deep(.p-grid) {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.625rem;
      padding: 0.75rem;
      margin: 0;
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
    min-width: 5rem;
    flex-shrink: 0;
    margin-left: 0.25rem;
    border-color: var(--surface-border);
    border-radius: 0.375rem;
    background: var(--surface-section);
    color: var(--text-color);
  }

  :deep(.p-paginator .p-dropdown .p-dropdown-trigger) {
    width: 2rem;
  }

  :deep(.p-paginator .p-dropdown .p-dropdown-label) {
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
    line-height: 1.5;
  }

  :deep(.p-paginator .p-inputtext) {
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
