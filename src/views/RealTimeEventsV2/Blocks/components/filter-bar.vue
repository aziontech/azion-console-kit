<script setup>
  import AdvancedFilterSystem from '@/components/base/advanced-filter-system-v2/index.vue'
  import FilterTagsDisplay from '@/components/base/advanced-filter-system-v2/filterTagsDisplay'
  import Dropdown from '@aziontech/webkit/dropdown'
  import PrimeButton from '@aziontech/webkit/button'
  import { computed, ref } from 'vue'
  import { useBreakpoint } from '../../composables/useBreakpoint'

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

  const bp = useBreakpoint()

  const layoutClass = computed(() => {
    if (bp.isAtMost('mobile').value) return 'is-stack'
    if (bp.is('tablet').value) return 'is-two-row'
    return 'is-single-row'
  })

  const onFilterDataUpdate = (val) => {
    emit('update:filterData', val)
  }

  defineExpose({ filterSystemRef })
</script>

<template>
  <div
    class="filter-bar"
    :class="layoutClass"
    role="search"
    data-testid="rte-filter-bar"
  >
    <div class="filter-bar__row">
      <div class="filter-bar__dataset-group">
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
        <PrimeButton
          icon="ai ai-filter-alt"
          outlined
          size="small"
          class="filter-bar__saved-searches-trigger flex-shrink-0"
          aria-label="Open saved searches"
          @click="(e) => emit('open-saved-searches', e)"
          v-tooltip.bottom="{ value: 'Saved queries', showDelay: 300 }"
        />
      </div>
      <div class="filter-bar__filters">
        <div class="filter-bar__filters-inner">
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
    /* Defensive horizontal clip: any internal element that miscalculates
       its width (PrimeVue popover anchors, contenteditable growth, etc.)
       cannot push past the card boundary on narrow viewports. */
    overflow-x: hidden;
  }

  .filter-bar__row {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    flex-wrap: wrap;
    min-width: 0;
  }

  /* Wraps Dataset selector + saved-searches trigger so both share a row.
     In desktop the group sits inline with `.filter-bar__filters`; in mobile
     (is-stack) it takes the full row width and packs the Dataset dropdown
     and saved-searches button side by side, freeing the Date+Refresh row
     below to start at the card's left edge. */
  .filter-bar__dataset-group {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    flex-shrink: 0;
    min-width: 0;
  }

  .filter-bar__dataset {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    flex-shrink: 0;
    min-width: 0;
  }

  .filter-bar__dataset-dropdown {
    flex: 0 0 auto;
    /* Widened upper bound so "HTTP Requests" (or any standard dataset name)
       fits without truncation at tablet sizes — the previous 10rem ceiling
       clipped longer labels. */
    width: clamp(8rem, 18vw, 12rem);
    height: 2rem;
  }

  /* Pre-existing project convention: unify ALL interactive controls in the
     filter bar to 2rem so PrimeButton small (28px) aligns visually with
     PrimeVue InputText / Dropdown defaults (~36px) which would otherwise
     create a height mismatch.

     The `.contenteditable.p-inputtext` selector targets the AQL input
     specifically — without `min-height: 2rem` the contenteditable's
     `h-auto` collapses below the button height. */
  :deep(.filter-bar__filters .p-button),
  :deep(.filter-bar__filters .p-inputtext),
  :deep(.filter-bar__filters .p-dropdown) {
    height: 2rem;
  }

  :deep(.filter-bar__filters .contenteditable.p-inputtext) {
    min-height: 2rem;
    height: 2rem;
    max-height: 2rem;
    width: 100%;
    max-width: 100%;
    display: flex;
    align-items: center;
    box-sizing: border-box;
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
    /* Anchor the AQL block — its internal AdvancedFilterSystem wraps to two
       rows in mobile/tablet, so we must not let it push the icon button or
       overflow the filter card. */
    overflow: hidden;
  }

  /* AQL input respects container width via flex shrinking */
  :deep(.filter-bar__aql .p-inputgroup),
  :deep(.filter-bar__aql .p-inputtext) {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
  }

  /* Responsive layout modes
     -----------------------
     `is-single-row` (desktop/xl) keeps the original behavior — no overrides here.
     `is-two-row` (tablet) lets the row wrap so internal items flow to a second line.
     `is-stack` (mobile/mobile-s) stacks every control vertically full-width. */

  .filter-bar.is-single-row .filter-bar__row {
    /* desktop/xl: keep existing flex row, gap, wrap */
  }

  /* Tablet (640-1023px): outer row wraps naturally. The AdvancedFilterSystem
     internally wraps its actions row to row 2 (per its own @media). */
  .filter-bar.is-two-row .filter-bar__row {
    flex-wrap: wrap;
    align-items: flex-start;
  }

  .filter-bar.is-stack .filter-bar__row {
    flex-direction: column;
    align-items: stretch;
  }

  /* Defensive: in stack mode every child must respect the parent width. */
  .filter-bar.is-stack > * {
    max-width: 100%;
    box-sizing: border-box;
  }

  /* Dataset + saved-searches share the same row in mobile. Dataset takes
     the remaining space, saved-searches keeps its 28×28 icon footprint. */
  .filter-bar.is-stack .filter-bar__dataset-group {
    width: 100%;
    flex-shrink: 1;
  }

  .filter-bar.is-stack .filter-bar__dataset {
    flex: 1 1 0%;
    min-width: 0;
  }

  .filter-bar.is-stack .filter-bar__dataset-dropdown {
    flex: 1 1 0%;
    width: auto;
    min-width: 0;
    max-width: 100%;
  }

  /* Force the inner PrimeVue trigger to honor its wrapper's width. */
  .filter-bar.is-stack :deep(.filter-bar__dataset-dropdown.p-dropdown),
  .filter-bar.is-stack :deep(.filter-bar__dataset-dropdown .p-dropdown) {
    width: 100%;
    max-width: 100%;
    min-width: 0;
  }

  /* The filters-inner only wraps the AQL block now (saved-searches moved
     into the dataset group). Stays as a flex row at full width. */
  .filter-bar.is-stack .filter-bar__filters-inner {
    flex-direction: row;
    align-items: stretch;
    width: 100%;
  }

  .filter-bar.is-stack .filter-bar__aql {
    width: 100%;
    min-width: 0;
  }

  /* Button sizing is owned by the design system — `size="small"` on the
     PrimeButton declarations (saved-searches, FilterFields "+", Refresh)
     gives the canonical `h-7` / `min-w-14` per @aziontech/webkit. Do NOT
     override height/width here; doing so violates the design-system
     hard rules on arbitrary spacing and breaks visual consistency with
     the rest of the console. */
</style>

<style>
  /* Global: Dropdown panel is teleported via appendTo="body", so it lives
     outside the scoped boundary. Constrain it so it never overflows the
     viewport on small screens. */
  .p-dropdown-panel {
    max-width: calc(100vw - 1rem);
  }
</style>
