<script setup>
  import CreateFormBlock from '@/templates/create-form-block'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import FormFieldsWafRules from './FormFields/FormFieldsWafRules.vue'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import * as yup from 'yup'
  import { inject } from 'vue'
  import { wafService } from '@/services/v2/waf/waf-service'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const handleTrackCreation = (response) => {
    tracker.product.productCreated({
      productName: 'WAF Rules'
    })
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

  const handleToast = (response) => {
    const toast = {
      feedback: 'Your waf rule has been created',
      actions: {
        link: {
          label: 'View WAF Rule',
          callback: () => response.redirectToUrl(`/waf/edit/${response.id}`)
        }
      }
    }
    response.showToastWithActions(toast)
  }
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Create WAF Rules" />
    </template>
    <template #content>
      <CreateFormBlock
        :createService="wafService.createWafRule"
        @on-response="handleTrackCreation"
        @on-response-fail="handleTrackFailedCreation"
        :schema="validationSchema"
        :initialValues="initialValues"
        disableToast
      >
        <template #form>
          <FormFieldsWafRules />
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
