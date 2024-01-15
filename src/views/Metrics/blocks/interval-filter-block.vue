<script setup>
  import Calendar from 'primevue/calendar'
  import Dropdown from 'primevue/dropdown'
  import { onMounted, ref } from 'vue'
  import DATE_TIME_INTEVALS from '../constants/date-time-interval'
  // const props = defineProps({})
  onMounted(() => {
    interval.value = intervalOptions.value[0]
  })
  const dates = ref()
  const interval = ref()
  const intervalOptions = ref(DATE_TIME_INTEVALS)
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
      v-if="interval?.code === 'custom'"
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
