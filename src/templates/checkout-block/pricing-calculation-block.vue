<template>
  <div class="border border-default border-solid rounded-md bg-surface">
    <PlanCardHeader :label="planLabel">
      <template #action>
        <BillingCycleToggle
          v-model="billingCycle"
          :disabled="Boolean(props.lockedCycle) || isPreparing"
        />
      </template>
    </PlanCardHeader>

    <PricingSummary
      :subtotal="subtotal"
      :yearlyDiscount="yearlyDiscount"
      :currentPlanCredit="currentPlanCredit"
      :total="total"
      :billingCycleLabel="billingCycleLabel"
    />
  </div>
</template>

<script setup>
  import { computed, onBeforeUnmount, ref, watch } from 'vue'
  import { useToast } from '@aziontech/webkit/use-toast'
  import { usePlans } from '@/composables/usePlans'
  import { useCheckoutSessionPreparer } from '@/composables/useCheckoutSessionPreparer'
  import { serviceOrdersService } from '@/services/v2/service-orders/service-orders-service'
  import { getPlanPricing } from '@/composables/usePlansService'
  import PlanCardHeader from '@/templates/checkout-block/plan-card-header.vue'
  import BillingCycleToggle from '@/templates/checkout-block/billing-cycle-toggle.vue'
  import PricingSummary from '@/templates/checkout-block/pricing-summary.vue'

  defineOptions({
    name: 'pricing-calculation-block'
  })

  const emit = defineEmits([
    'update:billingCycle',
    'update:checkoutSessionClientSecret',
    'pricingChange'
  ])

  const props = defineProps({
    plan: {
      type: String,
      required: true,
      validator: (value) => value === 'pro'
    },
    lockedCycle: {
      type: String,
      default: null,
      validator: (value) => value === null || ['monthly', 'yearly'].includes(value)
    },
    mode: {
      type: String,
      default: 'subscribe',
      validator: (value) => ['subscribe', 'edit', 'change-cycle'].includes(value)
    }
  })

  const toast = useToast()
  const { initialize, billingCycle: sharedBillingCycle, setParam } = usePlans()
  const { data: plans } = serviceOrdersService.useListPlansQuery()
  const { prepare: prepareCheckoutSession, isPreparing } = useCheckoutSessionPreparer()

  const billingCycle = ref('monthly')

  const planPricing = computed(() => getPlanPricing(plans.value, props.plan))

  const planLabel = computed(() => (props.plan === 'pro' ? 'Pro Plan' : props.plan))

  const subtotal = computed(() => {
    if (billingCycle.value === 'yearly') {
      return (planPricing.value?.monthly || 0) * 12
    }
    return planPricing.value?.monthly || 0
  })

  const yearlyDiscount = computed(() => {
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

  const currentPlanCredit = computed(() => {
    if (props.mode !== 'change-cycle') return 0
    if (billingCycle.value !== 'yearly') return 0
    return planPricing.value?.monthly || 0
  })

  const discount = computed(() => yearlyDiscount.value + currentPlanCredit.value)

  const total = computed(() => Math.max(basePlanPrice.value - currentPlanCredit.value, 0))

  const billingCycleLabel = computed(() => (billingCycle.value === 'monthly' ? 'month' : 'year'))

  initialize()
  // `lockedCycle` wins so the toggle reflects the cycle the user already
  // committed to outside the drawer (e.g. Pro/m → Pro/y from BillsView).
  billingCycle.value = props.lockedCycle || sharedBillingCycle.value || 'monthly'

  watch(
    () => props.lockedCycle,
    (value) => {
      if (value) billingCycle.value = value
    }
  )

  const BILLING_CYCLE_DEBOUNCE_MS = 250
  let pendingPlanPricingTimer = null

  const flushPlanPricingUpdate = async (value) => {
    emit('update:checkoutSessionClientSecret', '')
    try {
      const secret = await prepareCheckoutSession({
        plan: props.plan,
        preferredCycle: value
      })
      if (secret) {
        emit('update:checkoutSessionClientSecret', secret)
      }
    } catch (err) {
      const detail =
        (Array.isArray(err?.message) ? err.message[0] : err?.message) ||
        'Unable to update billing cycle. Please try again.'
      toast.add({ severity: 'error', summary: 'Error', detail, closable: true })
    }
  }

  watch(billingCycle, (value) => {
    setParam('billingCycle', value)
    emit('update:billingCycle', value)

    if (pendingPlanPricingTimer) {
      clearTimeout(pendingPlanPricingTimer)
    }
    pendingPlanPricingTimer = setTimeout(() => {
      pendingPlanPricingTimer = null
      flushPlanPricingUpdate(value)
    }, BILLING_CYCLE_DEBOUNCE_MS)
  })

  onBeforeUnmount(() => {
    if (pendingPlanPricingTimer) {
      clearTimeout(pendingPlanPricingTimer)
      pendingPlanPricingTimer = null
    }
  })

  watch(
    [subtotal, discount, currentPlanCredit, total, billingCycleLabel],
    () => {
      emit('pricingChange', {
        subtotal: subtotal.value,
        discount: discount.value,
        currentPlanCredit: currentPlanCredit.value,
        total: total.value,
        billingCycle: billingCycle.value,
        billingCycleLabel: billingCycleLabel.value
      })
    },
    { immediate: true }
  )

  defineExpose({
    billingCycle,
    subtotal,
    discount,
    currentPlanCredit,
    total
  })
</script>
