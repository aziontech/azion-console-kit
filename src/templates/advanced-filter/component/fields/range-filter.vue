<script setup>
  import InputNumber from 'primevue/inputnumber'
  import * as yup from 'yup'
  import { useField } from 'vee-validate'
  defineOptions({ name: 'rangerFilter' })

  const props = defineProps({
    value: {
      type: Object
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
  } = useField('selectedValue', yup.object().required(), {
    initialValue: props.value
  })
</script>
<template>
  <div class="flex gap-6 w-full">
    <div class="flex flex-col w-1/2 gap-2">
      <label
        for="number_field_begin"
        class="text-sm font-medium leading-5 text-color"
      >
        Begin *
      </label>
      <InputNumber
        @input="handleChange"
        :placeholder="props.placeholder"
        @blur="handleBlur"
        v-model="selectedValue"
        inputId="number_field_begin"
        :minFractionDigits="2"
        :maxFractionDigits="5"
      />
      <small
        v-if="errorMessage"
        class="p-error text-xs font-normal leading-tight"
        >{{ errorMessage }}</small
      >
    </div>
    <div class="flex flex-col w-1/2 gap-2">
      <label
        for="number_field_end"
        class="text-sm font-medium leading-5 text-color"
      >
        End *
      </label>
      <InputNumber
        @input="handleChange"
        :placeholder="props.placeholder"
        @blur="handleBlur"
        v-model="selectedValue"
        inputId="number_field_end"
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
