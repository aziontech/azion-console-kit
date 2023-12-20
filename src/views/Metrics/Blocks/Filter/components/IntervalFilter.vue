<script setup>
  import Dropdown from 'primevue/dropdown'
  import Calendar from 'primevue/calendar'
  import { DefaultDateTimeInterval } from '@views/metrics/utils/default-datetime'
  import { onMounted, ref } from 'vue'

  // const props = defineProps({})

  onMounted(() => {
    interval.value = intervalOptions.value[0]
  })

  const dates = ref()
  const interval = ref()
  const intervalOptions = ref(DefaultDateTimeInterval)
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
