<script setup>
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import TabPanel from 'primevue/tabpanel'
  import TabView from 'primevue/tabview'
  import PrimeButton from 'primevue/button'
  import { computed, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import ObjectStorageCredentialsListView from './ObjectStorageCredentials/ListView.vue'

  defineOptions({ name: 'tabs-credentials' })

  defineProps({
    documentationService: {
      required: true,
      type: Function
    }
  })

  const route = useRoute()
  const router = useRouter()
  const activeTab = ref(0)
  const componentsRefs = ref(null)

  const mapTabs = ref({
    'object-storage': 0
  })

  const showTab = (tabName) => computed(() => activeTab.value === mapTabs.value?.[tabName])
  const showTabs = {
    objectStorage: showTab('object-storage')
  }

  const addButtonController = computed(() => {
    const tab = tabs.value[activeTab.value]
    return {
      showAddButtonTab: !!tab?.showAddButtonTab,
      label: 'Credential',
      click: () => componentsRefs.value[0].handleCreateCredential?.()
    }
  })

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

    const activeTabIndexByRoute = mapTabs.value[selectedTab] ?? 0
    changeTab(activeTabIndexByRoute)
  }

  const tabs = ref([
    {
      header: 'Object Storage',
      component: ObjectStorageCredentialsListView,
      show: showTabs.objectStorage,
      showAddButtonTab: true
    }
  ])

  renderTabByCurrentRouter()
</script>

<template>
  <ContentBlock data-testid="credentials-content-block">
    <template #heading>
      <PageHeadingBlock
        pageTitle="Credentials"
        description="Define and manage credentials used to access Azion's Object Storage."
        data-testid="credentials-heading"
      />
    </template>
    <template #content>
      <div class="flex align-center justify-between relative">
        <TabView
          :activeIndex="activeTab"
          @tab-click="({ index = 0 }) => changeTab(index)"
          class="flex-1"
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
          </TabPanel>
        </TabView>
        <div
          v-if="addButtonController.showAddButtonTab"
          class="flex ml-4 items-center"
        >
          <PrimeButton
            :label="addButtonController.label"
            size="small"
            icon="pi pi-plus"
            @click="addButtonController.click"
            data-testid="data-table-actions-column-body-actions-menu-button"
          />
        </div>
      </div>

      <div>
        <template
          v-for="(tab, index) in tabs"
          :key="index"
        >
          <component
            ref="componentsRefs"
            :is="tab.component"
            v-if="tab.show"
            :documentationService="documentationService"
          />
        </template>
      </div>
    </template>
  </ContentBlock>
</template>
