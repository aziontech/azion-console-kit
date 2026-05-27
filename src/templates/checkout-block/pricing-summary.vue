<template>
  <div class="flex flex-col">
    <div class="bg-surface flex flex-col gap-6 px-6 py-6">
      <div class="flex items-center justify-between h-6">
        <span class="text-sm leading-none text-muted">Next Charge Value</span>
        <Currency
          size="small"
          prefix="$"
          :value="formattedNextCharge"
          :showSuffix="false"
        />
      </div>

      <div class="flex items-center justify-between h-6">
        <span class="text-sm leading-none text-muted">Subtotal</span>
        <Currency
          size="small"
          prefix="$"
          :value="formattedSubtotal"
          :suffix="`per ${billingCycleLabel}`"
          :showSuffix="true"
        />
      </div>

      <Transition name="annual-discount-slide">
        <div
          v-if="yearlyDiscount > 0"
          class="flex items-center justify-between h-6"
        >
          <span class="text-sm leading-none text-muted">Yearly Discount</span>
          <Currency
            size="small"
            prefix="-$"
            :value="formattedYearlyDiscount"
            suffix="per month"
            :showSuffix="true"
          />
        </div>
      </Transition>

      <Transition name="annual-discount-slide">
        <div
          v-if="currentPlanCredit > 0"
          class="flex items-center justify-between h-6"
        >
          <span class="text-sm leading-none text-muted">Current Plan Credit</span>
          <Currency
            size="small"
            prefix="-$"
            :value="formattedCurrentPlanCredit"
            :showSuffix="false"
          />
        </div>
      </Transition>
    </div>

    <div
      class="bg-surface border-t border-[var(--border-muted)] flex items-center justify-between px-6 py-4"
    >
      <span class="text-lg leading-[1.4] text-default">Total</span>
      <Currency
        size="large"
        prefix="$"
        :value="formattedTotal"
        :suffix="`per ${billingCycleLabel}`"
        :showSuffix="true"
      />
    </div>
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import Currency from '@aziontech/webkit/content/currency'

  defineOptions({ name: 'pricing-summary' })

  const props = defineProps({
    subtotal: { type: Number, required: true },
    yearlyDiscount: { type: Number, default: 0 },
    currentPlanCredit: { type: Number, default: 0 },
    total: { type: Number, required: true },
    billingCycleLabel: { type: String, required: true }
  })

  const formatPrice = (value) => Number(value).toFixed(2)

  const formattedSubtotal = computed(() => formatPrice(props.subtotal))
  const formattedYearlyDiscount = computed(() => formatPrice(props.yearlyDiscount))
  const formattedCurrentPlanCredit = computed(() => formatPrice(props.currentPlanCredit))
  const formattedTotal = computed(() => formatPrice(props.total))
  const formattedNextCharge = computed(() => formatPrice(props.total))
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
