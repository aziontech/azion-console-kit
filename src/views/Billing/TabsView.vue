<script setup>
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import TabPanel from 'primevue/tabpanel'
  import TabView from 'primevue/tabview'
  import Tag from 'primevue/tag'
  import PaymentListView from './PaymentListView.vue'
  import BillsView from '@/views/Billing/BillsView.vue'
  import DrawerAddCredit from '@/views/Billing/Drawer/DrawerAddCredit'
  import DrawerPaymentMethod from '@/views/Billing/Drawer/DrawerPaymentMethod'

  import { ref, computed, provide, onMounted } from 'vue'

  import { useRoute, useRouter } from 'vue-router'
  import { useAccountStore } from '@/stores/account'

  const route = useRoute()
  const router = useRouter()
  const activeTab = ref(0)
  const drawerAddCreditRef = ref(null)
  const drawerPaymentMethodRef = ref(null)
  const listPaymentMethodsRef = ref(null)
  const viewBillsRef = ref(null)
  const accountBlocked = useAccountStore().isReviewPaymentRequired

  provide('drawersMethods', {
    openDrawerPaymentMethod: () => {
      drawerPaymentMethodRef.value.openDrawer()
    },
    openDrawerAddCredit: () => {
      if (cardDefault.value.cardData) drawerAddCreditRef.value.openDrawer()
    }
  })

  const props = defineProps({
    loadPaymentMethodDefaultService: { type: Function, required: true },
    addCreditService: { type: Function, required: true },
    createPaymentMethodService: { type: Function, required: true },
    paymentServices: { type: Object, required: true },
    billsServices: { type: Object, required: true }
  })

  const cardDefault = ref({
    loader: false
  })

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

  const loadListPaymentMethods = () => {
    if (isActiveTab.value.payment) {
      listPaymentMethodsRef.value?.reloadList()
    }

    loadCardDefault()
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

  const successAddCredit = async () => {
    await viewBillsRef.value?.reloadList()
  }

  onMounted(() => {
    renderTabCurrentRouter()
    loadCardDefault()
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
          <Tag
            severity="info"
            icon="pi pi-refresh"
            value="Last Updated: MM/DD/2023 02:32 PM"
          />
        </template>
      </PageHeadingBlock>
    </template>
    <template #content>
      <DrawerAddCredit
        ref="drawerAddCreditRef"
        v-if="cardDefault.cardData"
        :cardDefault="cardDefault"
        :createService="props.addCreditService"
        @onSuccess="successAddCredit"
      />
      <DrawerPaymentMethod
        ref="drawerPaymentMethodRef"
        :createPaymentMethodService="props.createPaymentMethodService"
        @onSuccess="loadListPaymentMethods"
      />
      <TabView
        :activeIndex="activeTab"
        @tab-click="changeRouteByClickingOnTab"
        class="w-full h-full"
      >
        <TabPanel
          header="Bills"
          :disabled="accountBlocked"
          :pt="{
            headerAction: {
              'data-testid': 'billing__bills-tab'
            }
          }"
        >
          <BillsView
            v-if="isActiveTab.bills"
            ref="viewBillsRef"
            v-bind="props.billsServices"
            :cardDefault="cardDefault"
            @changeTab="changeTab"
          />
        </TabPanel>
        <TabPanel
          header="Payment Methods"
          :pt="{
            headerAction: {
              'data-testid': 'billing__payment-methods-tab'
            }
          }"
        >
          <PaymentListView
            v-if="isActiveTab.payment"
            ref="listPaymentMethodsRef"
            @update-credit-event="loadCardDefault"
            v-bind="props.paymentServices"
          />
        </TabPanel>
      </TabView>
    </template>
  </ContentBlock>
</template>
