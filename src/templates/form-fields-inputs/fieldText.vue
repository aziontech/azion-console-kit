<script setup>
  import { computed, ref, toRef } from 'vue'
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
    icon: {
      type: String,
      default: ''
    },
    iconPosition: {
      type: String,
      default: 'right'
    }
  })
  const inputRef = ref(null)
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
      ref="inputRef"
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
