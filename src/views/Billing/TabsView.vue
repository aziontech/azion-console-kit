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

  const route = useRoute()
  const router = useRouter()
  const activeTab = ref(0)
  const drawerAddCreditRef = ref(null)
  const drawerPaymentMethodRef = ref(null)
  const listPaymentMethodsRef = ref(null)

  provide('drawersMethods', {
    openDrawerPaymentMethod: () => {
      drawerPaymentMethodRef.value.openDrawer()
    },
    openDrawerAddCredit: () => {
      drawerAddCreditRef.value.openDrawer()
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

  const renderTabCurrentRouter = async () => {
    const { tab = TABS_MAP.bills } = route.params
    const activeTabIndexByRoute = TABS_MAP[tab]
    changeRouteByClickingOnTab({ index: activeTabIndexByRoute })
  }

  const loadListPaymentMethods = async () => {
    if (isPaymentTabActive.value) {
      listPaymentMethodsRef.value?.reloadList()
    }
  }

  const loadCardDefault = async () => {
    cardDefault.value = await props.loadPaymentMethodDefaultService()
  }

  onMounted(async () => {
    renderTabCurrentRouter()
    await loadCardDefault()
  })
</script>
<template>
  <DrawerAddCredit
    ref="drawerAddCreditRef"
    :cardDefault="cardDefault"
    :createService="props.addCreditService"
  />
  <DrawerPaymentMethod
    ref="drawerPaymentMethodRef"
    :createPaymentMethodService="props.createPaymentMethodService"
    @onSuccess="loadListPaymentMethods"
  />
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
            value="Last Updated - MM/DD/2023 02:32 PM"
          />
        </template>
      </PageHeadingBlock>
    </template>
    <template #content>
      <TabView
        :activeIndex="activeTab"
        @tab-click="changeRouteByClickingOnTab"
        class="w-full h-full"
      >
        <TabPanel header="Bills">
          <BillsView
            v-bind="props.billsServices"
            @changeTab="changeTab"
          />
        </TabPanel>
        <TabPanel header="Payment Methods">
          <PaymentListView
            ref="listPaymentMethodsRef"
            v-if="isPaymentTabActive"
            v-bind="props.paymentServices"
          />
        </TabPanel>
      </TabView>
    </template>
  </ContentBlock>
</template>
