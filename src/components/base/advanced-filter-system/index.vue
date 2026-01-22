<script setup>
  import { ref, onMounted, defineModel, computed } from 'vue'
  import DataTimeRange from '@/components/base/dataTimeRange'
  import DialogFilter from '@/components/base/advanced-filter-system/filterFields/temp/index.vue'
  import AzionQueryLanguage from '@/components/base/advanced-filter-system/filterAQL/azion-query-language.vue'
  import FilterTagsDisplay from '@/components/base/advanced-filter-system/filterTagsDisplay'
  import PrimeButton from 'primevue/button'

  import { useAccountStore } from '@/stores/account'
  import { createRelativeRange } from '@utils/date.js'

  defineOptions({ name: 'advanced-filter-system' })
  const accountStore = useAccountStore()

  const userUTC = accountStore.accountUtcOffset
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

  const isInvalidRange = computed(() => {
    const start = filterDataRange.value?.startDate
    const end = filterDataRange.value?.endDate
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
    const labelEndParsed = parseRelativeFromLabel(filterDataRange.value.labelEnd)
    const labelStartParsed = parseRelativeFromLabel(filterDataRange.value.labelStart)
    const labelParsed = parseRelativeFromLabel(filterDataRange.value.label)

    if (labelEndParsed) {
      const { startDate } = createRelativeRange(
        labelEndParsed.value,
        labelEndParsed.unit,
        labelEndParsed.direction,
        new Date()
      )
      filterDataRange.value.endDate = startDate
    }

    if (labelStartParsed) {
      const { startDate } = createRelativeRange(
        labelStartParsed.value,
        labelStartParsed.unit,
        labelStartParsed.direction,
        new Date()
      )
      filterDataRange.value.startDate = startDate
    }

    if (labelParsed) {
      const { startDate, endDate } = createRelativeRange(
        labelParsed.value,
        labelParsed.unit,
        labelParsed.direction,
        new Date()
      )
      filterDataRange.value.startDate = startDate
      filterDataRange.value.endDate = endDate
    }

    const { tsRangeBegin, tsRangeEnd } = updatedTimeRange(
      filterDataRange.value.startDate,
      filterDataRange.value.endDate,
      userUTC
    )
    filterData.value.tsRange = {
      tsRangeBegin,
      tsRangeEnd
    }
  }

  const applyFilters = () => {
    updatedTime()
    emitUpdatedFilter()
    hasPendingDateUpdate.value = false
  }

  const onDateRangeSelect = () => {
    hasPendingDateUpdate.value = true
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
    const dateBegin = begin.resetUTC(userUTC).toBeholderFormat()
    const dateEnd = end.resetUTC(userUTC).toBeholderFormat()

    return {
      tsRangeBegin: dateBegin,
      tsRangeEnd: dateEnd
    }
  }

  onMounted(() => {
    filterDataRange.value = {
      startDate: new Date(filterData.value.tsRange.tsRangeBegin),
      endDate: new Date(filterData.value.tsRange.tsRangeEnd),
      label: filterData.value.tsRange.label || ''
    }

    hasPendingDateUpdate.value = false
  })
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
          />
        </div>
        <DataTimeRange
          class="max-md:w-full"
          v-model="filterDataRange"
          :maxDays="props.filterDateRangeMaxDays"
          @select="onDateRangeSelect"
        />
        <PrimeButton
          v-if="!hasPendingDateUpdate"
          icon="pi pi-refresh"
          outlined
          size="small"
          label="Refresh"
          :disabled="isInvalidRange"
          @click="applyFilters"
        />
        <PrimeButton
          v-else
          icon="pi pi-check"
          severity="secondary"
          size="small"
          label="Updated"
          :disabled="isInvalidRange"
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
