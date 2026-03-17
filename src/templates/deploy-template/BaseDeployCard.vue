<script setup>
  defineProps({
    title: {
      type: String,
      required: true
    },
    hideFooter: {
      type: Boolean,
      default: false
    }
  })
</script>

<template>
  <div class="flex flex-col max-w-2xl border surface-border rounded-md">
    <div class="h-14 px-6 border-b surface-border flex items-center justify-between">
      <div class="text-color text-xl font-semibold leading-5">
        {{ title }}
      </div>
      <div
        v-if="$slots['header-right']"
        class="text-sm font-normal text-color-secondary"
      >
        <slot name="header-right" />
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
      v-if="$slots.footer && !hideFooter"
      class="h-14 px-6 border-t surface-border flex flex-col justify-center"
    >
      <slot name="footer" />
    </div>
  </div>
</template>
