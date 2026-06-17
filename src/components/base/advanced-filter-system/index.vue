<script setup>
  import { ref, onMounted, defineModel, computed, watch } from 'vue'
  import DataTimeRange from '@/components/base/dataTimeRange'
  import DialogFilter from '@/components/base/advanced-filter-system/filterFields/temp/index.vue'
  import AzionQueryLanguage from '@/components/base/advanced-filter-system/filterAQL/azion-query-language.vue'
  import FilterTagsDisplay from '@/components/base/advanced-filter-system/filterTagsDisplay'
  import PrimeButton from '@aziontech/webkit/button'

  import { useAccountStore } from '@/stores/account'
  import { createUtcDateFromUserTimezoneParts } from '@/helpers/convert-date'
  import { createRelativeRange } from '@utils/date.js'
  import { listTimezonesService } from '@/services/users-services'

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
    }
  })

  const filterData = defineModel('filterData')

  const filterDataRange = ref({})
  const hasPendingDateUpdate = ref(false)
  const hasPendingQueryUpdate = ref(false)
  const hasAqlValidationError = ref(false)
  const aqlRef = ref(null)

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
      tsRangeEnd
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
      aqlRef.value?.markAsApplied?.()
      hasPendingQueryUpdate.value = false
    }
    updatedTime()
    emitUpdatedFilter()
    hasPendingDateUpdate.value = false
  }

  const onDateRangeSelect = () => {
    hasPendingDateUpdate.value = true
  }

  const onAutoRefreshTick = () => {
    if (hasPendingDateUpdate.value) return
    updatedTime()
    emitUpdatedFilter()
  }

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
      .replace(/(\..+)/, '')

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
      .replace(/(\..+)/, '')

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
      utcOffset: userUTC,
      autoRefresh: filterData.value.tsRange.autoRefresh
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
      <div class="flex w-full gap-2 items-start md:flex-row flex-col">
        <div class="flex-1 flex gap-2 items-start max-md:w-full">
          <DialogFilter
            v-model:filterAdvanced="filterData.fields"
            :fieldsInFilter="props.fieldsInFilter"
            @applyFilter="applyFilters"
          />
          <AzionQueryLanguage
            :fieldsInFilter="props.fieldsInFilter"
            :searchAdvancedFilter="searchAdvancedFilter"
            :filterAdvanced="filterData.fields"
            ref="aqlRef"
            @dirty="onAqlDirtyChange"
            @validation="onAqlValidationChange"
          />
        </div>
        <DataTimeRange
          class="max-md:w-full"
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
          label="Refresh"
          class="w-[5.875rem]"
          :disabled="isInvalidRange || hasAqlValidationError"
          @click="applyFilters"
        />
        <PrimeButton
          v-else
          icon="pi pi-arrow-circle-right"
          severity="secondary"
          size="small"
          label="Update"
          :disabled="isInvalidRange || hasAqlValidationError"
          class="w-[5.875rem]"
          @click="applyFilters"
        />
      </div>
      <div class="flex flex-1 w-full">
        <FilterTagsDisplay
          :filters="filterData.fields"
          :fieldsInFilter="props.fieldsInFilter"
          @removeFilter="removeFilter"
        />
      </div>
    </div>
  </div>
</template>
