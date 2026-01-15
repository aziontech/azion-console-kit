<script setup>
  import { computed, ref, toRef, useAttrs, useSlots } from 'vue'
  import { useField } from 'vee-validate'
  import TextArea from 'primevue/textarea'
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
    },
    icon: {
      type: String,
      default: ''
    },
    iconPosition: {
      type: String,
      default: 'right'
    },
    sensitive: {
      type: Boolean,
      default: false
    },
    aditionalError: {
      type: String,
      default: ''
    }
  })

  const inputRef = ref(null)
  const name = toRef(props, 'name')
  const slots = useSlots()
  const hasDescriptionSlot = !!slots.description
  const {
    value: inputValue,
    errorMessage: veeValidateErrorMessage,
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

  const iconPositionClass = computed(() => {
    return props.icon ? `p-input-icon-${props.iconPosition}` : ''
  })

  const onBlur = (event) => {
    handleBlur(event)
    emit('blur', event)
  }

  const onChange = (event) => {
    handleChange(event)
    emit('input', event.target.value)
  }

  defineExpose({ inputRef })
</script>

<template>
  <LabelBlock
    :for="props.name"
    :data-testid="customTestId.label"
    :label="props.label"
    :isRequired="attrs.required"
  />
  <span
    class="w-full"
    :class="iconPositionClass"
  >
    <i
      v-if="props.icon"
      :class="props.icon"
      class="text-color-secondary top-5 right-5"
    />
    <TextArea
      v-bind="sensitive ? { 'data-sentry-mask': '' } : {}"
      v-model="inputValue"
      ref="inputRef"
      type="text"
      class="w-full min-h-[2.75rem]"
      :class="[{ 'p-invalid': aditionalError || veeValidateErrorMessage }, props.class]"
      :id="name"
      :data-testid="customTestId.textarea"
      :name="props.name"
      :disabled="props.disabled"
      :autoResize="props.autoResize"
      :rows="props.rows"
      :cols="props.cols"
      :placeholder="props.placeholder"
      @input="onChange"
      @blur="onBlur"
    />
  </span>
  <small
    v-if="aditionalError || veeValidateErrorMessage"
    class="p-error text-xs font-normal leading-tight"
    :data-testid="customTestId.error"
  >
    {{ aditionalError || veeValidateErrorMessage }}
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
