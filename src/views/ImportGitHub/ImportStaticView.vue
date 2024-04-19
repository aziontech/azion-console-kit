<script setup>
  import ActionBarBlockWithTeleport from '@/templates/action-bar-block/action-bar-with-teleport'
  import ContentBlock from '@/templates/content-block'
  import CreateFormBlock from '@/templates/create-form-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { useLoadingStore } from '@/stores/loading'
  import { useSolutionStore } from '@/stores/solution-create'
  import { useRouter } from 'vue-router'
  import * as yup from 'yup'
  import FormFieldsImportStatic from './FormFields/FormFieldsImportStatic.vue'
  import { useToast } from 'primevue/usetoast'
  import { onMounted } from 'vue'

  const loadingStore = useLoadingStore()
  const toast = useToast()
  const route = useRouter()

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
    },
    createVariablesService: {
      type: Function,
      required: true
    },
    instantiateTemplateService: {
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

  const parseVariables = (variables) => {
    const parsedVariables = variables?.map((variable, index) => {
      index = index + 5
      return {
        field: variable.key,
        value: variable.value,
        instantiation_data_path: 'envs.[' + index + '].value'
      }
    })

    return parsedVariables ?? []
  }

  const solutionStore = useSolutionStore()
  const handleExecuteScriptRunner = async (formValues) => {
    try {
      await Promise.all(
        formValues.newVariables.map((variable) => props.createVariablesService(variable))
      )

      const inputVariables = parseVariables(formValues.newVariables)

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
        ...inputVariables
      ]

      const templateId = solutionStore.solution.solutionId
      return props.instantiateTemplateService(templateId, inputSchema)
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
      const solution = await props.loadSolutionService({
        vendor: route.params.vendor,
        solution: route.params.solution
      })

      const solutionTrackerData = {
        isv: solution.vendor.slug,
        version: solution.version,
        versionId: solution.latestVersionInstallTemplate,
        solutionId: solution.id,
        templateName: solution.name
      }
      solutionStore.setSolution(solutionTrackerData)
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: error
      })
    }
  }

  onMounted(async () => {
    loadingStore.startLoading()
    await loadSolutionByVendor()
    loadingStore.finishLoading()
  })
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
