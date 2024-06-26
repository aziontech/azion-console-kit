<script setup>
  import { ref, toRef, useSlots } from 'vue'
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
    }
  })
  const inputRef = ref(null)
  const name = toRef(props, 'name')
  const slots = useSlots()
  const hasDescriptionSlot = !!slots.description

  const {
    value: inputValue,
    errorMessage,
    handleBlur,
    handleChange
  } = useField(name, undefined, {
    initialValue: props.value
  })

  defineExpose({
    inputRef
  })
</script>

<template>
  <label
    :for="props.name"
    class="text-color text-base font-medium leading-5"
  >
    {{ props.label }}
  </label>
  <InputText
    ref="inputRef"
    :id="name"
    v-model="inputValue"
    :name="name"
    :readonly="readonly"
    :disabled="disabled"
    type="text"
    :placeholder="props.placeholder"
    @input="handleChange"
    :class="{ 'p-invalid': errorMessage }"
    @blur="handleBlur"
    v-bind="$attrs"
  />
  <small
    v-if="errorMessage"
    class="p-error text-xs font-normal leading-tight"
    >{{ errorMessage }}</small
  >
  <small
    class="text-xs text-color-secondary font-normal leading-5"
    v-if="props.description || hasDescriptionSlot"
  >
    <slot name="description">
      {{ props.description }}
    </slot>
  </small>
</template>
