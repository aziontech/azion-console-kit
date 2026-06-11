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
              v-if="invoiceLastUpdated"
              width="12rem"
              :isLoaded="!loadingLastUpdated"
            >
              <span class="text-xs text-color">{{ invoiceLastUpdated }}</span>
            </SkeletonBlock>
            <IconButton
              kind="outlined"
              size="small"
              icon="pi pi-refresh"
              :loading="isRefreshing"
              ariaLabel="Refresh billing"
              @click="handleRefresh"
            />
          </div>
        </template>
      </PageHeadingBlock>
    </template>
    <template #content>
      <BillsView
        ref="billsRef"
        v-bind="props"
      />
    </template>
  </ContentBlock>
</template>

<script setup>
  import { ref, onMounted } from 'vue'
  import { storeToRefs } from 'pinia'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import IconButton from '@aziontech/webkit/actions/icon-button'
  import SkeletonBlock from '@/templates/skeleton-block'
  import BillsView from './BillsView.vue'
  import { useAccountStore } from '@/stores/account'
  import { loadContractData } from '@/helpers/account-data'

  defineOptions({ name: 'LegacyBillingScreen' })

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
    loadInvoiceLastUpdatedService: { type: Function, required: true }
  })

  const accountStore = useAccountStore()
  const { accountIsNotRegular } = storeToRefs(accountStore)

  const billsRef = ref(null)
  const invoiceLastUpdated = ref('')
  const loadingLastUpdated = ref(false)
  const isRefreshing = ref(false)

  const loadInvoiceLastUpdated = async () => {
    try {
      loadingLastUpdated.value = true
      invoiceLastUpdated.value = accountIsNotRegular.value
        ? await props.loadInvoiceLastUpdatedService()
        : ''
    } finally {
      loadingLastUpdated.value = false
    }
  }

  const handleRefresh = async () => {
    if (isRefreshing.value) return
    isRefreshing.value = true
    try {
      await Promise.allSettled([billsRef.value?.reloadAll(), loadInvoiceLastUpdated()])
    } finally {
      isRefreshing.value = false
    }
  }

  const callBackDrawer = async () => {
    await billsRef.value?.reloadList()
  }

  defineExpose({
    callBackDrawer
  })

  onMounted(() => {
    loadContractData()
    loadInvoiceLastUpdated()
  })
</script>
