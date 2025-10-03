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
        <AbsoluteTab
          :selected-date="selectedDate"
          :selected-time="selectedTime"
          :selected-month="selectedMonth"
          :selected-year="selectedYear"
          :years="years"
          @previous-month="previousMonth"
          @next-month="nextMonth"
          @month-change="onMonthChange"
          @year-change="onYearChange"
          @date-select="onDateSelect"
          @time-select="selectTime"
        />
      </TabPanel>
      <TabPanel header="Relative">
        <RelativeTab
          :relative-value="relativeValue"
          :relative-unit="relativeUnit"
          :max-days="maxDays"
          @value-change="onRelativeValueChange"
          @unit-change="onRelativeUnitChange"
        />
      </TabPanel>
    </TabView>

    <DateInputSection
      :active-tab="activeTab"
      :editing-field="editingField"
      :input-value="inputValue"
      :start-date-input="startDateInput"
      :end-date-input="endDateInput"
      @input-change="onInputValueChange"
      @update-range="updateRange"
      @set-to-now="setToNow"
    />
  </OverlayPanel>
</template>

<script setup>
  import { ref, computed, defineModel, onMounted, watch } from 'vue'
  import OverlayPanel from 'primevue/overlaypanel'
  import TabView from 'primevue/tabview'
  import TabPanel from 'primevue/tabpanel'
  import InputText from 'primevue/inputtext'
  import {
    formatDateSimple,
    parseDateSimple,
    createRelativeRange,
    getCurrentHourAndMinute
  } from '@utils/date.js'
  import AbsoluteTab from './components/AbsoluteTab.vue'
  import RelativeTab from './components/RelativeTab.vue'
  import DateInputSection from './components/DateInputSection.vue'

  defineOptions({ name: 'InputDateRange' })

  const props = defineProps({
    maxDays: {
      type: Number,
      default: 0
    }
  })

  const emit = defineEmits(['select'])

  const model = defineModel({
    type: Object,
    default: () => ({})
  })

  const overlayPanel = ref(null)
  const activeTab = ref(0)
  const selectedDate = ref(new Date())
  const selectedTime = ref('')
  const editingField = ref('start')
  const inputValue = ref('')
  const validationInfo = ref({
    isValid: true,
    hasError: false,
    errors: [],
    errorTypes: [],
    hasDateOrderError: false,
    hasFutureDateError: false,
    hasMaxDaysError: false,
    errorMessage: '',
    details: {
      startDate: null,
      endDate: null,
      today: new Date(),
      diffDays: 0,
      maxDays: 0
    }
  })

  const selectedMonth = ref(new Date().getMonth())
  const selectedYear = ref(new Date().getFullYear())
  const relativeValue = ref(15)
  const relativeUnit = ref('minutes')
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 20 }, (unused, index) => currentYear - 10 + index)

  const startDateInput = computed(() => {
    return formatDateSimple(model.value.startDate)
  })

  const endDateInput = computed(() => {
    return formatDateSimple(model.value.endDate)
  })

  const validateDates = () => {
    const errorList = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Reset validation info
    validationInfo.value = {
      isValid: true,
      hasError: false,
      errors: [],
      errorTypes: [],
      hasDateOrderError: false,
      hasFutureDateError: false,
      hasMaxDaysError: false,
      errorMessage: '',
      details: {
        startDate: model.value.startDate,
        endDate: model.value.endDate,
        today: today,
        diffDays: 0,
        maxDays: props.maxDays
      }
    }

    if (!model.value.startDate || !model.value.endDate) {
      return errorList
    }

    // Calculate difference in days
    const diffTime = Math.abs(model.value.endDate.getTime() - model.value.startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    validationInfo.value.details.diffDays = diffDays

    // Check if start date is greater than end date (full timestamp comparison)
    if (model.value.startDate.getTime() > model.value.endDate.getTime()) {
      const error = {
        type: 'date_order',
        message: 'Start date must be before end date'
      }
      errorList.push(error)
      validationInfo.value.hasDateOrderError = true
      validationInfo.value.errorTypes.push('date_order')
    }

    // Check if any date is in the future (date-only comparison, ignoring time)
    const startDateOnly = new Date(model.value.startDate)
    startDateOnly.setHours(0, 0, 0, 0)
    const endDateOnly = new Date(model.value.endDate)
    endDateOnly.setHours(0, 0, 0, 0)

    if (startDateOnly.getTime() > today.getTime()) {
      const error = {
        type: 'future_date_start',
        message: 'Start date cannot be in the future'
      }
      errorList.push(error)
      validationInfo.value.hasFutureDateError = true
      validationInfo.value.errorTypes.push('future_date_start')
    }

    if (endDateOnly.getTime() > today.getTime()) {
      const error = {
        type: 'future_date_end',
        message: 'End date cannot be in the future'
      }
      errorList.push(error)
      validationInfo.value.hasFutureDateError = true
      validationInfo.value.errorTypes.push('future_date_end')
    }

    // Check if it exceeds the day limit (if specified)
    if (props.maxDays > 0 && diffDays > props.maxDays) {
      const error = {
        type: 'max_days',
        message: `Period cannot exceed ${props.maxDays} days (current: ${diffDays} days)`
      }
      errorList.push(error)
      validationInfo.value.hasMaxDaysError = true
      validationInfo.value.errorTypes.push('max_days')
    }

    // Update general information
    validationInfo.value.errors = errorList
    validationInfo.value.hasError = errorList.length > 0
    validationInfo.value.isValid = errorList.length === 0
    validationInfo.value.errorMessage = errorList.length > 0 ? errorList[0].message : ''

    return errorList
  }

  const selectStartDate = (event) => {
    activeTab.value = 0
    editingField.value = 'start'
    selectedTime.value = ''
    inputValue.value = formatDateSimple(model.value.startDate)
    overlayPanel.value.toggle(event)
    selectedDate.value = new Date(model.value.startDate)
  }

  const selectEndDate = (event) => {
    activeTab.value = 0
    editingField.value = 'end'
    selectedTime.value = ''
    inputValue.value = formatDateSimple(model.value.endDate)
    selectedDate.value = new Date(model.value.endDate)
    overlayPanel.value.toggle(event)
  }

  const onDateSelect = (date) => {
    model.value.label = ''
    selectedDate.value = date
    updateSelectedDateTime()
  }

  const onMonthChange = (month) => {
    model.value.label = ''
    selectedMonth.value = month
    const newDate = new Date(selectedYear.value, month, 1)
    selectedDate.value = newDate
    updateSelectedDateTime()
  }

  const onYearChange = (year) => {
    model.value.label = ''
    selectedYear.value = year
    const newDate = new Date(year, selectedMonth.value, 1)
    selectedDate.value = newDate
    updateSelectedDateTime()
  }

  const previousMonth = () => {
    model.value.label = ''
    if (selectedMonth.value === 0) {
      selectedMonth.value = 11
      selectedYear.value--
    } else {
      selectedMonth.value--
    }
    onMonthChange(selectedMonth.value)
  }

  const nextMonth = () => {
    model.value.label = ''
    if (selectedMonth.value === 11) {
      selectedMonth.value = 0
      selectedYear.value++
    } else {
      selectedMonth.value++
    }
    onMonthChange(selectedMonth.value)
  }

  const selectTime = (time) => {
    model.value.label = ''
    selectedTime.value = time
    updateSelectedDateTime()
  }

  const updateSelectedDateTime = () => {
    const time = selectedTime.value || getCurrentHourAndMinute()
    if (activeTab.value === 0 && selectedDate.value && time) {
      const [hours, minutes] = time.split(':')
      const newDate = new Date(selectedDate.value)
      newDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)

      if (editingField.value === 'start') {
        model.value.startDate = newDate
      } else {
        model.value.endDate = newDate
      }

      inputValue.value = formatDateSimple(newDate)
      emit('select', model.value)
    }
  }

  const updateRelativeRange = () => {
    if (activeTab.value === 1) {
      const now = new Date()
      const { startDate: newStartDate, endDate: newEndDate } = createRelativeRange(
        relativeValue.value,
        relativeUnit.value,
        now
      )

      model.value.startDate = newStartDate
      model.value.endDate = newEndDate
      model.value.label = ''
      emit('select', model.value)
    }
  }

  const setToNow = () => {
    const now = new Date()
    if (editingField.value === 'start') {
      model.value.startDate = now
      if (model.value.endDate && now.getTime() > model.value.endDate.getTime()) {
        model.value.endDate = now
      }
    } else {
      model.value.endDate = now
      if (model.value.startDate && now.getTime() < model.value.startDate.getTime()) {
        model.value.startDate = now
      }
    }
    inputValue.value = formatDateSimple(now)
    model.value.label = ''
    emit('select', model.value)
  }

  const updateRange = () => {
    const parsedDate = parseDateSimple(inputValue.value)

    if (parsedDate) {
      if (editingField.value === 'start') {
        model.value.startDate = parsedDate
        if (model.value.endDate && parsedDate.getTime() > model.value.endDate.getTime()) {
          model.value.endDate = parsedDate
        }
      } else {
        model.value.endDate = parsedDate
        if (model.value.startDate && parsedDate.getTime() < model.value.startDate.getTime()) {
          model.value.startDate = parsedDate
        }
      }
    }

    model.value.label = ''
    emit('select', model.value)
  }

  const onInputValueChange = (value) => {
    inputValue.value = value
  }

  const onRelativeValueChange = (value) => {
    relativeValue.value = value
    updateRelativeRange()
  }

  const onRelativeUnitChange = (value) => {
    relativeUnit.value = value
    updateRelativeRange()
  }

  watch(
    [() => model.value.startDate, () => model.value.endDate, () => props.maxDays],
    () => {
      validateDates()
    },
    { immediate: true }
  )

  // Initialization
  if (model.value.startDate) {
    model.value.startDate = new Date(model.value.startDate)
  }
  if (model.value.endDate) {
    model.value.endDate = new Date(model.value.endDate)
  }

  onMounted(() => {
    updateRelativeRange()
  })
</script>
