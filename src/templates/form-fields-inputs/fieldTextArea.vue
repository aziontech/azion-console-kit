<script setup>
  import { toRef, useSlots, useAttrs, computed } from 'vue'
  import { useField } from 'vee-validate'
  import TextArea from 'primevue/textarea'
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

  const iconPositionClass = computed(() => {
    return props.icon ? `p-input-icon-${props.iconPosition}` : ''
  })
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
      :data-testid="customTestId.textarea"
      :id="name"
      v-model="inputValue"
      :name="props.name"
      :disabled="props.disabled"
      type="text"
      class="w-full min-h-[2.75rem]"
      :autoResize="props.autoResize"
      :rows="props.rows"
      :cols="props.cols"
      :placeholder="props.placeholder"
      @input="handleChange"
      @blur="handleBlur"
      :class="{ 'p-invalid': errorMessage }"
    />
  </span>

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
