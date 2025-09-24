<script setup>
  import CreateDrawerBlock from '@templates/create-drawer-block'
  import { refDebounced } from '@vueuse/core'
  import * as yup from 'yup'
  import { ref, inject, defineExpose } from 'vue'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import FormCreateEdgeFirewall from '../FormFields/FormFieldsEdgeFirewall'
  import { edgeFirewallService } from '@/services/v2/edge-firewall/edge-firewall-service'

  defineOptions({
    name: 'edge-firewall-drawer'
  })
  const emit = defineEmits(['onSuccess'])

  /**@type {import('@/plugins/adapters/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')
  const showCreateEdgeFirewallDrawer = ref(false)
  const DEBOUNCE_TIME_IN_MS = 300
  const showCreateDrawer = refDebounced(showCreateEdgeFirewallDrawer, DEBOUNCE_TIME_IN_MS)

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
    edgeFunctionsEnabled: false,
    networkProtectionEnabled: true,
    wafEnabled: false,
    ddosProtectionUnmetered: true
  }

  const handleTrackCreation = () => {
    tracker.product.productCreated({
      productName: 'Edge Firewall'
    })
  }

  const handleTrackFailedCreation = (error) => {
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

  const closeCreateDrawer = () => {
    showCreateEdgeFirewallDrawer.value = false
  }
  const openCreateDrawer = () => {
    showCreateEdgeFirewallDrawer.value = true
  }
  const handleCreateWithSuccess = (response) => {
    handleTrackCreation()
    handleToast(response)
    emit('onSuccess', response.data.id)
    closeCreateDrawer()
  }
  const handleToast = (response) => {
    const toast = {
      feedback: 'Your Firewall has been created'
    }
    response.showToastWithActions(toast)
  }
  defineExpose({
    showCreateDrawer,
    openCreateDrawer
  })
</script>

<template>
  <CreateDrawerBlock
    v-if="showCreateDrawer"
    data-testid="edge-firewall-drawer"
    v-model:visible="showCreateEdgeFirewallDrawer"
    :createService="edgeFirewallService.createEdgeFirewallService"
    :schema="validationSchema"
    :initialValues="initialValues"
    drawerId="edge-firewall-drawer"
    @onSuccess="handleCreateWithSuccess"
    @onResponseFail="handleTrackFailedCreation"
    title="Create Firewall"
    disableToast
  >
    <template #formFields>
      <FormCreateEdgeFirewall />
    </template>
  </CreateDrawerBlock>
</template>
