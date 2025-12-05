<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Edge Pulse"></PageHeadingBlock>
    </template>
    <template #content>
      <TabView
        :active-index="0"
        class="w-full grow flex flex-col gap-8"
      >
        <!-- Default -->
        <TabPanel
          :pt="{
            headerAction: {
              'data-testid': 'edge-pulse__default-tab'
            }
          }"
          header="Default Tag"
        >
          <FormFieldsDefault></FormFieldsDefault>
        </TabPanel>

        <!-- Pre-loading -->
        <TabPanel
          :pt="{
            headerAction: {
              'data-testid': 'edge-pulse__pre-loading-tab'
            }
          }"
          header="Pre-loading Tag"
        >
          <div class="w-full">
            <FormFieldsTag></FormFieldsTag>
          </div>
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
  import FormFieldsDefault from './FormFields/FormFieldsDefault.vue'
  import FormFieldsTag from './FormFields/FormFieldsTag.vue'
</script>
