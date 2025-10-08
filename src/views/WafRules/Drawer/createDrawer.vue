<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <CreateDrawerBlock
    v-if="showCreateDrawer"
    data-testid="waf-rules-drawer"
    v-model:visible="showCreateWafDrawer"
    :createService="wafService.createWafRule"
    :schema="validationSchema"
    :initialValues="initialValues"
    drawerId="waf-rules-drawer"
    @onSuccess="handleCreateWithSuccess"
    @onResponseFail="handleTrackFailedCreation"
    title="Create WAF Rule"
    disableToast
  >
    <template #formFields>
      <FormFieldsWafRules />
    </template>
  </CreateDrawerBlock>
</template>

<script setup>
  import { ref, inject } from 'vue'
  import { refDebounced } from '@vueuse/core'
  import * as yup from 'yup'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import CreateDrawerBlock from '@templates/create-drawer-block'
  import FormFieldsWafRules from '../FormFields/FormFieldsWafRules.vue'
  import { wafService } from '@/services/v2/waf/waf-service'

  const emit = defineEmits(['onSuccess'])
  /** @type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const showCreateWafDrawer = ref(false)
  const DEBOUNCE_TIME_IN_MS = 300
  const showCreateDrawer = refDebounced(showCreateWafDrawer, DEBOUNCE_TIME_IN_MS)

  const validationSchema = yup.object({
    name: yup.string().required(),
    sqlInjection: yup.boolean(),
    sqlInjectionSensitivity: yup.string(),
    remoteFileInclusion: yup.boolean(),
    remoteFileInclusionSensitivity: yup.string(),
    directoryTraversal: yup.boolean(),
    directoryTraversalSensitivity: yup.string(),
    crossSiteScripting: yup.boolean(),
    crossSiteScriptingSensitivity: yup.string(),
    fileUpload: yup.boolean(),
    fileUploadSensitivity: yup.string(),
    evadingTricks: yup.boolean(),
    evadingTricksSensitivity: yup.string(),
    unwantedAccess: yup.boolean(),
    unwantedAccessSensitivity: yup.string(),
    identifiedAttack: yup.boolean(),
    identifiedAttackSensitivity: yup.string(),
    active: yup.boolean()
  })

  const initialValues = {
    name: '',
    crossSiteScriptingSensitivity: 'medium',
    directoryTraversalSensitivity: 'medium',
    evadingTricksSensitivity: 'medium',
    fileUploadSensitivity: 'medium',
    identifiedAttackSensitivity: 'medium',
    remoteFileInclusionSensitivity: 'medium',
    sqlInjectionSensitivity: 'medium',
    unwantedAccessSensitivity: 'medium',
    fileUpload: true,
    evadingTricks: true,
    unwantedAccess: true,
    identifiedAttack: true,
    crossSiteScripting: true,
    directoryTraversal: true,
    remoteFileInclusion: true,
    sqlInjection: true,
    active: true
  }

  const openCreateDrawer = () => {
    showCreateWafDrawer.value = true
  }
  const closeCreateDrawer = () => {
    showCreateWafDrawer.value = false
  }

  const handleToast = (response) => {
    const toast = {
      feedback: 'Your waf rule has been created'
    }
    response.showToastWithActions(toast)
  }

  const handleTrackCreation = (response) => {
    tracker.product.productCreated({ productName: 'WAF Rules' })
    handleToast(response)
  }

  const handleTrackFailedCreation = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToCreate({
        productName: 'WAF Rules',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }

  const handleCreateWithSuccess = (response) => {
    handleTrackCreation(response)
    emit('onSuccess', response.id)
    closeCreateDrawer()
  }

  defineExpose({
    showCreateDrawer,
    showCreateWafDrawer,
    openCreateDrawer
  })
</script>
