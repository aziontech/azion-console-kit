<script setup>
  import Calendar from 'primevue/calendar'
  import Dropdown from 'primevue/dropdown'
  import { computed, ref, onBeforeMount, watchEffect } from 'vue'
  import DATE_TIME_INTEVALS from '../constants/date-time-interval'
  import { useAccountStore } from '@/stores/account'
  import { removeSelectedAmountOfHours } from '@/helpers/convert-date'
  const emit = defineEmits(['updateInterval'])

  const accountStore = useAccountStore()

  const dates = ref()
  const interval = ref()
  const intervalOptions = ref(DATE_TIME_INTEVALS)

  const errorMessageMissingDate = 'Select the second date.'

  const userUTC = accountStore.accountUtcOffset

  const isCustomDate = computed(() => {
    return interval?.value?.code === 'custom'
  })

  const hasSecondDate = computed(() => {
    return dates?.value?.[1] === null
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
    // TODO: Change the initialization of the varible below for the filters store equivalent on pinia
    const stateTsRange = null

    if (stateTsRange) {
      setInitialTimeRange(stateTsRange)
    } else {
      interval.value = DATE_TIME_INTEVALS[0]
    }
  }

  const setInitialTimeRange = (initialTsRange) => {
    const GMT0 = '.000Z'

    const gmt0Begin = `${initialTsRange.begin}${GMT0}`
    const gmt0End = `${initialTsRange.end}${GMT0}`
    const dateBegin = new Date(gmt0Begin).toUTC(userUTC)
    const dateEnd = new Date(gmt0End).toUTC(userUTC)

    dates.value = [dateBegin, dateEnd]

    if (initialTsRange.meta.option === 'custom') return (interval.value = DATE_TIME_INTEVALS[5])

    interval.value = DATE_TIME_INTEVALS.find(
      (element) => Number(element.code) === Number(initialTsRange.meta.option)
    )
  }

  const handleSelect = (offset) => {
    const result = removeAmountOfHours(offset)

    handleEmit(...result)
  }

  const handlePicker = async () => {
    if (!dates.value) {
      const result = removeAmountOfHours(1)

      dates.value = [...result]
    }

    if (hasSecondDate.value) return

    handleEmit(...dates.value)
  }

  const handleEmit = (begin, end) => {
    const tsRange = {
      tsRangeBegin: begin.resetUTC(userUTC).toBeholderFormat(),
      tsRangeEnd: end.resetUTC(userUTC).toBeholderFormat()
    }

    emit('updateInterval', tsRange)
  }

  const removeAmountOfHours = (offset) => {
    const date = new Date()
    const begin = removeSelectedAmountOfHours(offset, date)
    const end = removeSelectedAmountOfHours(0, date)

    return [begin.toUTC(userUTC), end.toUTC(userUTC)]
  }

  const dropdownChange = () => {
    return (dates.value = null)
  }

  watchEffect(() => {
    if (interval.value && !isCustomDate.value) return handleSelect(interval.value.code)

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
      />
    </div>
    <div class="w-full md:max-w-xs max-w-full">
      <Calendar
        v-if="isCustomDate"
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
        {{ errorMessageMissingDate }}
      </small>
    </div>
  </div>
</template>
