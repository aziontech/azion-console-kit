<script setup>
  import { ref } from 'vue'

  // Import the components
  import FormFieldsDataStream from './FormFields/FormFieldsDataStream'
  import SamplingDialog from './Dialog/SamplingDialog'
  import CreateFormBlock from '@/templates/create-form-block'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import ActionBarBlockWithTeleport from '@/templates/action-bar-block/action-bar-with-teleport'
  import { dataStreamService } from '@/services/v2/data-stream/data-stream-service'
  import { validationSchema } from './FormFields/composables/validation'

  const validation = validationSchema(false)

  const displaySamplingDialog = ref(false)
  const formSubmit = async (onSubmit, values, formValid) => {
    if (!values.hasSampling) {
      onSubmit()
    } else {
      if (!formValid) {
        onSubmit()
        return
      }

      displaySamplingDialog.value = true
    }
  }

  const handleToast = (response) => {
    const toast = {
      feedback: 'Your data stream has been created',
      actions: {
        link: {
          label: 'View Data Stream ',
          callback: () => response.redirectToUrl(`/data-stream/edit/${response.data.id}`)
        }
      }
    }
    response.showToastWithActions(toast)
  }
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Create Stream" description="Configure data sources, delivery destinations, and delivery behavior for event and log data." />
    </template>
    <template #content>
      <CreateFormBlock
        :createService="dataStreamService.createDataStreamService"
        :schema="validation"
        @on-response="handleToast"
        @on-response-fail="(error) => console.log(error)"
        disableToast
      >
        <template #form="{ resetForm }">
          <FormFieldsDataStream :resetForm="resetForm" />
        </template>
        <template #action-bar="{ onSubmit, onCancel, loading, values, formValid }">
          <ActionBarBlockWithTeleport
            @onSubmit="formSubmit(onSubmit, values, formValid)"
            @onCancel="onCancel"
            :loading="loading"
          />
          <SamplingDialog
            v-model:visible="displaySamplingDialog"
            @confirm="onSubmit"
            @cancel="displaySamplingDialog = false"
          />
        </template>
      </CreateFormBlock>
    </template>
  </ContentBlock>
</template>
