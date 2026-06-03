<template>
  <a
    :href="comparePlansUrl"
    target="_blank"
    rel="noopener noreferrer"
    class="flex items-center gap-1 text-xs leading-5 text-[var(--text-color-link)] hover:underline"
  >
    Compare Plans
    <i class="pi pi-external-link text-[10px]" />
  </a>
</template>

<script setup>
  defineOptions({ name: 'pricing-footer-links' })

  defineProps({
    comparePlansUrl: { type: String, default: 'https://www.azion.com/en/pricing/' }
  })
</script>
