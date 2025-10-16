<script setup>
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import TabPanel from 'primevue/tabpanel'
  import TabView from 'primevue/tabview'
  import { ref, reactive, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { generateCurrentTimestamp } from '@/helpers/generate-timestamp'

  defineOptions({ name: 'tabs-sql-database' })

  const mapTabs = ref({
    tables: 0,
    editor: 1,
    settings: 2
  })

  const route = useRoute()
  const router = useRouter()
  const activeTab = ref(0)
  const sqlDatabaseId = ref(route.params.id)

  const tabHasUpdate = reactive({ oldTab: null, nextTab: 0, updated: 0 })

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
      id: sqlDatabaseId.value,
      tab
    }
    const { query } = route

    router.push({
      name: 'database-sql-database',
      params,
      query
    })
  }

  const title = ref('')

  const renderTabCurrentRouter = async () => {
    const { tab = 0 } = route.params
    title.value = 'Titulo'
    const activeTabIndexByRoute = mapTabs.value[tab]
    changeRouteByClickingOnTab({ index: activeTabIndexByRoute })
  }

  watch(activeTab, (newValue, oldValue) => {
    tabHasUpdate.oldTab = oldValue
    tabHasUpdate.nextTab = newValue
    tabHasUpdate.updated = generateCurrentTimestamp()
  })

  renderTabCurrentRouter()
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock :pageTitle="title" />
    </template>
    <template #content>
      <TabView
        :activeIndex="activeTab"
        @tab-click="changeRouteByClickingOnTab"
        class="w-full h-full"
      >
        <TabPanel
          header="Tables"
          :pt="{
            root: { 'data-testid': 'sql-database-tabs__tab__tables' }
          }"
        >
          <div>Conteudo</div>
        </TabPanel>
        <TabPanel
          header="Editor"
          :pt="{
            root: { 'data-testid': 'sql-database-tabs__tab__editor' }
          }"
        >
          <h4>Conteudo</h4>
        </TabPanel>
        <TabPanel
          header="Settings"
          :pt="{
            root: { 'data-testid': 'sql-database-tabs__tab__settings' }
          }"
        >
          <h4>Conteudo</h4>
        </TabPanel>
      </TabView>
    </template>
  </ContentBlock>
</template>
