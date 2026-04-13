<template>
  <div class="flex items-center justify-between relative">
    <div class="flex gap-2 flex-1">
      <div
        v-for="(tabWidth, tabIndex) in tabWidths"
        :key="tabIndex"
        class="flex items-center justify-center rounded-md"
        :style="{
          minHeight: '2rem',
          padding: '0.375rem 0.75rem',
          backgroundColor: tabIndex === 0 ? 'var(--tabview-header-active-bg)' : 'transparent'
        }"
      >
        <Skeleton
          :width="tabWidth"
          height="0.875rem"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
  import Skeleton from '@aziontech/webkit/skeleton'

  defineOptions({ name: 'tabs-skeleton' })

  defineProps({
    tabWidths: {
      type: Array,
      required: true
    }
  })
</script>
