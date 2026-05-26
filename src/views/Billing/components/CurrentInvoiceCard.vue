<template>
  <CardBox
    title="Current Invoice"
    class="w-full min-[1100px]:w-1/2 current-invoice-card"
  >
    <template #header-action>
      <ActionButton
        label="Details"
        kind="secondary"
        size="small"
        icon="pi pi-file"
        :disabled="!invoice.redirectId"
        @click="emitViewDetails"
      />
    </template>

    <template #content>
      <div class="flex flex-col">
        <div class="flex flex-col gap-4 px-6 py-4">
          <SubscriptionPlanRow label="Billing Period">
            <span class="text-color">{{ billingPeriodLabel }}</span>
          </SubscriptionPlanRow>

          <SubscriptionPlanRow label="Plan Charge">
            <span class="text-color">
              <span class="text-color-secondary">$</span>
              {{ planChargeFormatted }}
            </span>
          </SubscriptionPlanRow>

          <SubscriptionPlanRow label="Extra Product Charges">
            <span class="text-color">
              <span class="text-color-secondary">$</span>
              {{ extraProductCharges }}
            </span>
          </SubscriptionPlanRow>

          <SubscriptionPlanRow label="Professional Services Plan Charges">
            <span class="text-color">
              <span class="text-color-secondary">$</span>
              {{ servicePlanCharges }}
            </span>
          </SubscriptionPlanRow>

          <SubscriptionPlanRow label="Credit Balance">
            <span class="text-color"><span class="text-color-secondary">$</span> 0</span>
          </SubscriptionPlanRow>
        </div>

        <div
          class="flex flex-col gap-4 px-6 py-4 border-t border-[var(--surface-border)] bg-[var(--surface-section)]"
        >
          <div class="flex items-center justify-between text-[13px] leading-5">
            <span class="text-color-secondary">Credit that will be used for payment</span>
            <span class="text-color">
              <span class="text-color-secondary">$</span>
              {{ creditUsedValue }}
            </span>
          </div>
          <div class="flex items-center justify-between">
            <div class="flex items-end gap-3">
              <span class="text-xl font-semibold leading-8 text-color">Total</span>
              <span class="text-[13px] leading-7 text-color-secondary">Amount Payable</span>
            </div>
            <span class="flex items-baseline gap-1 text-color">
              <span class="text-[13px] text-color-secondary">$</span>
              <span class="text-xl font-semibold leading-8">{{ totalValue }}</span>
            </span>
          </div>
        </div>
      </div>
    </template>
  </CardBox>
</template>

<script setup>
  import { computed } from 'vue'
  import ActionButton from '@aziontech/webkit/actions/button'
  import CardBox from '@aziontech/webkit/content/card-box'
  import SubscriptionPlanRow from './SubscriptionPlanRow.vue'

  defineOptions({ name: 'current-invoice-card' })

  const props = defineProps({
    invoice: { type: Object, default: () => ({}) },
    subscription: { type: Object, default: () => ({}) }
  })

  const emit = defineEmits(['view-details'])

  const formatAmount = (value) => {
    if (value === null || value === undefined || value === '---' || value === '--') return '--'
    const number = Number(value)
    if (Number.isNaN(number)) return String(value)
    const hasCents = Math.round(number * 100) % 100 !== 0
    return hasCents ? number.toFixed(2) : number.toFixed(0)
  }

  const toNumber = (value) => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0
    if (typeof value === 'string') {
      const stripped = value.replace(/[^\d.-]/g, '')
      const parsed = Number(stripped)
      return Number.isFinite(parsed) ? parsed : 0
    }
    return 0
  }

  // Plan price drives "Plan Charge". Sourced from the SO's pricing (resolved
  // by `useCurrentSubscription` against the plans catalog) — the legacy
  // invoice endpoint doesn't carry it.
  const billingPeriodLabel = computed(
    () => props.subscription?.billingPeriod || props.invoice?.billingPeriod || '--'
  )

  const planChargeNumeric = computed(() => toNumber(props.subscription?.planChargeValue))
  const planChargeFormatted = computed(() => formatAmount(planChargeNumeric.value))

  const servicePlanChargesNumeric = computed(() => toNumber(props.invoice?.servicePlan))
  const servicePlanCharges = computed(() => formatAmount(servicePlanChargesNumeric.value))

  const extraProductChargesNumeric = computed(() => toNumber(props.invoice?.extraProductCharges))
  const extraProductCharges = computed(() => formatAmount(extraProductChargesNumeric.value))

  const creditUsedNumeric = computed(() => toNumber(props.invoice?.creditUsedForPayment))
  const creditUsedValue = computed(() => formatAmount(creditUsedNumeric.value))

  const amountChargedNumeric = computed(() => {
    const raw = props.subscription?.currentInvoiceAmountCharged
    if (raw === null || raw === undefined) return null
    const parsed = Number(raw)
    if (!Number.isFinite(parsed) || parsed <= 0) return null
    return parsed
  })

  const totalValue = computed(() => {
    if (amountChargedNumeric.value !== null) {
      return formatAmount(amountChargedNumeric.value)
    }
    const subtotal =
      planChargeNumeric.value + extraProductChargesNumeric.value + servicePlanChargesNumeric.value
    const total = Math.max(subtotal - creditUsedNumeric.value, 0)
    return formatAmount(total)
  })

  const emitViewDetails = () => {
    // `redirectId` is the "is the details page reachable?" flag the legacy
    // service exposes, but the actual route param is `billId`. Emit the
    // whole invoice so BillsView's handler can pick the right field — same
    // pattern dev branch uses.
    if (!props.invoice?.redirectId) return
    emit('view-details', props.invoice)
  }
</script>
