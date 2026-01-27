<template>
  <div
    class="border border-[var(--surface-border)] rounded-md bg-[var(--surface-section)] flex flex-col overflow-hidden"
  >
    <div
      class="bg-[var(--surface-50)] border-b border-[var(--surface-border)] px-4 py-1.5 h-11 flex items-center"
    >
      <h2 class="text-base font-semibold text-white">{{ title }}</h2>
    </div>

    <div class="flex-1">
      <slot name="content" />
    </div>

    <div
      v-if="hasFooterSlot"
      class="border-t border-[var(--surface-border)] h-11 flex items-center justify-center px-4"
    >
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup>
  import { computed, useSlots } from 'vue'

  defineOptions({ name: 'HomeCardBlock' })

  defineProps({
    title: {
      type: String,
      required: true
    }
  })

  const slots = useSlots()
  const hasFooterSlot = computed(() => !!slots.footer)
</script>
