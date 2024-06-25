<script setup>
  import { toRef } from 'vue'
  import { useField } from 'vee-validate'
  import InputText from 'primevue/inputtext'

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
    }
  })

  const name = toRef(props, 'name')

  const {
    value: inputValue,
    errorMessage,
    handleBlur,
    handleChange
  } = useField(name, undefined, {
    initialValue: props.value
  })
</script>

<template>
  <label
    :for="props.name"
    class="text-color text-sm font-medium leading-5"
    >{{ props.label }}</label
  >
  <InputText
    :id="name"
    v-model="inputValue"
    :name="name"
    :readonly="readonly"
    :disabled="disabled"
    type="text"
    :placeholder="props.placeholder"
    @input="handleChange"
    @blur="handleBlur"
    :class="inputClass"
    v-bind="$attrs"
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
