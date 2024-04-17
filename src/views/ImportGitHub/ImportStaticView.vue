<script setup>
  import ActionBarBlockWithTeleport from '@/templates/action-bar-block/action-bar-with-teleport'
  import ContentBlock from '@/templates/content-block'
  import CreateFormBlock from '@/templates/create-form-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import * as yup from 'yup'
  import FormFieldsImportStatic from './FormFields/FormFieldsImportStatic'

  const props = defineProps({
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
    },
    createScriptRunnerExecutionService: {
      type: Function,
      required: true
    },
    frameworkDetectorService: {
      type: Function,
      required: true
    }
  })

  const validationSchema = yup.object({
    edgeApplicationName: yup.string().required().label('Edge Application Name'),
    rootDirectory: yup.string().required().label('Root Directory'),
    preset: yup.string().required().label('Preset'),
    mode: yup.string().required().label('Mode'),
    repository: yup.string().required().label('Repository'),
    installCommand: yup.string().required().label('Install Command'),
    gitScope: yup.string().required().label('Git Scope'),
    newVariables: yup.array().of(
      yup.object().shape({
        key: yup.string().required().label('Key'),
        value: yup.string().required().label('Value')
      })
    )
  })

  const initialValues = {
    edgeApplicationName: '',
    rootDirectory: '',
    preset: '',
    newVariables: [],
    mode: '',
    repository: '',
    installCommand: '',
    gitScope: ''
  }

  const handleExecuteScriptRunner = async (formValues) => {
    return await props.createScriptRunnerExecutionService(formValues)
  }
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Import Static Site from GitHub" />
    </template>
    <template #content>
      <CreateFormBlock
        :createService="handleExecuteScriptRunner"
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
            :frameworkDetectorService="frameworkDetectorService"
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
