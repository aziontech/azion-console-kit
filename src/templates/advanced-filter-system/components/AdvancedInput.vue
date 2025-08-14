<template>
  <div class="relative flex-1">
    <div class="relative">
      <InputText
        v-model="inputValue"
        :placeholder="placeholder"
        class="w-full pl-12 pr-12 py-3 bg-surface-card border border-surface-border rounded-lg text-sm text-color transition-all duration-200 hover:border-primary/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
        @input="handleInput"
        @keyup.enter="handleSearch"
      />
      <div class="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
        <i
          :class="iconClass"
          class="text-color-secondary text-base"
        ></i>
      </div>
      <div
        v-if="showClearButton"
        class="absolute inset-y-0 right-0 flex items-center pr-4"
      >
        <button
          type="button"
          class="text-color-secondary hover:text-color transition-colors duration-200 p-1 rounded-full hover:bg-surface-hover"
          @click="clearInput"
        >
          <i class="pi pi-times text-sm"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, watch } from 'vue'
  import InputText from 'primevue/inputtext'

  // Model
  const model = defineModel({
    type: String,
    default: ''
  })

  // Props
  const props = defineProps({
    placeholder: {
      type: String,
      default: 'Search...'
    },
    icon: {
      type: String,
      default: 'pi pi-search'
    }
  })

  // Emits
  const emit = defineEmits(['search', 'input'])

  // Component name
  defineOptions({ name: 'AdvancedInput' })

  // Refs
  const inputValue = ref(model.value)

  // Computed
  const iconClass = computed(() => props.icon)
  const showClearButton = computed(() => inputValue.value.length > 0)

  // Methods
  const handleInput = (event) => {
    inputValue.value = event.target.value
    model.value = inputValue.value
    emit('input', inputValue.value)
  }

  const handleSearch = () => {
    emit('search', inputValue.value)
  }

  const clearInput = () => {
    inputValue.value = ''
    model.value = ''
    emit('input', '')
    emit('search', '')
  }

  // Watchers
  watch(
    () => model.value,
    (newValue) => {
      inputValue.value = newValue
    }
  )
</script>
