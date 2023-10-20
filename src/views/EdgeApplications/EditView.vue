<template>
  <PageHeadingBlock :pageTitle="pageTitle">
    <template #tabs>
      <TabView
        :active-index="0"
        class="w-full"
      >
        <TabPanel header="Main Settings">
          <!-- <MainSettingsTab /> -->
        </TabPanel>

        <TabPanel header="Origins">
          <OriginsTab
            :listOriginsService="props.listOriginsService"
            :deleteOriginsService="props.deleteOriginsService"
          />
        </TabPanel>

        <TabPanel header="Device Groups">
          <!-- <DeviceGroupsTab /> -->
        </TabPanel>

        <TabPanel header="Error Responses">
          <!-- <ErrorResponsesTab /> -->
        </TabPanel>

        <TabPanel header="Cache Settings">
          <!-- <CacheSettingsTab /> -->
        </TabPanel>

        <TabPanel
          v-if="activatedFunctions"
          header="Functions"
        >
          <!-- <EdgeFunctionsTab /> -->
        </TabPanel>

        <TabPanel header="Rules Engine">
          <!-- <RulesEngineTab /> -->
        </TabPanel>
      </TabView>
    </template>
  </PageHeadingBlock>
</template>

<script setup>
  import TabView from 'primevue/tabview'
  import TabPanel from 'primevue/tabpanel'
  import PageHeadingBlock from '@/templates/page-heading-block-tabs'

  // Tabs
  import OriginsTab from '../EdgeApplicationsOrigins/ListView.vue'

  const activatedFunctions = false

  const props = defineProps({
    listOriginsService: {
      type: Function,
      required: true
    },
    deleteOriginsService: {
      type: Function,
      required: true
    }
  })

  const pageTitle = 'Edge Application'
</script>
