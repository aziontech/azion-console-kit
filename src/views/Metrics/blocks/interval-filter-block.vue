<script setup>
  import { removeSelectedAmountOfHours } from '@/helpers/convert-date'
  import { useAccountStore } from '@/stores/account'
  import { useMetricsStore } from '@/stores/metrics'
  import { storeToRefs } from 'pinia'
  import Calendar from 'primevue/calendar'
  import Dropdown from 'primevue/dropdown'
  import { computed, onBeforeMount, ref, watch } from 'vue'

  const accountStore = useAccountStore()
  const metricsStore = useMetricsStore()

  const {
    getDateTimeFilterOptions: intervalOptions,
    currentFilters,
    getIsLoadingFilters
  } = storeToRefs(metricsStore)
  const { setTimeRange } = metricsStore

  const emit = defineEmits(['applyTSRange'])

  const disabledFilter = computed(() => {
    return getIsLoadingFilters.value
  })

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
    return dates.value?.filter((date) => date)?.length != NUMBER_OF_DATES
  })

  const classError = computed(() => {
    return hasError.value ? 'p-invalid' : ''
  })

  const maxDate = computed(() => {
    const date = new Date()
    const max = removeSelectedAmountOfHours(0, date)
    return max.toUTC(userUTC)
  })

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
    const dateBegin = new Date(gmt0Begin).toUTC(userUTC)
    const dateEnd = new Date(gmt0End).toUTC(userUTC)

    dates.value = [dateBegin, dateEnd]
    lastFilteredDate.value = { begin: dateBegin, end: dateEnd }
    interval.value = intervalOptions?.value.find((element) => element.code === meta.option)
  }

  const handleSelect = (offset) => {
    const [begin, end] = removeAmountOfHours(offset)

    if (checkIfDatesAreEqual(begin, end)) return true

    setDateTimeFilters(begin, end)
  }

  const checkIfDatesAreEqual = (begin, end) => {
    const isoBegin = begin.toISOString().slice(0, 13)
    const isoEnd = end.toISOString().slice(0, 13)

    const isoLastBegin = lastFilteredDate.value.begin.toISOString().slice(0, 13)
    const isoLastEnd = lastFilteredDate.value.end.toISOString().slice(0, 13)

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
    setTimeRange({ ...tsRange })
  }

  const removeAmountOfHours = (offset) => {
    const date = new Date()
    const begin = removeSelectedAmountOfHours(offset, date)
    const end = removeSelectedAmountOfHours(0, date)

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
    () => currentFilters.value?.tsRange,
    (value) => {
      if (value) {
        updatedTimeRange(value)
      }
    },
    { deep: true }
  )

  onBeforeMount(() => {
    setInitialValues()
  })
</script>

<template>
  <div class="flex flex-column gap-6 md:flex-row md:gap-6">
    <div class="w-full md:max-w-xs max-w-full">
      <Dropdown
        appendTo="self"
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
