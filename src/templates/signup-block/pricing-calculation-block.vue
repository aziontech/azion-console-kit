<template>
  <div class="border border-default border-solid rounded-md bg-surface">
    <div class="bg-surface flex items-center justify-between px-6 py-3 border-b border-default">
      <span class="text-lg font-semibold text-default">{{ planLabel }}</span>
    </div>

    <div class="flex flex-col gap-4 p-6">
      <div class="flex items-center justify-between">
        <span class="text-sm text-muted">Charged</span>
        <div class="flex gap-1 p-1 bg-[var(--surface-300)] rounded-md">
          <button
            class="px-3 py-1.5 text-xs font-protomono rounded transition-colors"
            :class="
              billingCycle === 'monthly' ? 'bg-[var(--surface-0)] text-default' : 'text-muted'
            "
            @click="setBillingCycle('monthly')"
          >
            Monthly
          </button>
          <button
            class="px-3 py-1.5 text-xs font-protomono rounded transition-colors"
            :class="billingCycle === 'yearly' ? 'bg-[var(--surface-0)] text-default' : 'text-muted'"
            @click="setBillingCycle('yearly')"
          >
            Yearly
          </button>
        </div>
      </div>

      <div class="flex flex-col gap-5">
        <div class="flex flex-col gap-1">
          <div class="flex gap-3 items-center">
            <div class="w-[204px] max-w-full">
              <FieldInput
                name="couponCode"
                :value="couponCode"
                placeholder="Cupom Code"
                class="w-full"
                :disabled="isCouponLocked"
                @input="setCouponCode($event)"
              />
            </div>
            <Button
              class="font-protomono text-xs flex items-center justify-center h-8 min-w-[72px]"
              :disabled="isCouponLocked"
              outlined
              @click="submitCupom"
            >
              <span
                v-if="isApplyingCoupon"
                class="inline-flex items-center justify-center"
                aria-label="Applying coupon"
              >
                <i class="pi pi-spinner text-sm coupon-loader-spinner" />
              </span>
              <span v-else>Apply</span>
            </Button>
          </div>
          <small
            v-if="couponError"
            class="p-error text-xs font-normal leading-tight"
          >
            {{ couponError }}
          </small>
        </div>

        <Transition name="applied-coupon-slide">
          <div
            v-if="appliedCoupon"
            class="flex items-start gap-2 border rounded-md p-4 bg-[rgba(74,222,128,0.16)] border-[rgba(74,222,128,0.32)]"
          >
            <div class="flex-1 min-w-0">
              <p class="text-[13px] font-semibold text-default leading-normal">
                #BrazilMentioned: ThePrimeagen - 5% OFF
              </p>
              <p class="text-xs uppercase text-muted leading-normal mt-1">PRIMEAGEN</p>
            </div>
            <button
              type="button"
              aria-label="Remove coupon"
              class="h-8 w-8 rounded-md flex items-center justify-center text-default hover:bg-white/5 transition-colors"
              @click="removeCoupon"
            >
              <i class="pi pi-times text-sm" />
            </button>
          </div>
        </Transition>
      </div>
    </div>

    <div class="bg-surface flex flex-col gap-2 px-6 py-4 border-t border-default">
      <div class="flex justify-between text-sm">
        <span class="text-muted">Subtotal</span>
        <span class="text-default">${{ subtotal }}/{{ billingCycleLabel }}</span>
      </div>
      <div
        v-if="discount > 0"
        class="flex justify-between text-sm"
      >
        <span class="text-muted">Discount</span>
        <div class="text-right">
          <span class="text-success">-${{ discount }}/{{ billingCycleLabel }}</span>
          <span
            v-if="billingCycle === 'yearly'"
            class="block text-xs text-muted"
          >
            Yearly Discount
          </span>
        </div>
      </div>
      <div class="flex justify-between text-base font-semibold">
        <span class="text-default">Total</span>
        <span class="text-default">
          <span class="text-muted font-normal">$</span>
          {{ total }}
          <span class="text-muted font-normal text-sm">/{{ billingCycleLabel }}</span>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import Button from '@aziontech/webkit/button'
  import FieldInput from '@aziontech/webkit/field-text'
  import { usePlans } from '@/composables/usePlans'

  defineOptions({
    name: 'pricing-calculation-block'
  })

  const emit = defineEmits(['update:billingCycle', 'update:couponCode', 'pricingChange'])

  const props = defineProps({
    plan: {
      type: String,
      required: true,
      validator: (value) => ['pro', 'scale'].includes(value)
    }
  })

  const { initialize, billingCycle: sharedBillingCycle, cupom: sharedCupom, setParam } = usePlans()

  const VALID_COUPON = 'THEPRIMEGEN'
  const REQUEST_DELAY_MS = 3000

  const billingCycle = ref('yearly')
  const couponCode = ref('')
  const appliedCoupon = ref(false)
  const isApplyingCoupon = ref(false)
  const couponError = ref('')

  const planPricing = {
    pro: { monthly: 25, yearly: 300 },
    scale: { monthly: 50, yearly: 600 }
  }

  const planLabel = computed(() => (props.plan === 'pro' ? 'Pro Plan' : 'Scale Plan'))

  const subtotal = computed(() => {
    return planPricing[props.plan]?.[billingCycle.value] || 0
  })

  const discount = computed(() => {
    if (billingCycle.value === 'yearly') {
      return Math.round(subtotal.value * 0.2)
    }

    return appliedCoupon.value ? Math.round(subtotal.value * 0.1) : 0
  })

  const total = computed(() => {
    return subtotal.value - discount.value
  })

  const billingCycleLabel = computed(() => {
    return billingCycle.value === 'monthly' ? 'month' : 'year'
  })

  const isCouponLocked = computed(() => {
    return appliedCoupon.value || isApplyingCoupon.value
  })

  const setBillingCycle = (value) => {
    billingCycle.value = value
  }

  const setCouponCode = (value) => {
    couponCode.value = value
  }

  const submitCupom = async () => {
    const coupon = couponCode.value.trim()

    if (!coupon || isApplyingCoupon.value) return

    isApplyingCoupon.value = true
    couponError.value = ''

    await new Promise((resolve) => {
      setTimeout(resolve, REQUEST_DELAY_MS)
    })

    if (coupon === VALID_COUPON) {
      appliedCoupon.value = true
      couponError.value = ''
    } else {
      appliedCoupon.value = false
      couponError.value = 'Invalid coupon code'
    }

    isApplyingCoupon.value = false
  }

  const removeCoupon = () => {
    appliedCoupon.value = false
    couponError.value = ''
    couponCode.value = ''
    setParam('cupom', null)
  }

  initialize()
  billingCycle.value = sharedBillingCycle.value || 'yearly'
  couponCode.value = sharedCupom.value || ''

  onMounted(async () => {
    if (couponCode.value.trim()) {
      await submitCupom()
    }
  })

  watch(billingCycle, (value) => {
    setParam('billingCycle', value)
    emit('update:billingCycle', value)
  })

  watch(couponCode, (value) => {
    couponError.value = ''
    appliedCoupon.value = false
    setParam('cupom', value || null)
    emit('update:couponCode', value)
  })

  watch(
    [subtotal, discount, total, billingCycleLabel],
    () => {
      emit('pricingChange', {
        subtotal: subtotal.value,
        discount: discount.value,
        total: total.value,
        billingCycle: billingCycle.value,
        billingCycleLabel: billingCycleLabel.value
      })
    },
    { immediate: true }
  )

  defineExpose({
    billingCycle,
    couponCode,
    subtotal,
    discount,
    total
  })
</script>

<style scoped>
  .applied-coupon-slide-enter-active,
  .applied-coupon-slide-leave-active {
    transition:
      opacity 220ms ease,
      transform 220ms ease,
      max-height 220ms ease;
    overflow: hidden;
    max-height: 120px;
  }

  .applied-coupon-slide-enter-from,
  .applied-coupon-slide-leave-to {
    opacity: 0;
    transform: translateY(-8px);
    max-height: 0;
  }

  .applied-coupon-slide-enter-to,
  .applied-coupon-slide-leave-from {
    opacity: 1;
    transform: translateY(0);
    max-height: 120px;
  }

  .coupon-loader-spinner {
    animation: coupon-loader-spin 0.85s linear infinite;
    transform-origin: center;
    display: inline-block;
  }

  @keyframes coupon-loader-spin {
    from {
      transform: rotate(0deg);
    }

    to {
      transform: rotate(360deg);
    }
  }
</style>
