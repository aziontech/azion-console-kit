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
        :disabled="!detailsBillId"
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
  import { computed } from 'vue'
  import ActionButton from '@aziontech/webkit/actions/button'
  import CardBox from '@aziontech/webkit/content/card-box'
  import Currency from '@aziontech/webkit/content/currency'
  import SubscriptionPlanRow from './SubscriptionPlanRow.vue'
  import SkeletonBlock from '@/templates/skeleton-block'
  import { useLatestInvoice } from '@/composables/useLatestInvoice'

  defineOptions({ name: 'current-invoice-card' })

  const props = defineProps({
    invoice: { type: Object, default: () => ({}) },
    subscription: { type: Object, default: () => ({}) }
  })

  const { latestInvoice, latestInvoiceTotal, isLoading: isLoadingInvoice } = useLatestInvoice()

  const detailsBillId = computed(() => {
    const v4BillRef = latestInvoice.value?.billRefs?.[0] ?? null
    if (v4BillRef) return v4BillRef
    return props.invoice?.redirectId ? props.invoice.billId : null
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
    if (!detailsBillId.value) return
    emit('view-details', { ...props.invoice, billId: detailsBillId.value })
  }
</script>
