<template>
  <fieldset
    class="flex max-w-screen-2xl mx-auto gap-8 lg:gap-16 w-full surface-section rounded-md border surface-border px-8 py-8 xl:py-14 xl:p-14 flex-wrap"
    :class="{ 'lg:flex-nowrap': !isDrawer }"
  >
    <!-- title and description -->
    <div class="flex flex-col gap-2 flex-1 w-full md:min-w-[20rem]">
      <div class="text-color text-xl font-medium">{{ pros.title }}</div>
      <div class="text-color-secondary text-sm font-normal">
        {{ pros.description }}
      </div>
    </div>
    <!-- inputs  -->
    <div
      class="max-w-3xl w-full flex flex-col gap-8"
      :class="{ '-mt-8': isDrawer }"
    >
      <slot name="inputs"></slot>
    </div>
  </fieldset>
</template>
<script setup>
  const pros = defineProps({
    title: { type: String, required: true },
    description: { type: String, required: false },
    isDrawer: { type: Boolean, default: false, required: false }
  })
</script>
