<script setup>
  import Calendar from 'primevue/calendar'
  import Dropdown from 'primevue/dropdown'
  import { computed, ref, watchEffect } from 'vue'
  import DATE_TIME_INTEVALS from '../constants/date-time-interval'

  const emit = defineEmits(['updateInterval'])

  const dates = ref()
  const interval = ref(DATE_TIME_INTEVALS[0])
  const intervalOptions = ref(DATE_TIME_INTEVALS)

  const isCustomDate = computed(() => {
    return interval.value.code === 'custom'
  })

  watchEffect(() => {
    // TODO: handle data to be sent in beholder format
    emit('updateInterval', { dates: dates.value, interval: interval.value })
  })
</script>

<template>
  <div class="flex flex-column gap-6 md:flex-row md:gap-6">
    <Dropdown
      class="w-full max-w-xs"
      v-model="interval"
      :options="intervalOptions"
      optionLabel="name"
    />
    <Calendar
      v-if="isCustomDate"
      placeholder="Select date from calendar"
      class="w-full max-w-xs"
      v-model="dates"
      dateFormat="dd/mm/yy"
      showTime
      hourFormat="24"
      selectionMode="range"
      :manualInput="false"
      showIcon
      iconDisplay="input"
    />
  </div>
</template>
