<script setup>
  import { toRef, useSlots, useAttrs, computed } from 'vue'
  import { useField } from 'vee-validate'
  import TextArea from 'primevue/textarea'

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
      required: true
    },
    placeholder: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
    rows: {
      type: [Number, String],
      default: 5
    },
    cols: {
      type: Number,
      default: 30
    },
    autoResize: {
      type: Boolean
    },
    disabled: {
      type: Boolean
    }
  })

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

  const attrs = useAttrs()

  const customTestId = computed(() => {
    const id = attrs['data-testid'] || 'field-text'

    return {
      label: `${id}__label`,
      textarea: `${id}__textarea`,
      description: `${id}__description`,
      error: `${id}__error-message`
    }
  })
</script>

<template>
  <label
    :for="props.name"
    :data-testid="customTestId.label"
    class="text-color text-base font-medium leading-5"
  >
    {{ props.label }}
  </label>
  <TextArea
    :data-testid="customTestId.textarea"
    :id="name"
    v-model="inputValue"
    :name="props.name"
    :disabled="props.disabled"
    type="text"
    :autoResize="props.autoResize"
    :rows="props.rows"
    :cols="props.cols"
    :placeholder="props.placeholder"
    @input="handleChange"
    @blur="handleBlur"
    :class="{ 'p-invalid': errorMessage }"
  />
  <small
    v-if="errorMessage"
    :data-testid="customTestId.error"
    class="p-error text-xs font-normal leading-tight"
  >
    {{ errorMessage }}
  </small>
  <small
    class="text-xs text-color-secondary font-normal leading-5"
    :data-testid="customTestId.description"
    v-if="props.description || hasDescriptionSlot"
  >
    <slot name="description">
      {{ props.description }}
    </slot>
  </small>
</template>
