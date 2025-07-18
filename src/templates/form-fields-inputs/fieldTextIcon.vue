<script setup>
  import { computed, toRef } from 'vue'
  import { useField } from 'vee-validate'
  import InputText from 'primevue/inputtext'
  import LabelBlock from '@/templates/label-block'

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
    icon: {
      type: String,
      default: ''
    },
    iconPosition: {
      type: String,
      default: 'right'
    },
    required: {
      type: Boolean,
      default: false
    }
  })

  const nameInput = toRef(props, 'name')

  const {
    value: inputValue,
    errorMessage,
    handleBlur,
    handleChange
  } = useField(nameInput, undefined, {
    initialValue: props.value
  })

  const iconPositionClass = computed(() => {
    return props.icon ? `p-input-icon-${props.iconPosition}` : ''
  })
</script>

<template>
  <LabelBlock
    :for="props.name"
    :label="props.label"
    :isRequired="props.required"
  />
  <span
    class="w-full"
    :class="iconPositionClass"
  >
    <i
      v-if="props.icon"
      :class="props.icon"
      class="text-color-secondary"
    />
    <InputText
      :id="props.name"
      v-model="inputValue"
      :name="props.name"
      :readonly="props.readonly"
      :disabled="props.disabled"
      type="text"
      class="w-full"
      :class="{ 'p-invalid': errorMessage }"
      :placeholder="props.placeholder"
      @input="handleChange"
      @blur="handleBlur"
      v-bind="$attrs"
    />
  </span>

  <small
    v-if="errorMessage"
    class="p-error text-xs font-normal leading-tight"
  >
    {{ errorMessage }}
  </small>
  <small
    class="text-xs text-color-secondary font-normal leading-5"
    v-if="props.description"
  >
    {{ props.description }}
  </small>
</template>
