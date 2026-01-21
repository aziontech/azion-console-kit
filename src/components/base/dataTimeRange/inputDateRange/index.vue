<script setup>
  import { ref, computed, defineModel, watch } from 'vue'
  import PrimeButton from 'primevue/button'
  import Calendar from 'primevue/calendar'
  import Dropdown from 'primevue/dropdown'
  import InputText from 'primevue/inputtext'
  import InputNumber from 'primevue/inputnumber'
  import {
    formatDateSimple,
    parseDateSimple,
    createRelativeRange,
    COMMON_DATE_RANGES,
    MONTHS,
    RELATIVE_UNITS,
    RELATIVE_DIRECTIONS,
    TIME_SLOTS,
    getCurrentHourAndMinute
  } from '@utils/date.js'

  defineOptions({ name: 'InputDateRange' })

  const emit = defineEmits(['select', 'open', 'close'])

  const props = defineProps({
    maxDays: {
      type: Number,
      default: 0
    },
    panelOnly: {
      type: Boolean,
      default: false
    },
    mode: {
      type: String,
      default: 'absolute'
    },
    isActive: {
      type: Boolean,
      default: false
    },
    editingField: {
      type: String,
      default: 'start'
    }
  })

  const model = defineModel({
    type: Object,
    default: () => ({})
  })

  // Refs
  const selectedDate = ref(new Date())
  const selectedTime = ref('')
  const hasChanges = ref(false)
  const tempInputValue = ref('')

  const inputValue = computed({
    get: () => {
      return hasChanges.value
        ? tempInputValue.value
        : props.editingField === 'start'
          ? formatDateSimple(model.value.startDate)
          : formatDateSimple(model.value.endDate)
    },
    set: (value) => {
      model.value.label = ''
      tempInputValue.value = value
      hasChanges.value = true
    }
  })

  const selectedMonth = ref(new Date().getMonth())
  const selectedYear = ref(new Date().getFullYear())

  const relativeValue = ref(5)
  const relativeUnit = ref('minutes')
  const relativeDirection = ref('last')

  const lastRelativeRequestKey = ref('')
  const isSyncingRelativeFromModel = ref(false)

  const parseRelativeFromLabel = (label) => {
    if (!label || typeof label !== 'string') return null
    const match = label.trim().match(/^(last|next)\s+(\d+)\s+([a-zA-Z]+)$/i)
    if (!match) return null
    return {
      direction: match[1].toLowerCase(),
      value: Number(match[2]),
      unit: match[3].toLowerCase()
    }
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 20 }, (unused, index) => currentYear - 10 + index)

  const startDateInput = computed(() => {
    return formatDateSimple(model.value.startDate)
  })

  const endDateInput = computed(() => {
    return formatDateSimple(model.value.endDate)
  })

  const isInvalidRange = computed(() => {
    const start = model.value?.startDate
    const end = model.value?.endDate
    if (!start || !end) return false
    return new Date(start).getTime() > new Date(end).getTime()
  })

  const emitSelectIfValid = () => {
    if (isInvalidRange.value) return
    emit('select', model.value)
  }

  const openStart = (event) => {
    selectedTime.value = ''
    hasChanges.value = false
    emit('open', { event, field: 'start' })
  }

  const openEnd = (event) => {
    selectedTime.value = ''
    hasChanges.value = false
    emit('open', { event, field: 'end' })
  }

  const onDateSelect = (date) => {
    model.value.label = ''
    selectedDate.value = date
    updateSelectedDateTime()
    hasChanges.value = false
    emitSelectIfValid()
  }

  const onMonthChange = () => {
    model.value.label = ''
    const newDate = new Date(selectedYear.value, selectedMonth.value, 1)
    selectedDate.value = newDate
    updateSelectedDateTime()
    hasChanges.value = false
    emitSelectIfValid()
  }

  const onYearChange = () => {
    model.value.label = ''
    const newDate = new Date(selectedYear.value, selectedMonth.value, 1)
    selectedDate.value = newDate
    updateSelectedDateTime()
    hasChanges.value = false
    emitSelectIfValid()
  }

  const previousMonth = () => {
    model.value.label = ''
    if (selectedMonth.value === 0) {
      selectedMonth.value = 11
      selectedYear.value--
    } else {
      selectedMonth.value--
    }
    onMonthChange()
    hasChanges.value = false
    emitSelectIfValid()
  }

  const nextMonth = () => {
    model.value.label = ''
    if (selectedMonth.value === 11) {
      selectedMonth.value = 0
      selectedYear.value++
    } else {
      selectedMonth.value++
    }
    onMonthChange()
    emitSelectIfValid()
  }

  const selectTime = (time) => {
    model.value.label = ''
    selectedTime.value = time
    updateSelectedDateTime()
    hasChanges.value = false
    emitSelectIfValid()
  }

  const updateSelectedDateTime = () => {
    const time = selectedTime.value || getCurrentHourAndMinute()
    if (props.mode === 'absolute' && selectedDate.value && time) {
      const [hours, minutes] = time.split(':')
      const newDate = new Date(selectedDate.value)
      newDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)

      if (props.editingField === 'start') {
        model.value.startDate = newDate
        // if (model.value.endDate && newDate > model.value.endDate) {
        //   model.value.endDate = newDate
        // }
      } else {
        model.value.endDate = newDate
        // if (model.value.startDate && newDate < model.value.startDate) {
        //   model.value.startDate = newDate
        // }
      }

      hasChanges.value = false
      tempInputValue.value = ''
    }
  }

  const updateRelativeRange = () => {
    if (props.mode === 'relative') {
      const now = new Date()
      const { startDate: newStartDate, endDate: newEndDate } = createRelativeRange(
        relativeValue.value,
        relativeUnit.value,
        relativeDirection.value,
        now
      )

      const calculatedDate = relativeDirection.value === 'last' ? newStartDate : newEndDate

      model.value.relative = {
        direction: relativeDirection.value,
        value: relativeValue.value,
        unit: relativeUnit.value,
        preset: model.value?.relative?.preset
      }

      model.value.label = `${relativeDirection.value} ${relativeValue.value} ${relativeUnit.value}`

      // Apply relative calculation only to the active input (start/end)
      if (props.editingField === 'start') {
        model.value.startDate = calculatedDate
      } else {
        model.value.endDate = calculatedDate
      }

      hasChanges.value = false
      tempInputValue.value = ''
      emitSelectIfValid()
    }
  }

  watch(
    () => props.isActive,
    (isActive) => {
      if (props.mode !== 'relative') return

      if (!isActive) {
        lastRelativeRequestKey.value = ''
        return
      }

      const fromModel = model.value?.relative
      const fromLabel = parseRelativeFromLabel(model.value?.label)
      const source =
        fromModel?.value && fromModel?.unit && fromModel?.direction ? fromModel : fromLabel

      if (!source) return

      isSyncingRelativeFromModel.value = true
      relativeDirection.value = source.direction
      relativeValue.value = source.value
      relativeUnit.value = source.unit
      isSyncingRelativeFromModel.value = false

      const requestKey = `${props.editingField}|${relativeDirection.value}|${relativeValue.value}|${relativeUnit.value}`
      if (lastRelativeRequestKey.value !== requestKey) {
        lastRelativeRequestKey.value = requestKey
        updateRelativeRange()
      }
    },
    { immediate: true }
  )

  watch(
    () => [relativeDirection.value, relativeValue.value, relativeUnit.value],
    () => {
      if (isSyncingRelativeFromModel.value) return
      if (props.mode !== 'relative') return
      lastRelativeRequestKey.value = `${props.editingField}|${relativeDirection.value}|${relativeValue.value}|${relativeUnit.value}`
    }
  )

  const resetToLastFiveMinutes = () => {
    const now = new Date()
    const { startDate: newStartDate, endDate: newEndDate } = createRelativeRange(
      5,
      'minutes',
      'last',
      now
    )

    relativeValue.value = 5
    relativeUnit.value = 'minutes'
    relativeDirection.value = 'last'

    selectedTime.value = ''
    hasChanges.value = false
    tempInputValue.value = ''

    model.value = {
      startDate: newStartDate,
      endDate: newEndDate,
      label: COMMON_DATE_RANGES.last_5_minutes.label,
      relative: {
        direction: 'last',
        value: 5,
        unit: 'minutes',
        preset: 'last_5_minutes'
      }
    }

    emitSelectIfValid()
    emit('close')
  }

  const setToNow = () => {
    const now = new Date()
    if (props.editingField === 'start') {
      model.value.startDate = now
      if (model.value.endDate && now > model.value.endDate) {
        model.value.endDate = now
      }
    } else {
      model.value.endDate = now
      if (model.value.startDate && now < model.value.startDate) {
        model.value.startDate = now
      }
    }
    hasChanges.value = false
    tempInputValue.value = ''
    model.value.label = ''
    emitSelectIfValid()
  }

  const updateRange = () => {
    const parsedDate = parseDateSimple(tempInputValue.value)

    if (parsedDate) {
      if (props.editingField === 'start') {
        model.value.startDate = parsedDate
        // Ensure end date is not before start date
        if (model.value.endDate && parsedDate > model.value.endDate) {
          model.value.endDate = parsedDate
        }
      } else {
        model.value.endDate = parsedDate
        // Ensure start date is not after end date
        if (model.value.startDate && parsedDate < model.value.startDate) {
          model.value.startDate = parsedDate
        }
      }
    }

    hasChanges.value = false
    tempInputValue.value = ''
    model.value.label = ''
    emitSelectIfValid()
  }

  if (model.value.startDate) {
    model.value.startDate = new Date(model.value.startDate)
  }
  if (model.value.endDate) {
    model.value.endDate = new Date(model.value.endDate)
  }

  defineExpose({})
