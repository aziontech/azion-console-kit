<script setup>
  import EditFormBlock from '@/templates/edit-form-block'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import FormFieldsVariables from './FormFields/FormFieldsVariables.vue'
  import * as yup from 'yup'

  const props = defineProps({
    loadVariableService: { type: Function, required: true },
    editVariableService: { type: Function, required: true },
    updatedRedirect: { type: String, required: true }
  })

  const keyRegex = /^(_?[A-Z_]*)$/

  const validationSchema = yup.object({
    key: yup
      .string()
      .test('key', 'Invalid key format.', (value) => keyRegex.test(value))
      .required(),
    value: yup.string().required(),
    secret: yup.boolean().required().default(false)
  })
</script>
<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Edit Variable" />
    </template>
    <template #content>
      <EditFormBlock
        :editService="props.editVariableService"
        :loadService="props.loadVariableService"
        :updatedRedirect="updatedRedirect"
        :schema="validationSchema"
      >
        <template #form>
          <FormFieldsVariables />
        </template>
        <template #action-bar="{ onSubmit, formValid, onCancel, loading }">
          <ActionBarTemplate
            @onSubmit="onSubmit"
            @onCancel="onCancel"
            :loading="loading"
            :submitDisabled="!formValid"
          />
        </template>
      </EditFormBlock>
    </template>
  </ContentBlock>
</template>
