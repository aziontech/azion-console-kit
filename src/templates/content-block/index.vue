<template>
  <section class="w-full min-h-[calc(100vh-120px)] relative">
    <section class="w-full h-full flex flex-col mx-auto">
      <ProjectStageMessageBlock />
      <div
        class="mx-3 md:mx-8 mt-4"
        v-if="hasHeadingSlot"
      >
        <slot name="heading"></slot>
      </div>
      <div
        class="mx-3 md:mx-8 mb-8 h-full"
        :class="{ 'mt-4 md:mx-8': !hasHeadingSlot, 'mt-4': hasHeadingSlot }"
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

  import ProjectStageMessageBlock from './project-stage-message-block.vue'
  import { computed, useSlots } from 'vue'
  const slots = useSlots()
  const hasHeadingSlot = computed(() => !!slots.heading)
</script>
