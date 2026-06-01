<script setup>
  import { ref, computed } from 'vue'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import IconButton from '@aziontech/webkit/icon-button'
  import SkeletonBlock from '@/templates/skeleton-block'
  import BillsView from '@/views/Billing/BillsView.vue'
  import { useCurrentSubscription } from '@/composables/useCurrentSubscription'

  const emit = defineEmits(['loadCard', 'openDrawerAddCredit'])

  const subscription = useCurrentSubscription()
  const isRefreshing = ref(false)
  const viewBillsRef = ref(null)

  const loadingLastUpdated = computed(() => subscription.isLoading.value || isRefreshing.value)
  const invoiceLastUpdated = computed(() => {
    const value = subscription.lastUpdate.value
    return value ? `Last Update: ${value}` : 'Last Update: --'
  })

  const props = defineProps({
    loadPaymentMethodDefaultService: { type: Function, required: true },
    getStripeClientService: { type: Function, required: true },
    loadCurrentInvoiceService: { type: Function, required: true },
    loadInvoiceDataService: { type: Function, required: true },
    listServiceAndProductsChangesService: { type: Function, required: true },
    documentPaymentMethodService: { type: Function, required: true },
    listPaymentHistoryService: { type: Function, required: true },
    documentPaymentHistoryService: { type: Function, required: true },
    loadYourServicePlanService: { type: Function, required: true },
    openPlans: { type: Function, required: true },
    loadContractServicePlan: { type: Function, required: true },
    loadInvoiceLastUpdatedService: { type: Function, required: true },
    cardDefault: { type: Object, required: true }
  })

  const callBackDrawer = async () => {
    if (viewBillsRef.value) {
      await viewBillsRef.value.reloadList()
    }
  }

  const handleRefresh = async () => {
    if (isRefreshing.value) return
    isRefreshing.value = true
    try {
      await Promise.allSettled([subscription.refetch(), callBackDrawer()])
    } finally {
      isRefreshing.value = false
    }
  }

  const propsNotification = () => ({
    linkText: { hidden: true },
    buttonCredit: {},
    buttonPaymentMethod: { hidden: true }
  })

  defineExpose({
    callBackDrawer
  })
</script>
<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        pageTitle="Billing"
        description="View and manage invoices, payments, and subscription details."
        :isRightAlignment="true"
      >
        <template #default>
          <div class="flex items-center gap-3">
            <SkeletonBlock
              width="12rem"
              :isLoaded="!loadingLastUpdated"
            >
              <span class="text-xs text-color">{{ invoiceLastUpdated }}</span>
            </SkeletonBlock>
            <IconButton
              kind="outlined"
              size="small"
              :icon="isRefreshing ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'"
              :disabled="isRefreshing"
              ariaLabel="Refresh billing"
              @click="handleRefresh"
            />
          </div>
        </template>
      </PageHeadingBlock>
    </template>
    <template #content>
      <div class="mb-2">
        <slot
          name="notification"
          v-bind="propsNotification()"
        />
      </div>
      <BillsView
        ref="viewBillsRef"
        v-bind="props"
        :isReloading="isRefreshing"
        @loadCard="emit('loadCard')"
        @openDrawerAddCredit="emit('openDrawerAddCredit')"
      />
    </template>
  </ContentBlock>
</template>
