<template>
  <fieldset
    class="flex max-w-screen-2xl m-auto gap-16 sm:w-full surface-section
    rounded-md border border-neutral-200 p-6 flex-wrap md:flex-nowrap"
  >
    <!-- title and description -->
    <div class="flex flex-col gap-2 flex-1 w-full md:min-w-[400px]">
      <div class="text-color text-xl font-medium">{{ pros.title }}</div>
      <div class="text-color-secondary text-sm font-normal">
        {{ pros.description }}
      </div>
    </div>
    <!-- inputs  -->
    <div class="max-w-3xl w-full flex flex-col gap-4">
      <slot name="inputs"></slot>
    </div>
  </fieldset>
</template>
<script setup>
const pros = defineProps({
  title: { type: String, required: true },
  description: { type: String, required: true },
});
</script>
