<template>
  <div class="w-full flex flex-col sm:flex-row gap-6 mt-4 items-stretch billing-cards">
    <template v-if="cardsReady">
      <SubscriptionPlanCard
        :subscription="subscriptionState"
        :cardDefault="props.cardDefault"
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
  />

  <DialogDowngradePlan
    v-model:visible="showDowngradeDialog"
    :fromPlan="subscription.planSku.value"
    toPlan="hobby"
    :effectiveAt="downgradeEffectiveAt"
    @confirm="handleDowngradeConfirm"
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

  const actionsRow = ref([
    {
      label: 'Set as default',
      icon: 'pi pi-download',
      type: 'action',
      visibleAction: () => showExportBilling.value,
      disabled: (item) => item.disabled,
      commandAction: async (item) => {
        if (item.invoiceUrl) window.open(item.invoiceUrl, '_blank')
      }
    }
  ])

  const showChangePlanDrawer = ref(false)
  const showPlanInfoDrawer = ref(false)
  const showDowngradeDialog = ref(false)
  const drawerMode = ref('subscribe')
  const selectedPlan = ref(null)
  const lockedCycle = ref(null)
  const checkoutSessionClientSecret = ref('')
  // SKU currently being prepared (set while `prepareCheckoutSession` runs).
  // Drives the loading state on the upgrade buttons so the user can't fire a
  // second click that would race the first prepare.
  const preparingPlan = ref(null)
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
    isPaymentPendingLocked,
    loadServiceOrder,
    serviceOrder
  } = useServiceOrders()
  const { prepare: prepareCheckoutSession } = useCheckoutSessionPreparer()

  const downgradeEffectiveAt = ref(null)

  // Drop the pre-fetched secret when the drawer closes so the next open
  // forces a fresh `prepareCheckoutSession` call. Reusing a stale secret
  // across opens caused the Stripe element to stay in skeleton.
  watch(showPlanInfoDrawer, (visible) => {
    if (!visible) checkoutSessionClientSecret.value = ''
  })

  // Auto-recovery from "Payment already received" 409s: when a mutation hits
  // the backend lock, refetch after a short delay to let the Stripe webhook
  // finalize. The lock clears inside loadServiceOrder once fresh state lands,
  // and subscription.refetch() updates the cards in the UI.
  let pendingRefetchTimer = null
  watch(isPaymentPendingLocked, (locked) => {
    if (!locked) return
    if (pendingRefetchTimer) clearTimeout(pendingRefetchTimer)
    pendingRefetchTimer = setTimeout(async () => {
      pendingRefetchTimer = null
      const accountId = accountStore.accountData?.id
      if (accountId) await loadServiceOrder(accountId)
      await subscription.refetch()
    }, 2500)
  })

  const defaultCardStatus = computed(() => ({
    loaded: props.cardDefault?.loader,
    hasData: !!props.cardDefault?.cardData
  }))

  const subscriptionState = reactive({
    planTitle: computed(() => subscription.planTitle.value),
    planTag: computed(() => subscription.planTag.value),
    planStartDate: computed(() => subscription.planStartDate.value),
    nextChargeDate: computed(() => subscription.nextChargeDate.value),
    nextChargeValue: computed(() => subscription.nextChargeValue.value),
    planChargeValue: computed(() => subscription.planChargeValue.value),
    hasContractedPlan: computed(() => subscription.hasContractedPlan.value),
    isHobby: computed(() => subscription.isHobby.value),
    isPro: computed(() => subscription.isPro.value),
    isDraft: computed(() => subscription.isDraft.value),
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

  // Source of truth for "is this card the user's current plan?" inside the
  // PlanSelectionDrawer. Bound to the ACTIVE SO's cycle (not the toggle
  // state), so the comparison stays stable as the user toggles inside the
  // drawer — that's how Pro/m → Pro/y becomes a clickable upgrade.
  const currentActiveCycle = computed(() => subscription.billingCycle.value || 'monthly')

  const showOtherPlans = async () => {
    setParam('billingCycle', 'monthly')
    await syncToUrl()
    showChangePlanDrawer.value = true
  }

  // Pre-fetch the Stripe client secret BEFORE the drawer is rendered so the
  // PaymentMethodBlock mounts with a valid secret on the first paint —
  // mirrors the working signup pattern (PR #3511). Any error surfaces as a
  // toast and aborts opening the drawer to avoid the "skeleton forever"
  // failure mode.
  const openDrawerWithCheckoutSession = async ({ plan, preferredCycle, lockedCycle: locked }) => {
    // Reentrancy guard — the upgrade buttons already render with a loading
    // state while `preparingPlan` is set, but a stray duplicate event (touch
    // bounce, double-tap) would still slip past the disabled UI without this.
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

  const handlePlanSelect = async ({ plan, billingCycle }) => {
    // Pro → Hobby goes through the dedicated downgrade dialog only.
    if (plan === 'hobby') {
      downgradeEffectiveAt.value = null
      showDowngradeDialog.value = true

      // Prefer the SO already loaded by useCurrentSubscription on mount.
      // Only re-fetch when the singleton doesn't carry the ACTIVE SO yet
      // (e.g. user landed here mid-load) — saves one list call on the
      // typical path.
      if (serviceOrder.value?.status === 'ACTIVE') {
        downgradeEffectiveAt.value = serviceOrder.value.currentPeriodEnd ?? null
      } else {
        const accountId = accountStore.accountData?.id
        if (accountId) {
          loadServiceOrder(accountId, { preferStatus: 'ACTIVE' })
            .then(() => {
              downgradeEffectiveAt.value = serviceOrder.value?.currentPeriodEnd ?? null
            })
            .catch(() => {
              // dialog stays open; effectiveAt falls back to '--'
            })
        }
      }
      return
    }

    // For all paid-plan selections (including same-plan cycle change),
    // open the subscribe drawer. The preparer picks the right backend call
    // (POST / PATCH DRAFT / PATCH /upgrade) based on current SO state.
    if (billingCycle) {
      setParam('billingCycle', billingCycle)
      await syncToUrl()
    }

    // Cycle-only change on the same paid plan (e.g. Pro/m → Pro/y): lock the
    // drawer's toggle so the user can't accidentally pick the other cycle —
    // the whole point of entering through this card was the cycle choice.
    const isCycleOnlyChange =
      plan === subscription.planSku.value &&
      billingCycle &&
      subscription.billingCycle.value &&
      billingCycle !== subscription.billingCycle.value

    await openDrawerWithCheckoutSession({
      plan,
      preferredCycle: billingCycle || storedBillingCycle.value || null,
      lockedCycle: isCycleOnlyChange ? billingCycle : null
    })
  }

  const handleDowngradeConfirm = async ({ toPlan, done, fail }) => {
    try {
      const serviceOrderId = serviceOrder.value?.serviceOrderId
      const hobbyPlan = plansData.value?.find(
        (plan) => plan.sku?.toLowerCase() === toPlan.toLowerCase()
      )

      if (!serviceOrderId || !hobbyPlan?.id) {
        throw new Error('Missing data required to change plan.')
      }

      await downgradeServiceOrderPlan({
        id: serviceOrderId,
        newPlanId: hobbyPlan.id
      })

      toast.add({
        severity: 'success',
        summary: 'Plan changed',
        detail: 'Your plan has been updated successfully.',
        closable: true
      })
      done?.()
      showChangePlanDrawer.value = false
      await subscription.refetch()
    } catch (err) {
      const detail =
        (Array.isArray(err?.message) ? err.message[0] : err?.message) || 'Unable to downgrade plan.'
      fail?.(detail)
    }
  }

  const planLabel = (sku) => (sku === 'pro' ? 'Pro Plan' : sku === 'hobby' ? 'Hobby Plan' : 'plan')

  const handlePlanInfoSubmit = async () => {
    // Capture the target before resetting drawer state.
    const targetPlan = selectedPlan.value
    const targetCycle = lockedCycle.value || storedBillingCycle.value || null

    showPlanInfoDrawer.value = false
    showChangePlanDrawer.value = false
    selectedPlan.value = null
    drawerMode.value = 'subscribe'
    lockedCycle.value = null
    checkoutSessionClientSecret.value = ''

    // Stripe payment confirmed on the client, but the backend transitions
    // the new DRAFT to ACTIVE via webhook — poll until the SO reflects the
    // new plan. `useCurrentSubscription.isLoading` stays true throughout,
    // so the Subscription Plan + Current Invoice cards skeleton until the
    // new state lands.
    if (targetPlan) {
      const succeeded = await subscription.refetchUntil(({ planSku, billingCycle }) => {
        if (planSku !== targetPlan) return false
        if (!targetCycle) return true
        return billingCycle === targetCycle
      })

      if (succeeded) {
        toast.add({
          severity: 'success',
          summary: `${planLabel(targetPlan)} subscribed`,
          detail: `Your subscription to the ${planLabel(targetPlan)} is now active.`,
          life: 6000,
          closable: true
        })
      }
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
