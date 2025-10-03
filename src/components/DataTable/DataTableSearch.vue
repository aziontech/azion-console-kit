<template>
  <span
    class="flex flex-row p-input-icon-left items-center max-sm:w-full"
    data-testid="data-table-search"
  >
    <i class="pi pi-search" />
    <InputText
      class="h-8 w-full md:min-w-[20rem]"
      :modelValue="modelValue"
      @update:modelValue="handleInput"
      data-testid="data-table-search-input"
      :placeholder="placeholder"
      @keyup.enter="handleEnter"
    />
    <div
      v-if="hasSlot"
      class="ml-3"
    >
      <slot />
    </div>
  </span>
</template>

<script setup>
  import { useSlots } from 'vue'
  import InputText from 'primevue/inputtext'

  const props = defineProps({
    modelValue: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: 'Search'
    },
    debounce: {
      type: Number,
      default: 0
    }
  })

  const emit = defineEmits(['update:modelValue', 'search', 'input'])

  const slots = useSlots()
  const hasSlot = !!slots.default

  let debounceTimer = null

  const handleInput = (value) => {
    emit('update:modelValue', value)
    emit('input', value)

    if (props.debounce > 0) {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        emit('search', value)
      }, props.debounce)
    }
  }

  const handleEnter = () => {
    emit('search', props.modelValue)
  }
</script>
