<template>
  <PrimeButton
    @click="handleExport"
    outlined
    :class="buttonClass"
    icon="pi pi-download"
    :data-testid="testId"
    v-tooltip.bottom="{ value: tooltipText, showDelay: 200 }"
    :disabled="disabled"
    :loading="loading"
  >
    <template v-if="label">
      {{ label }}
    </template>
  </PrimeButton>
</template>

<script setup>
  import PrimeButton from 'primevue/button'

  defineProps({
    label: {
      type: String,
      default: ''
    },
    tooltipText: {
      type: String,
      default: 'Export to CSV'
    },
    buttonClass: {
      type: [String, Object, Array],
      default: 'max-sm:w-full ml-auto'
    },
    testId: {
      type: String,
      default: 'export_button'
    },
    disabled: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    }
  })

  const emit = defineEmits(['export', 'click'])

  const handleExport = (event) => {
    emit('export', event)
  }
</script>
