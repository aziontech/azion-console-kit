<script setup>
  import { computed } from 'vue'
  import DataView from 'primevue/dataview'
  import PrimeButton from '@aziontech/webkit/button'
  import Dropdown from '@aziontech/webkit/dropdown'
  import InputText from '@aziontech/webkit/inputtext'
  import Skeleton from '@aziontech/webkit/skeleton'

  defineOptions({ name: 'generic-data-view' })

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
    }
  })

  const emit = defineEmits([
    'update:searchTerm',
    'update:filterValues',
    'refresh',
    'page',
    'open-row-menu'
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
</script>

<template>
  <div class="flex flex-col gap-4 text-[var(--text-color)]">
    <div class="flex flex-wrap items-center justify-between gap-2">
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
      v-if="loading"
      class="flex flex-col gap-2"
    >
      <div
        v-for="item in 5"
        :key="item"
      >
        <Skeleton class="h-16 w-full rounded-md" />
      </div>
    </div>

    <div
      v-else-if="!hasDeployments"
      class="empty-state rounded-md border border-[var(--surface-border)] px-6 py-6 text-center text-[var(--text-color-secondary)]"
    >
      <h3 class="m-0 text-base font-semibold leading-6 text-[var(--text-color)]">
        {{ emptyTitle }}
      </h3>
      <p class="m-0 mt-2 text-sm leading-6">
        {{ emptyDescription }}
      </p>
    </div>

    <div
      v-else-if="!items.length"
      class="empty-state rounded-md border border-[var(--surface-border)] px-6 py-6 text-center text-[var(--text-color-secondary)]"
    >
      <h3 class="m-0 text-base font-semibold leading-6 text-[var(--text-color)]">
        {{ filteredEmptyTitle }}
      </h3>
      <p class="m-0 mt-2 text-sm leading-6">{{ filteredEmptyDescription }}</p>
    </div>

    <div
      v-else
      class="table-surface overflow-hidden rounded-md border border-[var(--surface-border)]"
    >
      <div
        class="deployment-header hidden items-center gap-3 border-b border-[var(--surface-border)] px-4 py-3 text-[14px] font-normal leading-6 tracking-[0.0625rem] text-[var(--text-color-secondary)] lg:flex"
      >
        <span
          v-for="column in columns"
          :key="column.key"
          :class="column.headerClass || column.cellClass"
        >
          {{ column.label }}
        </span>
        <span
          v-if="showRowActions"
          class="w-11 shrink-0"
        />
      </div>

      <DataView
        :value="items"
        dataKey="id"
        paginator
        :rows="paginatorRows"
        :first="paginatorFirst"
        :rowsPerPageOptions="[10, 20, 50]"
        paginator-template="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown JumpToPageInput"
        current-page-report-template="Showing {first} to {last} of {totalRecords} entries"
        @page="emit('page', $event)"
      >
        <template #list="{ data: deployment }">
          <div
            class="deployment-row flex min-h-[4.5rem] items-center gap-3 border-b border-[var(--surface-border)] px-4 py-3 text-sm leading-6 text-[var(--text-color)] max-lg:min-h-0 max-lg:flex-col max-lg:items-stretch max-lg:p-4"
          >
            <div
              v-for="column in columns"
              :key="column.key"
              :class="column.cellClass"
            >
              <span
                class="hidden max-lg:block max-lg:w-[min(35%,7.5rem)] max-lg:shrink-0 max-lg:text-[0.625rem] max-lg:font-normal max-lg:uppercase max-lg:tracking-[0.0625rem] max-lg:text-[var(--text-color-secondary)] max-sm:mb-1 max-sm:w-full"
                >{{ column.label }}</span
              >
              <slot
                :name="`cell-${column.key}`"
                :item="deployment"
                :column="column"
              >
                <span class="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{{
                  resolveDisplayValue(deployment, column)
                }}</span>
              </slot>
            </div>

            <div
              v-if="showRowActions"
              class="flex w-11 shrink-0 justify-end max-lg:w-full max-lg:items-start max-lg:gap-4 max-sm:flex-col max-sm:items-end max-sm:gap-1"
            >
              <span
                class="hidden max-lg:block max-lg:w-[min(35%,7.5rem)] max-lg:shrink-0 max-sm:hidden"
              />
              <PrimeButton
                icon="pi pi-ellipsis-v"
                text
                size="small"
                :aria-label="rowActionsAriaLabel"
                @click="emit('open-row-menu', { event: $event, deployment })"
              />
            </div>
          </div>
        </template>
      </DataView>
    </div>
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

  .deployment-header {
    background: var(--table-header-color, var(--surface-section));
  }

  .table-surface {
    background: var(--surface-section);
  }

  .deployment-row {
    background: var(--surface-section);
  }

  .deployment-row:hover {
    background: var(--table-body-row-hover-bg, var(--surface-ground));
  }

  .deployment-row:last-child {
    border-bottom: none;
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
