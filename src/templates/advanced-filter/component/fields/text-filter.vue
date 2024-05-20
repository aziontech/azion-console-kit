<script setup>
  import InputText from 'primevue/inputtext'
  import * as yup from 'yup'
  import { useField } from 'vee-validate'
  defineOptions({ name: 'textFilter' })

  const props = defineProps({
    value: {
      type: String
    },
    placeholder: {
      type: String
    },
    disabled: {
      type: Boolean
    }
  })

  const {
    value: selectedValue,
    errorMessage,
    handleBlur,
    handleChange
  } = useField('selectedValue', yup.string().default(''), {
    initialValue: props.value || ''
  })
</script>
<template>
  <div class="w-full sm:w-1/2 sm:pr-6">
    <div class="flex flex-col w-full gap-2">
      <label
        for="text_field"
        class="text-sm font-medium leading-5 text-color"
      >
        Value
      </label>
      <InputText
        inputId="text_field"
        v-model="selectedValue"
        type="text"
        :placeholder="props.placeholder"
        @input="handleChange"
        @blur="handleBlur"
      />
      <small
        v-if="errorMessage"
        class="p-error text-xs font-normal leading-tight"
      >
        {{ errorMessage }}
      </small>
    </div>
  </div>
</template>
