<script setup>
  import { ref, onMounted, defineModel, computed, watch } from 'vue'
  import DataTimeRange from '@/components/base/dataTimeRange-v2'
  import FilterFields from '@/components/base/advanced-filter-system-v2/filterFields/index.vue'
  import AzionQueryLanguage from '@/components/base/advanced-filter-system-v2/filterAQL/azion-query-language.vue'
  import FilterTagsDisplay from '@/components/base/advanced-filter-system-v2/filterTagsDisplay'
  import PrimeButton from '@aziontech/webkit/button'

  import { useAccountStore } from '@/stores/account'
  import { createUtcDateFromUserTimezoneParts } from '@/helpers/convert-date'
  import { createRelativeRange } from '@utils/date.js'
  import { listTimezonesService } from '@/services/users-services'
  import { useVisibility } from '@/views/RealTimeEventsV2/composables/useVisibility'
  import { useBreakpoint } from '@/views/RealTimeEventsV2/composables/useBreakpoint'
  import { convertUnitToMilliseconds } from '@/helpers'

  defineOptions({ name: 'advanced-filter-system' })
  const accountStore = useAccountStore()

  const userUTC = accountStore.accountUtcOffset
  const userTimezone = accountStore.accountTimezone
  const emit = defineEmits(['updatedFilter'])

  const props = defineProps({
    fieldsInFilter: {
      type: Array,
      required: true
    },
    filterDateRangeMaxDays: {
      type: Number
    },
    isLoadingFilters: {
      type: Boolean,
      default: false
    },
    hideFilterTags: {
      type: Boolean,
      default: false
    },
    dataset: {
      type: String,
      default: ''
    }
  })

  const filterData = defineModel('filterData')

  const filterDataRange = ref({})
  const hasPendingDateUpdate = ref(false)
  const hasPendingQueryUpdate = ref(false)
  const hasAqlValidationError = ref(false)
  const aqlRef = ref(null)

  const { isHidden, onVisible } = useVisibility()
  const bp = useBreakpoint()
  const isMobileViewport = computed(() => bp.is('mobile-s').value || bp.is('mobile').value)
  const refreshLabel = computed(() => (isMobileViewport.value ? null : 'Refresh'))
  const updateLabel = computed(() => (isMobileViewport.value ? null : 'Update'))
  const dataTimeRangeRef = ref(null)

  let lastTickAt = 0

  const getAutoRefreshIntervalMs = () => {
    const cfg = filterDataRange.value?.autoRefresh
    if (!cfg?.enabled) return null
    const every = Number(cfg.every)
    if (!Number.isFinite(every) || every < 1) return null
    const unit = String(cfg.unit || '').toLowerCase().trim()
    return convertUnitToMilliseconds(unit, every)
  }

  const isAqlInputFocused = () => {
    if (typeof document === 'undefined') return false
    const active = document.activeElement
    if (!active || typeof active.closest !== 'function') return false
    return Boolean(active.closest('[data-testid="azion-query-language-input"]'))
  }

  const isInvalidRange = computed(() => {
    const start = filterDataRange.value?.startDate
    const end = filterDataRange.value?.endDate

    const labelStart =
      typeof filterDataRange.value?.labelStart === 'string'
        ? filterDataRange.value.labelStart.trim()
        : ''
    const labelEnd =
      typeof filterDataRange.value?.labelEnd === 'string'
        ? filterDataRange.value.labelEnd.trim()
        : ''

    if (labelStart.toLowerCase() === 'now' && labelEnd.toLowerCase() === 'now') return true

    if (!start || !end) return false
    return new Date(start).getTime() > new Date(end).getTime()
  })

  const parseRelativeFromLabel = (label) => {
    if (!label || typeof label !== 'string') return null

    const match = label.trim().match(/^(last|next)\s+(\d+)\s+([a-zA-Z]+)$/i)
    if (!match) return null

    const direction = match[1].toLowerCase()
    const value = Number(match[2])
    const unit = match[3].toLowerCase()

    if (!Number.isFinite(value) || value <= 0) return null

    return { direction, value, unit }
  }

  const updatedTime = () => {
    const now = new Date()

    const selectedUtcOffset = filterDataRange.value?.utcOffset || userUTC

    if (
      typeof filterDataRange.value.labelEnd === 'string' &&
      filterDataRange.value.labelEnd.trim() === 'now'
    ) {
      filterDataRange.value.endDate = now
    }

    if (
      typeof filterDataRange.value.labelStart === 'string' &&
      filterDataRange.value.labelStart.trim() === 'now'
    ) {
      filterDataRange.value.startDate = now
    }

    if (
      typeof filterDataRange.value.label === 'string' &&
      filterDataRange.value.label.trim() === 'now'
    ) {
      filterDataRange.value.endDate = now
    }

    const labelEndParsed = parseRelativeFromLabel(filterDataRange.value.labelEnd)
    const labelStartParsed = parseRelativeFromLabel(filterDataRange.value.labelStart)
    const labelParsed = parseRelativeFromLabel(filterDataRange.value.label)

    if (labelEndParsed) {
      const { startDate } = createRelativeRange(
        labelEndParsed.value,
        labelEndParsed.unit,
        labelEndParsed.direction,
        now
      )
      filterDataRange.value.endDate = startDate
    }

    if (labelStartParsed) {
      const { startDate } = createRelativeRange(
        labelStartParsed.value,
        labelStartParsed.unit,
        labelStartParsed.direction,
        now
      )
      filterDataRange.value.startDate = startDate
    }

    if (labelParsed) {
      const { startDate, endDate } = createRelativeRange(
        labelParsed.value,
        labelParsed.unit,
        labelParsed.direction,
        now
      )
      filterDataRange.value.startDate = startDate
      filterDataRange.value.endDate = endDate
    }

    const { tsRangeBegin, tsRangeEnd } = updatedTimeRange(
      filterDataRange.value.startDate,
      filterDataRange.value.endDate,
      selectedUtcOffset
    )
    filterData.value.tsRange = {
      tsRangeBegin,
      tsRangeEnd,
      label: filterDataRange.value.label || '',
      labelStart: filterDataRange.value.labelStart || '',
      labelEnd: filterDataRange.value.labelEnd || ''
    }

    if (filterDataRange.value?.relative) {
      filterData.value.tsRange.relative = { ...filterDataRange.value.relative }
    }

    if (filterDataRange.value?.autoRefresh) {
      filterData.value.tsRange.autoRefresh = { ...filterDataRange.value.autoRefresh }
    }
  }

  const applyFilters = () => {
    if (hasAqlValidationError.value) return

    if (hasPendingQueryUpdate.value) {
      const parsed = aqlRef.value?.getParsedFilters?.()
      if (Array.isArray(parsed)) {
        filterData.value.fields = parsed
      }
      // History is persisted after the query succeeds — callers invoke
      // `commitQueryToHistory()` once they confirm the data loaded.
      hasPendingQueryUpdate.value = false
    }
    updatedTime()
    emitUpdatedFilter()
    hasPendingDateUpdate.value = false
  }

  const commitQueryToHistory = () => {
    aqlRef.value?.markAsApplied?.()
  }

  const onDateRangeSelect = () => {
    hasPendingDateUpdate.value = true
  }

  const onAutoRefreshTick = () => {
    // Pause auto-refresh while the tab is hidden — the catch-up fires
    // from `onVisible` registered below.
    if (isHidden.value) return
    // Focus guard: don't blow away the user's input while they type AQL.
    if (isAqlInputFocused()) return
    if (hasPendingDateUpdate.value) return
    updatedTime()
    emitUpdatedFilter()
    lastTickAt = Date.now()
  }

  onVisible(() => {
    const intervalMs = getAutoRefreshIntervalMs()
    if (!intervalMs) return
    if (Date.now() - lastTickAt > intervalMs) {
      onAutoRefreshTick()
    }
  })

  watch(
    () => bp.current.value,
    () => {
      dataTimeRangeRef.value?.closeOverlay?.()
    }
  )

  const onAqlDirtyChange = (isDirty) => {
    hasPendingQueryUpdate.value = Boolean(isDirty)
  }

  const onAqlValidationChange = (hasError) => {
    hasAqlValidationError.value = Boolean(hasError)
  }

  const emitUpdatedFilter = () => {
    emit('updatedFilter')
  }

  const searchAdvancedFilter = (filters) => {
    filterData.value.fields = filters
    updatedTime()
    emitUpdatedFilter()
  }

  const removeFilter = (index) => {
    filterData.value.fields.splice(index, 1)
    applyFilters()
  }

  const updatedTimeRange = (begin, end, userUTC) => {
    const beginDate = new Date(begin)
    const endDate = new Date(end)

    const dateBegin = createUtcDateFromUserTimezoneParts(
      {
        year: beginDate.getFullYear(),
        monthIndex: beginDate.getMonth(),
        day: beginDate.getDate(),
        hour: beginDate.getHours(),
        minute: beginDate.getMinutes(),
        second: beginDate.getSeconds(),
        millisecond: beginDate.getMilliseconds()
      },
      userUTC
    )
      .toISOString()
      .replace(/\.\d{3}/, '')

    const dateEnd = createUtcDateFromUserTimezoneParts(
      {
        year: endDate.getFullYear(),
        monthIndex: endDate.getMonth(),
        day: endDate.getDate(),
        hour: endDate.getHours(),
        minute: endDate.getMinutes(),
        second: endDate.getSeconds(),
        millisecond: endDate.getMilliseconds()
      },
      userUTC
    )
      .toISOString()
      .replace(/\.\d{3}/, '')

    return {
      tsRangeBegin: dateBegin,
      tsRangeEnd: dateEnd
    }
  }

  onMounted(() => {
    filterDataRange.value = {
      startDate: new Date(filterData.value.tsRange.tsRangeBegin),
      endDate: new Date(filterData.value.tsRange.tsRangeEnd),
      label: filterData.value.tsRange.label || '',
      labelStart: filterData.value.tsRange.labelStart || '',
      labelEnd: filterData.value.tsRange.labelEnd || '',
      utcOffset: userUTC,
      autoRefresh: filterData.value.tsRange.autoRefresh
    }

    if (filterData.value.tsRange.relative) {
      filterDataRange.value.relative = { ...filterData.value.tsRange.relative }
    }

    hasPendingDateUpdate.value = false
  })

  watch(
    () => filterDataRange.value?.autoRefresh,
    (autoRefresh) => {
      if (!filterData.value?.tsRange) return

      if (!autoRefresh) {
        delete filterData.value.tsRange.autoRefresh
        return
      }

      filterData.value.tsRange.autoRefresh = { ...autoRefresh }
    },
    { deep: true }
  )

  const syncDateRangeFromExternal = (startDate, endDate, label = '') => {
    filterDataRange.value = {
      ...filterDataRange.value,
      startDate: startDate instanceof Date ? startDate : new Date(startDate),
      endDate: endDate instanceof Date ? endDate : new Date(endDate),
      label,
      labelStart: '',
      labelEnd: '',
      relative: null
    }
    hasPendingDateUpdate.value = false
  }

  defineExpose({ removeFilter, applyFilters, commitQueryToHistory, syncDateRangeFromExternal })
