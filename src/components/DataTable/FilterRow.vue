<script setup>
  import { ref, computed, watch } from 'vue'
  import Dropdown from 'primevue/dropdown'
  import PrimeButton from 'primevue/button'
  import { filterBuilder } from './filters/filter-builder'

  const props = defineProps({
    filter: {
      type: Object,
      required: true
    },
    index: {
      type: Number,
      required: true
    },
    filterOptions: {
      type: Array,
      required: true
    },
    isEditing: {
      type: Boolean,
      default: false
    }
  })

  const emit = defineEmits(['change', 'remove'])

  const localField = ref(props.filter.field)
  const localValue = ref(props.filter.value)
  const isEmailValid = ref(true)

  watch(
    () => props.filter,
    (newFilter) => {
      if (!props.isEditing) {
        localField.value = newFilter.field
        localValue.value = newFilter.value
      }
    },
    { deep: true }
  )

  const filterComponent = computed(() => {
    if (!localField.value) return null

    const selectedOption = props.filterOptions.find((opt) => opt.value === localField.value)

    return filterBuilder({
      filterKey: localField.value,
      filterHeader: selectedOption?.label,
      filterValue: localValue.value,
      multiValue: selectedOption?.multiValue,
      onUpdate: (value) => {
        localValue.value = value
        emitChange()
      },
      onValidation: (isValid) => {
        isEmailValid.value = isValid
        emitChange()
      }
    })
  })

  const handleFieldChange = () => {
    localValue.value = ''
    isEmailValid.value = true
    emitChange()
  }

  const emitChange = () => {
    const selectedOption = props.filterOptions.find((opt) => opt.value === localField.value)
    emit('change', {
      index: props.index,
      field: localField.value,
      label: selectedOption?.label || localField.value,
      value: localValue.value,
      isValid: isEmailValid.value
    })
  }

  watch([localField, localValue], () => {
    emitChange()
  })

  const handleRemove = () => {
    emit('remove', props.index)
  }
</script>

<template>
  <div class="flex items-center gap-2">
    <PrimeButton
      icon="pi pi-times"
      :text="true"
      size="small"
      @click="handleRemove()"
    />

    <span
      class="flex items-center bg-[#292929] border border-[#282828] rounded-[6px] max-h-[34px] px-2 py-2"
    >
      {{ index === 0 ? 'where' : 'and' }}
    </span>

    <Dropdown
      v-model="localField"
      :options="filterOptions"
      optionLabel="label"
      optionValue="value"
      optionDisabled="disabled"
      placeholder="field"
      size="small"
      @change="handleFieldChange"
    />

    <component
      class="w-full"
      :is="filterComponent"
    />
  </div>
</template>
