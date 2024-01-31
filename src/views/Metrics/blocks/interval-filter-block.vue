<script setup>
  import { removeSelectedAmountOfHours } from '@/helpers/convert-date'
  import { useAccountStore } from '@/stores/account'
  import { useMetricsStore } from '@/stores/metrics'
  import { storeToRefs } from 'pinia'
  import Calendar from 'primevue/calendar'
  import Dropdown from 'primevue/dropdown'
  import { computed, onBeforeMount, ref, watchEffect } from 'vue'

  const accountStore = useAccountStore()
  const metricsStore = useMetricsStore()

  const { getDateTimeFilterOptions, currentFilters } = storeToRefs(metricsStore)
  const { setTimeRange } = metricsStore

  const dates = ref([])
  const interval = ref(null)

  const intervalOptions = computed(() => {
    return getDateTimeFilterOptions.value
  })

  const userUTC = accountStore.accountUtcOffset

  const isCustomDate = computed(() => {
    return interval.value?.code === 'custom'
  })

  const hasSecondDate = computed(() => {
    return dates.value?.[1] === null
  })

  const isInvalid = computed(() => {
    return hasSecondDate.value ? 'p-invalid' : ''
  })

  const maxDate = computed(() => {
    const date = new Date()
    const max = removeSelectedAmountOfHours(0, date)
    return max.toUTC(userUTC)
  })

  onBeforeMount(() => {
    setInitialValues()
  })

  const setInitialValues = () => {
    const stateTsRange = currentFilters.value?.tsRange

    if (stateTsRange) {
      setInitialTimeRange(stateTsRange)
    } else {
      interval.value = intervalOptions?.value[0]
    }
  }

  const setInitialTimeRange = (initialTsRange) => {
    const GMT0 = '.000Z'

    const gmt0Begin = `${initialTsRange.begin}${GMT0}`
    const gmt0End = `${initialTsRange.end}${GMT0}`
    const dateBegin = new Date(gmt0Begin).toUTC(userUTC)
    const dateEnd = new Date(gmt0End).toUTC(userUTC)

    dates.value = [dateBegin, dateEnd]

    interval.value = intervalOptions?.value.find(
      (element) => element.code === initialTsRange.meta.option
    )
  }

  const handleSelect = (offset) => {
    const result = removeAmountOfHours(offset)

    setDateTimeFilters(...result)
  }

  const handlePicker = async () => {
    if (!dates.value) {
      const result = removeAmountOfHours(1)

      dates.value = [...result]
    }

    if (hasSecondDate.value) return

    setDateTimeFilters(...dates.value)
  }

  const setDateTimeFilters = (begin, end) => {
    if (!begin || !end) return
    const tsRange = {
      meta: { option: interval.value?.code },
      tsRangeBegin: begin.resetUTC(userUTC).toBeholderFormat(),
      tsRangeEnd: end.resetUTC(userUTC).toBeholderFormat()
    }

    setTimeRange({ ...tsRange })
  }

  const removeAmountOfHours = (offset) => {
    const date = new Date()
    const begin = removeSelectedAmountOfHours(offset, date)
    const end = removeSelectedAmountOfHours(0, date)

    return [begin.toUTC(userUTC), end.toUTC(userUTC)]
  }

  const dropdownChange = () => {
    dates.value = null
  }

  watchEffect(() => {
    if (interval.value && !isCustomDate.value) {
      handleSelect(interval.value.code)
      return
    }

    handlePicker()
  })
</script>

<template>
  <div class="flex flex-column gap-6 md:flex-row md:gap-6">
    <div class="w-full md:max-w-xs max-w-full">
      <Dropdown
        class="w-full"
        v-model="interval"
        :options="intervalOptions"
        optionLabel="name"
        @change="dropdownChange"
        :loading="!intervalOptions?.length"
      />
    </div>
    <div
      class="w-full md:max-w-xs max-w-full"
      v-if="isCustomDate"
    >
      <Calendar
        placeholder="Select date from calendar"
        class="w-full"
        v-model="dates"
        dateFormat="dd/mm/yy"
        showTime
        hourFormat="24"
        selectionMode="range"
        :manualInput="false"
        showIcon
        iconDisplay="input"
        :maxDate="maxDate"
        :class="isInvalid"
      />
      <small
        v-if="hasSecondDate"
        class="p-error text-xs font-normal leading-tight"
      >
        Select the second date.
      </small>
    </div>
  </div>
</template>
