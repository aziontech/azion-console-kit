<script setup>
  import InputText from '@aziontech/webkit/inputtext'
  import * as yup from 'yup'
  import { useField } from 'vee-validate'
  import { watch } from 'vue'
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

  const emit = defineEmits(['update:value'])

  const {
    value: selectedValue,
    errorMessage,
    handleBlur,
    handleChange
  } = useField('selectedValue', yup.string().default(''), {
    initialValue: props.value || ''
  })

  watch(selectedValue, (newValue) => emit('update:value', newValue))
</script>
<template>
  <div class="w-full">
    <div class="flex flex-col w-full gap-2">
      <InputText
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
