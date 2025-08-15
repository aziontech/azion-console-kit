<template>
  <div class="flex flex-col justify-center">
    <div class="flex flex-row justify-between w-full">
      <TitleDescriptionArea
        :title="title"
        :description="description"
      />
      
      <div>
        <SelectButton
          v-model="value"
          :options="options"
          ariaLabel="Select Button"
          @update:modelValue="emit('update:modelValue', $event)"
        />
      </div>
    </div>

    <div class="mt-6">
      <slot name="content"></slot>
    </div> 
  </div>
</template>

<script setup>
  import { ref } from 'vue'
  import SelectButton from 'primevue/selectbutton'
  import TitleDescriptionArea from '../title-description-area'

  const emit = defineEmits(['update:modelValue'])

  const props = defineProps({
    options: {
      type: Array,
      default: () => []
    },
    value: {
      type: String,
      default: null
    },
    title: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
  })

  const value = ref(props.value)
  const options = ref(props.options)
</script>
