<script setup>
  import { ref, watch, onMounted } from 'vue'
  import DataTimeRange from '@/components/base/dataTimeRange'
  import { createRelativeRange } from '@/utils/date.js'

  const props = defineProps({
    modelValue: {
      type: Object,
      default: () => ({ operator: 'range', value: null })
    },
    maxDays: {
      type: Number,
      default: 365
    }
  })

  const emit = defineEmits(['update:modelValue', 'validation'])

  const initializeDefaultRange = () => {
    const now = new Date()
    const { startDate, endDate } = createRelativeRange(5, 'minutes', 'last', now)
    return {
      startDate,
      endDate,
      label: 'Last 5 minutes'
    }
  }

  const dateRangeModel = ref(initializeDefaultRange())

  const parseRelativeFromLabel = (label) => {
    if (!label || typeof label !== 'string') return null

    const match = label.trim().match(/^(last|next)\s+(\d+)\s+([a-zA-Z]+)$/i)
    if (!match) return null

    const direction = match[1].toLowerCase()
    const value = Number(match[2])
    const unit = match[3].toLowerCase()

    if (!Number.isFinite(value) || value <= 0) return null

    return { direction, value, unit }
  }

  const formatDateToISO = (date) => {
    if (!date) return null
    if (date instanceof Date) {
      return date.toISOString()
    }
    return date
  }

  const updateModelValue = () => {
    const parsed = parseRelativeFromLabel(dateRangeModel.value.label)

    let startDate = dateRangeModel.value.startDate
    let endDate = dateRangeModel.value.endDate

    if (parsed) {
      const { startDate: calculatedStart, endDate: calculatedEnd } = createRelativeRange(
        parsed.value,
        parsed.unit,
        parsed.direction,
        new Date()
      )
      startDate = calculatedStart
      endDate = calculatedEnd
    }

    const isValid = startDate && endDate && startDate <= endDate

    if (isValid) {
      emit('update:modelValue', {
        operator: 'range',
        value: {
          start: formatDateToISO(startDate),
          end: formatDateToISO(endDate)
        },
        label: dateRangeModel.value.label || ''
      })
    } else {
      emit('update:modelValue', {
        operator: 'range',
        value: null,
        label: ''
      })
    }

    emit('validation', isValid)
  }

  const initializeFromModelValue = () => {
    if (props.modelValue?.value) {
      const { start, end } = props.modelValue.value

      if (start && end) {
        dateRangeModel.value = {
          startDate: new Date(start),
          endDate: new Date(end),
          label: props.modelValue.label || ''
        }
      }
    }
  }

  watch(
    () => props.modelValue,
    (newValue) => {
      if (newValue?.value) {
        initializeFromModelValue()
      }
    },
    { deep: true }
  )

  onMounted(() => {
    if (props.modelValue?.value) {
      initializeFromModelValue()
    } else {
      updateModelValue()
    }
  })
</script>

<template>
  <DataTimeRange
    v-model="dateRangeModel"
    :maxDays="maxDays"
    @select="updateModelValue"
  />
</template>
