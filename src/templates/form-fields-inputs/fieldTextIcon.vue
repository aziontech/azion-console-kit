<script setup>
  import { computed, toRef, ref } from 'vue'
  import { useField } from 'vee-validate'
  import InputText from 'primevue/inputtext'
  import LabelBlock from '@/templates/label-block'
  const emit = defineEmits(['click-icon'])
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

  const inputValue = ref(props.value)
  const errorMessage = ref('')
  let handleBlur = () => {}
  let handleChange = () => {}

  if (!props.disabled) {
    const field = useField(nameInput, undefined, {
      initialValue: props.value
    })
    inputValue.value = field.value
    errorMessage.value = field.errorMessage
    handleBlur = field.handleBlur
    handleChange = field.handleChange
  }

  const iconPositionClass = computed(() => {
    return props.icon ? `p-input-icon-${props.iconPosition}` : ''
  })

  const handleClick = () => {
    emit('click-icon')
  }
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
      class="text-color-secondary cursor-pointer"
      @click="handleClick"
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
