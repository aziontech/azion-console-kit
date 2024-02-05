<template>
  <EditFormBlock
    :editService="submitEditWafRules"
    :loadService="loadWaf"
    :schema="validationSchema"
    :isTabs="true"
    disableRedirect
  >
    <template #form>
      <FormFieldsWafRules :disabledActive="false"></FormFieldsWafRules>
    </template>
    <template #action-bar="{ onSubmit, formValid, onCancel, loading, values }">
      <ActionBarTemplate
        v-if="showActionBar"
        @onSubmit="formSubmit(onSubmit, values)"
        @onCancel="onCancel"
        :loading="loading"
        :submitDisabled="!formValid"
      />
    </template>
  </EditFormBlock>
</template>
<script setup>
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import EditFormBlock from '@templates/edit-form-block'

  import { ref } from 'vue'
  import { useRoute } from 'vue-router'
  import * as yup from 'yup'
  import FormFieldsWafRules from './FormFields/FormFieldsWafRules.vue'

  const emit = defineEmits(['handleWafRulesUpdated'])

  const route = useRoute()

  const props = defineProps({
    editWafRulesService: {
      type: Function,
      required: true
    },
    waf: { type: Object },
    showActionBar: {
      type: Boolean,
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
    sqlInjection: yup.boolean()
  })

  const wafRuleId = ref(route.params.id)

  const loadWaf = async () => {
    return props.waf
  }

  const submitEditWafRules = async (payload) => {
    return await props.editWafRulesService(payload, parseInt(wafRuleId.value))
  }

  const formSubmit = async (onSubmit, values) => {
    await onSubmit()
    emit('handleWafRulesUpdated', values)
  }
</script>
