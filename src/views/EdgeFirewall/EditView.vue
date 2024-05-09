<script setup>
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import EditFormBlock from '@/templates/edit-form-block'
  import FormFieldsEdgeFirewall from '@/views/EdgeFirewall/FormFields/FormFieldsEdgeFirewall'
  import { ref, inject } from 'vue'
  import * as yup from 'yup'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  import { handleTrackerError } from '@/utils/errorHandlingTracker'

  const tracker = inject('tracker')

  defineOptions({ name: 'edit-edge-firewall' })
  const emit = defineEmits(['updatedFirewall'])

  const props = defineProps({
    editEdgeFirewallService: { type: Function, required: true },
    edgeFirewall: { type: Object },
    loadDomains: { type: Function, required: true },
    updatedRedirect: { type: String, required: true }
  })

  const loadingServices = ref(false)

  const validationSchema = yup.object({
    name: yup.string().required().label('Name'),
    domains: yup.array().label('Domains'),
    isActive: yup.boolean().label('Active'),
    debugRules: yup.boolean().label('Debug Rules'),
    edgeFunctionsEnabled: yup.boolean().label('Edge Funcions Enabled'),
    networkProtectionEnabled: yup.boolean().label('Network Protection Enabled'),
    wafEnabled: yup.boolean().label('WAF Enabled')
  })

  const loadEdgeFirewall = async () => {
    return props.edgeFirewall
  }

  const formSubmit = async (onSubmit, values) => {
    await onSubmit()
    emit('updatedFirewall', values)
  }

  const handleFailedEditeEdgeFirewall = (error) => {
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
      :editService="props.editEdgeFirewallService"
      :loadService="loadEdgeFirewall"
      :schema="validationSchema"
      :updatedRedirect="updatedRedirect"
      disableRedirect
      :isTabs="true"
      @on-edit-fail="handleFailedEditeEdgeFirewall"
    >
      <template #form>
        <FormFieldsEdgeFirewall
          :domainsService="loadDomains"
          v-model:loadingDomains="loadingServices"
        />
      </template>
      <template #action-bar="{ onSubmit, formValid, onCancel, loading, values }">
        <ActionBarTemplate
          @onSubmit="formSubmit(onSubmit, values)"
          @onCancel="onCancel"
          :loading="loading"
          :submitDisabled="!formValid || loadingServices"
        />
      </template>
    </EditFormBlock>
  </div>
</template>
