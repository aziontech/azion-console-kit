<script setup>
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import TabPanel from 'primevue/tabpanel'
  import TabView from 'primevue/tabview'
  import Tag from 'primevue/tag'
  import PaymentListView from './PaymentListView.vue'
  import BillsView from '@/views/Billing/BillsView.vue'
  import SkeletonBlock from '@/templates/skeleton-block'

  import { ref, computed, onMounted } from 'vue'

  import { useRoute, useRouter } from 'vue-router'
  import { useAccountStore } from '@/stores/account'
  import { storeToRefs } from 'pinia'
  import { loadUserAndAccountInfo } from '@/helpers/account-data'
  import { useToast } from 'primevue/usetoast'

  const route = useRoute()
  const router = useRouter()
  const accountStore = useAccountStore()
  const toast = useToast()
  const emit = defineEmits(['loadCard', 'openDrawerAddCredit', 'openDrawerAddPaymentMethod'])

  const { accountIsNotRegular } = storeToRefs(accountStore)

  const activeTab = ref(0)

  const viewBillsRef = ref(null)
  const paymentListViewRef = ref(null)

  const props = defineProps({
    loadPaymentMethodDefaultService: { type: Function, required: true },
    getStripeClientService: { type: Function, required: true },
    loadCurrentInvoiceService: { type: Function, required: true },
    loadInvoiceDataService: { type: Function, required: true },
    listServiceAndProductsChangesService: { type: Function, required: true },
    clipboardWrite: { type: Function, required: true },
    documentPaymentMethodService: { type: Function, required: true },
    listPaymentHistoryService: { type: Function, required: true },
    documentPaymentHistoryService: { type: Function, required: true },
    loadYourServicePlanService: { type: Function, required: true },
    openPlans: { type: Function, required: true },
    loadContractServicePlan: { type: Function, required: true },
    loadInvoiceLastUpdatedService: { type: Function, required: true },
    cardDefault: { type: Object, required: true }
  })

  const invoiceLastUpdated = ref('')
  const loadingLastUpdated = ref(false)

  const TABS_MAP = {
    bills: 0,
    payment: 1
  }

  const getTabFromValue = (selectedTabIndex) => {
    const tabNames = Object.keys(TABS_MAP)
    const selectedTab = tabNames.find((tabName) => TABS_MAP[tabName] === selectedTabIndex)
    return selectedTab
  }

  const changeRouteByClickingOnTab = ({ index = 0 }) => {
    changeTab(index)
  }

  const changeTab = (index) => {
    const tab = getTabFromValue(index)
    activeTab.value = index
    const params = {
      tab
    }
    const { query } = route

    router.push({
      name: 'billing-tabs',
      params,
      query
    })
  }

  const isActiveTab = computed(() => ({
    payment: activeTab.value === TABS_MAP.payment,
    bills: activeTab.value === TABS_MAP.bills
  }))

  const renderTabCurrentRouter = async () => {
    const { tab = TABS_MAP.bills } = route.params
    const activeTabIndexByRoute = TABS_MAP[tab]
    changeRouteByClickingOnTab({ index: activeTabIndexByRoute })
  }

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

  const showToast = (severity, detail) => {
    if (!detail) return
    const options = {
      closable: true,
      severity,
      summary: severity,
      detail
    }
    toast.add(options)
  }

  const updateAccountStatus = async () => {
    try {
      emit('loadCard')
      await loadUserAndAccountInfo()
    } catch (error) {
      showToast(
        'error',
        'An error occurred while updating account status. Please refresh the page to see the latest changes.'
      )
    }
  }

  const callBackDrawer = () => {
    updateAccountStatus()
    if (paymentListViewRef.value) {
      paymentListViewRef.value.reloadList()
    }
    if (viewBillsRef.value) {
      viewBillsRef.value.reloadList()
    }
  }

  const redirectPaymentMethod = () => {
    changeTab(TABS_MAP.payment)
  }

  const propsNotification = {
    redirectLink: redirectPaymentMethod,
    linkText: {
      hidden: true
    },
    buttonCredit: {
      hidden: true
    },
    buttonPaymentMethod: {
      hidden: true
    }
  }

  defineExpose({
    callBackDrawer,
    updateAccountStatus
  })

  onMounted(() => {
    renderTabCurrentRouter()
    loadInvoiceLastUpdated()
  })
</script>
<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        pageTitle="Billing"
        :isRightAlignment="true"
      >
        <template #default>
          <SkeletonBlock
            width="10rem"
            :isLoaded="!loadingLastUpdated"
            v-if="invoiceLastUpdated"
          >
            <Tag
              severity="info"
              icon="pi pi-refresh"
              :value="invoiceLastUpdated"
            />
          </SkeletonBlock>
        </template>
      </PageHeadingBlock>
    </template>
    <template #content>
      <TabView
        :activeIndex="activeTab"
        @tab-click="changeRouteByClickingOnTab"
        class="w-full h-full"
      >
        <TabPanel
          header="Bills"
          :pt="{
            headerAction: {
              'data-testid': 'billing__bills-tab__button'
            }
          }"
        >
          <div
            v-show="isActiveTab.bills"
            class="mt-4"
          >
            <slot
              name="notification"
              :redirectLink="redirectPaymentMethod"
            />
          </div>
          <BillsView
            v-if="isActiveTab.bills"
            ref="viewBillsRef"
            v-bind="props"
            @changeTab="changeTab"
          />
        </TabPanel>
        <TabPanel
          v-if="accountIsNotRegular"
          header="Payment Methods"
          :pt="{
            headerAction: {
              'data-testid': 'billing__payment-methods-tab__button'
            }
          }"
        >
          <div
            v-show="isActiveTab.payment"
            class="mt-4"
          >
            <slot
              name="notification"
              v-bind="propsNotification"
            />
          </div>
          <PaymentListView
            ref="paymentListViewRef"
            v-if="isActiveTab.payment"
            @update-credit-event="emit('loadCard')"
            @openDrawerAddCredit="emit('openDrawerAddCredit')"
            @openDrawerAddPaymentMethod="emit('openDrawerAddPaymentMethod')"
            v-bind="props"
          />
        </TabPanel>
      </TabView>
    </template>
  </ContentBlock>
</template>
