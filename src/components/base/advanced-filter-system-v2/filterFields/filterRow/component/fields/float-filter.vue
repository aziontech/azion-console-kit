<script setup>
  import InputNumber from '@aziontech/webkit/inputnumber'
  import * as yup from 'yup'
  import { useField } from 'vee-validate'
  import { watch } from 'vue'
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

  const emit = defineEmits(['update:value'])

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

  watch(selectedValue, (newValue) => emit('update:value', newValue))
</script>
<template>
  <div class="w-full min-w-0">
    <div class="flex flex-col w-full gap-2">
      <InputNumber
        :placeholder="props.placeholder"
        v-model="selectedValue"
        inputId="number_field"
        @input="handleChange"
        :minFractionDigits="2"
        :maxFractionDigits="5"
        class="w-full min-w-0"
        inputClass="w-full min-w-0"
      />

      <small
        v-if="errorMessage"
        class="p-error text-xs font-normal leading-tight"
        >{{ errorMessage }}</small
      >
    </div>
  </div>
</template>
