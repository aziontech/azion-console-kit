<template>
  <DowngradePendingBanner
    v-if="cardsReady && isDowngradePending"
    :effectiveAt="scheduledDowngrade?.effectiveAt"
    @cancel="showCancelDowngradeDialog = true"
  />

  <div class="w-full flex flex-col sm:flex-row gap-6 mt-4 items-stretch billing-cards">
    <template v-if="cardsReady">
      <SubscriptionPlanCard
        :subscription="subscriptionState"
        @change-plan="showOtherPlans"
        @go-to-payment="goToPayment"
      />

      <UpgradeToProCard
        v-if="subscriptionState.isHobby"
        :loading="preparingPlan === 'pro'"
        @upgrade="openUpgradeToPro"
      />
      <CurrentInvoiceCard
        v-else
        :invoice="currentInvoice"
        :subscription="subscriptionState"
        @view-details="goToEnvoiceDetails"
      />
    </template>

    <template v-else>
      <BillingCardSkeleton />
      <BillingCardSkeleton />
    </template>
  </div>

  <h2 class="text-lg font-medium line-height-1 my-8">Payment History</h2>

  <div
    v-if="hasContentToList"
    class="max-w-full mt-4"
    data-testid="data-table-container"
  >
    <ListTable
      ref="listTableRef"
      :listService="props.listPaymentHistoryService"
      :columns="loaderPaymentHistoryColumns"
      :actions="actionsRow"
      :enableEditClick="false"
      exportFileName="Payment History"
      :lazy="true"
      :allowedFilters="allowedFilters"
      emptyListMessage="No payment activity found."
      @on-load-data="handleLoadData"
      @on-before-go-to-edit="goToEnvoiceDetails"
    />
  </div>

  <EmptyResultsBlock
    v-else
    title="No payment activity yet."
    description="Add a payment method and start using services and products to view your activity."
    :inTabs="true"
    createButtonLabel="Add Credit"
    :documentationService="props.documentPaymentHistoryService"
  >
    <template #default>
      <PrimeButton
        class="max-md:w-full w-fit"
        label="Credit"
        icon="pi pi-plus"
        :disabled="!defaultCardStatus.hasData"
        @click="goToPayment"
        outlined
      >
      </PrimeButton>
      <PrimeButton
        class="max-md:w-full w-fit"
        severity="secondary"
        icon="pi pi-plus"
        label="Payment Method"
        @click="goToPayment"
      />
    </template>
  </EmptyResultsBlock>

  <PlanSelectionDrawer
    v-model:visible="showChangePlanDrawer"
    :plans="plansData || []"
    :currentPlan="currentPlanSlug"
    :billingCycle="currentActiveCycle"
    :closeOnSelect="false"
    :relativeLabels="true"
    :loadingPlan="preparingPlan"
    @select="handlePlanSelect"
  />

  <DrawerPlanInfo
    v-if="selectedPlan"
    v-model:visible="showPlanInfoDrawer"
    :plan="selectedPlan"
    :mode="drawerMode"
    :lockedCycle="lockedCycle"
    :initialClientSecret="checkoutSessionClientSecret"
    :getStripeClientService="props.getStripeClientService"
    @submit="handlePlanInfoSubmit"
    @submitCycleChange="handleCycleUpgradeSubmit"
  />

  <DialogDowngradePlan
    v-model:visible="showDowngradeDialog"
    :fromPlan="subscription.planSku.value"
    :toPlan="downgradeTarget.toPlan"
    :effectiveAt="downgradeEffectiveAt"
    :cycleChange="downgradeTarget.cycleChange"
    :fromCycle="downgradeTarget.fromCycle"
    :toCycle="downgradeTarget.toCycle"
    @confirm="handleDowngradeConfirm"
  />

  <DialogCancelDowngrade
    v-model:visible="showCancelDowngradeDialog"
    @confirm="handleCancelDowngradeConfirm"
  />
</template>

