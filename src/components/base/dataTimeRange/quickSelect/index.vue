<template>
  <i
    v-if="!panelOnly"
    class="pi pi-calendar inline-flex items-center justify-center border-l border-t border-b surface-border rounded-l-md text-muted-color text-sm w-[2rem] h-[2rem]"
    aria-hidden="true"
  ></i>

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
      <div class="grid grid-cols-2 grid-rows-6 grid-flow-col">
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

    <div class="mt-4 pt-4 border-t border-[var(--surface-border)]">
      <div class="flex gap-3 justify-between">
        <div class="flex align-center items-center gap-3">
          <InputSwitch
            v-model="autoRefreshEnabled"
            id="autoRefreshEnabled"
          />
          <label
            for="autoRefreshEnabled"
            class="text-sm font-medium leading-5 text-color"
            >Refresh Every</label
          >
        </div>
        <div class="flex gap-2 items-center">
          <InputNumber
            v-model="autoRefreshEvery"
            :min="1"
            :disabled="!autoRefreshEnabled"
            :pt="{ input: { class: 'w-16' } }"
            showButtons
          />
          <Dropdown
            v-model="autoRefreshUnit"
            :options="AUTO_REFRESH_UNITS"
            optionLabel="label"
            optionValue="value"
            :disabled="!autoRefreshEnabled"
          />
        </div>
      </div>
    </div>
  </template>
</template>

<script setup>
  import { ref, defineModel, onMounted, onUnmounted, watch } from 'vue'
  import PrimeButton from '@aziontech/webkit/button'
  import Dropdown from '@aziontech/webkit/dropdown'
  import InputNumber from '@aziontech/webkit/inputnumber'
  import InputSwitch from '@aziontech/webkit/inputswitch'
  import { convertUnitToMilliseconds } from '@/helpers'
  import {
    createRelativeRange,
    createStartOfDay,
    createEndOfDay,
    createWeekRange,
    COMMON_DATE_RANGES,
    RELATIVE_UNITS,
    getCurrentMonthLabel
  } from '@utils/date.js'

  const emit = defineEmits(['select', 'open', 'close', 'autoRefresh'])

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

  const AUTO_REFRESH_UNITS = [
    { label: 'Seconds', value: 'seconds' },
    { label: 'Minutes', value: 'minutes' },
    { label: 'Hours', value: 'hours' }
  ]

  const autoRefreshEnabled = ref(false)
  const autoRefreshEvery = ref(10)
  const autoRefreshUnit = ref('seconds')

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

    const autoRefresh = model.value?.autoRefresh
    autoRefreshEnabled.value = Boolean(autoRefresh?.enabled)
    if (Number.isFinite(autoRefresh?.every) && Number(autoRefresh.every) >= 1) {
      autoRefreshEvery.value = Number(autoRefresh.every)
    }
    if (typeof autoRefresh?.unit === 'string') {
      autoRefreshUnit.value = autoRefresh.unit
    }
  }

  const syncModelQuickFromFields = () => {
    model.value = {
      ...model.value,
      quick: {
        value: quickSelectValue.value,
        unit: quickSelectUnit.value,
        direction: quickSelectDirection.value
      },
      autoRefresh: {
        enabled: autoRefreshEnabled.value,
        every: autoRefreshEvery.value,
        unit: autoRefreshUnit.value
      }
    }
  }

  const autoRefreshTimeoutId = ref(null)
  const autoRefreshInFlight = ref(false)

  const clearAutoRefreshTimer = () => {
    if (!autoRefreshTimeoutId.value) return
    clearTimeout(autoRefreshTimeoutId.value)
    autoRefreshTimeoutId.value = null
  }

  const getAutoRefreshIntervalMs = (cfg) => {
    if (!cfg?.enabled) return null

    const every = Number(cfg.every)
    if (!Number.isFinite(every) || every < 1) return null

    const unit = String(cfg.unit || '')
      .toLowerCase()
      .trim()

    return convertUnitToMilliseconds(unit, every)
  }

  const scheduleAutoRefresh = () => {
    if (props.panelOnly) return

    clearAutoRefreshTimer()

    const cfg = model.value?.autoRefresh
    const intervalMs = getAutoRefreshIntervalMs(cfg)
    if (!intervalMs) return

    autoRefreshTimeoutId.value = setTimeout(async () => {
      try {
        if (autoRefreshInFlight.value) {
          scheduleAutoRefresh()
          return
        }

        autoRefreshInFlight.value = true
        emit('autoRefresh', model.value)
      } finally {
        autoRefreshInFlight.value = false
        scheduleAutoRefresh()
      }
    }, intervalMs)
  }

  onMounted(() => {
    if (!props.panelOnly) return
    syncFieldsFromModel()
    syncModelQuickFromFields()
  })

  onMounted(() => {
    if (props.panelOnly) return
    scheduleAutoRefresh()
  })

  onUnmounted(() => {
    clearAutoRefreshTimer()
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

  watch([autoRefreshEnabled, autoRefreshEvery, autoRefreshUnit], () => {
    if (!props.panelOnly) return
    syncModelQuickFromFields()
  })

  watch(
    () => model.value?.autoRefresh,
    () => {
      scheduleAutoRefresh()
    },
    { deep: true }
  )

  const applyQuickSelect = () => {
    const now = new Date()
    const { startDate: newStartDate, endDate: newEndDate } = createRelativeRange(
      quickSelectValue.value,
      quickSelectUnit.value,
      quickSelectDirection.value,
      now
    )

    const preservedAutoRefresh = model.value?.autoRefresh

    const relativeLabel = `${quickSelectDirection.value} ${quickSelectValue.value} ${quickSelectUnit.value}`

    model.value = {
      startDate: newStartDate,
      endDate: newEndDate,
      label: relativeLabel,
      labelStart: '',
      labelEnd: '',
      quick: {
        value: quickSelectValue.value,
        unit: quickSelectUnit.value,
        direction: quickSelectDirection.value
      },
      relative: {
        direction: quickSelectDirection.value,
        value: quickSelectValue.value,
        unit: quickSelectUnit.value
      },
      autoRefresh: preservedAutoRefresh
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

    const preservedAutoRefresh = model.value?.autoRefresh

    model.value = {
      startDate: newStartDate,
      endDate: newEndDate,
      label: range.label,
      labelStart: '',
      labelEnd: '',
      autoRefresh: preservedAutoRefresh
    }

    emit('select', model.value)
    emit('close')
  }
</script>
