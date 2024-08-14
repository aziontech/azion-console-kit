<template>
  <div class="flex items-center gap-2">
    <i
      :class="`flag flag-${code} h-4 w-6`"
      aria-hidden="true"
    />
    <span class="text-base">{{ country }}</span>
  </div>
</template>

<script setup>
  defineProps({
    country: {
      type: String,
      required: true
    },
    code: {
      type: String,
      required: true
    }
  })
</script>
