<script setup>
  import { toRef } from 'vue'
  import { useField } from 'vee-validate'
  import InputNumber from 'primevue/inputnumber'

  const props = defineProps({
    value: {
      type: String,
      default: ''
    },
    name: {
      type: String,
      required: true
    },
    label: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
    disabled: {
      type: Boolean,
      default: false
    },
    readonly: {
      type: Boolean,
      default: false
    },
    inputClass: {
      type: String,
      default: ''
    },
    min: {
      type: Number
    },
    max: {
      type: Number
    },
    step: {
      type: Number,
      default: 1
    }
  })

  const name = toRef(props, 'name')

  const {
    value: inputValue,
    errorMessage,
    handleBlur,
    handleChange
  } = useField(name, undefined, {
    initialValue: props.value || null
  })
</script>

<template>
  <label
    :for="props.name"
    class="text-color text-sm font-medium leading-5"
    >{{ props.label }}</label
  >
  <InputNumber
    v-model="inputValue"
    showButtons
    :placeholder="props.placeholder"
    :disabled="props.disabled"
    :readonly="props.readonly"
    :id="name"
    :min="props.min"
    :max="props.max"
    :step="props.step"
    type="number"
    @input="(event) => handleChange(event.value)"
    @blur="handleBlur"
    :class="[{ 'p-invalid': !!errorMessage }, props.inputClass]"
  />

  <small
    v-if="errorMessage"
    class="p-error text-xs font-normal leading-tight"
    >{{ errorMessage }}</small
  >
  <small
    class="text-xs text-color-secondary font-normal leading-5"
    v-if="props.description"
  >
    {{ props.description }}
  </small>
</template>
