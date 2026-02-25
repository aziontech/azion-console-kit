<script setup>
  import Skeleton from 'primevue/skeleton'

  defineOptions({ name: 'field-textarea-skeleton' })

  defineProps({
    /**
     * Width of the label skeleton
     */
    labelWidth: {
      type: String,
      default: '5rem'
    },
    /**
     * Height of the textarea skeleton
     */
    textareaHeight: {
      type: String,
      default: '10rem'
    },
    /**
     * Whether to show the description skeleton
     */
    showDescription: {
      type: Boolean,
      default: true
    },
    /**
     * Width of the description skeleton
     */
    descriptionWidth: {
      type: String,
      default: '90%'
    }
  })
</script>

<template>
  <div class="flex flex-col w-full gap-2">
    <Skeleton
      :width="labelWidth"
      height="1rem"
      class="mb-1"
    />
    <Skeleton
      width="100%"
      :height="textareaHeight"
      borderRadius="6px"
    />
    <Skeleton
      v-if="showDescription"
      :width="descriptionWidth"
      height="0.875rem"
    />
  </div>
</template>
