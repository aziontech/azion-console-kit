<script setup>
  import { computed, ref, useSlots, watch } from 'vue'
  import DataTable from '@aziontech/webkit/list-data-table'
  import PrimeButton from '@aziontech/webkit/button'
  import Dropdown from '@aziontech/webkit/dropdown'
  import EmptyResultsBlock from '@aziontech/webkit/empty-results-block'
  import Illustration from '@/assets/svg/illustration-layers.vue'

  import VersionStateBadge from '@/templates/version-shell-block/components/VersionStateBadge.vue'
  import { getRowActions, metaFor } from '@/composables/versioning/version-actions'
  import { convertToRelativeTime, formatDateToDayMonthYearHour } from '@/helpers/convert-date'

  const DataTableColumnSelector = DataTable.ColumnSelector

  defineOptions({ name: 'version-list-data-view' })

  const props = defineProps({
    title: {
      type: String,
      default: 'Version History'
    },
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
      default: 10
    },
    rowsPerPageOptions: {
      type: Array,
      default: () => [10, 20, 50]
    },
    lazy: {
      type: Boolean,
      default: false
    },
    totalRecords: {
      type: Number,
      default: 0
    },
    showColumnSelector: {
      type: Boolean,
      default: true
    },
    exportFileName: {
      type: String,
      default: ''
    },
    csvMapper: {
      type: Function,
      default: null
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
    emit('update:filterValues', { ...props.filterValues, [key]: value })
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

  const availableColumns = computed(() =>
    props.columns.filter(isColumnVisible).map((column) => ({
      ...column,
      field: column.field || column.key,
      header: column.label
    }))
  )

  const selectedColumns = ref([])
  watch(
    availableColumns,
    (next) => {
      const allowed = new Set(next.map((column) => column.field))
      const kept = selectedColumns.value.filter((column) => allowed.has(column.field))
      selectedColumns.value = kept.length
        ? next.filter((column) => allowed.has(column.field))
        : next
    },
    { immediate: true }
  )

  const hasExport = computed(() => !!props.exportFileName || !!props.csvMapper)

  const hasErrorAction = computed(
    () => !!(props.errorState?.buttonLabel && props.errorState?.buttonAction)
  )
  const hasEmptyAction = computed(
    () => !!(props.emptyState?.buttonLabel && props.emptyState?.buttonAction)
  )

  const runErrorAction = () => props.errorState?.buttonAction?.()
  const runEmptyAction = () => props.emptyState?.buttonAction?.()

  const triggerRowClick = (item) => emit('row-click', item)

  const ICON_FOR = {
    BUILD: 'pi pi-cog',
    NEW_DRAFT_FROM: 'pi pi-copy',
    ARCHIVE: 'pi pi-inbox',
    DELETE: 'pi pi-trash'
  }

  const rowActionOptions = (version) =>
    getRowActions(version?.state).map((action) => ({
      label: metaFor(action).label,
      icon: ICON_FOR[action],
      command: () => emit('row-action', { action, item: version })
    }))

  const hasRowActions = (version) => getRowActions(version?.state).length > 0

  const menuRefs = ref({})
  const setMenuRefForRow = (id) => (el) => {
    menuRefs.value[id] = el
  }
  const toggleActionsMenu = (event, id) => {
    menuRefs.value[id]?.toggle?.(event)
  }

  const reload = () => emit('refresh')

  const exportData = () => {
    if (!props.csvMapper) {
      dataTableRef.value?.exportCSV?.()
      return
    }
    props.csvMapper(props.items, props.exportFileName)
  }

  const dataTableRef = ref(null)

  const relativeTime = (version) =>
    version?.createdAt ? convertToRelativeTime(version.createdAt) : '--'
  const exactDate = (version) =>
    version?.createdAt ? formatDateToDayMonthYearHour(version.createdAt) : '--'
  const authorInitial = (version) =>
    (version?.lastEditor || 'azion@azion.com').charAt(0).toUpperCase()

  const isPrimaryColumn = (column) => column?.key === 'version'
</script>

<template>
  <div
    class="flex flex-col gap-4 text-[var(--text-color)]"
    data-testid="version-list-data-view"
  >
    <!-- Error -->
    <div
      v-if="isError"
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

    <!-- Empty (resource has no versions at all) -->
    <EmptyResultsBlock
      v-else-if="!hasVersions && !loading"
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

    <!-- Table (standard list-table chrome) -->
    <DataTable
      v-else
      ref="dataTableRef"
      :data="items"
      :columns="selectedColumns"
      :loading="loading"
      :lazy="lazy"
      :totalRecords="lazy ? totalRecords : items.length"
      :paginator="true"
      :rows="paginatorRows"
      :rowsPerPageOptions="rowsPerPageOptions"
      :emptyListMessage="filteredEmptyTitle"
      :searchValue="searchTerm"
      notShowEmptyBlock
      dataKey="id"
      data-testid="version-list-data-view__table"
      @page="emit('page', $event)"
    >
      <template #header>
        <DataTable.Header :showDivider="false">
          <template #first-line>
            <div class="flex w-full flex-col gap-3">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <h3
                  class="m-0 text-base font-semibold leading-6 text-[var(--text-color)]"
                  data-testid="version-list-data-view__title"
                >
                  {{ title }}
                </h3>
                <div class="flex flex-wrap items-center gap-2">
                  <Dropdown
                    v-for="filter in filters"
                    :key="filter.key"
                    :modelValue="resolveFilterValue(filter)"
                    :options="filter.options"
                    :pt="dropdownPt"
                    :optionLabel="filter.optionLabel || 'label'"
                    :optionValue="filter.optionValue || 'value'"
                    :aria-label="filter.placeholder"
                    class="dataview-control dataview-dropdown dataview-dropdown-min"
                    :placeholder="filter.placeholder"
                    :data-testid="`version-list-data-view__filter-${filter.key}`"
                    @update:modelValue="updateFilterValue(filter.key, $event)"
                  />
                  <slot name="toolbar-actions" />
                  <slot name="header-actions" />
                </div>
              </div>

              <div class="flex flex-wrap items-center justify-between gap-2">
                <span class="flex flex-row items-center gap-2 max-sm:w-full">
                  <Dropdown
                    v-if="sortOptions.length"
                    v-model="sortValue"
                    :options="sortOptions"
                    :pt="dropdownPt"
                    optionLabel="label"
                    optionValue="value"
                    :aria-label="sortAriaLabel"
                    class="dataview-control dataview-dropdown dataview-dropdown-min"
                    :placeholder="sortAriaLabel"
                    data-testid="version-list-data-view__sort"
                  />
                  <DataTable.Search
                    class="w-full md:min-w-[20rem]"
                    v-model="searchValue"
                    :placeholder="searchPlaceholder"
                    data-testid="version-list-data-view__search"
                  >
                    <slot name="toolbar-extras" />
                  </DataTable.Search>
                </span>
                <div class="flex gap-2 max-sm:w-full">
                  <PrimeButton
                    outlined
                    icon="pi pi-refresh"
                    size="small"
                    :aria-label="refreshAriaLabel"
                    v-tooltip.top="{ value: 'Reload', showDelay: 200 }"
                    data-testid="version-list-data-view__refresh"
                    @click="reload"
                  />
                  <DataTable.Export
                    v-if="hasExport"
                    @export="exportData"
                  />
                  <DataTableColumnSelector
                    v-if="showColumnSelector"
                    :columns="availableColumns"
                    v-model:selectedColumns="selectedColumns"
                  />
                </div>
              </div>
            </div>
          </template>
        </DataTable.Header>
      </template>

      <DataTable.Column
        v-for="col in selectedColumns"
        :key="col.field"
        :field="col.field"
        :header="col.header"
        :sortable="false"
        data-testid="version-list-data-view__column"
      >
        <template #body="{ data: version }">
          <slot
            :name="`cell-${col.key}`"
            :item="version"
            :column="col"
            :isPrimary="isPrimaryColumn(col)"
            :onPrimaryClick="() => triggerRowClick(version)"
          >
            <!-- Version: hash + Current tag + comment, with state badge -->
            <button
              v-if="col.key === 'version'"
              type="button"
              class="version-cell-button inline-flex max-w-full min-w-0 flex-wrap items-center gap-2 border-0 bg-transparent p-0 text-left text-[var(--text-color)]"
              :data-testid="`version-list-data-view__row-${version.id}__primary`"
              @click="triggerRowClick(version)"
            >
              <span class="version-hash font-mono text-sm font-semibold leading-5">
                {{ version.id }}
              </span>
              <VersionStateBadge :state="version.state" />
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

            <!-- Status: state badge in its own column -->
            <VersionStateBadge
              v-else-if="col.key === 'status'"
              :state="version.state"
            />

            <!-- Created by: avatar + relative time -->
            <DataTable.CellDisplay
              v-else-if="col.key === 'created'"
              :avatar="authorInitial(version)"
              :text="relativeTime(version)"
              :tooltip="exactDate(version)"
              tooltipPosition="bottom"
              data-sentry-mask
            />

            <span
              v-else
              class="cell-default"
            >
              {{ version[col.field] ?? '--' }}
            </span>
          </slot>
        </template>
      </DataTable.Column>

      <DataTable.Column
        v-if="showRowActions"
        :frozen="true"
        :alignFrozen="'right'"
        headerStyle="width: 3rem"
        data-testid="version-list-data-view__actions-column"
      >
        <template #body="{ data: version }">
          <DataTable.RowActions
            v-if="hasRowActions(version)"
            :rowData="version"
            :actions="rowActionOptions(version)"
            :onMenuToggle="toggleActionsMenu"
            :menuRefSetter="setMenuRefForRow"
          />
        </template>
      </DataTable.Column>

      <template #empty>
        <div
          class="my-4 flex flex-col gap-2"
          data-testid="version-list-data-view__filtered-empty"
        >
          <p class="m-0 text-base font-semibold leading-6 text-[var(--text-color)]">
            {{ filteredEmptyTitle }}
          </p>
          <p class="m-0 text-sm leading-6 text-[var(--text-color-secondary)]">
            {{ filteredEmptyDescription }}
          </p>
        </div>
      </template>
    </DataTable>
  </div>
</template>

<style scoped>
  :deep(.dataview-dropdown.p-dropdown) {
    min-height: 2rem;
    border-color: var(--surface-border);
    border-radius: 0.375rem;
    background: var(--surface-section);
    color: var(--text-color);
    font-size: 0.875rem;
    box-shadow: none;
  }

  :deep(.dataview-dropdown.p-dropdown.p-focus) {
    border-color: var(--primary-color);
    box-shadow: none;
  }

  @media (min-width: 640px) {
    .dataview-dropdown-min {
      min-width: 9.5rem;
    }
  }

  :deep(.dataview-dropdown .p-dropdown-label) {
    color: var(--text-color);
    padding-block: 0.375rem;
    font-size: 0.875rem;
  }

  :deep(.dataview-dropdown .p-dropdown-trigger) {
    color: var(--text-color-secondary);
  }

  :deep(.dataview-dropdown-panel) {
    border: 1px solid var(--surface-border);
    border-radius: 0.5rem;
    background: var(--surface-section);
    color: var(--text-color);
  }

  :deep(.dataview-dropdown-panel .dataview-dropdown-item) {
    border-radius: 0.375rem;
    color: var(--text-color);
    font-size: 0.875rem;
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

  .version-cell-button {
    cursor: pointer;
  }

  .cell-default {
    display: block;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