</script>
<template>
  <template v-if="!panelOnly">
    <template v-if="!model.label">
      <div
        class="flex flex-col sm:flex-row items-center gap-2 bg-[var(--surface-300)] rounded-lg rounded-l-none max-md:w-full"
      >
        <InputText
          class="w-min cursor-pointer border border-transparent hover:border-[var(--surface-border)] focus:border-[var(--surface-border)] focus:outline-none ml-0.5"
          :class="isInvalidRange ? 'p-invalid text-red-500' : ''"
          :value="startDateInput"
          readonly
          @click="openStart"
        />
        <div class="flex items-center text-color-secondary text-sm">
          <i class="pi text-xs pi-arrow-right hidden sm:inline"></i>
          <i class="pi text-xs pi-arrow-down inline sm:hidden"></i>
        </div>
        <InputText
          class="w-min cursor-pointer border border-transparent hover:border-[var(--surface-border)] focus:border-[var(--surface-border)] focus:outline-none"
          :class="isInvalidRange ? 'p-invalid text-red-500' : ''"
          :value="endDateInput"
          readonly
          @click="openEnd"
        />
      </div>
    </template>

    <InputText
      v-else
      :value="model.label"
      class="cursor-pointer border border-transparent hover:border-[var(--surface-border)] focus:border-[var(--surface-border)] focus:outline-none"
      :class="isInvalidRange ? 'p-invalid text-red-500' : ''"
      @click="openStart"
      readonly
    />
  </template>

  <template v-else>
    <template v-if="mode === 'absolute'">
      <div class="flex justify-center">
        <div class="flex items-center gap-3">
          <PrimeButton
            icon="pi pi-chevron-left"
            size="small"
            outlined
            @click="previousMonth"
          />
          <div class="flex items-center gap-2">
            <Dropdown
              v-model="selectedMonth"
              :options="MONTHS"
              optionLabel="label"
              optionValue="value"
              class="min-w-[120px]"
              @change="onMonthChange"
            />
            <Dropdown
              v-model="selectedYear"
              :options="years"
              class="min-w-[100px]"
              @change="onYearChange"
            />
          </div>
          <PrimeButton
            icon="pi pi-chevron-right"
            size="small"
            outlined
            @click="nextMonth"
          />
        </div>
      </div>

      <div class="flex gap-3 mt-2">
        <Calendar
          v-model="selectedDate"
          :inline="true"
          :showIcon="false"
          :showButtonBar="false"
          :showWeek="false"
          :dateFormat="'dd/mm/yy'"
          class="w-full"
          @date-select="onDateSelect"
          :pt="{
            header: { class: 'hidden' },
            table: { class: 'w-full' },
            daylabel: {
              style: {
                padding: '0px !important',
                margin: '0px !important',
                fontSize: '0.875rem'
              }
            }
          }"
        />

        <!-- Time selector -->
        <div class="border surface-border rounded-lg p-1 w-min">
          <div class="max-h-64 overflow-y-auto overflow-x-hidden space-y-1">
            <PrimeButton
              :label="timeSlot"
              v-for="timeSlot in TIME_SLOTS"
              :key="timeSlot"
              class="m-1"
              severity="secondary"
              size="small"
              :outlined="selectedTime !== timeSlot"
              @click="selectTime(timeSlot)"
              :pt="{
                label: { class: 'text-xs font-normal' }
              }"
            />
          </div>
        </div>
      </div>
    </template>
    <template v-else>
      <div class="flex flex-col gap-4">
        <InputNumber
          v-model="relativeValue"
          @update:modelValue="updateRelativeRange"
          @value-change="updateRelativeRange"
          :min="1"
          showButtons
        />
        <Dropdown
          v-model="relativeUnit"
          :options="RELATIVE_UNITS"
          optionLabel="label"
          optionValue="value"
          @update:modelValue="updateRelativeRange"
        />
        <Dropdown
          v-model="relativeDirection"
          :options="RELATIVE_DIRECTIONS"
          @update:modelValue="updateRelativeRange"
          optionLabel="label"
          optionValue="value"
          disabled
        />
      </div>
    </template>

    <div class="mt-4 pt-4 border-t surface-border">
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium text-color">
          {{ props.editingField === 'start' ? 'Start date' : 'End date' }}
        </label>
        <div class="flex items-center gap-2">
          <InputText
            v-model="inputValue"
            :placeholder="props.editingField === 'start' ? startDateInput : endDateInput"
            class="w-full"
            :readonly="mode !== 'absolute'"
            @keydown.enter="updateRange"
          />
          <template v-if="mode === 'absolute'">
            <PrimeButton
              label="Clear"
              size="small"
              outlined
              class="w-20"
              severity="secondary"
              @click="resetToLastFiveMinutes"
            />
            <PrimeButton
              v-if="hasChanges"
              icon="pi pi-check"
              size="small"
              outlined
              @click="updateRange"
            />
            <PrimeButton
              v-else
              label="Set today"
              class="min-w-max"
              size="small"
              outlined
              @click="setToNow"
            />
          </template>
        </div>
      </div>
    </div>
  </template>
</template>
