<script setup>
  import { computed, ref, toRef, useAttrs, useSlots } from 'vue'
  import { useField } from 'vee-validate'
  import InputText from 'primevue/inputtext'
  import LabelBlock from '@/templates/label-block'

  const emit = defineEmits(['blur', 'input', 'update:isPublic'])

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
    /**
     * Controls the privacy state of the field.
     * false = private (locked) | true = public (unlocked)
     * Use with v-model:isPublic
     */
    isPublic: {
      type: Boolean,
      default: false
    }
  })

  const inputRef = ref(null)
  const name = toRef(props, 'name')
  const slots = useSlots()
  const attrs = useAttrs()
  const hasDescriptionSlot = !!slots.description

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

  const {
    value: inputValue,
    errorMessage: veeValidateErrorMessage,
    handleBlur,
    handleChange
  } = useField(name, undefined, {
    initialValue: props.value
  })

  const onBlur = (event) => {
    handleBlur(event)
    emit('blur', event)
  }

  const onChange = (event) => {
    handleChange(event)
    emit('input', event.target.value)
  }

  const togglePrivacy = () => {
    if (props.disabled || props.readonly) return
    emit('update:isPublic', !props.isPublic)
  }

  defineExpose({ inputRef })
</script>

<template>
  <LabelBlock
    v-if="props.label"
    :for="props.name"
    :data-testid="customTestId.label"
    :label="props.label"
    :isRequired="attrs.required"
  />

  <div class="p-inputgroup">
    <InputText
      v-bind="sensitive ? { 'data-sentry-mask': '' } : {}"
      v-model="inputValue"
      ref="inputRef"
      type="text"
      :data-testid="customTestId.input"
      :id="name"
      :name="name"
      :readonly="readonly"
      :disabled="disabled"
      :placeholder="props.placeholder"
      :class="[{ 'p-invalid': aditionalError || veeValidateErrorMessage }, props.class]"
      @input="onChange"
      @keypress.enter.prevent
      @blur="onBlur"
    />

    <!-- Privacy switch toggle -->
    <span
      :data-testid="customTestId.privacySwitch"
      :title="isPublic ? 'Public – click to make private' : 'Private – click to make public'"
      :aria-label="isPublic ? 'Field is public. Click to make private.' : 'Field is private. Click to make public.'"
      :aria-pressed="isPublic"
      role="switch"
      tabindex="0"
      class="p-inputgroup-addon px-2 flex items-center justify-center select-none bg-transparent cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:rounded"
      :class="{
        'opacity-50 cursor-not-allowed pointer-events-none': disabled || readonly
      }"
      @click="togglePrivacy"
      @keydown.enter.prevent="togglePrivacy"
      @keydown.space.prevent="togglePrivacy"
    >
      <span
        class="relative w-9 h-5 rounded-full transition-colors duration-200"
        :class="isPublic ? 'privacy-switch--public' : 'privacy-switch--private'"
      >
        <span
          class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white flex items-center justify-center shadow-sm transition-transform duration-200"
          :class="isPublic ? 'translate-x-4' : 'translate-x-0'"
        >
          <!-- Both icons rendered with transition -->
          <span class="relative w-3 h-3">
            <!-- Lock closed (private/inactive) -->
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
              class="absolute inset-0 transition-all duration-200"
              :class="isPublic ? 'opacity-0 scale-75' : 'opacity-100 scale-100'"
              :style="{ color: 'var(--text-color-secondary, #6c757d)' }"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>

            <!-- Lock open (public/active) -->
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
              class="absolute inset-0 transition-all duration-200"
              :class="isPublic ? 'opacity-100 scale-100' : 'opacity-0 scale-75'"
              :style="{ color: '#c2410c' }"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
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
</template>

<style scoped>
/* CSS variables for theming - Tailwind can't handle these */
.privacy-switch--private {
  background-color: var(--surface-300, #d1d5db) !important;
}

.privacy-switch--private:hover {
  background-color: var(--surface-400, #9ca3af) !important;
}

.privacy-switch--public {
  background-color: #f3652b !important;
}

.privacy-switch--public:hover {
  background-color: var(--primary-600, #f3652b) !important;
}

.p-inputgroup-addon:focus-visible {
  outline-color: var(--primary-color, #3b82f6);
}

.p-inputgroup-addon {
  background-color: #282828  !important;
  border-left:none;
}

.p-inputtext {
  border-right: none;
}
</style>
