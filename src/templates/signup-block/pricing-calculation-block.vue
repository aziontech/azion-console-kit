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
                {{ appliedCoupon.code }} - {{ appliedCoupon.discountPreview?.value }}% OFF
              </p>
              <p class="text-xs uppercase text-muted leading-normal mt-1">
                {{ appliedCoupon.code }}
              </p>
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
        <span class="text-default">${{ formattedSubtotal }}/{{ billingCycleLabel }}</span>
      </div>
      <Transition name="applied-coupon-slide">
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
      <Transition name="applied-coupon-slide">
        <div
          v-if="couponDiscount > 0"
          class="flex justify-between text-sm"
        >
          <span class="text-muted">Coupon Discount</span>
          <div class="text-right">
            <span class="text-success"
              >-${{ formattedCouponDiscount }}/{{ billingCycleLabel }}</span
            >
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
  </div>
</template>

<script setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import Button from '@aziontech/webkit/button'
  import FieldInput from '@aziontech/webkit/field-text'
  import { usePlans } from '@/composables/usePlans'
  import { serviceOrdersService } from '@/services/v2/service-orders/service-orders-service'
  import { useValidateCoupon, getPlanPricing } from '@/composables/usePlansService'

  defineOptions({
    name: 'pricing-calculation-block'
  })

  const emit = defineEmits(['update:billingCycle', 'update:couponCode', 'pricingChange'])

  const props = defineProps({
    plan: {
      type: String,
      required: true,
      validator: (value) => value === 'pro'
    }
  })

  const { initialize, billingCycle: sharedBillingCycle, cupom: sharedCupom, setParam } = usePlans()
  const { data: plans } = serviceOrdersService.useListPlansQuery()
  const { mutate: validateCoupon, isPending: isValidatingCoupon } = useValidateCoupon()

  const billingCycle = ref('yearly')
  const couponCode = ref('')
  const appliedCoupon = ref(null)
  const couponError = ref('')

  const planPricing = computed(() => getPlanPricing(plans.value, props.plan))

  const planLabel = computed(() => (props.plan === 'pro' ? 'Pro Plan' : props.plan))

  const subtotal = computed(() => {
    // Monthly: subtotal = monthly price
    // Yearly: subtotal = monthly * 12 (what it would cost if paid monthly for 12 months)
    if (billingCycle.value === 'yearly') {
      return (planPricing.value?.monthly || 0) * 12
    }
    return planPricing.value?.monthly || 0
  })

  const yearlyDiscount = computed(() => {
    // Yearly discount = difference between (monthly * 12) and yearly
    if (billingCycle.value === 'yearly') {
      const monthlyEquivalent = (planPricing.value?.monthly || 0) * 12
      const yearlyPrice = planPricing.value?.yearly || 0
      return monthlyEquivalent - yearlyPrice
    }
    return 0
  })

  const basePlanPrice = computed(() => {
    return billingCycle.value === 'yearly'
      ? planPricing.value?.yearly || 0
      : planPricing.value?.monthly || 0
  })

  const couponDiscount = computed(() => {
    // Coupon discount (works for both monthly and yearly)
    if (appliedCoupon.value?.valid && appliedCoupon.value?.discountPreview) {
      const { type, value } = appliedCoupon.value.discountPreview
      if (type === 'percent') {
        return Math.round(basePlanPrice.value * (value / 100))
      }
      if (type === 'fixed') {
        return value
      }
    }
    return 0
  })

  const discount = computed(() => {
    return yearlyDiscount.value + couponDiscount.value
  })

  const total = computed(() => {
    return basePlanPrice.value - couponDiscount.value
  })

  const billingCycleLabel = computed(() => {
    return billingCycle.value === 'monthly' ? 'month' : 'year'
  })

  const formatPrice = (value) => {
    return Number(value).toFixed(2)
  }

  const formattedSubtotal = computed(() => formatPrice(subtotal.value))
  const formattedYearlyDiscount = computed(() => formatPrice(yearlyDiscount.value))
  const formattedCouponDiscount = computed(() => formatPrice(couponDiscount.value))
  const formattedTotal = computed(() => formatPrice(total.value))

  const isApplyingCoupon = computed(() => isValidatingCoupon.value)

  const isCouponLocked = computed(() => {
    return appliedCoupon.value || isApplyingCoupon.value
  })

  const setBillingCycle = (value) => {
    billingCycle.value = value
  }

  const setCouponCode = (value) => {
    couponCode.value = value
  }

  const submitCupom = () => {
    const coupon = couponCode.value.trim()

    if (!coupon || isValidatingCoupon.value) return

    couponError.value = ''
    const plan = plans.value?.find((item) => item.sku.toLowerCase() === props.plan.toLowerCase())

    validateCoupon(
      { code: coupon, planId: plan?.id },
      {
        onSuccess: (data) => {
          if (data.valid) {
            appliedCoupon.value = data
            couponError.value = ''
          } else {
            appliedCoupon.value = null
            couponError.value = data.reasons?.[0] || 'Invalid coupon code'
          }
        },
        onError: () => {
          appliedCoupon.value = null
          couponError.value = 'Failed to validate coupon'
        }
      }
    )
  }

  const removeCoupon = () => {
    appliedCoupon.value = null
    couponError.value = ''
    couponCode.value = ''
    setParam('cupom', null)
  }

  initialize()
  billingCycle.value = sharedBillingCycle.value || 'yearly'
  couponCode.value = sharedCupom.value || ''

  onMounted(() => {
    if (couponCode.value.trim()) {
      submitCupom()
    }
  })

  watch(billingCycle, (value) => {
    setParam('billingCycle', value)
    emit('update:billingCycle', value)
  })

  watch(couponCode, (value) => {
    couponError.value = ''
    appliedCoupon.value = null
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
