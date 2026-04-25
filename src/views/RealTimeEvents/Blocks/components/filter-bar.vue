<script setup>
  import AdvancedFilterSystem from '@/components/base/advanced-filter-system/index.vue'
  import FilterTagsDisplay from '@/components/base/advanced-filter-system/filterTagsDisplay'
  import Dropdown from '@aziontech/webkit/dropdown'
  import PrimeButton from '@aziontech/webkit/button'
  import { ref } from 'vue'

  defineOptions({ name: 'FilterBar' })

  const props = defineProps({
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
    padding: 0.75rem;
    border-radius: var(--border-radius);
  }

  .filter-bar__row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .filter-bar__dataset {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .filter-bar__dataset-dropdown {
    width: 13rem;
    height: 2rem;
  }

  /* Force uniform height on all interactive elements inside filter-bar */
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

  /* DataTimeRange inputgroup: force uniform height and remove double borders */
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

  /* Refresh / Update buttons */
  :deep(.afs-filter-row__actions .p-button) {
    height: 2rem !important;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
  }

  /* Saved queries button */
  :deep(.filter-bar__filters-inner > .p-button) {
    height: 2rem !important;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
  }

  .filter-bar__filters {
    flex: 1 1 300px;
    min-width: 0;
  }

  .filter-bar__filters-inner {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .filter-bar__aql {
    flex: 1;
    min-width: 0;
  }

  @media (max-width: 768px) {
    .filter-bar__row {
      flex-direction: column;
      gap: 0.5rem;
    }

    .filter-bar__dataset {
      width: 100%;
    }

    .filter-bar__dataset-dropdown {
      flex: 1;
      width: auto;
    }

    .filter-bar__filters {
      width: 100%;
      flex-basis: 100%;
    }
  }
</style>
