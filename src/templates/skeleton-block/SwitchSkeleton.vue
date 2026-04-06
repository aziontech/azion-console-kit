<template>
  <!-- Justified variant: label+description on left, toggle on right -->
  <div
    v-if="justified"
    class="flex items-center justify-between"
  >
    <div class="flex flex-col gap-2 flex-1">
      <Skeleton
        :width="labelWidth"
        height="1rem"
      />
      <Skeleton
        v-if="descriptionWidth"
        :width="descriptionWidth"
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
  <!-- Inline variant: toggle + label side by side -->
  <div
    v-else
    class="flex items-center gap-3"
  >
    <Skeleton
      width="3rem"
      height="1.5rem"
      borderRadius="12px"
    />
    <Skeleton
      :width="labelWidth"
      height="1rem"
    />
  </div>
</template>

<script setup>
  import Skeleton from '@aziontech/webkit/skeleton'

  defineOptions({ name: 'switch-skeleton' })

  defineProps({
    labelWidth: {
      type: String,
      default: '10rem'
    },
    descriptionWidth: {
      type: String,
      default: ''
    },
    justified: {
      type: Boolean,
      default: false
    }
  })
</script>
