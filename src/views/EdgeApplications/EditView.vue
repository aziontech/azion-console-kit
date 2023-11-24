<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Edge Application"></PageHeadingBlock>
    </template>
    <template #content>
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
  </ContentBlock>
</template>

<script setup>
  import TabView from 'primevue/tabview'
  import TabPanel from 'primevue/tabpanel'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'

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
</script>
