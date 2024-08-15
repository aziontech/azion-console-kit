<script setup>
  import { useField } from 'vee-validate'
  import { toRef } from 'vue'
  import InputSwitch from 'primevue/inputswitch'

  const props = defineProps({
    name: {
      type: String,
      required: true
    },
    label: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    }
  })

  const inputName = toRef(props.name)
  const { value: inputValue } = useField(inputName)
</script>
<template>
  <InputSwitch
    v-model="inputValue"
    :inputId="inputName"
  />
  <label
    :for="inputName"
    class="flex flex-col text-base items-start gap-1"
  >
    <span class="text-color font-normal leading-5">{{ props.label }} </span>
    <span
      v-if="props.description"
      class="text-sm text-color-secondary font-normal leading-5"
    >
      {{ props.description }}
    </span>
  </label>
</template>
