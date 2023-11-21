<template>
  <section class="w-full min-h-[calc(100vh-120px)]">
    <section class="w-full h-full flex flex-col max-w-screen-2xl mx-auto">
      <div class="mx-8 mt-4">
        <slot
          v-if="hasHeadingSlot"
          name="heading"
        ></slot>
      </div>
      <div
        class="mx-8 mb-8 h-full"
        :class="{ 'mt-8': !hasHeadingSlot, 'mt-4': hasHeadingSlot }"
      >
        <slot name="content"></slot>
      </div>
    </section>
    <slot
      v-if="hasActionsSlot"
      name="actions"
    >
    </slot>
  </section>
</template>
<script setup>
  import { computed, useSlots } from 'vue'
  const slots = useSlots()
  const hasHeadingSlot = computed(() => !!slots.heading)
  const hasActionsSlot = computed(() => !!slots.actions)
</script>
