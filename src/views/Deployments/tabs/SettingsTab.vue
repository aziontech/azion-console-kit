<script setup>
  import { computed } from 'vue'
  import EditFormBlock from '@/templates/edit-form-block'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import FormFieldsDeployment from '@/views/Deployments/FormFields/FormFieldsDeployment.vue'
  import { validationSchema } from '@/views/Deployments/Config/validation'
  import { updateDeploymentAdapter } from '@/views/Deployments/Config/adapters'

  defineOptions({ name: 'deployment-settings-tab' })

  const props = defineProps({
    deployment: {
      type: Object,
      required: true
    }
  })

  const emit = defineEmits(['updated'])

  const initialValues = computed(() => ({
    name: props.deployment.name ?? '',
    description: props.deployment.description ?? '',
    binding_policy: props.deployment.binding_policy ?? 'STRICT',
    deployment_policy: props.deployment.deployment_policy ?? 'single_version',
    strategy_canary_enabled: !!props.deployment.strategy_canary_enabled,
    strategy_canary_default_percentage: props.deployment.strategy_canary_default_percentage ?? 10,
    strategy_skew_enabled: !!props.deployment.strategy_skew_enabled,
    strategy_skew_default_ttl_seconds: props.deployment.strategy_skew_default_ttl_seconds ?? 3600
  }))

  const loadService = () => initialValues.value

  const editService = (values) =>
    updateDeploymentAdapter(props.deployment.id, values, { headState: props.deployment.state })

  const isUnchanged = (values = {}) => {
    const initial = initialValues.value

    return (
      values.name === initial.name &&
      values.description === initial.description &&
      values.binding_policy === initial.binding_policy &&
      values.deployment_policy === initial.deployment_policy &&
      values.strategy_canary_enabled === initial.strategy_canary_enabled &&
      values.strategy_canary_default_percentage === initial.strategy_canary_default_percentage &&
      values.strategy_skew_enabled === initial.strategy_skew_enabled &&
      values.strategy_skew_default_ttl_seconds === initial.strategy_skew_default_ttl_seconds
    )
  }

  const handleEditSuccess = () => {
    emit('updated')
  }
</script>

<template>
  <EditFormBlock
    :editService="editService"
    :loadService="loadService"
    :initialValues="initialValues"
    :schema="validationSchema"
    isTabs
    disableRedirect
    @on-edit-success="handleEditSuccess"
  >
    <template #form>
      <FormFieldsDeployment
        :isEdit="true"
        :resourceId="deployment.id"
      />
    </template>
    <template #action-bar="{ onSubmit, onCancel, loading, values }">
      <ActionBarTemplate
        @onSubmit="onSubmit"
        @onCancel="onCancel"
        :loading="loading"
        :submitDisabled="isUnchanged(values)"
      />
    </template>
  </EditFormBlock>
</template>
