<script setup>
  import InputNumber from 'primevue/inputnumber'
  import * as yup from 'yup'
  import { useField } from 'vee-validate'
  defineOptions({ name: 'numberFilter' })

  const props = defineProps({
    value: {
      type: String
    },
    placeholder: {
      type: String,
      default: 'Select'
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
  } = useField('selectedValue', yup.number().required(), {
    initialValue: props.value
  })
</script>
<template>
  <div class="w-1/2 pr-6">
    <div class="flex flex-col w-full gap-2">
      <label
        for="number_field"
        class="text-sm font-medium leading-5 text-color"
      >
        Value *
      </label>
      <InputNumber
        @input="handleChange"
        :placeholder="props.placeholder"
        @blur="handleBlur"
        v-model="selectedValue"
        inputId="number_field"
        :minFractionDigits="2"
        :maxFractionDigits="5"
      />
      <small
        v-if="errorMessage"
        class="p-error text-xs font-normal leading-tight"
        >{{ errorMessage }}</small
      >
    </div>
  </div>
</template>
