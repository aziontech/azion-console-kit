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
        <TabPanel header="Main Settings"> </TabPanel>
        <TabPanel header="Origins">
          <EdgeApplicationsOriginsListView
            :listOriginsService="props.listOriginsService"
            :deleteOriginsService="props.deleteOriginsService"
          />
        </TabPanel>

        <TabPanel header="Device Groups"> </TabPanel>
        <TabPanel header="Error Responses"> </TabPanel>
        <TabPanel header="Cache Settings"> </TabPanel>
        <TabPanel
          v-if="activatedFunctions"
          header="Functions"
        >
        </TabPanel>
        <TabPanel header="Rules Engine"> </TabPanel>
      </TabView>
    </template>
  </ContentBlock>
</template>

<script setup>
  import TabView from 'primevue/tabview'
  import TabPanel from 'primevue/tabpanel'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import EdgeApplicationsOriginsListView from '../EdgeApplicationsOrigins/ListView.vue'

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
