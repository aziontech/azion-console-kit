<template>
  <EditFormBlock
    :editService="submitEditWafRules"
    :loadService="loadWaf"
    :schema="validationSchema"
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