</script>

<template>
  <div class="flex flex-col gap-6 md:gap-4">
    <div
      v-if="props.isLoadingFilters"
      class="w-full flex flex-col gap-4 animate-pulse"
    >
      <div class="flex gap-2 w-full">
        <div class="h-10 w-14 rounded-md surface-200" />
        <div class="h-10 flex-1 rounded-md surface-200" />
        <div class="h-10 w-44 rounded-md surface-200" />
        <div class="h-10 w-24 rounded-md surface-200" />
      </div>
    </div>

    <div
      v-else
      class="flex w-full flex-column md:flex-col items-center"
      :class="{ 'gap-6 md:gap-4': filterData.fields.length }"
    >
      <div class="afs-filter-row">
        <div class="afs-filter-row__query">
          <FilterFields
            v-model="filterData.fields"
            :filtersOptions="props.fieldsInFilter"
            @apply-filter="applyFilters"
          />
          <AzionQueryLanguage
            :fieldsInFilter="props.fieldsInFilter"
            :searchAdvancedFilter="searchAdvancedFilter"
            :filterAdvanced="filterData.fields"
            :dataset="props.dataset"
            ref="aqlRef"
            @dirty="onAqlDirtyChange"
            @validation="onAqlValidationChange"
          />
        </div>
        <div class="afs-filter-row__actions">
          <DataTimeRange
            ref="dataTimeRangeRef"
            v-model="filterDataRange"
            :maxDays="props.filterDateRangeMaxDays"
            :defaultUtcOffset="userUTC"
            :userTimezone="userTimezone"
            :listTimezonesService="listTimezonesService"
            @select="onDateRangeSelect"
            @autoRefresh="onAutoRefreshTick"
          />
          <PrimeButton
            v-if="!hasPendingDateUpdate && !hasPendingQueryUpdate"
            icon="pi pi-refresh"
            outlined
            size="small"
            :label="refreshLabel"
            class="flex-shrink-0"
            aria-label="Refresh events"
            data-testid="rte-refresh-button"
            :disabled="isInvalidRange || hasAqlValidationError"
            @click="applyFilters"
          />
          <PrimeButton
            v-else
            icon="pi pi-arrow-circle-right"
            severity="secondary"
            size="small"
            :label="updateLabel"
            aria-label="Update events"
            :disabled="isInvalidRange || hasAqlValidationError"
            class="flex-shrink-0"
            @click="applyFilters"
          />
        </div>
      </div>
      <div
        class="flex flex-1 w-full"
        v-if="!props.hideFilterTags"
      >
        <FilterTagsDisplay
          :filters="filterData.fields"
          :fieldsInFilter="props.fieldsInFilter"
          @removeFilter="removeFilter"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
  .afs-filter-row {
    display: flex;
    flex-wrap: nowrap;
    gap: 1.25rem;
    width: 100%;
    align-items: center;
  }

  .afs-filter-row__query {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex: 1 1 0%;
    min-width: 0;
  }

  /* Actions group (DataTimeRange + Refresh) is clearly detached from the
     AQL input via a wider gap (1.25rem) + a vertical separator to its
     left. Without these, the dark backgrounds of the input and the
     time-range control merge into one continuous strip and the user
     can't tell where filtering ends and time/refresh controls begin. */
  .afs-filter-row__actions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-shrink: 0;
    padding-left: 1rem;
    border-left: 1px solid var(--surface-border);
    margin-left: 0.25rem;
  }

  /* Tablet + mobile (< 1024px): the actions group (time range + refresh)
     drops to row 2 of the AdvancedFilterSystem so the AQL input gets full
     width on row 1. Date + Refresh stay LEFT-aligned across both
     breakpoints (per UX request — easier scan + thumb reach). */
  @media (max-width: 1023px) {
    .afs-filter-row {
      flex-wrap: wrap;
    }
    .afs-filter-row__query {
      flex: 1 1 100%;
      min-width: 0;
    }
    .afs-filter-row__actions {
      flex: 0 0 auto;
      width: 100%;
      justify-content: flex-start;
      align-items: center;
      max-width: 100%;
      overflow: hidden;
      /* Keep border-left + padding-left at all viewports: when the actions
         row stays on the same line as the query (no actual wrap), the
         divider is the only visual separation between them. Suppressing it
         here was making the AQL input visually merge with the date picker
         whenever the actions did NOT wrap to row 2. */
    }
    .afs-filter-row__actions > * {
      max-width: 100%;
      min-width: 0;
    }

    /* Height baseline unified at 2rem across DataTimeRange + Refresh so the
     wrapped row reads as a single visual band. */
    :deep(.afs-filter-row__actions .p-inputgroup),
    :deep(.afs-filter-row__actions .p-inputgroup > *),
    :deep(.afs-filter-row__actions .p-inputgroup .p-inputtext) {
      height: 2rem !important;
      min-height: 2rem !important;
      max-height: 2rem !important;
      box-sizing: border-box;
    }
    :deep(.afs-filter-row__actions .p-button) {
      height: 2rem !important;
      min-height: 2rem !important;
      max-height: 2rem !important;
    }
  }

  /* ── Uniform 2rem height for ALL filterbar elements ── */
  :deep(.afs-filter-row .p-button),
  :deep(.afs-filter-row .p-inputtext),
  :deep(.afs-filter-row .p-dropdown),
  :deep(.afs-filter-row .p-inputgroup) {
    height: 2rem !important;
    min-height: 2rem !important;
    max-height: 2rem !important;
    box-sizing: border-box;
  }

  /* inputgroup children */
  :deep(.afs-filter-row .p-inputgroup > *) {
    height: 2rem !important;
    min-height: 2rem !important;
    max-height: 2rem !important;
    box-sizing: border-box;
    display: flex;
    align-items: center;
  }

  /* QuickSelect icon override */
  :deep(.afs-filter-row .p-inputgroup > i) {
    height: 2rem !important;
    width: 2rem !important;
    min-height: 2rem !important;
    max-height: 2rem !important;
    display: inline-flex !important;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
  }

  /* InputDateRange inner container */
  :deep(.afs-filter-row .p-inputgroup > div) {
    height: 2rem !important;
    min-height: 2rem !important;
    max-height: 2rem !important;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
    display: flex;
    align-items: center;
  }

  /* InputText inside inputgroup */
  :deep(.afs-filter-row .p-inputgroup .p-inputtext) {
    height: 2rem !important;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
    padding-left: 0.375rem !important;
    padding-right: 0.375rem !important;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  /* Buttons padding */
  :deep(.afs-filter-row .p-button) {
    padding-top: 0 !important;
    padding-bottom: 0 !important;
  }

  /* Dropdown label vertical centering */
  :deep(.afs-filter-row .p-dropdown .p-dropdown-label) {
    padding-top: 0 !important;
    padding-bottom: 0 !important;
    display: flex;
    align-items: center;
  }

  @media (max-width: 640px) {
    .afs-filter-row__query {
      flex-basis: 100%;
    }

    .afs-filter-row__actions {
      width: 100%;
    }
  }
</style>

<!--
  Global (unscoped) constraints for the time-range OverlayPanel on
  mobile. PrimeVue teleports the panel to <body>, so scoped styles
  cannot reach it. The constraints keep the panel within the viewport
  and ensure its contents scroll instead of overflowing.
-->
<style>
  @media (max-width: 640px) {
    .p-overlaypanel {
      max-width: calc(100vw - 1rem) !important;
      max-height: calc(100dvh - 4rem) !important;
      overflow: auto;
    }
    .p-overlaypanel .p-overlaypanel-content {
      max-height: calc(100dvh - 5rem);
      overflow: auto;
    }
  }
</style>
