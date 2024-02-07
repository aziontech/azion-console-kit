<script setup>
  import InputNumber from 'primevue/inputnumber'
  import * as yup from 'yup'
  import { useField } from 'vee-validate'
  defineOptions({ name: 'floatFilter' })

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

  const { value: selectedValue, errorMessage } = useField(
    'selectedValue',
    yup.number().required(),
    {
      initialValue: props.value
    }
  )
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
        :placeholder="props.placeholder"
        v-model="selectedValue"
        inputId="number_field"
        showButtons
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
