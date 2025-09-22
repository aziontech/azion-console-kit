<script setup>
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import EditFormBlock from '@/templates/edit-form-block'
  import FormFieldsEdgeFirewall from '@/views/EdgeFirewall/FormFields/FormFieldsEdgeFirewall'
  import { ref, inject } from 'vue'
  import * as yup from 'yup'
  import { edgeFirewallService } from '@/services/v2'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  import { handleTrackerError } from '@/utils/errorHandlingTracker'

  const tracker = inject('tracker')

  defineOptions({ name: 'edit-firewall' })
  const emit = defineEmits(['updatedFirewall'])

  const props = defineProps({
    loadDomains: { type: Function, required: true },
    updatedRedirect: { type: String, required: true },
    edgeFirewall: { type: Object }
  })

  const loadingServices = ref(false)

  const validationSchema = yup.object({
    name: yup.string().required().label('Name'),
    domains: yup.array().label('Domains'),
    debugRules: yup.boolean().label('Debug Rules'),
    edgeFunctionsEnabled: yup.boolean().label('Edge Funcions Enabled'),
    networkProtectionEnabled: yup.boolean().label('Network Protection Enabled'),
    wafEnabled: yup.boolean().label('WAF Enabled'),
    isActive: yup.boolean().label('Active')
  })

  const formSubmit = async (onSubmit, values, formValid) => {
    if (!formValid) return
    await onSubmit()
    emit('updatedFirewall', values)
  }

  const loadEdgeFirewallService = () => {
    return props.edgeFirewall
  }

  const handleTrackSuccessEdit = () => {
    tracker.product
      .productEdited({
        productName: 'Edge Firewall',
        tab: 'mainSettings'
      })
      .track()
  }

  const handleFailedEditEdgeFirewall = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToEdit({
        productName: 'Edge Firewall',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }
</script>

<template>
  <div>
    <EditFormBlock
      :editService="edgeFirewallService.editEdgeFirewallService"
      :loadService="loadEdgeFirewallService"
      :schema="validationSchema"
      :updatedRedirect="updatedRedirect"
      disableRedirect
      :isTabs="true"
      @on-edit-fail="handleFailedEditEdgeFirewall"
      @on-edit-success="handleTrackSuccessEdit"
    >
      <template #form>
        <FormFieldsEdgeFirewall
          :domainsService="loadDomains"
          v-model:loadingDomains="loadingServices"
        />
      </template>
      <template #action-bar="{ onSubmit, onCancel, formValid, loading, values }">
        <ActionBarTemplate
          @onSubmit="formSubmit(onSubmit, values, formValid)"
          @onCancel="onCancel"
          :loading="loading"
          :submitDisabled="loadingServices"
        />
      </template>
    </EditFormBlock>
  </div>
</template>
