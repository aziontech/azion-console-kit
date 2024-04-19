<script setup>
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import ContentBlock from '@/templates/content-block'
  import CreateFormBlock from '@/templates/create-form-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import * as yup from 'yup'
  import FormCreateEdgeFirewall from './FormFields/FormFieldsEdgeFirewall'
  import { ref, inject } from 'vue'

  defineOptions({ name: 'create-edge-firewall' })

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  import { handleTrackerError } from '@/utils/errorHandlingTracker'

  const tracker = inject('tracker')

  const props = defineProps({
    createEdgeFirewallService: {
      type: Function,
      required: true
    },
    listDomainsService: {
      type: Function,
      required: true
    }
  })

  const loadingServices = ref(false)

  const validationSchema = yup.object({
    name: yup.string().required().label('Name'),
    domains: yup.array().label('Domains'),
    isActive: yup.boolean().label('Active'),
    edgeFunctionsEnabled: yup.boolean().label('Edge Funcions Enabled'),
    networkProtectionEnabled: yup.boolean().label('Network Protection Enabled'),
    wafEnabled: yup.boolean().label('WAF Enabled')
  })

  const initialValues = {
    name: '',
    domains: [],
    isActive: true,
    debugRules: false,
    edgeFunctionsEnabled: false,
    networkProtectionEnabled: true,
    wafEnabled: false
  }


  const handleCreateEdgeFirewall = () => {
    tracker.product.productCreated({
      productName: 'Edge Firewall'
    })
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
      <PageHeadingBlock pageTitle="Create Edge Firewall"></PageHeadingBlock>
    </template>
    <template #content>
      <CreateFormBlock
        :createService="props.createEdgeFirewallService"
        :schema="validationSchema"
        :initialValues="initialValues"
        @on-response="handleCreateEdgeFirewall"
        @on-response-fail="handleFailedCreateEdgeFirewall"
      >
        <template #form>
          <FormCreateEdgeFirewall
            :domainsService="props.listDomainsService"
            v-model:loadingDomains="loadingServices"
          />
        </template>
        <template #action-bar="{ onSubmit, formValid, onCancel, loading }">
          <ActionBarTemplate
            @onSubmit="onSubmit"
            @onCancel="onCancel"
            :loading="loading"
            :submitDisabled="!formValid"
          />
        </template>
      </CreateFormBlock>
    </template>
  </ContentBlock>
</template>
