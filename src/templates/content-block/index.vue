<template>
  <section class="w-full flex flex-col flex-1 relative">
    <section class="w-full flex flex-col flex-1 px-8 pt-4 pb-8">
      <div v-if="hasHeadingSlot">
        <slot name="headi ng" />
      </div>
      <div
        class="h-full flex flex-1 flex-col"
        :class="{ 'mt-4': hasHeadingSlot }"
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
