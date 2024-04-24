<template>
  <fieldset
    class="flex max-w-screen-2xl-test mx-auto gap-8 w-full surface-section rounded-md border surface-border px-8 py-8 flex-wrap min-w-[2rem]"
    :class="{ 'lg:flex-nowrap xl:py-14 xl:p-14 lg:gap-16': !isDrawer }"
  >
    <!-- title and description -->
    <div class="flex flex-col gap-2 flex-1 w-full md:min-w-[20rem]">
      <div class="text-color text-xl font-medium">{{ props.title }}</div>
      <div
        class="text-color-secondary text-sm font-normal flex flex-col gap-2"
        style="white-space: pre-line"
      >
        <slot name="description">
          {{ props.description }}
        </slot>
      </div>
    </div>
    <!-- inputs  -->
    <div class="max-w-3xl w-full flex flex-col gap-8 max-md:gap-6">
      <slot name="inputs"></slot>
    </div>
  </fieldset>
</template>
<script setup>
  const props = defineProps({
    title: { type: String, required: true },
    description: { type: String },
    isDrawer: { type: Boolean, default: false }
  })
</script>
