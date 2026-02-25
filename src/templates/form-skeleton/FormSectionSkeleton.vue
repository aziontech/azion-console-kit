<script setup>
  import Skeleton from 'primevue/skeleton'

  defineOptions({ name: 'form-section-skeleton' })

  defineProps({
    /**
     * Width of the section title skeleton
     */
    titleWidth: {
      type: String,
      default: '6rem'
    },
    /**
     * Number of description lines to show
     */
    descriptionLines: {
      type: Number,
      default: 2
    },
    /**
     * Array of description line widths (e.g., ['100%', '80%'])
     * If not provided, defaults are generated based on descriptionLines count
     */
    descriptionWidths: {
      type: Array,
      default: null
    }
  })
</script>

<template>
  <fieldset
    class="flex max-w-screen-2xl-test mx-auto gap-8 w-full surface-section px-8 py-8 rounded-md lg:flex-nowrap xl:py-14 xl:p-14 lg:gap-16 border surface-border flex-wrap min-w-[2rem]"
  >
    <!-- Left: Title and Description -->
    <div class="flex flex-col gap-2 flex-1 w-full md:min-w-[15rem]">
      <Skeleton
        :width="titleWidth"
        height="1.75rem"
        class="mb-2"
      />
      <Skeleton
        v-for="(width, index) in descriptionWidths ||
        Array.from({ length: descriptionLines }, (_, i) =>
          i === 0 ? '100%' : `${Math.max(60, 100 - i * 15)}%`
        )"
        :key="index"
        :width="width"
        height="1rem"
      />
    </div>

    <!-- Right: Inputs (slot) -->
    <div class="max-w-3xl w-full flex flex-col gap-8 max-md:gap-6">
      <slot />
    </div>
  </fieldset>
</template>
