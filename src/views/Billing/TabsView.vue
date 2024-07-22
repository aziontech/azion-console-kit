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
      if (cardDefault.value) drawerAddCreditRef.value.openDrawer()
    }
  })

  const props = defineProps({
    loadPaymentMethodDefaultService: { type: Function, required: true },
    addCreditService: { type: Function, required: true },
    createPaymentMethodService: { type: Function, required: true },
    paymentServices: { type: Object, required: true },
    billsServices: { type: Object, required: true }
  })

  const cardDefault = ref(null)

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

  const isPaymentTabActive = computed(() => activeTab.value === TABS_MAP.payment)
  const isBillsTabActive = computed(() => activeTab.value === TABS_MAP.bills)

  const renderTabCurrentRouter = async () => {
    const { tab = TABS_MAP.bills } = route.params
    const activeTabIndexByRoute = TABS_MAP[tab]
    changeRouteByClickingOnTab({ index: activeTabIndexByRoute })
  }

  const loadListPaymentMethods = async () => {
    if (isPaymentTabActive.value) {
      listPaymentMethodsRef.value?.reloadList()
    }
    await loadCardDefault()
  }

  const loadCardDefault = async () => {
    try {
      cardDefault.value = await props.loadPaymentMethodDefaultService()
    } catch (error) {
      cardDefault.value = null
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
            severity="secondary"
            icon="pi pi-refresh"
            value="Last Updated: MM/DD/2023 02:32 PM"
          />
        </template>
      </PageHeadingBlock>
    </template>
    <template #content>
      <DrawerAddCredit
        ref="drawerAddCreditRef"
        v-if="cardDefault"
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
        >
          <BillsView
            v-if="isBillsTabActive"
            ref="viewBillsRef"
            v-bind="props.billsServices"
            :cardDefault="cardDefault"
            @changeTab="changeTab"
          />
        </TabPanel>
        <TabPanel header="Payment Methods">
          <PaymentListView
            v-if="isPaymentTabActive"
            ref="listPaymentMethodsRef"
            v-bind="props.paymentServices"
          />
        </TabPanel>
      </TabView>
    </template>
  </ContentBlock>
</template>
