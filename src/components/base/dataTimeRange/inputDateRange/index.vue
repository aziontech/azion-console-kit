<template>
  <template v-if="!model.label">
    <div
      class="flex flex-col sm:flex-row items-center gap-2 bg-[var(--surface-300)] rounded-lg rounded-l-none max-md:w-full"
    >
      <InputText
        class="w-min cursor-pointer"
        :value="startDateInput"
        readonly
        @click="selectStartDate"
      />
      <div class="flex items-center text-color-secondary text-sm">
        <i class="pi text-xs pi-arrow-right hidden sm:inline"></i>
        <i class="pi text-xs pi-arrow-down inline sm:hidden"></i>
      </div>
      <InputText
        class="w-min cursor-pointer"
        :value="endDateInput"
        readonly
        @click="selectEndDate"
      />
    </div>
  </template>

  <InputText
    v-else
    :value="model.label"
    class="cursor-pointer"
    @click="selectStartDate"
    readonly
  />

  <OverlayPanel
    ref="overlayPanel"
    class="min-w-[200px] max-w-[400px]"
    :showCloseIcon="false"
    :pt="{
      content: { class: 'p-2' }
    }"
  >
    <TabView
      v-model:activeIndex="activeTab"
      :pt="{
        navcontent: { class: 'mb-2 pb-1 border-b surface-border' }
      }"
    >
      <TabPanel header="Absolute">
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
        <div class="flex justify-end mt-2">
          <PrimeButton
            label="Clear"
            icon="pi pi-times"
            size="small"
            outlined
            class="w-20"
            severity="secondary"
            @click="resetToLastFiveMinutes"
          />
        </div>
      </TabPanel>
      <TabPanel header="Relative">
        <div class="flex flex-col gap-4">
          <InputNumber
            v-model="relativeValue"
            @input="updateRelativeRange"
            :min="1"
            showButtons
          />
          <Dropdown
            v-model="relativeUnit"
            :options="RELATIVE_UNITS"
            optionLabel="label"
            optionValue="value"
            @change="updateRelativeRange"
          />
          <Dropdown
            v-model="relativeDirection"
            :options="RELATIVE_DIRECTIONS"
            @change="updateRelativeRange"
            optionLabel="label"
            optionValue="value"
            disabled
          />
        </div>
      </TabPanel>
    </TabView>

    <div
      class="mt-4 pt-4 border-t surface-border"
      v-if="activeTab !== 2"
    >
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium text-color">
          {{ editingField === 'start' ? 'Start date' : 'End date' }}
        </label>
        <div class="flex items-center gap-2">
          <InputText
            v-model="inputValue"
            :placeholder="editingField === 'start' ? startDateInput : endDateInput"
            class="w-full"
            :readonly="activeTab !== 0"
            @keydown.enter="updateRange"
          />
          <template v-if="activeTab === 0">
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
  </OverlayPanel>
</template>

<script setup>
  import { ref, computed, defineModel, onMounted } from 'vue'
  import PrimeButton from 'primevue/button'
  import OverlayPanel from 'primevue/overlaypanel'
  import TabView from 'primevue/tabview'
  import TabPanel from 'primevue/tabpanel'
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
    getCurrentMonthLabel,
    getCurrentHourAndMinute
  } from '@utils/date.js'

  defineOptions({ name: 'InputDateRange' })

  const emit = defineEmits(['select'])

  defineProps({
    maxDays: {
      type: Number,
      default: 0
    }
  })

  const model = defineModel({
    type: Object,
    default: () => ({})
  })

  // Refs
  const overlayPanel = ref(null)
  const activeTab = ref(0)
  const selectedDate = ref(new Date())
  const selectedTime = ref('')
  const editingField = ref('start')
  const hasChanges = ref(false)
  const tempInputValue = ref('')

  const inputValue = computed({
    get: () => {
      return hasChanges.value
        ? tempInputValue.value
        : editingField.value === 'start'
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
  const relativeDirection = ref(getCurrentMonthLabel().toLowerCase())

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 20 }, (unused, index) => currentYear - 10 + index)

  const startDateInput = computed(() => {
    return formatDateSimple(model.value.startDate)
  })

  const endDateInput = computed(() => {
    return formatDateSimple(model.value.endDate)
  })

  const selectStartDate = (event) => {
    activeTab.value = 0
    editingField.value = 'start'
    selectedTime.value = ''
    hasChanges.value = false
    overlayPanel.value.toggle(event)
    selectedDate.value = new Date(model.value.startDate)
  }

  const selectEndDate = (event) => {
    activeTab.value = 0
    editingField.value = 'end'
    selectedTime.value = ''
    hasChanges.value = false
    selectedDate.value = new Date(model.value.endDate)
    overlayPanel.value.toggle(event)
  }

  const onDateSelect = (date) => {
    model.value.label = ''
    selectedDate.value = date
    updateSelectedDateTime()
    hasChanges.value = false
    emit('select', model.value)
  }

  const onMonthChange = () => {
    model.value.label = ''
    const newDate = new Date(selectedYear.value, selectedMonth.value, 1)
    selectedDate.value = newDate
    updateSelectedDateTime()
    hasChanges.value = false
    emit('select', model.value)
  }

  const onYearChange = () => {
    model.value.label = ''
    const newDate = new Date(selectedYear.value, selectedMonth.value, 1)
    selectedDate.value = newDate
    updateSelectedDateTime()
    hasChanges.value = false
    emit('select', model.value)
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
    emit('select', model.value)
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
    emit('select', model.value)
  }

  const selectTime = (time) => {
    model.value.label = ''
    selectedTime.value = time
    updateSelectedDateTime()
    hasChanges.value = false
    emit('select', model.value)
  }

  const updateSelectedDateTime = () => {
    const time = selectedTime.value || getCurrentHourAndMinute()
    if (activeTab.value === 0 && selectedDate.value && time) {
      const [hours, minutes] = time.split(':')
      const newDate = new Date(selectedDate.value)
      newDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)

      if (editingField.value === 'start') {
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
    if (activeTab.value === 1) {
      const now = new Date()
      const { startDate: newStartDate, endDate: newEndDate } = createRelativeRange(
        relativeValue.value,
        relativeUnit.value,
        relativeDirection.value,
        now
      )

      model.value.startDate = newStartDate
      model.value.endDate = newEndDate

      hasChanges.value = false
      tempInputValue.value = ''
      model.value.label = ''
      emit('select', model.value)
    }
  }

  const resetToLastFiveMinutes = () => {
    const now = new Date()
    const { startDate: newStartDate, endDate: newEndDate } = createRelativeRange(
      5,
      'minutes',
      'last',
      now
    )

    activeTab.value = 1
    relativeValue.value = 5
    relativeUnit.value = 'minutes'
    relativeDirection.value = getCurrentMonthLabel().toLowerCase()

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

    emit('select', model.value)
    overlayPanel.value?.hide?.()
  }

  const setToNow = () => {
    const now = new Date()
    if (editingField.value === 'start') {
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
    emit('select', model.value)
  }

  const updateRange = () => {
    const parsedDate = parseDateSimple(tempInputValue.value)

    if (parsedDate) {
      if (editingField.value === 'start') {
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
    emit('select', model.value)
  }

  if (model.value.startDate) {
    model.value.startDate = new Date(model.value.startDate)
  }
  if (model.value.endDate) {
    model.value.endDate = new Date(model.value.endDate)
  }

  onMounted(() => {
    if (activeTab.value === 1) {
      updateRelativeRange()
    }
  })

  defineExpose({
    selectStartDate,
    selectEndDate
  })
</script>
