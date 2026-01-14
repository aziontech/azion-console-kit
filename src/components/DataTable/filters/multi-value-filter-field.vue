<script setup>
  import { ref, watch } from 'vue'
  import Chips from 'primevue/chips'

  const props = defineProps({
    modelValue: {
      type: [Array, String],
      default: () => []
    },
    placeholder: {
      type: String,
      default: 'Enter values (comma or Enter to separate)'
    },
    separator: {
      type: String,
      default: ','
    }
  })

  const emit = defineEmits(['update:modelValue'])

  const localValue = ref([])

  const initializeValue = () => {
    if (Array.isArray(props.modelValue)) {
      localValue.value = [...props.modelValue]
    } else if (typeof props.modelValue === 'string') {
      if (props.modelValue.trim()) {
        localValue.value = props.modelValue
          .split(props.separator)
          .map((item) => item.trim())
          .filter(Boolean)
      } else {
        localValue.value = []
      }
    } else {
      localValue.value = []
    }
  }

  watch(() => props.modelValue, initializeValue, { immediate: true })

  const handleUpdate = (value) => {
    const cleanedValues = (value || []).map((item) => String(item).trim()).filter(Boolean)

    localValue.value = cleanedValues
    emit('update:modelValue', cleanedValues)
  }
</script>

<template>
  <Chips
    :modelValue="localValue"
    @update:modelValue="handleUpdate"
    :placeholder="placeholder"
    separator=","
    :pt="{
      container: {
        class: 'w-full'
      }
    }"
  />
</template>
