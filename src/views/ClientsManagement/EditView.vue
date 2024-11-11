<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Edit Client"></PageHeadingBlock>
    </template>
    <template #content>
      <EditFormBlock
        :editService="props.loadAccountService"
        :loadService="props.loadAccountService"
        :schema="validationSchema"
        :updatedRedirect="props.updatedRedirect"
        @on-edit-success="handleTrackSuccessEdit"
        @on-edit-fail="handleTrackFailEdit"
      >
        <template #form>
          <FormFieldsCreateClients
            :clipboardWrite="clipboardWrite"
            :documentationService="documentationService"
          />
        </template>
        <template #action-bar="{ onSubmit, onCancel, loading, values }">
          <ActionBarBlockWithTeleport
            v-if="!values.managed"
            @onSubmit="onSubmit"
            @onCancel="onCancel"
            :loading="loading"
          />
        </template>
      </EditFormBlock>
    </template>
  </ContentBlock>
</template>

<script setup>
  import EditFormBlock from '@/templates/edit-form-block'
  import ActionBarBlockWithTeleport from '@/templates/action-bar-block/action-bar-with-teleport.vue'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import FormFieldsCreateClients from './FormFields/FormFieldsCreateClients.vue'

  import * as yup from 'yup'
  import { inject } from 'vue'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const props = defineProps({
    loadAccountService: {
      type: Function,
      required: true
    },
    editDigitalCertificateService: {
      type: Function,
      required: true
    },
    updatedRedirect: {
      type: String,
      required: true
    },
    clipboardWrite: {
      type: Function,
      required: true
    },
    documentationService: {
      required: true,
      type: Function
    }
  })

  const validationSchema = yup.object({
    name: yup.string().required('Name is a required field.'),
    certificateType: yup.string(),
    csr: yup.string(),
    certificate: yup.string(),
    privateKey: yup.string(),
    managed: yup
      .boolean()
      .isFalse(
        `This is a Let's Encrypt™ certificate automatically created and managed by Azion and can't be edited.`
      )
  })

  const handleTrackSuccessEdit = () => {
    tracker.product
      .productEdited({
        productName: 'Clients Management'
      })
      .track()
  }
  const handleTrackFailEdit = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToEdit({
        productName: 'Clients Management',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }
</script>
