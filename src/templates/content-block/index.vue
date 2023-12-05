<template>
  <section class="w-full min-h-[calc(100vh-120px)] relative">
    <div class="bg-[#F3652B16]">
      <div class="flex gap-2 items-center w-full max-w-screen-2xl mx-auto py-3 px-8">
        <i class="pi pi-check"></i>
        <p class="text-color-secondary">
          <b class="text-color" >Experiment in progress.</b>
          You're currently using Azion's Platform Kit. Avoid complex setups as this platform is
          currently undergoing testing and fine-tuning.
        </p>
      </div>
    </div>
    <section class="w-full h-full flex flex-col max-w-screen-2xl mx-auto">
      <div
        class="mx-3 sm:mx-8 mt-4"
        v-if="hasHeadingSlot"
      >
        <slot name="heading"></slot>
      </div>
      <div
        class="mx-3 sm:mx-8 mb-8 h-full"
        :class="{ 'mt-4 sm:mt-8': !hasHeadingSlot, 'mt-4': hasHeadingSlot }"
      >
        <slot name="content"></slot>
      </div>
    </section>
    <div
      class="sticky bottom-0"
      id="action-bar"
    ></div>
  </section>
</template>
<script setup>
  defineOptions({ name: 'ContentBlock' })

  import { computed, useSlots } from 'vue'
  const slots = useSlots()
  const hasHeadingSlot = computed(() => !!slots.heading)
</script>
