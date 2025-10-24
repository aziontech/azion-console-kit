<script setup>
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import ContentBlock from '@/templates/content-block'
  import CreateFormBlock from '@/templates/create-form-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import * as yup from 'yup'
  import FormCreateEdgeFirewall from './FormFields/FormFieldsEdgeFirewall'
  import { edgeFirewallService } from '@/services/v2/edge-firewall/edge-firewall-service'
  import { inject } from 'vue'

  defineOptions({ name: 'create-edge-firewall' })

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  import { handleTrackerError } from '@/utils/errorHandlingTracker'

  const tracker = inject('tracker')

  const validationSchema = yup.object({
    name: yup.string().required().label('Name'),
    edgeFunctionsEnabled: yup.boolean().label('Edge Funcions Enabled'),
    networkProtectionEnabled: yup.boolean().label('Network Protection Enabled'),
    wafEnabled: yup.boolean().label('WAF Enabled'),
    isActive: yup.boolean().label('Active')
  })

  const initialValues = {
    name: '',
    isActive: true,
    debugRules: false,
    edgeFunctionsEnabled: true,
    networkProtectionEnabled: true,
    wafEnabled: false,
    ddosProtectionUnmetered: true
  }

  const handleCreateEdgeFirewall = (response) => {
    tracker.product.productCreated({
      productName: 'Edge Firewall'
    })
    handleToast(response)
  }

  const handleToast = (response) => {
    const toast = {
      feedback: 'Your Firewall has been created',
      actions: {
        link: {
          label: 'View Firewall',
          callback: () => response.redirectToUrl(`/firewalls/edit/${response.data.id}`)
        }
      }
    }
    response.showToastWithActions(toast)
  }

  const handleFailedCreateEdgeFirewall = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToCreate({
        productName: 'Edge Firewall',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Create Firewall"></PageHeadingBlock>
    </template>
    <template #content>
      <CreateFormBlock
        :createService="edgeFirewallService.createEdgeFirewallService"
        :schema="validationSchema"
        :initialValues="initialValues"
        @on-response="handleCreateEdgeFirewall"
        @on-response-fail="handleFailedCreateEdgeFirewall"
        disableToast
      >
        <template #form>
          <FormCreateEdgeFirewall />
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
