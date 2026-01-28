<template>
  <PrimeButton
    v-if="!panelOnly"
    icon="pi pi-calendar"
    outlined
    size="small"
    @click="emit('open', $event)"
    :pt="{
      icon: { class: 'max-md:m-0' }
    }"
  />

  <template v-else>
    <div class="flex gap-2">
      <div class="flex gap-2 flex-1">
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
  </template>
</template>

<script setup>
  import { ref, defineModel, onMounted, watch } from 'vue'
  import PrimeButton from 'primevue/button'
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

  const emit = defineEmits(['select', 'open', 'close'])

  defineOptions({ name: 'QuickSelect' })

  const model = defineModel({
    type: Object,
    default: () => ({})
  })

  const props = defineProps({
    maxDays: {
      type: Number,
      default: 365
    },
    panelOnly: {
      type: Boolean,
      default: false
    }
  })

  const commonDateRanges = Object.values(COMMON_DATE_RANGES).filter(
    (range) => range.maxDays <= props.maxDays
  )

  const quickSelectDirection = ref('last')
  const quickSelectValue = ref(15)
  const quickSelectUnit = ref('minutes')

  const normalizeUnit = (unit) => {
    if (!unit) return null

    const normalized = String(unit).toLowerCase().trim()

    switch (normalized) {
      case 'minute':
      case 'minutes':
        return 'minutes'

      case 'hour':
      case 'hours':
        return 'hours'

      case 'day':
      case 'days':
        return 'days'

      case 'month':
      case 'months':
        return 'months'

      default:
        return null
    }
  }

  const parseRelativeFromLabel = (label) => {
    if (!label) return null
    const match = label.trim().match(/^(last|next)\s+(\d+)\s+([a-zA-Z]+)$/i)
    if (!match) return null

    const direction = match[1].toLowerCase()
    const value = Number(match[2])
    const unit = normalizeUnit(match[3])
    if (!Number.isFinite(value) || value <= 0 || !unit) return null

    return { direction, value, unit }
  }

  const getQuickStepFromModel = () => {
    const step =
      model.value?.quick || model.value?.relative || parseRelativeFromLabel(model.value?.label)
    const unit = normalizeUnit(step?.unit)
    if (!unit || !Number.isFinite(step?.value) || step.value <= 0) return null

    const direction = step?.direction === 'next' ? 'next' : 'last'
    return { direction, value: step.value, unit }
  }

  const syncFieldsFromModel = () => {
    const step = getQuickStepFromModel()
    if (!step) return
    quickSelectDirection.value = step.direction
    quickSelectValue.value = step.value
    quickSelectUnit.value = step.unit
  }

  const syncModelQuickFromFields = () => {
    model.value = {
      ...model.value,
      quick: {
        value: quickSelectValue.value,
        unit: quickSelectUnit.value,
        direction: quickSelectDirection.value
      }
    }
  }

  onMounted(() => {
    if (!props.panelOnly) return
    syncFieldsFromModel()
    syncModelQuickFromFields()
  })

  watch(
    () => model.value?.quick,
    () => {
      if (!props.panelOnly) return
      syncFieldsFromModel()
    },
    { deep: true }
  )

  watch([quickSelectDirection, quickSelectValue, quickSelectUnit], () => {
    if (!props.panelOnly) return
    syncModelQuickFromFields()
  })

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
      endDate: newEndDate,
      label: '',
      labelStart: '',
      labelEnd: '',
      quick: {
        value: quickSelectValue.value,
        unit: quickSelectUnit.value,
        direction: quickSelectDirection.value
      }
    }
    emit('select', model.value)
    emit('close')
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
      case 'last_5_minutes':
        ;({ startDate: newStartDate, endDate: newEndDate } = createRelativeRange(
          5,
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
      label: range.label,
      labelStart: '',
      labelEnd: ''
    }

    emit('select', model.value)
    emit('close')
  }
</script>
