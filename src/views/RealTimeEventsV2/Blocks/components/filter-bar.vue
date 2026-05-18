<script setup>
  import AdvancedFilterSystem from '@/components/base/advanced-filter-system-v2/index.vue'
  import FilterTagsDisplay from '@/components/base/advanced-filter-system-v2/filterTagsDisplay'
  import Dropdown from '@aziontech/webkit/dropdown'
  import PrimeButton from '@aziontech/webkit/button'
  import { ref } from 'vue'

  defineOptions({ name: 'FilterBar' })

  defineProps({
    filterData: { type: Object, default: null },
    filterFields: { type: Array, default: () => [] },
    tabSelected: { type: Object, default: null },
    hideDatasetSelector: { type: Boolean, default: false },
    datasetOptions: { type: Array, default: () => [] }
  })

  const emit = defineEmits([
    'update:filterData',
    'filter-updated',
    'remove-filter',
    'dataset-change',
    'open-saved-searches'
  ])

  const filterSystemRef = ref(null)

  const onFilterDataUpdate = (val) => {
    emit('update:filterData', val)
  }

  defineExpose({ filterSystemRef })
</script>

<template>
  <div class="filter-bar">
    <div class="filter-bar__row">
      <div
        v-if="!hideDatasetSelector"
        class="filter-bar__dataset"
      >
        <span class="text-xs font-medium text-color-secondary">Dataset</span>
        <Dropdown
          appendTo="body"
          :modelValue="tabSelected?.panel"
          :options="datasetOptions"
          optionLabel="label"
          optionValue="value"
          class="filter-bar__dataset-dropdown"
          @change="emit('dataset-change', $event)"
          data-testid="dataset-selector-top"
        />
      </div>
      <div class="filter-bar__filters">
        <div class="filter-bar__filters-inner">
          <PrimeButton
            icon="ai ai-filter-alt"
            outlined
            size="small"
            class="flex-shrink-0"
            @click="(e) => emit('open-saved-searches', e)"
            v-tooltip.bottom="{ value: 'Saved queries', showDelay: 300 }"
          />
          <div class="filter-bar__aql">
            <AdvancedFilterSystem
              ref="filterSystemRef"
              :filterData="filterData"
              @update:filterData="onFilterDataUpdate"
              :fieldsInFilter="filterFields"
              :dataset="tabSelected?.dataset || ''"
              :filterDateRangeMaxDays="365"
              :hideFilterTags="true"
              @updatedFilter="emit('filter-updated')"
            />
          </div>
        </div>
      </div>
    </div>
    <FilterTagsDisplay
      v-if="filterData?.fields?.length"
      :filters="filterData.fields"
      :fieldsInFilter="filterFields"
      @removeFilter="emit('remove-filter', $event)"
    />
  </div>
</template>

<style scoped>
  .filter-bar {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    border: 1px solid var(--surface-border);
    padding: 0.5rem 0.625rem;
    border-radius: var(--border-radius);
  }

  .filter-bar__row {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    flex-wrap: wrap;
    min-width: 0;
  }

  .filter-bar__dataset {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    flex-shrink: 0;
  }

  .filter-bar__dataset-dropdown {
    flex: 0 0 auto;
    width: clamp(7rem, 15vw, 10rem);
    height: 2rem;
  }

  /* Uniform 2rem height on all interactive elements */
  :deep(.filter-bar__filters .p-button),
  :deep(.filter-bar__filters .p-inputtext),
  :deep(.filter-bar__filters .p-dropdown) {
    height: 2rem;
  }

  :deep(.filter-bar__dataset .p-dropdown) {
    height: 2rem;
    display: flex;
    align-items: center;
  }

  :deep(.filter-bar__dataset .p-dropdown .p-dropdown-label) {
    padding-top: 0;
    padding-bottom: 0;
    display: flex;
    align-items: center;
  }

  :deep(.filter-bar__filters .p-inputgroup) {
    height: 2rem;
    display: flex;
    align-items: stretch;
  }

  :deep(.filter-bar__filters .p-inputgroup > *) {
    height: 2rem !important;
    min-height: 2rem !important;
    max-height: 2rem !important;
    box-sizing: border-box;
  }

  :deep(.filter-bar__filters .p-inputgroup .p-button) {
    height: 2rem !important;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
    border-radius: 0;
  }

  :deep(.filter-bar__filters .p-inputgroup .p-inputtext) {
    height: 2rem !important;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
  }

  :deep(.afs-filter-row__actions .p-button) {
    height: 2rem !important;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
  }

  :deep(.filter-bar__filters-inner > .p-button) {
    height: 2rem !important;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
  }

  .filter-bar__filters {
    flex: 1 1 0%;
    min-width: 0;
  }

  .filter-bar__filters-inner {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    min-width: 0;
  }

  .filter-bar__aql {
    flex: 1 1 0%;
    min-width: 0;
    max-width: 100%;
  }

  /* AQL input respects container width via flex shrinking */
  :deep(.filter-bar__aql .p-inputgroup),
  :deep(.filter-bar__aql .p-inputtext) {
    width: 100%;
    min-width: 0;
  }
</style>
