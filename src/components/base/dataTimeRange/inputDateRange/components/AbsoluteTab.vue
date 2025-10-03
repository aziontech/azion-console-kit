<template>
  <div class="space-y-3">
    <div class="flex justify-center">
      <div class="flex items-center gap-3">
        <PrimeButton
          icon="pi pi-chevron-left"
          size="small"
          outlined
          @click="$emit('previousMonth')"
          :pt="{
            root: { class: 'transition-all duration-200 hover:scale-105' }
          }"
        />
        <div class="flex items-center gap-2">
          <Dropdown
            :model-value="selectedMonth"
            :options="MONTHS"
            optionLabel="label"
            optionValue="value"
            class="min-w-[120px]"
            @update:model-value="$emit('monthChange', $event)"
            :pt="{
              root: { class: 'transition-all duration-200' }
            }"
          />
          <Dropdown
            :model-value="selectedYear"
            :options="years"
            class="min-w-[100px]"
            @update:model-value="$emit('yearChange', $event)"
            :pt="{
              root: { class: 'transition-all duration-200' }
            }"
          />
        </div>
        <PrimeButton
          icon="pi pi-chevron-right"
          size="small"
          outlined
          @click="$emit('nextMonth')"
          :pt="{
            root: { class: 'transition-all duration-200 hover:scale-105' }
          }"
        />
      </div>
    </div>

    <div class="flex gap-3">
      <Calendar
        :model-value="selectedDate"
        :inline="true"
        :showIcon="false"
        :showButtonBar="false"
        :showWeek="false"
        :dateFormat="'dd/mm/yy'"
        class="w-full max-h-16rem min-h-14 h-fit"
        @date-select="$emit('dateSelect', $event)"
        :pt="{
          header: { class: 'hidden' },
          table: { class: 'w-full' },
          daylabel: {
            style: {
              padding: '0px !important',
              margin: '0px !important',
              fontSize: '0.875rem'
            }
          },
          day: {
            class: 'transition-all duration-200 hover:scale-105'
          }
        }"
      />

      <div class="border surface-border rounded-lg p-1 w-min h-13rem">
        <div class="space-y-1 h-full overflow-y-auto overflow-x-hidden">
          <PrimeButton
            :label="timeSlot"
            v-for="timeSlot in TIME_SLOTS"
            :key="timeSlot"
            class="m-1"
            severity="secondary"
            size="small"
            :outlined="selectedTime !== timeSlot"
            @click="$emit('timeSelect', timeSlot)"
            :pt="{
              label: { class: 'text-xs font-normal' },
              root: {
                class: `${
                  selectedTime === timeSlot
                    ? 'scale-105 shadow-md'
                    : 'hover:scale-102 hover:shadow-sm'
                }`
              }
            }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import PrimeButton from 'primevue/button'
  import Calendar from 'primevue/calendar'
  import Dropdown from 'primevue/dropdown'
  import { MONTHS, TIME_SLOTS } from '@utils/date.js'

  defineOptions({ name: 'AbsoluteTab' })

  defineProps({
    selectedDate: {
      type: Date,
      required: true
    },
    selectedTime: {
      type: String,
      default: ''
    },
    selectedMonth: {
      type: Number,
      required: true
    },
    selectedYear: {
      type: Number,
      required: true
    },
    years: {
      type: Array,
      required: true
    }
  })

  defineEmits([
    'previousMonth',
    'nextMonth',
    'monthChange',
    'yearChange',
    'dateSelect',
    'timeSelect'
  ])
</script>
