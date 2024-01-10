<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Create WAF Rules" />
    </template>
    <template #content>
      <CreateFormBlock
        :createService="props.createWafRulesService"
        :schema="validationSchema"
        :initialValues="initialValues"
      >
        <template #form>
          <FormFieldsWafRules />
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
<script setup>
  import CreateFormBlock from '@/templates/create-form-block'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import FormFieldsWafRules from './FormFields/FormFieldsWafRules.vue'
  import * as yup from 'yup'

  const props = defineProps({
    createWafRulesService: {
      type: Function,
      required: true
    }
  })

  const validationSchema = yup.object({
    name: yup.string().required(),
    crossSiteScriptingSensitivity: yup.string(),
    directoryTraversalSensitivity: yup.string(),
    evadingTricksSensitivity: yup.string(),
    fileUploadSensitivity: yup.string(),
    identifiedAttackSensitivity: yup.string(),
    remoteFileInclusionSensitivity: yup.string(),
    sqlInjectionSensitivity: yup.string(),
    unwantedAccessSensitivity: yup.string(),
    active: yup.boolean(),
    fileUpload: yup.boolean(),
    evadingTricks: yup.boolean(),
    unwantedAccess: yup.boolean(),
    identifiedAttack: yup.boolean(),
    crossSiteScripting: yup.boolean(),
    directoryTraversal: yup.boolean(),
    remoteFileInclusion: yup.boolean(),
    sqlInjection: yup.boolean(),
  })


  const initialValues = {
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
    active: true,
  }
</script>
