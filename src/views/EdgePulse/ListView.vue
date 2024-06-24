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
        <TabPanel header="Default Tag">
          <FormFieldsDefault @handleCopy="handleCopy"></FormFieldsDefault>
        </TabPanel>

        <!-- Pre-loading -->
        <TabPanel header="Pre-loading Tag">
          <div class="w-full">
            <FormFieldsTag @handleCopy="handleCopy"></FormFieldsTag>
          </div>
        </TabPanel>
      </TabView>
    </template>
  </ContentBlock>
</template>

<script setup>
  import { useToast } from 'primevue/usetoast'

  import { clipboardWrite } from '@/helpers'
  import TabView from 'primevue/tabview'
  import TabPanel from 'primevue/tabpanel'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import FormFieldsDefault from './FormFields/FormFieldsDefault.vue'
  import FormFieldsTag from './FormFields/FormFieldsTag.vue'

  const toast = useToast()

  const showToast = () => {
    toast.add({
      closable: true,
      severity: 'success',
      summary: 'Copied successfully!'
    })
  }
  const handleCopy = ({ code }) => {
    clipboardWrite(code)
    showToast()
  }
</script>
