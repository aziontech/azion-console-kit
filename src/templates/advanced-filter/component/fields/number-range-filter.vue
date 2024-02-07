<script setup>
  import InputNumber from 'primevue/inputnumber'
  import * as yup from 'yup'
  import { useField } from 'vee-validate'

  defineOptions({ name: 'numberangerFilter' })

  const props = defineProps({
    value: {
      type: Object,
      default: () => ({ begin: null, end: null })
    },
    placeholder: {
      type: String
    }
  })

  const {
    value: begin,
    errorMessage: errorBegin,
    setValue: setBegin
  } = useField(
    'begin',
    yup
      .number()
      .required()
      .when('end', {
        is: () => end.value,
        then: (schema) =>
          schema
            .notOneOf([end.value], 'Begin must be different from end')
            .lessThan(end.value, 'Begin must be less than end')
      }),
    {
      initialValue: props.value?.begin
    }
  )

  const {
    value: end,
    errorMessage: errorEnd,
    setValue: setEnd
  } = useField(
    'end',
    yup
      .number()
      .required()
      .when('begin', {
        is: () => begin.value,
        then: (schema) =>
          schema
            .notOneOf([begin.value], 'End must be different from begin')
            .moreThan(begin.value, 'End must be more than begin')
      }),
    {
      initialValue: props.value?.end
    }
  )

  const handleChange = () => {
    setBegin(begin.value)
    setEnd(end.value)
  }
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
        :placeholder="props.placeholder"
        v-model="begin"
        @update:modelValue="handleChange"
        @blur="handleChange"
        inputId="number_field_begin"
        mode="decimal"
        showButtons
        :min="0"
      />
      <small
        v-if="errorBegin"
        class="p-error text-xs font-normal leading-tight"
        >{{ errorBegin }}</small
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
        :placeholder="props.placeholder"
        v-model="end"
        @update:modelValue="handleChange"
        @blur="handleChange"
        inputId="number_field_end"
        mode="decimal"
        showButtons
        :min="0"
      />
      <small
        v-if="errorEnd"
        class="p-error text-xs font-normal leading-tight"
        >{{ errorEnd }}</small
      >
    </div>
  </div>
</template>
