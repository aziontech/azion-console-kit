<template>
  <fieldset
    class="flex max-w-screen-2xl-test mx-auto gap-8 w-full surface-section px-8 py-8 rounded-md flex-wrap min-w-[2rem] lg:flex-nowrap xl:py-14 xl:p-14 lg:gap-16 border surface-border"
  >
    <div class="flex flex-col gap-2 flex-1 w-full md:min-w-[15rem]">
      <Skeleton
        :width="titleWidth"
        height="1.75rem"
        class="mb-2"
      />
      <Skeleton
        v-for="(w, i) in descriptionWidths"
        :key="i"
        :width="w"
        height="1rem"
      />
    </div>
    <div class="max-w-3xl w-full flex flex-col gap-8 max-md:gap-6">
      <slot />
    </div>
  </fieldset>
</template>

<script setup>
  import Skeleton from '@aziontech/webkit/skeleton'

  defineOptions({ name: 'fieldset-skeleton' })

  defineProps({
    titleWidth: {
      type: String,
      default: '5rem'
    },
    descriptionWidths: {
      type: Array,
      default: () => ['100%', '80%']
    }
  })
</script>
