<script setup>
  import InputNumber from 'primevue/inputnumber'
  import * as yup from 'yup'
  import { useField } from 'vee-validate'
  defineOptions({ name: 'numberFilter' })

  const props = defineProps({
    value: {
      type: Number
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
    handleChange: handleChangeNumber
  } = useField('selectedValue', yup.number().required(), {
    initialValue: props.value
  })

  const handleChange = ({ value }) => {
    handleChangeNumber(value)
  }
</script>
<template>
  <div class="w-full sm:w-1/2 sm:pr-6">
    <div class="flex flex-col w-full gap-2">
      <InputNumber
        :placeholder="props.placeholder"
        v-model="selectedValue"
        inputId="number_field"
        @input="handleChange"
        mode="decimal"
        showButtons
        :min="0"
      />
      <small
        v-if="errorMessage"
        class="p-error text-xs font-normal leading-tight"
        >{{ errorMessage }}</small
      >
    </div>
  </div>
</template>
