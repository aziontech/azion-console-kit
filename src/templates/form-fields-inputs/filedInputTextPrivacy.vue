<script setup>
  import { computed, ref, toRef, useAttrs, useSlots } from 'vue'
  import { useField } from 'vee-validate'
  import InputText from 'primevue/inputtext'
  import LabelBlock from '@aziontech/webkit/label'

  const emit = defineEmits(['blur', 'input', 'update:props.isPublic'])

  const props = defineProps({
    value: {
      type: String,
      default: ''
    },
    class: {
      type: String
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
    sensitive: {
      type: Boolean,
      default: false
    },
    aditionalError: {
      type: String,
      default: ''
    },
    isPublic: {
      type: Boolean,
      default: false
    },
    labelPrivate: { type: String, default: 'Private' },
    labelPublic: {
      type: String,
      default: 'Public'
    },
    required: {
      type: Boolean,
      default: false
    },
    showPrivacyIcon: {
      type: Boolean,
      default: true
    }
  })

  const inputRef = ref(null)
  const name = toRef(props, 'name')
  const slots = useSlots()
  const attrs = useAttrs()
  const hasDescriptionSlot = !!slots.description

  const isFocused = ref(false)
  const isHovered = ref(false)

  const customTestId = computed(() => {
    const id = attrs['data-testid'] || 'field-text-privacy'
    return {
      label: `${id}__label`,
      input: `${id}__input`,
      description: `${id}__description`,
      error: `${id}__error-message`,
      privacySwitch: `${id}__privacy-switch`
    }
  })

  const groupBorderClass = computed(() => {
    if (aditionalError.value || veeValidateErrorMessage.value) return '!border-red-500'
    if (isFocused.value || isHovered.value) return '!border-[#f3652b]'
    return ''
  })

  const groupShadowClass = computed(() => {
    if (isFocused.value || isHovered.value) {
      const color = aditionalError.value || veeValidateErrorMessage.value ? '#ef4444' : '#f3652b'
      return `shadow-[0_0_0_1px_${color}]`
    }
    return ''
  })

  const {
    value: inputValue,
    errorMessage: veeValidateErrorMessage,
    handleBlur,
    handleChange
  } = useField(name, undefined, {
    initialValue: props.value
  })

  const labelInput = computed(() => {
    if (!props.showPrivacyIcon) return props.label
    return props.isPublic
      ? `${props.labelPublic} ${props.label} `
      : `${props.labelPrivate} ${props.label}`
  })

  const aditionalError = computed(() => props.aditionalError)

  const onBlur = (event) => {
    handleBlur(event)
    emit('blur', event)
  }

  const onChange = (event) => {
    handleChange(event)
    emit('input', event.target.value)
  }

  const togglePrivacy = () => {
    if (!props.showPrivacyIcon && (props.disabled || props.readonly)) return
    emit('update:isPublic', !props.isPublic)
  }

  const isInputDisabled = computed(() => {
    if (props.disabled) return true
    if (!props.showPrivacyIcon && !props.isPublic) return true
    return false
  })

  const onGroupFocusIn = () => {
    isFocused.value = true
  }
  const onGroupFocusOut = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      isFocused.value = false
    }
  }
  const onGroupMouseEnter = () => {
    isHovered.value = true
  }
  const onGroupMouseLeave = () => {
    isHovered.value = false
  }

  defineExpose({ inputRef })
</script>

