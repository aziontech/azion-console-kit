<template>
  <div class="flex flex-col justify-center">
    <div class="flex flex-col justify-between w-full">
      <TitleDescriptionArea
        :title="title"
        :description="description"
      />

      <div class="min-w-[164px]">
        <div class="flex sm:flex sm:justify-end">
          <SelectButton
            v-model="selectPanelModelValue"
            @update:modelValue="changeButtonPanel"
            :options="options"
            :pt="pt()"
            ariaLabel="Select Button"
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
    },
    pt: {
      type: Function,
      default: () => {}
    }
  })

  const selectPanelModelValue = ref(props.value)

  const changeButtonPanel = (value) => {
    emit('update:modelValue', value)
  }
</script>
