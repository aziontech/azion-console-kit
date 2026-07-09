<script setup>
  import { computed } from 'vue'
  import EditFormBlock from '@/templates/edit-form-block'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import FormFieldsVariablesV6 from './components/FormFieldsVariablesV6.vue'
  import ScopeReadonlyCard from './components/ScopeReadonlyCard.vue'
  import * as yup from 'yup'
  import { variablesV6Service } from '@/services/v2/variables/v6/variables-v6-service'

  defineOptions({ name: 'variables-configuration-tab' })

  const props = defineProps({
    variable: {
      type: Object,
      required: true
    }
  })

  const emit = defineEmits(['updated'])

  const keyRegex = /^[A-Z0-9_]*$/

  const isStoredAsSecret = computed(() => props.variable.secret === true)

  const validationSchema = computed(() =>
    yup.object({
      key: yup
        .string()
        .test('key', 'Invalid key format', (value) => keyRegex.test(value))
        .required(),
      secret: yup.boolean().required().default(false),
      value: isStoredAsSecret.value ? yup.string() : yup.string().required()
    })
  )

  const initialValues = computed(() => ({
    key: props.variable.key,
    value: props.variable.value ?? '',
    secret: props.variable.secret === true
  }))

  const loadService = () => initialValues.value

  const editService = (values) =>
    variablesV6Service.edit({
      id: props.variable.id,
      values,
      initialValues: initialValues.value
    })

  const isUnchanged = (values = {}) => {
    const initial = initialValues.value
    const keyUnchanged = values.key === initial.key
    const secretUnchanged = (values.secret === true) === (initial.secret === true)
    const isEmptySecretValue =
      values.secret === true &&
      (values.value === '' || values.value === null || values.value === undefined)
    const valueUnchanged = values.value === initial.value || isEmptySecretValue

    return keyUnchanged && secretUnchanged && valueUnchanged
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
      <FormFieldsVariablesV6 :secretLocked="isStoredAsSecret" />
      <ScopeReadonlyCard :scopes="variable.scope" />
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
