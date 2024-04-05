<script setup>
  import ActionBarBlockWithTeleport from '@/templates/action-bar-block/action-bar-with-teleport'
  import ContentBlock from '@/templates/content-block'
  import CreateFormBlock from '@/templates/create-form-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import * as yup from 'yup'
  import FormFieldsImportStatic from './FormFields/FormFieldsImportStatic'

  defineProps({
    getAccountSettingsService: {
      type: Function,
      required: true
    }
  })

  const validationSchema = yup.object({
    edgeApplicationName: yup.string().required().label('Edge Application Name'),
    rootDirectory: yup.string(),
    preset: yup.string(),
    newVariables: yup.array(),
  })

  const initialValues = {
    edgeApplicationName: '',
    rootDirectory: '',
    preset: '',
    newVariables: [],
  }
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Import Static Site from GitHub" />
    </template>
    <template #content>
      <CreateFormBlock
        :createService="() => {}"
        :schema="validationSchema"
        :initialValues="initialValues"
      >
        <template #form>
          <FormFieldsImportStatic />
        </template>
        <template #action-bar="{ onSubmit, formValid, onCancel, loading }">
          <ActionBarBlockWithTeleport
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
