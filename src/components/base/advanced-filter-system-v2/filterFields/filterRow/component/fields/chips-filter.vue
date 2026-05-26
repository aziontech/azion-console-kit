<script setup>
  import chips from '@aziontech/webkit/chips'
  import * as yup from 'yup'
  import { useField } from 'vee-validate'
  import { watch } from 'vue'
  defineOptions({ name: 'chipsFilter' })

  const props = defineProps({
    value: {
      type: Array
    },
    placeholder: {
      type: String,
      default: 'Select'
    },
    disabled: {
      type: Boolean
    }
  })

  const emit = defineEmits(['update:value'])

  const { value: selectedValue, errorMessage } = useField('selectedValue', yup.array().required(), {
    initialValue: props.value
  })

  watch(selectedValue, (newValue) => emit('update:value', newValue))
</script>
<template>
  <div class="w-full">
    <div class="flex flex-col w-full gap-2">
      <div class="card p-fluid">
        <chips
          inputId="in_field_chips"
          class="w-full m-0 gap-1"
          v-model="selectedValue"
          :pt="{
            container: { class: 'gap-1' },
            token: { class: 'm-0' }
          }"
          :placeholder="props.placeholder"
          :disabled="props.disabled"
        />
      </div>
      <small
        v-if="errorMessage"
        class="p-error text-xs font-normal leading-tight"
        >{{ errorMessage }}</small
      >
    </div>
  </div>
</template>
