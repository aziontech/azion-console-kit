<template>
  <PrimeButton
    icon="pi pi-calendar"
    outlined
    size="small"
    @click="toggleOverlayPanel"
    :pt="{
      icon: { class: 'max-md:m-0' }
    }"
  />

  <OverlayPanel
    ref="overlayPanelQuickSelect"
    :showCloseIcon="false"
    class="max-w-[330px]"
  >
    <div class="text-sm font-medium leading-5 mb-3">Quick select</div>

    <div class="flex gap-2">
      <div class="flex gap-2 flex-1">
        <InputNumber
          v-model="quickSelectValue"
          :min="1"
          
          :pt="{ input: { class: 'w-full' } }"
        />
        <Dropdown
          v-model="quickSelectUnit"
          :options="RELATIVE_UNITS"
          optionLabel="label"
          optionValue="value"
        />
      </div>
      <PrimeButton
        label="Apply"
        outlined
        class="whitespace-nowrap px-4"
        size="small"
        @click="applyQuickSelect"
      />
    </div>

    <div class="mt-4">
      <div class="text-sm font-medium leading-5 text-color mb-3">Commonly used</div>
      <div class="grid grid-cols-1 sm:grid-cols-2">
        <PrimeButton
          v-for="range in commonDateRanges"
          :key="range.value"
          size="small"
          link
          class="justify-start text-left w-full"
          @click="applyCommonRange(range)"
        >
          {{ range.label }}
        </PrimeButton>
      </div>
    </div>
  </OverlayPanel>
</template>

<script setup>
  import { ref, defineModel } from 'vue'
  import PrimeButton from 'primevue/button'
  import OverlayPanel from 'primevue/overlaypanel'
  import Dropdown from 'primevue/dropdown'
  import InputNumber from 'primevue/inputnumber'
  import {
    createRelativeRange,
    createStartOfDay,
    createEndOfDay,
    createWeekRange,
    COMMON_DATE_RANGES,
    RELATIVE_UNITS
  } from '@utils/date.js'

  const emit = defineEmits(['select'])

  defineOptions({ name: 'QuickSelect' })

  const model = defineModel({
    type: Object,
    default: () => ({})
  })

  const props = defineProps({
    maxDays: {
      type: Number,
      default: 0
    }
  })

  const commonDateRanges = Object.values(COMMON_DATE_RANGES).filter(
    (range) => range.maxDays <= props.maxDays
  )

  const quickSelectValue = ref(15)
  const quickSelectUnit = ref('minutes')

  const overlayPanelQuickSelect = ref(null)

  const toggleOverlayPanel = (event) => {
    overlayPanelQuickSelect.value.toggle(event)
  }

  const applyQuickSelect = () => {
    const now = new Date()
    const dateRange = createRelativeRange(quickSelectValue.value, quickSelectUnit.value, now)

    model.value = {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    }

    emit('select', model.value)
    overlayPanelQuickSelect.value.hide()
  }

  const applyCommonRange = (range) => {
    const now = new Date()
    let dateRange

    switch (range.value) {
      case 'today':
        dateRange = {
          startDate: createStartOfDay(now),
          endDate: createEndOfDay(now)
        }
        break
      case 'this_week':
        dateRange = createWeekRange(now)
        break
      case 'last_1_minute':
        dateRange = createRelativeRange(1, 'minutes', now)
        break
      case 'last_5_minutes':
        dateRange = createRelativeRange(5, 'minutes', now)
        break
      case 'last_15_minutes':
        dateRange = createRelativeRange(15, 'minutes', now)
        break
      case 'last_30_minutes':
        dateRange = createRelativeRange(30, 'minutes', now)
        break
      case 'last_1_hour':
        dateRange = createRelativeRange(1, 'hours', now)
        break
      case 'last_24_hours':
        dateRange = createRelativeRange(24, 'hours', now)
        break
      case 'last_7_days':
        dateRange = createRelativeRange(7, 'days', now)
        break
      case 'last_30_days':
        dateRange = createRelativeRange(30, 'days', now)
        break
      case 'last_90_days':
        dateRange = createRelativeRange(90, 'days', now)
        break
      case 'last_1_year':
        dateRange = createRelativeRange(365, 'days', now)
        break
      default:
        return
    }

    model.value = {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      label: range.label
    }

    emit('select', model.value)
    overlayPanelQuickSelect.value.hide()
  }
</script>
