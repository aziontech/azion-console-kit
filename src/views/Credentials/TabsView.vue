<script setup>
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import TabPanel from 'primevue/tabpanel'
  import TabView from 'primevue/tabview'
  import { computed, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import ObjectStorageCredentialsListView from './ObjectStorageCredentials/ListView.vue'

  defineOptions({ name: 'tabs-credentials' })

  const route = useRoute()
  const router = useRouter()
  const activeTab = ref(0)

  const mapTabs = ref({
    'object-storage': 0
  })

  const showTab = (tabName) => computed(() => activeTab.value === mapTabs.value?.[tabName])
  const showTabs = {
    objectStorage: showTab('object-storage')
  }

  const getTabFromIndex = (selectedTabIndex) => {
    const tabNames = Object.keys(mapTabs.value)
    const selectedTab = tabNames.find((tabName) => mapTabs.value[tabName] === selectedTabIndex)
    return selectedTab
  }

  const changeRouteByTab = (tab) => {
    const params = { tab }
    router.push({
      name: 'credentials-tabs',
      params,
      query: route.query
    })
  }

  const changeTab = (index) => {
    const tab = getTabFromIndex(index)
    activeTab.value = index
    changeRouteByTab(tab)
  }

  const renderTabByCurrentRouter = () => {
    const { tab } = route.params
    let selectedTab = tab
    if (!tab) selectedTab = 'object-storage'

    const activeTabIndexByRoute = mapTabs.value[selectedTab]
    changeTab(activeTabIndexByRoute)
  }

  const tabs = ref([
    {
      header: 'Object Storage',
      component: ObjectStorageCredentialsListView,
      show: showTabs.objectStorage
    }
  ])

  renderTabByCurrentRouter()
</script>

<template>
  <ContentBlock data-testid="credentials-content-block">
    <template #heading>
      <PageHeadingBlock
        pageTitle="Credentials"
        data-testid="credentials-heading"
      />
    </template>
    <template #content>
      <TabView
        :activeIndex="activeTab"
        @tab-click="({ index = 0 }) => changeTab(index)"
        class="w-full h-full"
      >
        <TabPanel
          v-for="(tab, index) in tabs"
          :pt="{
            headerAction: {
              id: `tab_${index}`
            },
            root: {
              'data-testid': `credentials-tab-panel__${tab.header}__tab`,
              id: `${tab.header}`
            }
          }"
          :key="index"
          :header="tab.header"
        >
          <component
            :is="tab.component"
            v-if="tab.show"
          />
        </TabPanel>
      </TabView>
    </template>
  </ContentBlock>
</template>
