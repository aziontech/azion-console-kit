<script setup>
  import { ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import TabView from 'primevue/tabview'
  import TabPanel from '@aziontech/webkit/tabpanel'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { DataTableActionsButtons } from '@/components/list-table'
  import OverviewTab from '@/views/Deployments/tabs/OverviewTab.vue'
  import DeploymentHistoryTab from '@/views/Deployments/tabs/DeploymentHistoryTab.vue'

  defineOptions({ name: 'tabs-deployments' })

  const TAB_ORDER = ['overview', 'history']
  const TAB_TO_INDEX = TAB_ORDER.reduce((acc, name, index) => {
    acc[name] = index
    return acc
  }, {})

  const route = useRoute()
  const router = useRouter()

  const initialTabName = TAB_ORDER.includes(route.params.tab) ? route.params.tab : 'overview'
  const activeTab = ref(TAB_TO_INDEX[initialTabName])

  if (route.params.tab !== initialTabName) {
    router.replace({
      name: 'deployments-list',
      params: { tab: initialTabName },
      query: route.query
    })
  }

  const indexToTabName = (index) => TAB_ORDER[index] || TAB_ORDER[0]

  const handleTabClick = ({ index = 0 }) => {
    if (index === activeTab.value) return
    activeTab.value = index
    router.replace({
      name: 'deployments-list',
      params: { tab: indexToTabName(index) },
      query: route.query
    })
  }
</script>

<template>
  <ContentBlock data-testid="deployments-content-block">
    <template #heading>
      <PageHeadingBlock
        pageTitle="Deployments"
        description="View and manage your deployment history."
        data-testid="deployments-heading"
      >
        <template #default>
          <DataTableActionsButtons
            size="small"
            label="Deployment"
            createPagePath="/deployments/create"
            data-testid="create_Deployment_button"
          />
        </template>
      </PageHeadingBlock>
    </template>
    <template #content>
      <TabView
        :activeIndex="activeTab"
        class="w-full h-full"
        @tab-click="handleTabClick"
      >
        <TabPanel
          header="Overview"
          :pt="{ root: { 'data-testid': 'deployments-tabs__tab__overview' } }"
        >
          <OverviewTab v-if="activeTab === TAB_TO_INDEX.overview" />
        </TabPanel>
        <TabPanel
          header="Deployment History"
          :pt="{ root: { 'data-testid': 'deployments-tabs__tab__history' } }"
        >
          <DeploymentHistoryTab v-if="activeTab === TAB_TO_INDEX.history" />
        </TabPanel>
      </TabView>
    </template>
  </ContentBlock>
</template>
