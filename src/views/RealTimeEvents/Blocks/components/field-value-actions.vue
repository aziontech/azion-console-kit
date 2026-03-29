<script setup>
  import PrimeButton from 'primevue/button'
  import { clipboardWrite } from '@/helpers/clipboard'
  import { useToast } from 'primevue/usetoast'

  defineOptions({ name: 'FieldValueActions' })

  const props = defineProps({
    fieldKey: {
      type: String,
      required: true
    },
    fieldValue: {
      type: [String, Number, Boolean, null],
      required: true
    },
    onAddFilter: {
      type: Function,
      default: null
    },
    onExcludeFilter: {
      type: Function,
      default: null
    }
  })

  const toast = useToast()

  const handleCopy = () => {
    clipboardWrite(String(props.fieldValue))
    toast.add({
      closable: true,
      severity: 'success',
      summary: 'Copied to clipboard'
    })
  }

  const handleAddFilter = () => {
    if (props.onAddFilter) {
      props.onAddFilter(props.fieldKey, props.fieldValue)
    }
  }

  const handleExcludeFilter = () => {
    if (props.onExcludeFilter) {
      props.onExcludeFilter(props.fieldKey, props.fieldValue)
    }
  }
</script>

<template>
  <span
    class="inline-flex gap-0.5 opacity-0 group-hover/field:opacity-100 transition-opacity items-center ml-1"
    data-testid="field-value-actions"
  >
    <PrimeButton
      v-if="onAddFilter && fieldValue !== '-'"
      icon="pi pi-plus-circle"
      text
      rounded
      size="small"
      class="!w-5 !h-5 !p-0"
      v-tooltip.top="{ value: 'Filter for value', showDelay: 300 }"
      @click.stop="handleAddFilter"
      data-testid="field-value-add-filter"
    />
    <PrimeButton
      v-if="onExcludeFilter && fieldValue !== '-'"
      icon="pi pi-minus-circle"
      text
      rounded
      size="small"
      class="!w-5 !h-5 !p-0"
      v-tooltip.top="{ value: 'Filter out value', showDelay: 300 }"
      @click.stop="handleExcludeFilter"
      data-testid="field-value-exclude-filter"
    />
    <PrimeButton
      v-if="fieldValue !== '-'"
      icon="pi pi-copy"
      text
      rounded
      size="small"
      class="!w-5 !h-5 !p-0"
      v-tooltip.top="{ value: 'Copy value', showDelay: 300 }"
      @click.stop="handleCopy"
      data-testid="field-value-copy"
    />
  </span>
</template>
