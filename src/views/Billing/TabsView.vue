<script setup>
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import TabPanel from 'primevue/tabpanel'
  import TabView from 'primevue/tabview'
  import Tag from 'primevue/tag'
  import PaymentListView from './PaymentListView.vue'
  import BillsView from '@/views/Billing/BillsView.vue'
  import SkeletonBlock from '@/templates/skeleton-block'
  import NotificationPayment from './components/notification-payment'
  import DrawerAddCredit from '@/views/Billing/Drawer/DrawerAddCredit'
  import DrawerPaymentMethod from '@/views/Billing/Drawer/DrawerPaymentMethod'

  import { ref, computed, onMounted } from 'vue'

  import { useRoute, useRouter } from 'vue-router'
  import { useAccountStore } from '@/stores/account'
  import { storeToRefs } from 'pinia'
  import { provideBillingDrawers } from '@/composables/use-billing-drawers'
  import { paymentService } from '@/services/v2'
  import { loadUserAndAccountInfo } from '@/helpers/account-data'
  import { useToast } from 'primevue/usetoast'

  const route = useRoute()
  const router = useRouter()
  const accountStore = useAccountStore()
  const toast = useToast()

  const { accountIsNotRegular } = storeToRefs(accountStore)

  const activeTab = ref(0)

  const viewBillsRef = ref(null)
  const paymentListViewRef = ref(null)

  const {
    drawerAddCreditRef,
    drawerPaymentMethodRef,
    openDrawerAddCredit: openDrawerAddCreditGlobal,
    openDrawerPaymentMethod: openDrawerPaymentMethodGlobal
  } = provideBillingDrawers()

  const props = defineProps({
    loadPaymentMethodDefaultService: { type: Function, required: true },
    paymentServices: { type: Object, required: true },
    billsServices: { type: Object, required: true },
    getStripeClientService: { type: Function, required: true }
  })

  const cardDefault = ref({
    loader: false
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

  const loadCardDefault = async () => {
    cardDefault.value.isLoader = false
    try {
      cardDefault.value = await props.loadPaymentMethodDefaultService()
    } finally {
      cardDefault.value = {
        ...cardDefault.value,
        loader: true
      }
    }
  }

  const loadInvoiceLastUpdated = async () => {
    try {
      loadingLastUpdated.value = true
      invoiceLastUpdated.value = accountIsNotRegular.value
        ? await props.billsServices.loadInvoiceLastUpdatedService()
        : ''
    } finally {
      loadingLastUpdated.value = false
    }
  }

  const goToPaymentCredit = () => {
    openDrawerAddCreditGlobal()
  }

  const goToPaymentMethod = () => {
    openDrawerPaymentMethodGlobal()
  }

  // Helper functions for drawer success callbacks
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
      await loadUserAndAccountInfo()
    } catch (error) {
      showToast(
        'error',
        'An error occurred while updating account status. Please refresh the page to see the latest changes.'
      )
    }
  }

  const successAddCredit = async () => {
    await updateAccountStatus()
    await loadCardDefault()
  }

  const successAddPaymentMethod = async () => {
    await updateAccountStatus()
    await loadCardDefault()
    if (paymentListViewRef.value) {
      paymentListViewRef.value.reloadList()
    }
  }

  onMounted(() => {
    renderTabCurrentRouter()
    loadCardDefault()
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
          <NotificationPayment
            class="mt-4"
            :loadCurrentInvoice="props.billsServices.loadCurrentInvoiceService"
            :disabledCredit="!cardDefault.cardData"
            @clickAddCredit="goToPaymentCredit"
            @clickAddPaymentMethod="goToPaymentMethod"
            @clickLinkPaymentMethod="changeTab(TABS_MAP.payment)"
          />
          <BillsView
            v-if="isActiveTab.bills"
            ref="viewBillsRef"
            v-bind="props.billsServices"
            :cardDefault="cardDefault"
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
          <NotificationPayment
            class="mt-4"
            :loadCurrentInvoice="props.billsServices.loadCurrentInvoiceService"
            :disabledCredit="!cardDefault.cardData"
            @clickAddCredit="goToPaymentCredit"
            @clickAddPaymentMethod="goToPaymentMethod"
            @clickLinkPaymentMethod="changeTab(TABS_MAP.payment)"
          />
          <PaymentListView
            ref="paymentListViewRef"
            v-if="isActiveTab.payment"
            @update-credit-event="loadCardDefault"
            v-bind="props.paymentServices"
            :getStripeClientService="props.getStripeClientService"
            :cardDefault="cardDefault"
          />
        </TabPanel>
      </TabView>
    </template>
  </ContentBlock>

  <DrawerAddCredit
    ref="drawerAddCreditRef"
    v-if="cardDefault.cardData"
    :cardDefault="cardDefault"
    :createService="paymentService.addCredit"
    @onSuccess="successAddCredit"
  />
  <DrawerPaymentMethod
    ref="drawerPaymentMethodRef"
    :getStripeClientService="props.getStripeClientService"
    @onSuccess="successAddPaymentMethod"
  />
</template>
