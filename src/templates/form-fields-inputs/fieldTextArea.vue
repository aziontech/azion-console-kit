<script setup>
  import { toRef } from 'vue'
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
      type: Boolean,
      default: false
    }
  })

  const name = toRef(props, 'name')

  const {
    value: inputValue,
    errorMessage,
    handleBlur,
    handleChange
  } = useField(name, undefined, {
    initialValue: props.value
  })
</script>

<template>
  <label
    :for="props.name"
    class="text-color text-base font-medium leading-5"
  >
    {{ props.label }}
  </label>
  <TextArea
    :id="name"
    v-model="inputValue"
    :name="props.name"
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
