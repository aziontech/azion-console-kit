<template>
  <EditFormBlock
    :editService="submitEditWafRules"
    :loadService="loadWaf"
    :schema="validationSchema"
    @on-edit-success="handleTrackSuccessEdit"
    @on-edit-fail="handleTrackFailEdit"
    :isTabs="true"
    :updatedRedirect="props.updatedRedirect"
    disableRedirect
  >
    <template #form>
      <FormFieldsWafRules :disabledActive="false"></FormFieldsWafRules>
    </template>
    <template #action-bar="{ onSubmit, onCancel, formValid, loading, values }">
      <ActionBarTemplate
        v-if="showActionBar"
        @onSubmit="formSubmit(onSubmit, values, formValid)"
        @onCancel="onCancel"
        :loading="loading"
      />
    </template>
  </EditFormBlock>
</template>
<script setup>
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import EditFormBlock from '@templates/edit-form-block'

  import { ref, inject } from 'vue'
  import { useRoute } from 'vue-router'
  import * as yup from 'yup'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import FormFieldsWafRules from './FormFields/FormFieldsWafRules.vue'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const emit = defineEmits(['handleWafRulesUpdated'])

  const route = useRoute()

  const handleTrackSuccessEdit = () => {
    tracker.product
      .productEdited({
        productName: 'WAF Rules'
      })
      .track()
  }
  const handleTrackFailEdit = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToEdit({
        productName: 'WAF Rules',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }

  const props = defineProps({
    editWafRulesService: {
      type: Function,
      required: true
    },
    updatedRedirect: { type: String, required: true },
    waf: { type: Object },
    showActionBar: {
      type: Boolean,
      required: true
    }
  })

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

  const wafRuleId = ref(route.params.id)

  const loadWaf = async () => {
    return props.waf
  }

  const submitEditWafRules = async (payload) => {
    return await props.editWafRulesService(payload, parseInt(wafRuleId.value))
  }

  const formSubmit = async (onSubmit, values, formValid) => {
    await onSubmit()
    if (formValid) {
      emit('handleWafRulesUpdated', values)
    }
  }
</script>
