<template>
  <div class="w-full md:min-h-16 flex md:flex-row flex-col gap-4 md:justify-between items-center">
    <div class="w-full md:w-auto flex flex-col">
      <div class="flex gap-1 items-center overflow-auto w-full p-0">
        <template
          v-for="(breadcrumbWidth, breadcrumbIndex) in widths"
          :key="breadcrumbIndex"
        >
          <i
            v-if="breadcrumbIndex > 0"
            class="pi pi-chevron-right text-color-secondary mx-2"
          />
          <Skeleton
            :width="breadcrumbWidth"
            height="1.125rem"
            class="bg-surface-200 dark:bg-surface-700"
          />
        </template>
      </div>
      <Skeleton
        v-if="descriptionWidth"
        :width="descriptionWidth"
        height="0.875rem"
        class="mt-2"
      />
    </div>
  </div>
</template>

<script setup>
  import Skeleton from '@aziontech/webkit/skeleton'

  defineOptions({ name: 'breadcrumb-skeleton' })

  defineProps({
    widths: {
      type: Array,
      default: () => ['8rem', '10rem']
    },
    descriptionWidth: {
      type: String,
      default: '40rem'
    }
  })
</script>
