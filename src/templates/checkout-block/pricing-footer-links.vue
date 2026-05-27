<template>
  <div class="flex flex-col gap-[10px]">
    <a
      :href="pricingUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="flex items-center gap-1 text-xs leading-5 text-[var(--text-color-link)] hover:underline"
    >
      Learn more about Pricing
      <i class="pi pi-external-link text-[10px]" />
    </a>
    <a
      :href="comparePlansUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="flex items-center gap-1 text-xs leading-5 text-[var(--text-color-link)] hover:underline"
    >
      Compare Plans
      <i class="pi pi-external-link text-[10px]" />
    </a>
  </div>
</template>

<script setup>
  defineOptions({ name: 'pricing-footer-links' })

  defineProps({
    pricingUrl: { type: String, default: 'https://www.azion.com/en/pricing/' },
    comparePlansUrl: { type: String, default: 'https://www.azion.com/en/pricing/' }
  })
</script>
