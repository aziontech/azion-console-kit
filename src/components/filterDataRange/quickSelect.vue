<template>
  <div class="relative">
    <PrimeButton
      icon="pi pi-calendar"
      outlined
      size="small"
      @click="toggleOverlayPanel"
    />

    <OverlayPanel
      ref="overlayPanelQuickSelect"
      :showCloseIcon="false"
      class="max-w-[500px]"
      pt:overlayPanel="bg-surface-card border border-surface-border shadow-lg rounded-lg"
    >
      <div>
        <div class="mb-6">
          <div class="text-sm font-medium leading-5 mb-3">Quick select</div>

          <div class="flex items-center gap-3">
            <Dropdown
              v-model="quickSelectDirection"
              :options="[
                { label: 'Last', value: 'last' },
                { label: 'Next', value: 'next' }
              ]"
              optionLabel="label"
              optionValue="value"
            />
            <InputNumber
              v-model="quickSelectValue"
              :min="1"
            />
            <Dropdown
              v-model="quickSelectUnit"
              :options="RELATIVE_UNITS"
              optionLabel="label"
              optionValue="value"
            />
            <PrimeButton
              label="Apply"
              size="small"
              @click="applyQuickSelect"
            />
          </div>
        </div>

        <div class="mb-6">
          <div class="text-sm font-medium leading-5 text-color mb-3">Commonly used</div>
          <div class="flex flex-wrap">
            <PrimeButton
              v-for="range in commonDateRanges"
              :key="range.value"
              link
              class="p-3"
              @click="applyCommonRange(range)"
            >
              {{ range.label }}
            </PrimeButton>
          </div>
        </div>
      </div>
    </OverlayPanel>
  </div>
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
    RELATIVE_UNITS,
    getCurrentMonthLabel
  } from '@utils/date.js'

  const model = defineModel({
    type: Object,
    default: () => ({})
  })

  const commonDateRanges = Object.values(COMMON_DATE_RANGES)

  const quickSelectDirection = ref('last')
  const quickSelectValue = ref(15)
  const quickSelectUnit = ref('minutes')

  const overlayPanelQuickSelect = ref(null)

  const toggleOverlayPanel = (event) => {
    overlayPanelQuickSelect.value.toggle(event)
  }

  const applyQuickSelect = () => {
    const now = new Date()
    const { startDate: newStartDate, endDate: newEndDate } = createRelativeRange(
      quickSelectValue.value,
      quickSelectUnit.value,
      quickSelectDirection.value,
      now
    )

    model.value = {
      startDate: newStartDate,
      endDate: newEndDate
    }

    overlayPanelQuickSelect.value.hide()
  }

  const applyCommonRange = (range) => {
    const now = new Date()
    let newStartDate, newEndDate

    switch (range.value) {
      case 'today':
        newStartDate = createStartOfDay(now)
        newEndDate = createEndOfDay(now)
        break
      case 'this_week':
        const weekRange = createWeekRange(now)
        newStartDate = weekRange.startDate
        newEndDate = weekRange.endDate
        break
      case 'last_1_minute':
        ;({ startDate: newStartDate, endDate: newEndDate } = createRelativeRange(
          1,
          'minutes',
          getCurrentMonthLabel().toLowerCase(),
          now
        ))
        break
      case 'last_15_minutes':
        ;({ startDate: newStartDate, endDate: newEndDate } = createRelativeRange(
          15,
          'minutes',
          getCurrentMonthLabel().toLowerCase(),
          now
        ))
        break
      case 'last_30_minutes':
        ;({ startDate: newStartDate, endDate: newEndDate } = createRelativeRange(
          30,
          'minutes',
          getCurrentMonthLabel().toLowerCase(),
          now
        ))
        break
      case 'last_1_hour':
        ;({ startDate: newStartDate, endDate: newEndDate } = createRelativeRange(
          1,
          'hours',
          getCurrentMonthLabel().toLowerCase(),
          now
        ))
        break
      case 'last_24_hours':
        ;({ startDate: newStartDate, endDate: newEndDate } = createRelativeRange(
          24,
          'hours',
          getCurrentMonthLabel().toLowerCase(),
          now
        ))
        break
      case 'last_7_days':
        ;({ startDate: newStartDate, endDate: newEndDate } = createRelativeRange(
          7,
          'days',
          getCurrentMonthLabel().toLowerCase(),
          now
        ))
        break
      case 'last_30_days':
        ;({ startDate: newStartDate, endDate: newEndDate } = createRelativeRange(
          30,
          'days',
          getCurrentMonthLabel().toLowerCase(),
          now
        ))
        break
      case 'last_90_days':
        ;({ startDate: newStartDate, endDate: newEndDate } = createRelativeRange(
          90,
          'days',
          getCurrentMonthLabel().toLowerCase(),
          now
        ))
        break
      case 'last_1_year':
        ;({ startDate: newStartDate, endDate: newEndDate } = createRelativeRange(
          365,
          'days',
          getCurrentMonthLabel().toLowerCase(),
          now
        ))
        break
      default:
        return
    }

    model.value = {
      startDate: newStartDate,
      endDate: newEndDate,
      label: range.label
    }

    overlayPanelQuickSelect.value.hide()
  }
</script>
