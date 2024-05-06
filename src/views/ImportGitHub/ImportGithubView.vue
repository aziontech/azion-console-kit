<script setup>
  import ActionBarBlockWithTeleport from '@/templates/action-bar-block/action-bar-with-teleport'
  import ContentBlock from '@/templates/content-block'
  import CreateFormBlock from '@/templates/create-form-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { useLoadingStore } from '@/stores/loading'
  import { ref } from 'vue'
  import { useRoute } from 'vue-router'
  import * as yup from 'yup'
  import { useToast } from 'primevue/usetoast'
  import { onMounted } from 'vue'
  import FormFieldsImportGithub from './FormFields/FormFieldsImportGithub.vue'

  const loadingStore = useLoadingStore()
  const toast = useToast()
  const route = useRoute()

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
    frameworkDetectorService: {
      type: Function,
      required: true
    },
    createVariablesService: {
      type: Function,
      required: true
    },
    instantiateTemplateService: {
      type: Function,
      required: true
    },
    loadSolutionService: {
      type: Function,
      required: true
    }
  })

  const validationSchema = yup.object({
    edgeApplicationName: yup.string().required().label('Edge Application Name'),
    rootDirectory: yup
      .string()
      .required()
      .matches(/^\//, 'Root Directory must start with a slash (/)')
      .matches(/^(?!.*\.\.).*$/, 'Root Directory cannot contain (..)')
      .matches(/^\S*$/, 'Root Directory cannot contain spaces')
      .label('Root Directory'),
    preset: yup.string().required().label('Preset'),
    mode: yup.string().required().label('Mode'),
    repository: yup.string().required().label('Repository'),
    installCommand: yup.string().required().label('Install Command'),
    gitScope: yup.string().required().label('Git Scope'),
    newVariables: yup.array().of(
      yup.object().shape({
        key: yup
          .string()
          .required()
          .label('Key')
          .matches(/^[A-Z0-9_]+$/, 'Only accepts upper-case letters, numbers, and underscore.'),
        value: yup.string().required().label('Value')
      })
    )
  })

  const initialValues = {
    edgeApplicationName: '',
    rootDirectory: '/',
    preset: '',
    newVariables: [],
    mode: '',
    repository: '',
    installCommand: '',
    gitScope: ''
  }

  const parseVariables = (variables) => {
    const lastInputSchemaEnvsIndex = 6
    const parsedVariables = variables?.map((variable, index) => {
      index = index + lastInputSchemaEnvsIndex
      return {
        field: variable.key,
        value: variable.value,
        instantiation_data_path: 'envs.[' + index + '].value'
      }
    })

    return parsedVariables ?? []
  }

  const templateId = ref(null)
  const handleExecuteScriptRunner = async (formValues) => {
    try {
      let inputVariables = []

      if (formValues.newVariables) {
        await Promise.all(
          formValues.newVariables.map((variable) => props.createVariablesService(variable))
        )
        inputVariables = parseVariables(formValues.newVariables)
      }

      const inputSchema = [
        {
          field: 'platform_feature__vcs_integration__uuid',
          instantiation_data_path: '',
          value: formValues.gitScope
        },
        {
          field: 'az_name',
          instantiation_data_path: 'envs.[0].value',
          value: formValues.edgeApplicationName
        },
        {
          field: 'git_url_external',
          instantiation_data_path: 'envs.[1].value',
          value: formValues.repository
        },
        {
          field: 'vulcan_preset',
          instantiation_data_path: 'envs.[2].value',
          value: formValues.preset
        },
        {
          field: 'vulcan_mode',
          instantiation_data_path: 'envs.[3].value',
          value: formValues.mode
        },
        {
          field: 'az_command',
          instantiation_data_path: 'envs.[4].value',
          value: formValues.installCommand
        },
        {
          field: 'az_root_directory',
          instantiation_data_path: 'envs.[5].value',
          value: formValues.rootDirectory
        },
        ...inputVariables
      ]

      return props.instantiateTemplateService(templateId.value, inputSchema)
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: 'error',
        detail: error
      })
    }
  }

  const loadSolutionByVendor = async () => {
    try {
      loadingStore.startLoading()

      const solution = await props.loadSolutionService({
        vendor: route.params.vendor,
        solution: route.params.solution
      })

      templateId.value = solution.referenceId
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: error
      })
    } finally {
      loadingStore.finishLoading()
    }
  }

  onMounted(async () => {
    await loadSolutionByVendor()
  })
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Import from GitHub" />
    </template>
    <template #content>
      <CreateFormBlock
        :disableAfterCreateToastFeedback="true"
        :createService="handleExecuteScriptRunner"
        :schema="validationSchema"
        :initialValues="initialValues"
      >
        <template #form>
          <FormFieldsImportGithub
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
