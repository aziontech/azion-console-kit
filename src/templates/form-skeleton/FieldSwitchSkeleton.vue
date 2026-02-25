<script setup>
  import Skeleton from 'primevue/skeleton'

  defineOptions({ name: 'field-switch-skeleton' })

  defineProps({
    /**
     * Width of the switch label skeleton
     */
    labelWidth: {
      type: String,
      default: '4rem'
    },
    /**
     * Whether to show a description line
     */
    showDescription: {
      type: Boolean,
      default: false
    }
  })
</script>

<template>
  <div class="flex flex-col w-full gap-2">
    <div class="flex items-center justify-between">
      <div class="flex flex-col gap-2 flex-1">
        <Skeleton
          :width="labelWidth"
          height="1rem"
        />
        <Skeleton
          v-if="showDescription"
          width="80%"
          height="0.875rem"
        />
      </div>
      <Skeleton
        width="3rem"
        height="1.5rem"
        borderRadius="12px"
        class="ml-4"
      />
    </div>
  </div>
</template>
