<template>
  <CardBox
    title="Current Invoice"
    class="w-full min-[1100px]:w-1/2 current-invoice-card"
  >
    <template #header-action>
      <ActionButton
        label="Details"
        kind="outlined"
        size="medium"
        icon="pi pi-file-o"
        :disabled="!invoice.redirectId"
        @click="emitViewDetails"
      />
    </template>

    <template #content>
      <div class="flex flex-col">
        <div class="flex flex-col gap-3 px-6 py-4">
          <SubscriptionPlanRow label="Billing Period">
            <span class="text-color">{{ billingPeriodLabel }}</span>
          </SubscriptionPlanRow>

          <SubscriptionPlanRow label="Plan Charge">
            <Currency
              size="small"
              prefix="$"
              :value="planChargeFormatted"
              :showSuffix="false"
            />
          </SubscriptionPlanRow>

          <SubscriptionPlanRow label="Extra Product Charges">
            <Currency
              size="small"
              prefix="$"
              :value="extraProductCharges"
              :showSuffix="false"
            />
          </SubscriptionPlanRow>

          <SubscriptionPlanRow label="Professional Services Plan Charges">
            <Currency
              size="small"
              prefix="$"
              :value="servicePlanCharges"
              :showSuffix="false"
            />
          </SubscriptionPlanRow>

          <SubscriptionPlanRow label="Credit Balance">
            <Currency
              size="small"
              prefix="$"
              value="0"
              :showSuffix="false"
            />
          </SubscriptionPlanRow>
        </div>

        <div class="flex flex-col gap-2 px-6 py-4 border-t border-[var(--surface-border)]">
          <SubscriptionPlanRow label="Credit that will be used for payment">
            <Currency
              size="small"
              prefix="$"
              :value="creditUsedValue"
              :showSuffix="false"
            />
          </SubscriptionPlanRow>
          <div class="flex items-center justify-between">
            <span class="text-lg leading-[1.4] text-color">Total</span>
            <SkeletonBlock
              width="5rem"
              height="2rem"
              :isLoaded="!isLoadingInvoice"
            >
              <Currency
                size="large"
                prefix="$"
                :value="totalValue"
                :showSuffix="false"
              />
            </SkeletonBlock>
          </div>
        </div>
      </div>
    </template>
  </CardBox>
</template>

<script setup>
  import { computed, onMounted, ref } from 'vue'
  import ActionButton from '@aziontech/webkit/button'
  import CardBox from '@aziontech/webkit/content/card-box'
  import Currency from '@aziontech/webkit/content/currency'
  import SubscriptionPlanRow from './SubscriptionPlanRow.vue'
  import SkeletonBlock from '@/templates/skeleton-block'
  import { invoicesService } from '@/services/v2/billing/invoices-service'

  defineOptions({ name: 'current-invoice-card' })

  const props = defineProps({
    invoice: { type: Object, default: () => ({}) },
    subscription: { type: Object, default: () => ({}) }
  })

  const latestInvoiceTotal = ref(null)
  const isLoadingInvoice = ref(true)

  const extractTotal = (invoice) => {
    if (!invoice) return null
    const cents = typeof invoice.amount_paid === 'number' ? invoice.amount_paid : invoice.total
    if (typeof cents !== 'number' || !Number.isFinite(cents)) return null
    return cents / 100
  }

  onMounted(async () => {
    try {
      const result = await invoicesService.listAccountInvoices({ limit: 1 })
      latestInvoiceTotal.value = extractTotal(result?.invoices?.[0])
    } catch {
      latestInvoiceTotal.value = null
    } finally {
      isLoadingInvoice.value = false
    }
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

  const totalValue = computed(() => formatAmount(latestInvoiceTotal.value))

  const emitViewDetails = () => {
    // `redirectId` is the "is the details page reachable?" flag the legacy
    // service exposes, but the actual route param is `billId`. Emit the
    // whole invoice so BillsView's handler can pick the right field — same
    // pattern dev branch uses.
    if (!props.invoice?.redirectId) return
    emit('view-details', props.invoice)
  }
</script>
