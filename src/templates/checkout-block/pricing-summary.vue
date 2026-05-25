<template>
  <div class="bg-surface flex flex-col gap-2 px-6 py-4 border-t border-default">
    <div
      v-if="$slots.toggle"
      class="flex justify-end"
    >
      <slot name="toggle" />
    </div>

    <div class="flex justify-between text-sm">
      <span class="text-muted">Subtotal</span>
      <span class="text-default">${{ formattedSubtotal }}/{{ billingCycleLabel }}</span>
    </div>

    <Transition name="annual-discount-slide">
      <div
        v-if="yearlyDiscount > 0"
        class="flex justify-between text-sm"
      >
        <span class="text-muted">Annual Discount</span>
        <div class="text-right">
          <span class="text-success">-${{ formattedYearlyDiscount }}/year</span>
          <span class="block text-xs text-muted"> Yearly Discount </span>
        </div>
      </div>
    </Transition>

    <div class="flex justify-between text-base font-semibold">
      <span class="text-default">Total</span>
      <span class="text-default">
        <span class="text-muted font-normal">$</span>
        {{ formattedTotal }}
        <span class="text-muted font-normal text-sm">/{{ billingCycleLabel }}</span>
      </span>
    </div>
  </div>
</template>

<script setup>
  import { computed } from 'vue'

  defineOptions({ name: 'pricing-summary' })

  const props = defineProps({
    subtotal: { type: Number, required: true },
    yearlyDiscount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    billingCycleLabel: { type: String, required: true }
  })

  const formatPrice = (value) => Number(value).toFixed(2)

  const formattedSubtotal = computed(() => formatPrice(props.subtotal))
  const formattedYearlyDiscount = computed(() => formatPrice(props.yearlyDiscount))
  const formattedTotal = computed(() => formatPrice(props.total))
</script>

<style scoped>
  .annual-discount-slide-enter-active,
  .annual-discount-slide-leave-active {
    transition:
      opacity 220ms ease,
      transform 220ms ease,
      max-height 220ms ease;
    overflow: hidden;
    max-height: 120px;
  }

  .annual-discount-slide-enter-from,
  .annual-discount-slide-leave-to {
    opacity: 0;
    transform: translateY(-8px);
    max-height: 0;
  }

  .annual-discount-slide-enter-to,
  .annual-discount-slide-leave-from {
    opacity: 1;
    transform: translateY(0);
    max-height: 120px;
  }
</style>
