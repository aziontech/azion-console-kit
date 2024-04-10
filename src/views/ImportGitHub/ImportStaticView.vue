<script setup>
  import ActionBarBlockWithTeleport from '@/templates/action-bar-block/action-bar-with-teleport'
  import ContentBlock from '@/templates/content-block'
  import CreateFormBlock from '@/templates/create-form-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import * as yup from 'yup'
  import FormFieldsImportStatic from './FormFields/FormFieldsImportStatic'

  const props = defineProps({
    createVariablesService: {
      type: Function,
      required: true
    },
    listPlatformsService: {
      type: Function,
      required: true
    },
    postCallbackUrlService: {
      type: Function,
      required: true
    },
    listIntegrationsService: {
      type: Function,
      required: true
    },
    listRepositoriesService: {
      type: Function,
      required: true
    },
    listVulcanPresetsService: {
      type: Function,
      required: true
    },
    getModesByPresetService: {
      type: Function,
      required: true
    }
  })

  const validationSchema = yup.object({
    edgeApplicationName: yup.string().required().label('Edge Application Name'),
    rootDirectory: yup.string(),
    preset: yup.string(),
    newVariables: yup.array()
  })

  const initialValues = {
    edgeApplicationName: '',
    rootDirectory: '',
    preset: '',
    newVariables: []
  }

  const handleCreateStaticTemplate = async (formValues) => {
    return await Promise.all(
      formValues.newVariables.map((variable) => props.createVariablesService(variable))
    )
  }
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Import Static Site from GitHub" />
    </template>
    <template #content>
      <CreateFormBlock
        :createService="handleCreateStaticTemplate"
        :schema="validationSchema"
        :initialValues="initialValues"
      >
        <template #form>
          <FormFieldsImportStatic
            :listPlatformsService="listPlatformsService"
            :listIntegrationsService="listIntegrationsService"
            :listRepositoriesService="listRepositoriesService"
            :postCallbackUrlService="postCallbackUrlService"
            :listVulcanPresetsService="listVulcanPresetsService"
            :getModesByPresetService="getModesByPresetService"
          />
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
