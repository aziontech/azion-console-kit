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

  import { ref, computed, onMounted } from 'vue'

  import { useRoute, useRouter } from 'vue-router'
  import { useAccountStore } from '@/stores/account'
  import { storeToRefs } from 'pinia'

  const route = useRoute()
  const router = useRouter()
  const accountStore = useAccountStore()

  const { accountIsNotRegular } = storeToRefs(accountStore)

  const activeTab = ref(0)

  const viewBillsRef = ref(null)
  const paymentListViewRef = ref(null)

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
    if (activeTab.value !== TABS_MAP.payment) changeTab(TABS_MAP.payment)
    paymentListViewRef.value.openDrawerAddCredit()
  }

  const goToPaymentMethod = () => {
    if (activeTab.value !== TABS_MAP.payment) changeTab(TABS_MAP.payment)
    paymentListViewRef.value.openDrawerPaymentMethod()
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
</template>
