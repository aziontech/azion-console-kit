<template>
  <div
    class="flex flex-col gap-6 border-b lg:border-b-0 lg:border-l surface-border bg-surface p-4 lg:p-6 w-full lg:max-w-[300px] flex-1"
  >
    <p class="text-[13px] leading-[21px] text-color-secondary text-center lg:text-left">
      <span>Upgrade to </span>
      <span class="font-semibold">{{ planName }}</span>
      <span> to power your businesses with advanced security and compliance.</span>
    </p>

    <div class="flex flex-col gap-6">
      <FeaturesList
        title="Upgrade features"
        :features="planFeatures"
      />

      <PricingFooterLinks />
    </div>
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import FeaturesList from '@/templates/checkout-block/features-list.vue'
  import PricingFooterLinks from '@/templates/checkout-block/pricing-footer-links.vue'
  import {
    getPlanLabel,
    getPlanFeatures
  } from '@/templates/checkout-block/helpers/plan-features.js'

  defineOptions({
    name: 'checkout-features-block'
  })

  const props = defineProps({
    plan: {
      type: String,
      required: true,
      validator: (value) => ['hobby', 'pro'].includes(value)
    }
  })

  const planName = computed(() => getPlanLabel(props.plan))
  const planFeatures = computed(() => getPlanFeatures(props.plan))
</script>
