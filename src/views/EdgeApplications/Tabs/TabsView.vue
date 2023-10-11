<template>
  <div>
    <TabView :active-index="0">
      <TabPanel header="Main Settings">
        <MainSettingsTab />
      </TabPanel>

      <TabPanel header="Origins">
        <OriginsTab />
      </TabPanel>

      <TabPanel header="Device Groups">
        <DeviceGroupsTab />
      </TabPanel>

      <TabPanel header="Error Responses">
        <ErrorResponsesTab />
      </TabPanel>

      <TabPanel header="Cache Settings">
        <CacheSettingsTab />
      </TabPanel>

      <TabPanel
        v-if="activatedFunctions"
        header="Functions"
      >
        <EdgeFunctionsTab />
      </TabPanel>

      <TabPanel header="Rules Engine">
        <RulesEngineTab />
      </TabPanel>
    </TabView>
  </div>
</template>

<script setup>
  import TabView from 'primevue/tabview'
  import TabPanel from 'primevue/tabpanel'

  // Tabs
  import OriginsTab from 'Tabs/Origins'
  import MainSettingsTab from 'Tabs/MainSettings'
  import DeviceGroupsTab from 'Tabs/DeviceGroups'
  import ErrorResponsesTab from 'Tabs/ErrorResponses'
  import CacheSettingsTab from 'Tabs/CacheSettings'
  import EdgeFunctionsTab from 'Tabs/EdgeFunctions'
  import RulesEngineTab from 'Tabs/RulesEngine'

  const activatedFunctions = false
</script>
