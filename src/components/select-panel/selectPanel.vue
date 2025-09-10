<template>
  <div class="flex flex-col justify-center">
    <div class="flex flex-col gap-4 sm:flex-row md:gap-0 justify-between w-full">
      <TitleDescriptionArea
        :title="title"
        :description="description"
      />

      <div class="min-w-[164px]">
        <div class="flex sm:flex sm:justify-end">
          <SelectButton
            v-model="selectPanelModelValue"
            :options="options"
            ariaLabel="Select Button"
            @update:modelValue="changeButtonPanel"
          />
        </div>
      </div>
    </div>

    <div
      class="mt-6"
      v-if="$slots.content"
    >
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
    }
  })

  const selectPanelModelValue = ref(props.value)

  const changeButtonPanel = (value) => {
    emit('update:modelValue', value)
  }
</script>
