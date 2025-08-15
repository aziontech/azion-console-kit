<template>
  <div class="relative">
    <div
      class="flex flex-col sm:flex-row items-center gap-1 bg-[var(--surface-300)] rounded-lg p-1 px-2.5"
    >
      <PrimeButton
        icon="pi pi-calendar"
        outlined
        size="small"
        @click="toggleAbbreviations"
      />

      <div class="flex flex-col sm:flex-row items-center gap-2 bg-[var(--surface-300)] rounded-lg">
        <div class="relative w-full sm:w-auto">
          <InputText
            :value="startDateInput"
            readonly
            @click="selectStartDate"
          />
        </div>
        <div class="flex items-center text-color-secondary text-sm">
          <i class="pi pi-arrow-right text-xs"></i>
        </div>
        <div class="relative w-full sm:w-auto">
          <InputText
            :value="endDateInput"
            readonly
            @click="selectEndDate"
          />
        </div>
      </div>
    </div>

    <OverlayPanel
      ref="abbreviationsPanel"
      :showCloseIcon="false"
      class="max-w-[500px]"
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

        <!-- Commonly Used -->
        <div class="mb-6">
          <div class="text-sm font-medium leading-5 text-color mb-3">Commonly used</div>
          <div class="flex flex-wrap">
            <PrimeButton
              v-for="range in COMMON_DATE_RANGES"
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

    <!-- Overlay Panel com o seletor de data -->
    <OverlayPanel
      ref="overlayPanel"
      class="min-w-[400px] max-w-[400px] bg-surface-card border border-surface-border shadow-lg rounded-lg"
      :showCloseIcon="false"
    >
      <!-- Tabs -->
      <div class="flex border-b border-surface-border mb-2">
        <div
          v-for="tab in TABS"
          :key="tab.key"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </div>
      </div>
      
      <!-- Absolute -->
      <div
        v-if="activeTab === 'absolute'"
        class="space-y-3"
      >
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

        <div class="flex gap-3">
          <!-- diminuir o tamanho do calendario -->
           <!-- .azion .p-datepicker table td > span tirar a margem forcadamente pt e daylabel-->
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
              daylabel: { class: '!m-0 !p-0 !text-sm' }
            }"
          />

          <!-- Seletor de horários -->
          <div class="w-48 border border-surface-border rounded-lg p-4 bg-surface-section">
            <div class="max-h-64 overflow-y-auto space-y-1">
              <button
                v-for="timeSlot in TIME_SLOTS"
                :key="timeSlot"
                :class="[
                  'w-full text-left px-3 py-2 text-sm rounded transition-colors duration-200',
                  selectedTime === timeSlot
                    ? 'bg-primary text-white'
                    : 'text-color hover:bg-surface-hover'
                ]"
                @click="
                  () => {
                    selectedTime = timeSlot
                    updateSelectedDateTime()
                  }
                "
              >
                {{ timeSlot }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab Relative -->
      <div
        v-if="activeTab === 'relative'"
        class="py-4"
      >
        <div class="flex flex-col gap-4">
          <div class="flex gap-2 items-center">
            <InputNumber
              v-model="relativeValue"
              :min="1"
            />
            <Dropdown
              v-model="relativeUnit"
              :options="RELATIVE_UNITS"
              optionLabel="label"
              optionValue="value"
            />
            <Dropdown
              v-model="relativeDirection"
              :options="RELATIVE_DIRECTIONS"
              optionLabel="label"
              optionValue="value"
            />
          </div>
          <div class="p-3 surface-100 border border-surface-border rounded-md text-sm text-color">
            {{ relativePreview }}
          </div>
        </div>
      </div>

      <!-- Tab Now -->
      <div
        v-if="activeTab === 'now'"
        class="py-4 text-center"
      >
        <div class="flex flex-col gap-4 items-center">
          <p>Use current time as end date</p>
          <PrimeButton
            label="Set to Now"
            icon="pi pi-clock"
            @click="setToNow"
          />
        </div>
      </div>

      <!-- Campo de entrada de data/hora -->
      <div class="mt-4 pt-4 border-t border-surface-border">
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium text-color">
            {{ editingField === 'start' ? 'Start date' : 'End date' }}
          </label>
          <InputText
            :value="editingField === 'start' ? startDateInput : endDateInput"
            class="w-full"
          />
        </div>
      </div>
    </OverlayPanel>
  </div>
</template>

<script setup>
  import { ref, computed, watch } from 'vue'
  import PrimeButton from 'primevue/button'
  import OverlayPanel from 'primevue/overlaypanel'
  import Calendar from 'primevue/calendar'
  import Dropdown from 'primevue/dropdown'
  import InputText from 'primevue/inputtext'
  import InputNumber from 'primevue/inputnumber'
  import {
    formatDateSimple,
    createRelativeRange,
    createStartOfDay,
    createEndOfDay,
    createWeekRange
  } from '../utils/dateUtils.js'

  // Model
  const model = defineModel({
    type: Object,
    default: () => ({
      startDate: new Date(),
      endDate: new Date()
    })
  })

  // Emits
  const emit = defineEmits(['change'])

  // Component name
  defineOptions({ name: 'AdvancedCalendar' })

  // Constants
  const TABS = [
    { key: 'absolute', label: 'Absolute' },
    { key: 'relative', label: 'Relative' },
    { key: 'now', label: 'Now' }
  ]

  const MONTHS = [
    { label: 'January', value: 0 },
    { label: 'February', value: 1 },
    { label: 'March', value: 2 },
    { label: 'April', value: 3 },
    { label: 'May', value: 4 },
    { label: 'June', value: 5 },
    { label: 'July', value: 6 },
    { label: 'August', value: 7 },
    { label: 'September', value: 8 },
    { label: 'October', value: 9 },
    { label: 'November', value: 10 },
    { label: 'December', value: 11 }
  ]

  const TIME_SLOTS = [
    '00:00',
    '00:30',
    '01:00',
    '01:30',
    '02:00',
    '02:30',
    '03:00',
    '03:30',
    '04:00',
    '04:30',
    '05:00',
    '05:30',
    '06:00',
    '06:30',
    '07:00',
    '07:30',
    '08:00',
    '08:30',
    '09:00',
    '09:30',
    '10:00',
    '10:30',
    '11:00',
    '11:30',
    '12:00',
    '12:30',
    '13:00',
    '13:30',
    '14:00',
    '14:30',
    '15:00',
    '15:30',
    '16:00',
    '16:30',
    '17:00',
    '17:30',
    '18:00',
    '18:30',
    '19:00',
    '19:30',
    '20:00',
    '20:30',
    '21:00',
    '21:30',
    '22:00',
    '22:30',
    '23:00',
    '23:30'
  ]

  const RELATIVE_UNITS = [
    { label: 'Minutes', value: 'minutes' },
    { label: 'Hours', value: 'hours' },
    { label: 'Days', value: 'days' },
    { label: 'Weeks', value: 'weeks' },
    { label: 'Months', value: 'months' },
    { label: 'Years', value: 'years' }
  ]

  const RELATIVE_DIRECTIONS = [
    { label: 'Ago', value: 'ago' },
    { label: 'From now', value: 'from now' }
  ]

  const COMMON_DATE_RANGES = [
    { label: 'Today', value: 'today' },
    { label: 'This week', value: 'this_week' },
    { label: 'Last 1 minute', value: 'last_1_minute' },
    { label: 'Last 15 minutes', value: 'last_15_minutes' },
    { label: 'Last 30 minutes', value: 'last_30_minutes' },
    { label: 'Last 1 hour', value: 'last_1_hour' },
    { label: 'Last 24 hours', value: 'last_24_hours' },
    { label: 'Last 7 days', value: 'last_7_days' },
    { label: 'Last 30 days', value: 'last_30_days' },
    { label: 'Last 90 days', value: 'last_90_days' },
    { label: 'Last 1 year', value: 'last_1_year' }
  ]

  // Refs
  const overlayPanel = ref(null)
  const abbreviationsPanel = ref(null)
  const activeTab = ref('absolute')
  const selectedDate = ref(new Date())
  const selectedTime = ref('12:00')
  const editingField = ref('start')
  const hasChanges = ref(false)

  // Estado de datas
  const startDate = ref(model.value.startDate)
  const endDate = ref(model.value.endDate)
  const selectedMonth = ref(new Date().getMonth())
  const selectedYear = ref(new Date().getFullYear())

  // Estado de datas relativas
  const relativeValue = ref(15)
  const relativeUnit = ref('minutes')
  const relativeDirection = ref('ago')

  // Estado de seleção rápida
  const quickSelectDirection = ref('last')
  const quickSelectValue = ref(15)
  const quickSelectUnit = ref('minutes')

  // Estado de histórico
  const recentlyUsed = ref([])

  // Anos (últimos 10 anos + próximos 5)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 15 }, (unused, index) => currentYear - 10 + index)

  // Computed properties
  const startDateInput = computed(() => {
    return formatDateSimple(startDate.value)
  })

  const endDateInput = computed(() => {
    return formatDateSimple(endDate.value)
  })

  const relativePreview = computed(() => {
    const now = new Date()
    const { startDate: calculatedStart, endDate: calculatedEnd } = createRelativeRange(
      relativeValue.value,
      relativeUnit.value,
      relativeDirection.value,
      now
    )

    return `${formatDateSimple(calculatedStart)} - ${formatDateSimple(calculatedEnd)}`
  })

  // Methods
  const selectStartDate = (event) => {
    editingField.value = 'start'
    overlayPanel.value.toggle(event)
  }

  const selectEndDate = (event) => {
    editingField.value = 'end'
    overlayPanel.value.toggle(event)
  }

  const toggleAbbreviations = (event) => {
    abbreviationsPanel.value.toggle(event)
  }

  const applyQuickSelect = () => {
    const now = new Date()
    const { startDate: newStartDate, endDate: newEndDate } = createRelativeRange(
      quickSelectValue.value,
      quickSelectUnit.value,
      quickSelectDirection.value,
      now
    )

    startDate.value = newStartDate
    endDate.value = newEndDate

    addToRecentlyUsed({
      label: `${quickSelectDirection.value === 'last' ? 'Last' : 'Next'} ${
        quickSelectValue.value
      } ${quickSelectUnit.value}`,
      startDate: startDate.value,
      endDate: endDate.value
    })

    hasChanges.value = true
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
          'ago',
          now
        ))
        break
      case 'last_15_minutes':
        ;({ startDate: newStartDate, endDate: newEndDate } = createRelativeRange(
          15,
          'minutes',
          'ago',
          now
        ))
        break
      case 'last_30_minutes':
        ;({ startDate: newStartDate, endDate: newEndDate } = createRelativeRange(
          30,
          'minutes',
          'ago',
          now
        ))
        break
      case 'last_1_hour':
        ;({ startDate: newStartDate, endDate: newEndDate } = createRelativeRange(
          1,
          'hours',
          'ago',
          now
        ))
        break
      case 'last_24_hours':
        ;({ startDate: newStartDate, endDate: newEndDate } = createRelativeRange(
          24,
          'hours',
          'ago',
          now
        ))
        break
      case 'last_7_days':
        ;({ startDate: newStartDate, endDate: newEndDate } = createRelativeRange(
          7,
          'days',
          'ago',
          now
        ))
        break
      case 'last_30_days':
        ;({ startDate: newStartDate, endDate: newEndDate } = createRelativeRange(
          30,
          'days',
          'ago',
          now
        ))
        break
      case 'last_90_days':
        ;({ startDate: newStartDate, endDate: newEndDate } = createRelativeRange(
          90,
          'days',
          'ago',
          now
        ))
        break
      case 'last_1_year':
        ;({ startDate: newStartDate, endDate: newEndDate } = createRelativeRange(
          365,
          'days',
          'ago',
          now
        ))
        break
      default:
        return
    }

    startDate.value = newStartDate
    endDate.value = newEndDate

    addToRecentlyUsed({
      label: range.label,
      startDate: startDate.value,
      endDate: endDate.value
    })

    hasChanges.value = true
  }

  const addToRecentlyUsed = (range) => {
    // Remove se já existe
    const index = recentlyUsed.value.findIndex((recent) => recent.label === range.label)
    if (index > -1) {
      recentlyUsed.value.splice(index, 1)
    }

    // Adiciona no início
    recentlyUsed.value.unshift(range)

    // Mantém apenas os últimos 5
    if (recentlyUsed.value.length > 5) {
      recentlyUsed.value = recentlyUsed.value.slice(0, 5)
    }
  }

  const onDateSelect = (date) => {
    selectedDate.value = date
    updateSelectedDateTime()
  }

  const onMonthChange = () => {
    const newDate = new Date(selectedYear.value, selectedMonth.value, 1)
    selectedDate.value = newDate
  }

  const onYearChange = () => {
    const newDate = new Date(selectedYear.value, selectedMonth.value, 1)
    selectedDate.value = newDate
  }

  const previousMonth = () => {
    if (selectedMonth.value === 0) {
      selectedMonth.value = 11
      selectedYear.value--
    } else {
      selectedMonth.value--
    }
    onMonthChange()
  }

  const nextMonth = () => {
    if (selectedMonth.value === 11) {
      selectedMonth.value = 0
      selectedYear.value++
    } else {
      selectedMonth.value++
    }
    onMonthChange()
  }

  const updateSelectedDateTime = () => {
    if (activeTab.value === 'absolute' && selectedDate.value && selectedTime.value) {
      const [hours, minutes] = selectedTime.value.split(':')
      const newDate = new Date(selectedDate.value)
      newDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)

      if (editingField.value === 'start') {
        startDate.value = newDate
        if (endDate.value && newDate > endDate.value) {
          endDate.value = newDate
        }
      } else {
        endDate.value = newDate
        if (startDate.value && newDate < startDate.value) {
          startDate.value = newDate
        }
      }

      hasChanges.value = true
    }
  }

  const updateRelativeRange = () => {
    if (activeTab.value === 'relative') {
      const now = new Date()
      const { startDate: newStartDate, endDate: newEndDate } = createRelativeRange(
        relativeValue.value,
        relativeUnit.value,
        relativeDirection.value,
        now
      )

      startDate.value = newStartDate
      endDate.value = newEndDate
      hasChanges.value = true
    }
  }

  const setToNow = () => {
    const now = new Date()
    if (editingField.value === 'start') {
      startDate.value = now
      if (endDate.value && now > endDate.value) {
        endDate.value = now
      }
    } else {
      endDate.value = now
      if (startDate.value && now < startDate.value) {
        startDate.value = now
      }
    }
    hasChanges.value = true
  }

  const applySelectedDateTime = () => {
    if (selectedDate.value && selectedTime.value) {
      const [hours, minutes] = selectedTime.value.split(':')
      const newDate = new Date(selectedDate.value)
      newDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)

      if (editingField.value === 'start') {
        startDate.value = newDate
        if (endDate.value && newDate > endDate.value) {
          endDate.value = newDate
        }
      } else {
        endDate.value = newDate
        if (startDate.value && newDate < startDate.value) {
          startDate.value = newDate
        }
      }

      hasChanges.value = true

      // Fecha o overlay após aplicar
      overlayPanel.value.hide()
    }
  }

  const updateRange = () => {
    addToRecentlyUsed({
      label: `${formatDateSimple(startDate.value)} → ${formatDateSimple(endDate.value)}`,
      startDate: startDate.value,
      endDate: endDate.value
    })

    model.value = {
      startDate: startDate.value,
      endDate: endDate.value
    }
    emit('change', {
      startDate: startDate.value,
      endDate: endDate.value
    })
    hasChanges.value = false
  }

  // Watchers
  watch(selectedTime, updateSelectedDateTime)
  watch(activeTab, (newTab) => {
    if (newTab === 'relative') {
      updateRelativeRange()
    } else if (newTab === 'now') {
      setToNow()
    }
  })

  watch([relativeValue, relativeUnit, relativeDirection], updateRelativeRange)

  // Inicialização
  if (model.value.startDate) {
    startDate.value = new Date(model.value.startDate)
  }
  if (model.value.endDate) {
    endDate.value = new Date(model.value.endDate)
  }
</script>
