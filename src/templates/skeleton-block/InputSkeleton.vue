<template>
  <div
    class="flex flex-col w-full gap-2"
    :class="maxWidthClass"
  >
    <Skeleton
      :width="labelWidth"
      height="1rem"
      class="mb-1"
    />
    <Skeleton
      width="100%"
      :height="inputHeight"
      borderRadius="6px"
    />
    <Skeleton
      v-if="hasHelper"
      width="90%"
      height="0.875rem"
    />
  </div>
</template>

<script setup>
  import Skeleton from '@aziontech/webkit/skeleton'

  defineOptions({ name: 'input-skeleton' })

  defineProps({
    labelWidth: {
      type: String,
      default: '5rem'
    },
    inputHeight: {
      type: String,
      default: '2.75rem'
    },
    hasHelper: {
      type: Boolean,
      default: false
    },
    maxWidthClass: {
      type: String,
      default: 'sm:max-w-lg'
    }
  })
</script>
