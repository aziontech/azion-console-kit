<script setup>
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import TabPanel from 'primevue/tabpanel'
  import TabView from 'primevue/tabview'
  import Tag from 'primevue/tag'

  import { ref } from 'vue'

  import { useRoute, useRouter } from 'vue-router'

  const route = useRoute()
  const router = useRouter()
  const activeTab = ref(0)

  const mapTabs = ref({
    bills: 0,
    payment: 1
  })

  const getTabFromValue = (selectedTabIndex) => {
    const tabNames = Object.keys(mapTabs.value)
    const selectedTab = tabNames.find((tabName) => mapTabs.value[tabName] === selectedTabIndex)
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

  const renderTabCurrentRouter = async () => {
    const { tab = 0 } = route.params
    const activeTabIndexByRoute = mapTabs.value[tab]
    changeRouteByClickingOnTab({ index: activeTabIndexByRoute })
  }

  renderTabCurrentRouter()
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
            value="Last Updated - MM/DD/2023 02:32 PM"
          ></Tag>
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
          <h3>Bills</h3>
        </TabPanel>
        <TabPanel header="Payment Methods">
          <h3>Payments Methods</h3>
        </TabPanel>
      </TabView>
    </template>
  </ContentBlock>
</template>
