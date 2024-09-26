<script setup>
  import { TIME_INTERVALS } from '@modules/real-time-metrics/constants'
  import Calendar from 'primevue/calendar'
  import Dropdown from 'primevue/dropdown'
  import { computed, onMounted, onUnmounted, ref, watch, inject } from 'vue'

  const props = defineProps({
    moduleActions: {
      type: Object,
      required: true
    },
    moduleGetters: {
      type: Object,
      required: true
    },
    filterData: {
      type: Object,
      required: true
    },
    userUTC: {
      type: String,
      required: true
    },
    groupData: {
      type: Object,
      required: true
    }
  })

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const { setTimeRange } = props.moduleActions

  const { currentFilters, getIsLoadingFilters } = props.moduleGetters

  const intervalOptions = ref([...TIME_INTERVALS.DATE_TIME_FILTER_INTERVALS])

  const getCurrentFilters = computed(() => {
    return currentFilters({ filters: props.filterData })
  })

  const isLoading = () => {
    return getIsLoadingFilters({ filters: props.filterData })
  }

  const emit = defineEmits(['applyTSRange'])

  const disabledFilter = computed(() => {
    return isLoading.value
  })

  const dates = ref([])
  const maxDate = ref()
  const timer = ref()
  const lastFilteredDate = ref({})
  const interval = ref(null)
  const isVisibleCalendar = ref(false)

  const isCustomDate = computed(() => {
    return interval.value?.code === 'custom'
  })

  const hasError = computed(() => {
    const NUMBER_OF_DATES = 2
    return dates.value?.filter((date) => date)?.length != NUMBER_OF_DATES
  })

  const classError = computed(() => {
    return hasError.value ? 'p-invalid' : ''
  })

  const clickedOnTimeRangerRealTimeMetrics = () => {
    const payload = {
      product: 'Real-Time Metrics',
      section: props.groupData.current.value,
      page: props.groupData.currentPage.label,
      option: interval.value.code === 'custom' ? 'none' : interval.value.name
    }
    tracker.realTimeMetrics
      .clickedToRealTimeMetrics({
        eventName: 'Clicked on Time Range',
        payload
      })
      .track()
  }

  const clickedOnDatePickerRealTimeMetrics = () => {
    const payload = {
      product: 'Real-Time Metrics',
      section: props.groupData.current.value,
      page: props.groupData.currentPage.label,
      option: interval.value.code === 'custom' ? 'none' : interval.value.name
    }
    tracker.realTimeMetrics
      .clickedToRealTimeMetrics({
        eventName: 'Clicked on Date Picker',
        payload
      })
      .track()
  }

  const updateCurrentTime = () => {
    const max = new Date().removeSelectedAmountOfHours(0)
    maxDate.value = max.toUTC(props.userUTC)
  }

  const setInitialValues = () => {
    interval.value = intervalOptions?.value[0]
    const [begin, end] = removeAmountOfHours(interval.value?.code)
    dates.value = [begin, end]
    setDateTimeFilters(begin, end)
  }

  const updatedTimeRange = ({ begin, end, meta }) => {
    const GMT0 = '.000Z'

    const gmt0Begin = `${begin}${GMT0}`
    const gmt0End = `${end}${GMT0}`
    const dateBegin = new Date(gmt0Begin).toUTC(props.userUTC)
    const dateEnd = new Date(gmt0End).toUTC(props.userUTC)

    dates.value = [dateBegin, dateEnd]
    lastFilteredDate.value = { begin: dateBegin, end: dateEnd }
    interval.value = intervalOptions?.value.find((element) => element.code === meta.option)
  }

  const handleSelect = (offset) => {
    const [begin, end] = removeAmountOfHours(offset)

    if (areDatesEqual(begin, end)) return true

    setDateTimeFilters(begin, end)
  }

  const areDatesEqual = (begin, end) => {
    const DATE_SLICE_END = 19 // YYYY-MM-DDTHH:MM:SS

    const isoBegin = begin.toISOString().slice(0, DATE_SLICE_END)
    const isoEnd = end.toISOString().slice(0, DATE_SLICE_END)

    const isoLastBegin = lastFilteredDate.value?.begin?.toISOString().slice(0, DATE_SLICE_END)
    const isoLastEnd = lastFilteredDate.value?.end?.toISOString().slice(0, DATE_SLICE_END)

    return isoBegin === isoLastBegin && isoEnd === isoLastEnd
  }

  const setDateTimeFilters = (begin, end) => {
    if (!begin || !end) return
    const tsRange = {
      meta: { option: interval.value?.code },
      tsRangeBegin: begin.resetUTC(props.userUTC).toBeholderFormat(),
      tsRangeEnd: end.resetUTC(props.userUTC).toBeholderFormat()
    }

    if (areDatesEqual(begin, end)) return

    lastFilteredDate.value = { begin, end }
    setTimeRange({ ...tsRange })
  }

  const removeAmountOfHours = (offset) => {
    const date = new Date()
    const begin = date.removeSelectedAmountOfHours(offset)
    const end = date.removeSelectedAmountOfHours(0)

    return [begin.toUTC(props.userUTC), end.toUTC(props.userUTC)]
  }

  const dropdownChange = ({ value }) => {
    if (value && !isCustomDate.value) {
      if (handleSelect(value.code)) return
      emit('applyTSRange')
    }
  }

  const handleCalendar = () => {
    isVisibleCalendar.value = true
    if (hasError.value) return
    setDateTimeFilters(...dates.value)
    emit('applyTSRange')
  }

  const showCalendar = () => {
    clickedOnDatePickerRealTimeMetrics()
    isVisibleCalendar.value = false
  }

  watch(
    () => getCurrentFilters.value?.tsRange,
    (value) => {
      if (value) {
        updatedTimeRange(value)
      }
    },
    { deep: true }
  )

  onMounted(() => {
    updateCurrentTime()
    timer.value = setInterval(updateCurrentTime, 60000)
    setInitialValues()
  })
  onUnmounted(() => {
    clearInterval(timer.value)
  })
</script>

<template>
  <div class="flex flex-column gap-6 md:flex-row md:gap-3 w-full">
    <div class="w-full lg:max-w-xs max-w-full">
      <Dropdown
        appendTo="self"
        class="w-full"
        v-model="interval"
        :options="intervalOptions"
        optionLabel="name"
        @change="dropdownChange"
        @click="clickedOnTimeRangerRealTimeMetrics()"
        :loading="disabledFilter"
        :disabled="disabledFilter"
        data-testid="real-time-metrics__interval-filter-block__dropdown"
      />
    </div>
    <div
      class="w-full lg:max-w-xs max-w-full"
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
        @hide="handleCalendar"
        @show="showCalendar"
        :manualInput="false"
        showIcon
        iconDisplay="input"
        :maxDate="maxDate"
        :class="classError"
        data-testid="real-time-metrics__interval-filter-block__calendar"
        :aria-valuenow="dates"
      />
      <small
        v-if="hasError && isVisibleCalendar"
        class="p-error text-xs font-normal leading-tight"
      >
        Select the second date.
      </small>
    </div>
  </div>
</template>