<script setup>
  import { ref, computed, reactive, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import { storeToRefs } from 'pinia'
  import EmptyResultsBlock from '@aziontech/webkit/empty-results-block'
  import { columnBuilder } from '@/components/list-table/columns/column-builder'
  import ListTable from '@/components/list-table/ListTable.vue'
  import PrimeButton from '@aziontech/webkit/button'
  import PlanSelectionDrawer from '@/templates/signup-block/plan-selection-drawer.vue'
  import DrawerPlanInfo from './Drawer/DrawerPlanInfo.vue'
  import SubscriptionPlanCard from './components/SubscriptionPlanCard.vue'
  import UpgradeToProCard from './components/UpgradeToProCard.vue'
  import CurrentInvoiceCard from './components/CurrentInvoiceCard.vue'
  import BillingCardSkeleton from './components/BillingCardSkeleton.vue'
  import DialogDowngradePlan from './Dialog/DialogDowngradePlan.vue'
  import DialogCancelDowngrade from './Dialog/DialogCancelDowngrade.vue'
  import DowngradePendingBanner from './components/DowngradePendingBanner.vue'
  import { useToast } from '@aziontech/webkit/use-toast'
  import { usePlans } from '@/composables/usePlans'
  import { usePlansList } from '@/composables/usePlansService'
  import { useCurrentSubscription } from '@/composables/useCurrentSubscription'
  import { useServiceOrders } from '@/composables/useServiceOrders'
  import { useCheckoutSessionPreparer } from '@/composables/useCheckoutSessionPreparer'
  import { useAccountStore } from '@/stores/account'

  const router = useRouter()
  const emit = defineEmits(['changeTab'])
  const accountStore = useAccountStore()

  const { showExportBilling, accountIsNotRegular } = storeToRefs(accountStore)

  const props = defineProps({
    listPaymentHistoryService: {
      type: Function,
      required: true
    },
    documentPaymentHistoryService: {
      type: Function,
      required: true
    },
    loadYourServicePlanService: {
      type: Function,
      required: true
    },
    openPlans: {
      type: Function,
      required: true
    },
    loadContractServicePlan: {
      type: Function,
      required: true
    },
    loadCurrentInvoiceService: {
      type: Function,
      required: true
    },
    cardDefault: {
      type: Object
    },
    loadPaymentMethodDefaultService: {
      type: Function
    },
    loadInvoiceDataService: {
      type: Function
    },
    listServiceAndProductsChangesService: {
      type: Function
    },
    getStripeClientService: {
      type: Function
    },
    documentPaymentMethodService: {
      type: Function
    },
    loadInvoiceLastUpdatedService: {
      type: Function
    }
  })

  const hasContentToList = ref(true)
  const listTableRef = ref(null)

  const allowedFilters = [
    {
      header: 'Invoice Number',
      field: 'invoice_number'
    }
  ]

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const navigateMethod = (name, params) => {
    router.push({ name, params })
  }

  const actionsRow = computed(() => {
    const actions = [
      {
        label: 'Details',
        icon: 'pi pi-file',
        type: 'action',
        disabled: (item) => item.isFallback,
        commandAction: (item) => goToEnvoiceDetails(item)
      }
    ]

    if (showExportBilling.value) {
      actions.push({
        label: 'Download Invoice',
        icon: 'pi pi-download',
        type: 'action',
        disabled: (item) => item.disabled || item.isFallback,
        commandAction: (item) => {
          if (item.invoiceUrl) window.open(item.invoiceUrl, '_blank')
        }
      })
    }

    return actions
  })

  const showChangePlanDrawer = ref(false)
  const showPlanInfoDrawer = ref(false)
  const showDowngradeDialog = ref(false)
  const showCancelDowngradeDialog = ref(false)
  const drawerMode = ref('subscribe')
  const selectedPlan = ref(null)
  const lockedCycle = ref(null)
  const checkoutSessionClientSecret = ref('')
  const preparingPlan = ref(null)
  const downgradeTarget = ref({
    toPlan: 'hobby',
    cycleChange: false,
    fromCycle: null,
    toCycle: null
  })
  const toast = useToast()

  const {
    initialize: initializePlans,
    billingCycle: storedBillingCycle,
    setParam,
    syncToUrl
  } = usePlans()
  const { data: plansData } = usePlansList()

  initializePlans()

  const subscription = useCurrentSubscription()
  const {
    downgrade: downgradeServiceOrderPlan,
    upgrade: upgradeServiceOrder,
    updateServiceOrder,
    loadAccountServiceOrders,
    serviceOrder
  } = useServiceOrders()
  const { prepare: prepareCheckoutSession } = useCheckoutSessionPreparer()

  const downgradeEffectiveAt = ref(null)

  const isDowngradePending = computed(() => subscription.isDowngradePending.value)
  const scheduledDowngrade = computed(() => subscription.scheduledDowngrade.value)

  watch(showPlanInfoDrawer, (visible) => {
    if (!visible) {
      checkoutSessionClientSecret.value = ''
      drawerMode.value = 'subscribe'
    }
  })

  const defaultCardStatus = computed(() => ({
    loaded: props.cardDefault?.loader,
    hasData: !!props.cardDefault?.cardData
  }))

  const subscriptionState = reactive({
    planTitle: computed(() => subscription.planTitle.value),
    planTag: computed(() => subscription.planTag.value),
    planStartDate: computed(() => subscription.planStartDate.value),
    billingPeriod: computed(() => subscription.billingPeriod.value),
    nextChargeDate: computed(() => subscription.nextChargeDate.value),
    nextChargeValue: computed(() => subscription.nextChargeValue.value),
    planChargeValue: computed(() => subscription.planChargeValue.value),
    hasContractedPlan: computed(() => subscription.hasContractedPlan.value),
    isHobby: computed(() => subscription.isHobby.value),
    isPro: computed(() => subscription.isPro.value),
    isLoading: computed(() => subscription.isLoading.value)
  })

  const currentInvoice = ref({})

  const loadCurrentInvoice = async () => {
    try {
      currentInvoice.value = (await props.loadCurrentInvoiceService()) || {}
    } catch {
      currentInvoice.value = {}
    }
  }

  watch(
    () => subscriptionState.isPro,
    (isPro, wasPro) => {
      if (isPro && !wasPro) loadCurrentInvoice()
    },
    { immediate: true }
  )

  const cardsReady = computed(() => !subscriptionState.isLoading)

  const currentPlanSlug = computed(() => subscription.planSku.value || 'hobby')

  const currentActiveCycle = computed(() => subscription.billingCycle.value || 'monthly')

  const ensureActiveServiceOrder = async () => {
    if (serviceOrder.value?.status === 'ACTIVE') return serviceOrder.value
    const accountId = accountStore.accountData?.id
    if (!accountId) return null
    try {
      const { active } = await loadAccountServiceOrders(accountId)
      return active
    } catch {
      return null
    }
  }

  const findPlanIdBySku = (sku) =>
    plansData.value?.find((plan) => plan.sku?.toLowerCase() === sku.toLowerCase())?.id ?? null

  const findPriceId = (sku, cycle) => {
    const plan = plansData.value?.find((item) => item.sku?.toLowerCase() === sku.toLowerCase())
    return plan?.pricings?.find((pricing) => pricing.periodicity === cycle)?.id ?? null
  }

  const showOtherPlans = async () => {
    const initialCycle = subscription.isPro.value ? 'yearly' : 'monthly'
    setParam('billingCycle', initialCycle)
    await syncToUrl()
    showChangePlanDrawer.value = true
  }

  const openDrawerWithCheckoutSession = async ({ plan, preferredCycle, lockedCycle: locked }) => {
    if (preparingPlan.value) return
    preparingPlan.value = plan
    try {
      const secret = await prepareCheckoutSession({ plan, preferredCycle })
      checkoutSessionClientSecret.value = secret
      drawerMode.value = 'subscribe'
      selectedPlan.value = plan
      lockedCycle.value = locked
      showPlanInfoDrawer.value = true
    } catch (err) {
      const detail =
        (Array.isArray(err?.message) ? err.message[0] : err?.message) ||
        'Unable to initialize payment session.'
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail,
        closable: true
      })
    } finally {
      preparingPlan.value = null
    }
  }

  const openUpgradeToPro = async () => {
    setParam('billingCycle', 'monthly')
    await syncToUrl()
    await openDrawerWithCheckoutSession({
      plan: 'pro',
      preferredCycle: 'monthly',
      lockedCycle: null
    })
  }

  const openCycleReviewDrawer = ({ plan, targetCycle }) => {
    drawerMode.value = 'change-cycle'
    selectedPlan.value = plan
    lockedCycle.value = targetCycle
    checkoutSessionClientSecret.value = ''
    showPlanInfoDrawer.value = true
  }

  const openCycleDowngradeDialog = async ({ fromCycle, toCycle }) => {
    downgradeEffectiveAt.value = null
    downgradeTarget.value = {
      toPlan: subscription.planSku.value,
      cycleChange: true,
      fromCycle,
      toCycle
    }
    const active = await ensureActiveServiceOrder()
    downgradeEffectiveAt.value = active?.currentPeriodEnd ?? null
    showDowngradeDialog.value = true
  }

  const openPlanDowngradeDialog = async () => {
    downgradeEffectiveAt.value = null
    downgradeTarget.value = {
      toPlan: 'hobby',
      cycleChange: false,
      fromCycle: null,
      toCycle: null
    }
    const active = await ensureActiveServiceOrder()
    downgradeEffectiveAt.value = active?.currentPeriodEnd ?? null
    showDowngradeDialog.value = true
  }

  const handlePlanSelect = async ({ plan, billingCycle }) => {
    if (plan === 'hobby') {
      await openPlanDowngradeDialog()
      return
    }

    if (billingCycle) {
      setParam('billingCycle', billingCycle)
      await syncToUrl()
    }

    const currentSku = subscription.planSku.value
    const currentCycle = subscription.billingCycle.value

    const isSamePlan = plan === currentSku
    const isCycleChange =
      isSamePlan && billingCycle && currentCycle && billingCycle !== currentCycle

    if (isCycleChange) {
      if (billingCycle === 'yearly') {
        openCycleReviewDrawer({ plan, targetCycle: 'yearly' })
      } else {
        await openCycleDowngradeDialog({ fromCycle: currentCycle, toCycle: 'monthly' })
      }
      return
    }

    await openDrawerWithCheckoutSession({
      plan,
      preferredCycle: billingCycle || storedBillingCycle.value || null,
      lockedCycle: null
    })
  }

  const resolveCycleChangePayload = async ({ plan, billingCycle }) => {
    const active = await ensureActiveServiceOrder()
    if (!active?.serviceOrderId) {
      throw new Error('Missing active service order.')
    }

    const accountId = accountStore.accountData?.id
    const planId = findPlanIdBySku(plan)
    const planPricingId = findPriceId(plan, billingCycle)

    if (!accountId || !planId || !planPricingId) {
      throw new Error('Missing data required to change cycle.')
    }

    return { serviceOrderId: active.serviceOrderId, accountId, planId, planPricingId }
  }

  const upgradeServiceOrderCycle = async ({ plan, billingCycle }) => {
    const { serviceOrderId, accountId, planId, planPricingId } = await resolveCycleChangePayload({
      plan,
      billingCycle
    })

    await upgradeServiceOrder({
      id: serviceOrderId,
      accountId,
      newPlanId: planId,
      priceId: planPricingId
    })
  }

  const downgradeServiceOrderCycle = async ({ plan, billingCycle }) => {
    const { serviceOrderId, accountId, planId, planPricingId } = await resolveCycleChangePayload({
      plan,
      billingCycle
    })

    await updateServiceOrder(serviceOrderId, {
      accountId,
      planId,
      planPricingId
    })
  }

  const handleCycleUpgradeSubmit = async ({ plan, billingCycle, done, fail }) => {
    try {
      await upgradeServiceOrderCycle({ plan, billingCycle })
      const targetPriceId = findPriceId(plan, billingCycle)
      done?.()
      showPlanInfoDrawer.value = false
      showChangePlanDrawer.value = false
      selectedPlan.value = null
      lockedCycle.value = null
      if (targetPriceId) {
        await subscription.refetchUntil((so) => so?.priceId === targetPriceId)
      } else {
        await subscription.refetch()
      }
      toast.add({
        severity: 'success',
        summary: 'Billing cycle updated',
        detail: 'Your billing cycle has been updated successfully.',
        life: 6000,
        closable: true
      })
    } catch (err) {
      const detail =
        (Array.isArray(err?.message) ? err.message[0] : err?.message) ||
        'Unable to update billing cycle.'
      fail?.(detail)
    }
  }

  const handleDowngradeConfirm = async ({ toPlan, toCycle, cycleChange, done, fail }) => {
    try {
      if (cycleChange) {
        await downgradeServiceOrderCycle({
          plan: subscription.planSku.value,
          billingCycle: toCycle
        })
        toast.add({
          severity: 'success',
          summary: 'Downgrade scheduled',
          detail: 'Your billing cycle change has been scheduled.',
          closable: true
        })
        done?.()
        showChangePlanDrawer.value = false
        await subscription.refetch()
        return
      }

      const serviceOrderId = serviceOrder.value?.serviceOrderId
      const targetPlanId = findPlanIdBySku(toPlan)

      if (!serviceOrderId || !targetPlanId) {
        throw new Error('Missing data required to change plan.')
      }

      await downgradeServiceOrderPlan({
        id: serviceOrderId,
        newPlanId: targetPlanId
      })

      toast.add({
        severity: 'success',
        summary: 'Plan changed',
        detail: 'Your plan has been updated successfully.',
        closable: true
      })
      done?.()
      showChangePlanDrawer.value = false
      await subscription.refetchUntil((so) => so?.metadata?.status === 'downgrade_pending')
    } catch (err) {
      const detail =
        (Array.isArray(err?.message) ? err.message[0] : err?.message) || 'Unable to downgrade plan.'
      fail?.(detail)
    }
  }

  const handleCancelDowngradeConfirm = async ({ fail }) => {
    fail?.('Cancel scheduled downgrade is not available yet.')
  }

  const planLabel = (sku) => (sku === 'pro' ? 'Pro Plan' : sku === 'hobby' ? 'Hobby Plan' : 'plan')

  const handlePlanInfoSubmit = async () => {
    const targetPlan = selectedPlan.value
    const targetPlanId = targetPlan ? findPlanIdBySku(targetPlan) : null

    showPlanInfoDrawer.value = false
    showChangePlanDrawer.value = false
    selectedPlan.value = null
    drawerMode.value = 'subscribe'
    lockedCycle.value = null
    checkoutSessionClientSecret.value = ''

    if (targetPlan) {
      toast.add({
        severity: 'success',
        summary: `${planLabel(targetPlan)} subscribed`,
        detail: `Your subscription to the ${planLabel(targetPlan)} is now active.`,
        life: 6000,
        closable: true
      })
    }

    if (targetPlanId) {
      await subscription.refetchUntil((so) => so?.planId === targetPlanId)
    } else {
      await subscription.refetch()
    }
  }

  const goToEnvoiceDetails = (item) => {
    const billId = typeof item === 'object' ? item?.billId : item
    if (!billId) return
    navigateMethod('billing-invoice-details', { billId })
  }

  const goToPayment = () => {
    emit('changeTab', 1)
  }

  const loaderPaymentHistoryColumns = computed(() => {
    if (accountIsNotRegular.value) {
      return [
        {
          field: 'paymentDate',
          header: 'Payment Date'
        },
        {
          field: 'invoiceNumber',
          header: 'Invoice ID',
          filterPath: 'invoiceNumber.content',
          sortField: 'invoiceNumber.content',
          type: 'component',
          component: (columnData) => {
            return columnBuilder({
              data: columnData,
              columnAppearance: 'text-full-with-clipboard'
            })
          }
        },
        {
          field: 'paymentMethod',
          header: 'Payment Method',
          filterPath: 'paymentMethod.value',
          sortField: 'paymentMethod.value',
          type: 'component',
          component: (columnData) =>
            columnBuilder({ data: columnData, columnAppearance: 'credit-card-column' })
        },
        {
          field: 'amount',
          header: 'Transactions Amount'
        },
        {
          field: 'status',
          header: 'Status',
          type: 'component',
          sortField: 'status.content',
          filterPath: 'status.content',
          component: (columnData) => {
            return columnBuilder({
              data: columnData,
              columnAppearance: 'tag'
            })
          }
        }
      ]
    }

    return [
      {
        field: 'paymentDate',
        header: 'Payment Date'
      },
      {
        field: 'invoiceNumber',
        header: 'Invoice ID',
        filterPath: 'invoiceNumber.content',
        sortField: 'invoiceNumber.content',
        type: 'component',
        component: (columnData) => {
          return columnBuilder({
            data: columnData,
            columnAppearance: 'text-full-with-clipboard'
          })
        }
      }
    ]
  })

  const reloadList = async () => {
    if (hasContentToList.value) {
      await listTableRef.value?.reload()
      return
    }
    hasContentToList.value = true
  }

  defineExpose({
    reloadList
  })
</script>

<style scoped>
  .billing-cards :deep(.rounded-md.border) {
    border-color: var(--surface-border) !important;
    background-color: var(--surface-card) !important;
  }

  .billing-cards :deep(.h-11.justify-between) {
    height: 56px !important;
    padding: 0 24px !important;
    border-bottom-color: var(--surface-border) !important;
  }

  .billing-cards :deep(.opacity-0.transition-opacity) {
    opacity: 1 !important;
    transition: none !important;
  }

  .billing-cards :deep(.rounded-b-md.justify-center) {
    height: 56px !important;
    padding: 16px 24px !important;
    justify-content: flex-start !important;
    border-top-color: var(--surface-border) !important;
  }
</style>
