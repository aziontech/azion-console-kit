<script setup>
  import { useAccountStore } from '@/stores/account'
  import Calendar from 'primevue/calendar'
  import Dropdown from 'primevue/dropdown'
  import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
  import DATE_TIME_INTERVALS from '@/views/RealTimeEvents/Blocks/constants/date-time-interval'

  const accountStore = useAccountStore()

  const emit = defineEmits(['applyTSRange', 'update:filterDate'])

  const props = defineProps({
    disabledFilter: {
      type: Boolean
    },
    filterDate: {
      type: Object,
      required: true
    }
  })

  const intervalOptions = DATE_TIME_INTERVALS

  const setTimeRange = computed({
    get: () => props.filterDate.value,
    set: (value) => emit('update:filterDate', value)
  })

  const timer = ref()
  const maxDate = ref()
  const dates = ref([])
  const lastFilteredDate = ref({})
  const interval = ref(null)
  const isVisibleCalendar = ref(false)

  const userUTC = accountStore.accountUtcOffset

  const isCustomDate = computed(() => {
    return interval.value?.code === 'custom'
  })

  const hasError = computed(() => {
    const NUMBER_OF_DATES = 2
    return dates.value?.filter((date) => date)?.length !== NUMBER_OF_DATES
  })

  const classError = computed(() => {
    return hasError.value ? 'p-invalid' : ''
  })

  const minDate = computed(() => {
    const sevenDaysInHours = 7 * 24
    const min = new Date().removeSelectedAmountOfHours(sevenDaysInHours)
    return min.toUTC(userUTC)
  })

  const updatedTimeRange = ({ tsRangeBegin, tsRangeEnd, meta }) => {
    const GMT0 = '.000Z'
    const gmt0Begin = `${tsRangeBegin}${GMT0}`
    const gmt0End = `${tsRangeEnd}${GMT0}`
    const dateBegin = new Date(gmt0Begin).toUTC(userUTC)
    const dateEnd = new Date(gmt0End).toUTC(userUTC)
    dates.value = [dateBegin, dateEnd]
    lastFilteredDate.value = { begin: dateBegin, end: dateEnd }
    interval.value = intervalOptions.find((element) => element.code === meta.option)
  }

  const updateCurrentTime = () => {
    const max = new Date().removeSelectedAmountOfHours(0)
    maxDate.value = max.toUTC(userUTC)
  }

  const setInitialValues = () => {
    if (props.filterDate.tsRangeBegin) {
      updatedTimeRange(props.filterDate)
      return
    }
    interval.value = intervalOptions[0]
    const [begin, end] = removeAmountOfHours(interval.value?.code)
    dates.value = [begin, end]
    setDateTimeFilters(begin, end)
  }

  const handleSelect = (offset) => {
    const [begin, end] = removeAmountOfHours(offset)

    if (checkIfDatesAreEqual(begin, end)) return true

    setDateTimeFilters(begin, end)
  }

  const checkIfDatesAreEqual = (begin, end) => {
    const isoBegin = begin.toISOString().slice(0, 16)
    const isoEnd = end.toISOString().slice(0, 16)

    const isoLastBegin = lastFilteredDate.value.begin.toISOString().slice(0, 16)
    const isoLastEnd = lastFilteredDate.value.end.toISOString().slice(0, 16)

    return isoBegin === isoLastBegin && isoEnd === isoLastEnd
  }

  const setDateTimeFilters = (begin, end) => {
    if (!begin || !end) return
    const tsRange = {
      meta: { option: interval.value?.code },
      tsRangeBegin: begin.resetUTC(userUTC).toBeholderFormat(),
      tsRangeEnd: end.resetUTC(userUTC).toBeholderFormat()
    }

    if (lastFilteredDate.value?.begin && checkIfDatesAreEqual(begin, end)) return

    lastFilteredDate.value = { begin, end }
    setTimeRange.value = { ...tsRange }
  }

  const removeAmountOfHours = (offset) => {
    const date = new Date()
    const begin = date.removeSelectedAmountOfHours(offset)
    const end = date.removeSelectedAmountOfHours(0)

    return [begin.toUTC(userUTC), end.toUTC(userUTC)]
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
    isVisibleCalendar.value = false
  }

  watch(
    () => props.filterDate,
    (newValue) => {
      if (newValue.tsRangeBegin) {
        updatedTimeRange(newValue)
      }
    },
    { immediate: true }
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
  <div class="flex flex-column gap-3 md:flex-row md:gap-6">
    <div class="w-full md:max-w-xs max-w-full">
      <Dropdown
        class="w-full"
        v-model="interval"
        :options="intervalOptions"
        optionLabel="name"
        @change="dropdownChange"
        :loading="disabledFilter"
        :disabled="disabledFilter"
      />
    </div>
    <div
      class="w-full md:max-w-xs max-w-full"
      v-if="isCustomDate"
    >
      <Calendar
        placeholder="Select a date and time."
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
        :minDate="minDate"
        :class="classError"
      />
      <small
        v-if="hasError && isVisibleCalendar"
        class="p-error text-xs font-normal leading-tight"
      >
        Select a second date and time.
      </small>
    </div>
  </div>
</template>
