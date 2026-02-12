<script setup>
  import { computed, toRef, useAttrs } from 'vue'
  import { useField } from 'vee-validate'
  import InputNumber from 'primevue/inputnumber'
  import LabelBlock from '@/templates/label-block'

  const emit = defineEmits(['blur', 'input'])
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
    },
    showButtons: {
      type: Boolean,
      default: true
    },
    useGrouping: {
      type: Boolean,
      default: true
    },
    aditionalError: {
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
    initialValue: props.value ?? null
  })

  const attrs = useAttrs()

  const customTestId = computed(() => {
    const id = attrs['data-testid'] || 'field-number'

    return {
      label: `${id}__label`,
      input: `${id}__input`,
      description: `${id}__description`,
      error: `${id}__error-message`
    }
  })

  const onBlur = (event) => {
    handleBlur(event)
    emit('blur', event)
  }

  const onInput = (event) => {
    handleChange(event.value)
    emit('input', event.value)
  }
</script>

<template>
  <LabelBlock
    :for="props.name"
    :data-testid="customTestId.label"
    :label="props.label"
    :isRequired="$attrs.required"
  />
  <InputNumber
    v-model="inputValue"
    :showButtons="props.showButtons"
    :placeholder="props.placeholder"
    :disabled="props.disabled"
    :readonly="props.readonly"
    :id="name"
    :min="props.min"
    :max="props.max"
    :step="props.step"
    :useGrouping="props.useGrouping"
    type="number"
    @input="onInput"
    @blur="onBlur"
    :pt="{
      input: {
        name: props.name
      }
    }"
    :class="[{ 'p-invalid': aditionalError || errorMessage }, props.inputClass]"
    :data-testid="customTestId.input"
  />

  <small
    v-if="aditionalError || errorMessage"
    class="p-error text-xs font-normal leading-tight"
    :data-testid="customTestId.error"
  >
    {{ aditionalError || errorMessage }}
  </small>
  <small
    class="text-xs text-color-secondary font-normal leading-5"
    :data-testid="customTestId.description"
    v-if="props.description"
  >
    {{ props.description }}
  </small>
</template>