<template>
  <div
    class="flex flex-col gap-2"
    @mouseenter="onGroupMouseEnter"
    @mouseleave="onGroupMouseLeave"
  >
    <LabelBlock
      v-if="props.label"
      :for="props.name"
      :data-testid="customTestId.label"
      :label="labelInput"
      :isRequired="props.required || attrs.required"
    />

    <div
      class="p-inputgroup rounded transition-shadow duration-150"
      :class="[
        groupShadowClass,
        isInputDisabled && showPrivacyIcon ? 'opacity-50 pointer-events-none' : ''
      ]"
      @focusin="onGroupFocusIn"
      @focusout="onGroupFocusOut"
    >
      <InputText
        v-bind="sensitive ? { 'data-sentry-mask': '' } : {}"
        v-model="inputValue"
        ref="inputRef"
        type="text"
        :data-testid="customTestId.input"
        :id="name"
        :name="name"
        :readonly="readonly"
        :disabled="isInputDisabled"
        :placeholder="props.placeholder"
        :class="[
          '!border-r-0 !outline-none !shadow-none transition-colors duration-150',
          groupBorderClass,
          { 'p-invalid': aditionalError || veeValidateErrorMessage },
          props.class
        ]"
        @input="onChange"
        @keypress.enter.prevent
        @blur="onBlur"
      />

      <span
        :data-testid="customTestId.privacySwitch"
        :title="
          props.isPublic ? 'Public – click to make private' : 'Private – click to make public'
        "
        :aria-label="
          props.isPublic
            ? 'Field is public. Click to make private.'
            : 'Field is private. Click to make public.'
        "
        :aria-pressed="props.isPublic"
        role="switch"
        tabindex="0"
        class="p-inputgroup-addon !border-l-0 cursor-pointer outline-none transition-colors duration-150 select-none"
        :class="[
          groupBorderClass,
          {
            'opacity-50 cursor-not-allowed pointer-events-none':
              (disabled || readonly) && showPrivacyIcon
          }
        ]"
        :style="{
          backgroundColor: 'var(--input-bg, var(--surface-0))',
          ...(isInputDisabled && !showPrivacyIcon ? { opacity: 'var(--disabled-opacity)' } : {})
        }"
        @click="togglePrivacy"
        @keydown.enter.prevent="togglePrivacy"
        @keydown.space.prevent="togglePrivacy"
      >
        <span
          class="relative w-9 h-5 rounded-full transition-colors duration-200"
          :class="
            props.isPublic
              ? 'bg-[#f3652b] hover:bg-[#d95522]'
              : 'bg-[var(--input-switch-slider-off-bg)] hover:bg-[var(--input-switch-slider-off-hover-bg)]'
          "
        >
          <span
            class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white flex items-center justify-center shadow-sm transition-transform duration-200"
            :class="props.isPublic ? 'translate-x-4' : 'translate-x-0'"
          >
            <span
              v-if="props.showPrivacyIcon"
              class="relative w-3 h-3"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
                class="absolute inset-0 transition-all duration-200 text-gray-500"
                :class="props.isPublic ? 'opacity-0 scale-75' : 'opacity-100 scale-100'"
              >
                <rect
                  x="3"
                  y="11"
                  width="18"
                  height="11"
                  rx="2"
                  ry="2"
                />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>

              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
                class="absolute inset-0 transition-all duration-200 text-orange-700"
                :class="props.isPublic ? 'opacity-100 scale-100' : 'opacity-0 scale-75'"
              >
                <rect
                  x="3"
                  y="11"
                  width="18"
                  height="11"
                  rx="2"
                  ry="2"
                />
                <path d="M7 11V7a5 5 0 0 1 9.9-1" />
              </svg>
            </span>
          </span>
        </span>
      </span>
    </div>

    <small
      v-if="aditionalError || veeValidateErrorMessage"
      class="p-error text-xs font-normal leading-tight"
      :data-testid="customTestId.error"
    >
      {{ aditionalError || veeValidateErrorMessage }}
    </small>

    <small
      v-if="props.description || hasDescriptionSlot"
      class="text-xs text-color-secondary font-normal leading-5"
      :data-testid="customTestId.description"
    >
      <slot name="description">
        {{ props.description }}
      </slot>
    </small>
  </div>
</template>

<style scoped>
  :deep(.p-inputtext:focus) {
    outline: none !important;
    box-shadow: none !important;
  }
</style>
