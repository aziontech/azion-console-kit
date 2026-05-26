<template>
  <DowngradePendingBanner
    v-if="cardsReady && isDowngradePending"
    :effectiveAt="scheduledDowngrade?.effectiveAt"
    @cancel="showCancelDowngradeDialog = true"
  />

  <div class="w-full flex flex-col min-[1100px]:flex-row gap-6 mt-4 items-stretch billing-cards">
    <template v-if="cardsReady">
      <SubscriptionPlanCard
        :subscription="subscriptionState"
        :paymentMethodLabel="paymentMethodLabel"
        :paymentMethodBrandRaw="paymentMethodBrandRaw"
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

  <h2 class="text-lg font-medium line-height-1 mt-6 mb-2">Payment History</h2>

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
      <ActionButton
        class="max-md:w-full w-fit"
        kind="outlined"
        size="medium"
        label="Credit"
        icon="pi pi-plus"
        :disabled="!defaultCardStatus.hasData"
        @click="goToPayment"
      />
      <ActionButton
        class="max-md:w-full w-fit"
        kind="secondary"
        size="medium"
        icon="pi pi-plus"
        label="Payment Method"
        @click="goToPayment"
      />
    </template>
  </EmptyResultsBlock>

  <DrawerPlanComparison
    v-model:visible="showChangePlanDrawer"
    :currentPlan="currentPlanSlug"
    :currentCycle="currentActiveCycle"
    :plans="plansData || []"
    @select-pro-upgrade="handleSelectProUpgrade"
    @select-downgrade-hobby="handleSelectDowngradeHobby"
    @select-cycle-change="handleSelectCycleChange"
  />

  <DrawerPlanInfo
    v-if="selectedPlan"
    v-model:visible="showPlanInfoDrawer"
    :plan="selectedPlan"
    :mode="drawerMode"
    :lockedCycle="lockedCycle"
    :initialClientSecret="checkoutSessionClientSecret"
    :getStripeClientService="props.getStripeClientService"
    :indented="showChangePlanDrawer"
    @submit="handlePlanInfoSubmit"
    @submitCycleChange="handleCycleUpgradeSubmit"
    @stale-session="handleStaleCheckoutSession"
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
  import { ref, computed, reactive, watch, inject, onMounted, defineAsyncComponent } from 'vue'
  import { useRouter } from 'vue-router'
  import { storeToRefs } from 'pinia'
  import EmptyResultsBlock from '@aziontech/webkit/empty-results-block'
  import { columnBuilder } from '@/components/list-table/columns/column-builder'
  import ListTable from '@/components/list-table/ListTable.vue'
  import ActionButton from '@aziontech/webkit/actions/button'
  import SubscriptionPlanCard from './components/SubscriptionPlanCard.vue'
  import UpgradeToProCard from './components/UpgradeToProCard.vue'
  import CurrentInvoiceCard from './components/CurrentInvoiceCard.vue'
  import BillingCardSkeleton from './components/BillingCardSkeleton.vue'
  import DowngradePendingBanner from './components/DowngradePendingBanner.vue'
  import { useToast } from '@aziontech/webkit/use-toast'
  import { usePlans } from '@/composables/usePlans'
  import { usePlansList } from '@/composables/usePlansService'
  import { useCurrentSubscription } from '@/composables/useCurrentSubscription'
  import { useBillingPaymentMethods } from '@/composables/useBillingPaymentMethods'
  import { useServiceOrders } from '@/composables/useServiceOrders'
  import { useCheckoutSessionPreparer } from '@/composables/useCheckoutSessionPreparer'
  import { markAwaitingActiveServiceOrder } from '@/composables/post-payment-flag'
  import { useAccountStore } from '@/stores/account'
  import * as Sentry from '@sentry/vue'

  // Modals/drawers are heavy (Stripe element, plan grid) and only render on
  // user action — defer the chunks so the initial Billing render stays light.
  const DrawerPlanComparison = defineAsyncComponent(
    () => import('./Drawer/DrawerPlanComparison.vue')
  )
  const DrawerPlanInfo = defineAsyncComponent(() => import('./Drawer/DrawerPlanInfo.vue'))
  const DialogDowngradePlan = defineAsyncComponent(() => import('./Dialog/DialogDowngradePlan.vue'))
  const DialogCancelDowngrade = defineAsyncComponent(
    () => import('./Dialog/DialogCancelDowngrade.vue')
  )

  const router = useRouter()
  const emit = defineEmits(['changeTab'])
  const accountStore = useAccountStore()
  /** @type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const trackBilling = (method, payload) => {
    Promise.resolve()
      .then(() => tracker?.billing?.[method]?.(payload)?.track?.())
      .catch(Sentry.captureException)
  }

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
          if (item.invoiceUrl) {
            trackBilling('invoiceDownloaded', { billId: item.billId, format: 'pdf' })
            window.open(item.invoiceUrl, '_blank')
          }
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
    upgrade: upgradeServiceOrderPlan,
    cancelDowngrade: cancelDowngradeServiceOrderPlan,
    loadAccountServiceOrders,
    serviceOrder,
    activeServiceOrder
  } = useServiceOrders()
  const { prepare: prepareCheckoutSession, recoverFromStaleSession } = useCheckoutSessionPreparer()

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

  const { defaultPaymentMethod } = useBillingPaymentMethods()

  const formatBrandName = (brand) => {
    if (!brand) return ''
    return brand.charAt(0).toUpperCase() + brand.slice(1)
  }

  const paymentMethodLabel = computed(() => {
    const method = defaultPaymentMethod.value
    if (!method?.last4) return '--'
    const brand = formatBrandName(method.brand)
    return [brand, method.last4].filter(Boolean).join(' •••• ') || '--'
  })

  const paymentMethodBrandRaw = computed(() => defaultPaymentMethod.value?.brand ?? '')

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
    isLoading: computed(() => subscription.isLoading.value),
    currentInvoiceAmountCharged: computed(() => subscription.currentInvoiceAmountCharged.value)
  })

  const currentInvoice = ref({})

  const loadCurrentInvoice = async () => {
    try {
      currentInvoice.value = (await props.loadCurrentInvoiceService()) || {}
    } catch {
      currentInvoice.value = {}
    }
  }

  // Re-fetch the legacy invoice service whenever the subscription transitions
  // into Pro (initial mount included). No timer/retry loop here — the
  // post-checkout invoice freshness used to be papered over by 6×2s polling;
  // now it relies on the SO mutation `onSuccess` invalidating subscription
  // state and `loadCurrentInvoice` running again on this watch.
  watch(
    () => subscriptionState.isPro,
    (isPro) => {
      if (isPro) loadCurrentInvoice()
    },
    { immediate: true }
  )

  onMounted(async () => {
    // Post-checkout entry refreshes once so the cards reflect the just-paid
    // SO without depending on stale persisted cache.
    try {
      await subscription.refetch()
    } catch (err) {
      Sentry.captureException(err)
    }
  })

  const cardsReady = computed(() => !subscriptionState.isLoading)

  const currentPlanSlug = computed(() => subscription.planSku.value || 'hobby')

  const currentActiveCycle = computed(() => subscription.billingCycle.value || 'monthly')

  const ensureActiveServiceOrder = async () => {
    if (activeServiceOrder.value) return activeServiceOrder.value
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
    trackBilling('planChangeInitiated', {
      fromPlan: subscription.planSku.value,
      fromCycle: subscription.billingCycle.value,
      source: 'subscription-card'
    })
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
      trackBilling('checkoutStarted', {
        plan,
        billingCycle: preferredCycle || storedBillingCycle.value,
        mode: 'subscribe'
      })
    } catch (err) {
      const detail =
        (Array.isArray(err?.message) ? err.message[0] : err?.message) ||
        'Unable to initialize payment session.'
      trackBilling('planChangeFailed', {
        plan,
        billingCycle: preferredCycle,
        errorType: 'checkout-session',
        errorMessage: detail
      })
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

  // Stripe rejected the previously issued client secret (session expired or
  // already consumed). Re-prepare with a fresh PATCH so the payment element
  // re-mounts against a live session — without forcing the user to close the
  // drawer.
  const handleStaleCheckoutSession = async ({ plan, billingCycle: cycle } = {}) => {
    const targetPlan = plan || selectedPlan.value
    if (!targetPlan) return
    checkoutSessionClientSecret.value = ''
    try {
      const fresh = await recoverFromStaleSession({
        plan: targetPlan,
        preferredCycle: cycle || storedBillingCycle.value || null
      })
      checkoutSessionClientSecret.value = fresh
    } catch (err) {
      Sentry.captureException(err)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail:
          (Array.isArray(err?.message) ? err.message[0] : err?.message) ||
          'Unable to refresh the checkout session.',
        closable: true
      })
    }
  }

  const openUpgradeToPro = async () => {
    setParam('billingCycle', 'monthly')
    await syncToUrl()
    trackBilling('upgradeBannerClicked', { location: 'upgrade-card' })
    trackBilling('planChangeInitiated', {
      fromPlan: subscription.planSku.value,
      fromCycle: subscription.billingCycle.value,
      source: 'upgrade-card'
    })
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

  const handleSelectProUpgrade = async (cycle) => {
    setParam('billingCycle', cycle)
    await syncToUrl()
    trackBilling('planSelected', {
      plan: 'pro',
      billingCycle: cycle,
      fromPlan: subscription.planSku.value,
      fromCycle: subscription.billingCycle.value,
      isCycleOnlyChange: false
    })
    await openDrawerWithCheckoutSession({
      plan: 'pro',
      preferredCycle: cycle,
      lockedCycle: null
    })
  }

  const handleSelectDowngradeHobby = async () => {
    trackBilling('planSelected', {
      plan: 'hobby',
      billingCycle: subscription.billingCycle.value,
      fromPlan: subscription.planSku.value,
      fromCycle: subscription.billingCycle.value,
      isCycleOnlyChange: false
    })
    await openPlanDowngradeDialog()
  }

  const handleSelectCycleChange = async (targetCycle) => {
    const plan = subscription.planSku.value
    const fromCycle = subscription.billingCycle.value
    trackBilling('billingCycleToggled', { fromCycle, toCycle: targetCycle, context: 'billing' })
    if (targetCycle === 'yearly') {
      openCycleReviewDrawer({ plan, targetCycle })
    } else {
      await openCycleDowngradeDialog({ fromCycle, toCycle: targetCycle })
    }
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

    await upgradeServiceOrderPlan({
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

    await downgradeServiceOrderPlan({
      id: serviceOrderId,
      accountId,
      newPlanId: planId,
      priceId: planPricingId
    })
  }

  const handleCycleUpgradeSubmit = async ({ plan, billingCycle, done, fail }) => {
    const fromCycle = subscription.billingCycle.value
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
      trackBilling('planChangeCompleted', {
        plan,
        billingCycle,
        fromPlan: plan,
        fromCycle,
        isUpgrade: true,
        isDowngrade: false
      })
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
      trackBilling('planChangeFailed', {
        plan,
        billingCycle,
        errorType: 'cycle-upgrade',
        errorMessage: detail
      })
      fail?.(detail)
    }
  }

  const handleDowngradeConfirm = async ({ toPlan, toCycle, cycleChange, done, fail }) => {
    const fromPlan = subscription.planSku.value
    const fromCycle = subscription.billingCycle.value
    try {
      if (cycleChange) {
        await downgradeServiceOrderCycle({
          plan: subscription.planSku.value,
          billingCycle: toCycle
        })
        trackBilling('downgradeScheduled', {
          fromPlan,
          toPlan: fromPlan,
          effectiveAt: downgradeEffectiveAt.value,
          reason: 'cycle-change'
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

      trackBilling('downgradeScheduled', {
        fromPlan,
        toPlan,
        effectiveAt: downgradeEffectiveAt.value,
        reason: 'plan-change'
      })

      toast.add({
        severity: 'success',
        summary: 'Plan changed',
        detail: 'Your plan has been updated successfully.',
        closable: true
      })
      done?.()
      showChangePlanDrawer.value = false
      await subscription.refetchUntil((so) => so?.downgradePending != null)
    } catch (err) {
      const detail =
        (Array.isArray(err?.message) ? err.message[0] : err?.message) || 'Unable to downgrade plan.'
      trackBilling('planChangeFailed', {
        plan: toPlan,
        billingCycle: cycleChange ? toCycle : fromCycle,
        errorType: 'downgrade',
        errorMessage: detail
      })
      fail?.(detail)
    }
  }

  const handleCancelDowngradeConfirm = async ({ fail, done } = {}) => {
    const fromPlan = subscription.planSku.value
    try {
      const serviceOrderId = serviceOrder.value?.serviceOrderId
      if (!serviceOrderId) {
        throw new Error('Missing service order to cancel.')
      }

      await cancelDowngradeServiceOrderPlan({ id: serviceOrderId })

      await subscription.refetchUntil((so) => so?.downgradePending == null)

      trackBilling('downgradeCancelled', {
        fromPlan,
        toPlan: 'hobby'
      })

      toast.add({
        severity: 'success',
        summary: 'Downgrade cancelled',
        detail: 'Your scheduled downgrade has been cancelled.',
        life: 6000,
        closable: true
      })

      done?.()
    } catch (err) {
      const detail =
        (Array.isArray(err?.message) ? err.message[0] : err?.message) ||
        'Unable to cancel scheduled downgrade.'
      trackBilling('planChangeFailed', {
        plan: fromPlan,
        billingCycle: subscription.billingCycle.value,
        errorType: 'cancel-downgrade',
        errorMessage: detail
      })
      fail?.(detail)
    }
  }

  const planLabel = (sku) => (sku === 'pro' ? 'Pro Plan' : sku === 'hobby' ? 'Hobby Plan' : 'plan')

  const handlePlanInfoSubmit = async (submitPayload = {}) => {
    const targetPlan = selectedPlan.value
    const targetPlanId = targetPlan ? findPlanIdBySku(targetPlan) : null
    const fromPlan = subscription.planSku.value
    const fromCycle = subscription.billingCycle.value
    const submittedCycle = submitPayload?.billingCycle || storedBillingCycle.value

    trackBilling('paymentMethodSubmitted', {
      plan: targetPlan,
      billingCycle: submittedCycle,
      methodType: 'card'
    })

    markAwaitingActiveServiceOrder()

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

    trackBilling('planChangeCompleted', {
      plan: targetPlan,
      billingCycle: submittedCycle,
      fromPlan,
      fromCycle,
      isUpgrade: targetPlan === 'pro' && fromPlan === 'hobby',
      isDowngrade: false
    })
  }

  const goToEnvoiceDetails = (item) => {
    const detailsUrl = typeof item === 'object' ? item?.detailsUrl : null
    if (detailsUrl) {
      trackBilling('invoiceViewed', {
        status: item?.status?.content || item?.status,
        amount: item?.amount
      })
      window.open(detailsUrl, '_blank')
      return
    }
    const billId = typeof item === 'object' ? item?.billId : item
    if (!billId) return
    const invoicePayload =
      typeof item === 'object'
        ? {
            billId,
            status: item?.status?.content || item?.status,
            amount: item?.amount
          }
        : { billId }
    trackBilling('invoiceViewed', invoicePayload)
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
