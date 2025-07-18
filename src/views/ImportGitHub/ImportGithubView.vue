<script setup>
  import ActionBarBlockWithTeleport from '@/templates/action-bar-block/action-bar-with-teleport'
  import ContentBlock from '@/templates/content-block'
  import CreateFormBlock from '@/templates/create-form-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { useLoadingStore } from '@/stores/loading'
  import { useDeploy } from '@/stores/deploy'
  import { ref } from 'vue'
  import { useRoute } from 'vue-router'
  import * as yup from 'yup'
  import { useToast } from 'primevue/usetoast'
  import { onMounted } from 'vue'
  import FormFieldsImportGithub from './FormFields/FormFieldsImportGithub.vue'

  const loadingStore = useLoadingStore()
  const deployStore = useDeploy()
  const toast = useToast()
  const route = useRoute()

  const props = defineProps({
    listVulcanPresetsService: {
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
    applicationName: yup.string().required().label('Application Name'),
    rootDirectory: yup
      .string()
      .required()
      .matches(/^\//, 'Root Directory must start with a slash (/)')
      .matches(/^(?!.*\.\.).*$/, 'Root Directory cannot contain (..)')
      .matches(/^\S*$/, 'Root Directory cannot contain spaces')
      .label('Root Directory'),
    preset: yup.string().required().label('Preset'),
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
    applicationName: '',
    rootDirectory: '/',
    preset: '',
    newVariables: [],
    repository: '',
    installCommand: '',
    gitScope: ''
  }

  const templateId = ref(null)
  const createServiceWithVariablesDecorator = async (formValues) => {
    if (formValues.newVariables) {
      await Promise.all(
        formValues.newVariables.map((variable) => props.createVariablesService(variable))
      )
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
        value: formValues.applicationName
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
        field: 'az_command',
        instantiation_data_path: 'envs.[4].value',
        value: formValues.installCommand
      },
      {
        field: 'az_root_directory',
        instantiation_data_path: 'envs.[5].value',
        value: formValues.rootDirectory
      }
    ]
    deployStore.addApplicationName(formValues.applicationName)
    return props.instantiateTemplateService(templateId.value, inputSchema)
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
        summary: 'Error',
        detail: error.message || 'Failed to load solution'
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
        :createService="createServiceWithVariablesDecorator"
        :schema="validationSchema"
        :initialValues="initialValues"
      >
        <template #form>
          <FormFieldsImportGithub
            :listVulcanPresetsService="listVulcanPresetsService"
            :frameworkDetectorService="frameworkDetectorService"
          />
        </template>
        <template #action-bar="{ onSubmit, formValid, onCancel, loading }">
          <ActionBarBlockWithTeleport
            @onSubmit="onSubmit"
            @onCancel="onCancel"
            :loading="loading"
            :submitDisabled="!formValid"
            primaryActionLabel="Deploy"
          />
        </template>
      </CreateFormBlock>
    </template>
  </ContentBlock>
</template>
