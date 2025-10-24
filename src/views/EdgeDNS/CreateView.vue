<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Create Zone" />
    </template>

    <template #content>
      <CreateFormBlock
        :createService="edgeDNSService.createEdgeDNSZonesService"
        :schema="validationSchema"
        :initialValues="initialValues"
        disableToast
        @on-response="handleResponse"
        @on-response-fail="handleTrackFailedCreation"
      >
        <template #form>
          <FormFieldsEdgeDnsCreate />
        </template>
        <template #action-bar="{ onSubmit, onCancel, loading }">
          <ActionBarTemplate
            @onSubmit="onSubmit"
            @onCancel="onCancel"
            :loading="loading"
          />
        </template>
      </CreateFormBlock>
    </template>
  </ContentBlock>
</template>

<script setup>
  import CreateFormBlock from '@templates/create-form-block'
  import FormFieldsEdgeDnsCreate from './FormFields/FormFieldsEdgeDns.vue'
  import * as yup from 'yup'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import { inject } from 'vue'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import { edgeDNSService } from '@/services/v2/edge-dns/edge-dns-service'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const validationSchema = yup.object({
    name: yup.string().required(),
    domain: yup
      .string()
      .required()
      .test('valid-domain', 'Invalid domain', function (value) {
        const domainRegex = /^(?:[-A-Za-z0-9]+\.)+[A-Za-z]{2,6}$/
        return domainRegex.test(value)
      }),
    dnssec: yup.boolean(),
    isActive: yup.boolean()
  })

  const initialValues = {
    name: '',
    domain: '',
    dnssec: false,
    isActive: true
  }

  const handleResponse = (response) => {
    tracker.product.productCreated({
      productName: 'Edge DNS Zone'
    })

    handleToast(response)
  }

  const handleToast = (response) => {
    const toast = {
      feedback:
        'Your DNS zone has been created. To complete the setup, ensure the Azion nameservers are configured in your domain provider.',
      additionalFeedback:
        'For the DNSSEC, once the Key Tag and Digest are available in your zone, provide them to your provider to fully activate DNSSEC.',
      actions: {
        link: {
          label: 'View Zone',
          callback: () => response.redirectToUrl(`/edge-dns/edit/${response.data.id}`)
        }
      }
    }
    response.showToastWithActions(toast)
  }

  const handleTrackFailedCreation = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToCreate({
        productName: 'Edge DNS Zone',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }
</script>
