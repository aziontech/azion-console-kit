<script setup>
  /**
   * BaseDeployCard.vue
   *
   * Base presentational component for deploy template cards.
   * Provides a consistent structure with slots for customization.
   *
   * Structure:
   * - Header: title + header-meta slot
   * - Content: main content slot
   * - Footer: footer slot for actions
   *
   * This component is 100% presentational - no state, no business logic.
   *
   * Props:
   * - title: Card header title (required)
   *
   * Slots:
   * - header-meta: Optional area below title for step-specific content
   * - content: Required main content area
   * - footer: Required action button area
   */
  defineProps({
    title: {
      type: String,
      required: true
    }
  })
</script>

<template>
  <div class="flex flex-col max-w-2xl border surface-border rounded-md min-h-[400px]">
    <div class="h-14 px-6 border-b surface-border flex items-center">
      <div class="flex-1 text-color text-xl font-semibold leading-5">
        {{ title }}
      </div>
    </div>

    <div
      v-if="$slots['header-meta']"
      class="px-6 py-4 border-b surface-border bg-[var(--surface-50)]"
    >
      <slot name="header-meta" />
    </div>

    <div class="p-6 bg-[var(--surface-50)] flex flex-col gap-6 flex-1">
      <slot name="content" />
    </div>

    <div
      v-if="$slots.footer"
      class="h-14 px-6 border-t surface-border flex flex-col justify-center"
    >
      <slot name="footer" />
    </div>
  </div>
</template>
