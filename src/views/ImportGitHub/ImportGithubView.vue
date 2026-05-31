<script setup>
  import { ref, computed, onMounted, nextTick, onBeforeUnmount } from 'vue'
  import { useForm, useField } from 'vee-validate'
  import { useRoute } from 'vue-router'
  import * as yup from 'yup'
  import { variablesService } from '@/services/v2/variables'
  import { vulcanService } from '@/services/v2/vulcan'

  import Accordion from 'primevue/accordion'
  import AccordionTab from 'primevue/accordiontab'
  import Button from 'primevue/button'
  import Dropdown from 'primevue/dropdown'
  import { useLoadingStore } from '@/stores/loading'
  import { useDeploy } from '@/stores/deploy'
  import LabelBlock from '@aziontech/webkit/label'
  import FieldText from '@aziontech/webkit/field-text'
  import { useToast } from '@aziontech/webkit/use-toast'
  import FieldInputTextPrivacy from '@/templates/form-fields-inputs/fieldInputTextPrivacy.vue'

  import { vcsService } from '@/services/v2/vcs/vcs-service'
  import { useVcsOAuth } from '@/composables/useVcsOAuth'
  import { workloadService } from '@/services/v2/workload/workload-service'
  import { getScriptRunnerLogsService } from '@/services/script-runner-service'
  import DeploySuccessCard from '@/templates/deploy-template/DeploySuccessCard.vue'
  import CardBox from '@aziontech/webkit/content/card-box'
  import Skeleton from 'primevue/skeleton'
  import DeployStatusCard from '@/templates/deploy-template/DeployStatusCard.vue'

  const props = defineProps({
    repositoryOwner: {
      type: String,
      default: ''
    },
    repositoryName: {
      type: String,
      default: ''
    },
    loading: {
      type: Boolean,
      default: false
    },
    frameworkDetectorService: {
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
    },
    getResultsService: {
      type: Function,
      required: true
    }
  })

  const emit = defineEmits(['deploy', 'finish', 'retry', 'manage'])

  const loadingStore = useLoadingStore()
  const deployStore = useDeploy()
  const route = useRoute()
  const toast = useToast()

  // Step Navigation State
  const currentStep = ref('settings')
  const step2Ref = ref(null)
  const step3Ref = ref(null)

  // Deploy State
  const executionId = ref('')
  const deployFailed = ref(false)
  const deployStartTime = ref(null)
  const appUrl = ref('')
  const deployedApplicationName = ref('')
  const results = ref(null)
  const isDeploying = ref(false)
  const isRestoringState = ref(false)
  const isSavingDomains = ref(false)

  // OAuth and integration state
  const presetsList = ref([])
  const templateId = ref(null)
  const isInstallCommandEditable = ref(false)

  // Use VCS OAuth composable
  const {
    isLoading: isGithubConnectLoading,
    isRepositoriesLoading: isLoadingRepositories,
    integrations: integrationsList,
    repositories: repositoriesListRaw,
    callbackUrl,
    listPlatforms,
    listIntegrations,
    listRepositories,
    connect
  } = useVcsOAuth()

  // GitHub account and repository selection (using vee-validate fields)
  const selectedIntegration = computed({
    get: () => githubAccount.value,
    set: (val) => {
      if (val && val !== githubAccount.value) {
        githubAccount.value = val
      }
    }
  })
  const selectedRepository = computed({
    get: () => repository.value,
    set: (val) => {
      if (val && val !== repository.value) {
        repository.value = val
      }
    }
  })

  // Computed integrations with "Add another account" option
  const integrationOptions = computed(() => {
    return integrationsList.value
  })

  // Validation schema
  const validationSchema = yup.object({
    githubAccount: yup.string().required().label('GitHub Account'),
    repository: yup.string().required().label('Repository'),
    applicationName: yup
      .string()
      .required()
      .matches(
        /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/,
        'Application Name may only contain lowercase letters, numbers and hyphens'
      )
      .label('Application Name'),
    preset: yup.string().required().label('Framework'),
    rootDirectory: yup
      .string()
      .required()
      .matches(/^\//, 'Root Directory must start with a slash (/)')
      .matches(/^(?!.*\.\.).*$/, 'Root Directory cannot contain (..)')
      .matches(/^\S*$/, 'Root Directory cannot contain spaces')
      .label('Root Directory'),
    installCommand: yup.string().required().label('Install Command'),
    newVariables: yup.array().of(
      yup.object().shape({
        key: yup
          .string()
          .label('Key')
          .matches(/^[A-Z0-9_]*$/, 'Only accepts upper-case letters, numbers, and underscore.')
          .test('required-if-value', 'Key is required when value is provided', function (value) {
            const siblingValue = this.parent.value
            if (siblingValue && siblingValue.trim() !== '') {
              return value && value.trim() !== ''
            }
            return true
          }),
        value: yup
          .string()
          .label('Value')
          .test('required-if-key', 'Value is required when key is provided', function (value) {
            const siblingKey = this.parent.key
            if (siblingKey && siblingKey.trim() !== '') {
              return value && value.trim() !== ''
            }
            return true
          }),
        isPublic: yup.boolean().default(false)
      })
    )
  })

  // Computed application name suggestion
  const suggestedApplicationName = computed(() => {
    const repoName = route.query.repositoryName || props.repositoryName
    if (!repoName) return ''
    return repoName.toLowerCase().replace(/[^a-z0-9-]/g, '-')
  })

  const addVariableLabel = computed(() => {
    if (!newVariables.value || newVariables.value.length === 0) {
      return 'Add Variable'
    }
    return 'Add Another'
  })

  // Initial form values
  const initialValues = {
    githubAccount: '',
    repository: '',
    applicationName: suggestedApplicationName.value,
    preset: '',
    rootDirectory: '/',
    installCommand: 'npm install',
    newVariables: [
      {
        key: '',
        value: '',
        isPublic: false
      }
    ]
  }

  // Setup form with vee-validate
  const { handleSubmit, resetForm } = useForm({
    validationSchema,
    initialValues
  })

  // UseField for individual fields
  const { value: applicationName } = useField('applicationName')
  const { value: preset, errorMessage: presetError } = useField('preset')
  const { value: rootDirectory } = useField('rootDirectory')
  const { value: installCommand } = useField('installCommand')
  const { value: newVariables } = useField('newVariables')
  const { value: githubAccount, errorMessage: githubAccountError } = useField('githubAccount')
  const { value: repository, errorMessage: repositoryError } = useField('repository')

  // Methods
  const addVariable = () => {
    if (!Array.isArray(newVariables.value)) {
      newVariables.value = []
    }
    newVariables.value.push({
      key: '',
      value: '',
      isPublic: false
    })
  }

  const initializeFromQueryParams = async () => {
    const {
      gitScope: queryGitScope,
      repositoryName: queryRepoName,
      formApplicationName,
      formPreset,
      formRootDirectory,
      formInstallCommand,
      formVariables
    } = route.query

    // Check if we're restoring from a previous state (deploying step with saved form values)
    const isRestoringFormState = route.query.step && route.query.executionId

    // Only set applicationName to suggestedApplicationName if there's no formApplicationName in the route and not restoring
    if (isRestoringFormState && formApplicationName) {
      applicationName.value = formApplicationName
    } else if (suggestedApplicationName.value) {
      applicationName.value = suggestedApplicationName.value
    }

    // Restore other form values from route if available
    if (formPreset) {
      preset.value = formPreset
    }
    if (formRootDirectory) {
      rootDirectory.value = formRootDirectory
    }
    if (formInstallCommand) {
      installCommand.value = formInstallCommand
    }
    if (formVariables) {
      try {
        newVariables.value = JSON.parse(formVariables)
      } catch (error) {
        // Silently fail - use default variables
      }
    }

    if (queryGitScope && queryRepoName) {
      await detectAndSetFrameworkPreset(repositoryOwnerRef, queryRepoName)
    }

    // Força o form a refletir os valores corretos
    // Use restored values from route if available, otherwise use defaults
    resetForm({
      values: {
        githubAccount: githubAccount.value || '',
        repository: repository.value || '',
        applicationName: applicationName.value || suggestedApplicationName.value || '',
        preset: preset.value || '',
        rootDirectory: rootDirectory.value || '/',
        installCommand: installCommand.value || 'npm install',
        newVariables: newVariables.value || [{ key: '', value: '', isPublic: false }]
      }
    })
  }

  const parseEnvVariables = (text) => {
    const lines = text.split('\n').filter((line) => line.trim())

    const variables = []
    const seenKeys = new Set()

    for (const line of lines) {
      const trimmedLine = line.trim()
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue
      }

      // Match patterns like: KEY="value", KEY='value', KEY=value
      // Regex captures the key and value, handling quoted values properly
      const doubleQuotedMatch = trimmedLine.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"([^"]*)"\s*$/)
      const singleQuotedMatch = trimmedLine.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*'([^']*)'\s*$/)
      const unquotedMatch = trimmedLine.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*([^\s]+)\s*$/)

      const match = doubleQuotedMatch || singleQuotedMatch || unquotedMatch
      if (match) {
        const key = match[1].toUpperCase()
        const value = match[2]

        // Only add if key hasn't been seen before (deduplicate, keep first occurrence)
        if (!seenKeys.has(key)) {
          seenKeys.add(key)
          variables.push({
            key,
            value,
            isPublic: false
          })
        }
      }
    }
    return variables
  }

  const handlePasteVariables = (event, index) => {
    const pastedText = event.clipboardData?.getData('text')
    if (!pastedText) {
      return
    }

    const parsedVariables = parseEnvVariables(pastedText)

    // Only process if multiple lines were pasted (likely env vars format)
    if (parsedVariables.length > 1 || (parsedVariables.length === 1 && pastedText.includes('\n'))) {
      event.preventDefault()

      // Get existing keys (excluding the current row being edited)
      const existingKeys = new Set(
        newVariables.value
          .filter((variable, idx) => idx !== index && newVariables.value[idx]?.key?.trim())
          .map((variable) => variable.key.toUpperCase())
      )

      // Filter out variables with duplicate keys
      const uniqueVariables = parsedVariables.filter(
        (variable) => !existingKeys.has(variable.key.toUpperCase())
      )

      // Replace the current variable at index with the first parsed one
      // and add the rest as new variables
      if (uniqueVariables.length) {
        newVariables.value[index] = uniqueVariables[0]

        // Add remaining variables
        for (let idx = 1; idx < uniqueVariables.length; idx++) {
          newVariables.value.push(uniqueVariables[idx])
        }
      }
    }
    // If it's a single line without newline, let the default paste behavior happen
  }

  const removeVariable = (index) => {
    newVariables.value.splice(index, 1)
  }

  const saveIntegration = async (integration) => {
    try {
      isGithubConnectLoading.value = true
      await vcsService.postCallbackUrl(callbackUrl.value, integration.data)
      await listIntegrations()
    } catch (error) {
      //
    } finally {
      isGithubConnectLoading.value = false
    }
  }

  const handleGithubMessage = (event) => {
    if (event.data.event === 'integration-data') {
      saveIntegration(event.data)
    }
  }

  const listenerOnMessage = () => {
    window.addEventListener('message', handleGithubMessage)
  }

  const removeMessageListener = () => {
    window.removeEventListener('message', handleGithubMessage)
  }

  const handleIntegrationChange = async (event) => {
    // Note: selectedIntegration is already updated via v-model before this handler runs
    // This handler is for additional side effects like loading repositories
    selectedRepository.value = null
    repositoriesListRaw.value = []

    if (event?.value) {
      await listRepositories(event.value)
    }
  }

  const handleRepositoryChange = async (event) => {
    const repoUrl = event?.value
    const repo = repositoriesListRaw.value.find((repo) => repo.url === repoUrl)
    if (repo) {
      // Update suggested application name based on repository name
      applicationName.value = repo.name.toLowerCase().replace(/[^a-z0-9-]/g, '-')

      // Detect framework automatically
      await detectAndSetFrameworkPreset(repo.owner?.login, repo.name)
    }
  }

  // Repository package.json data
  const packageJsonData = ref(null)

  const detectAndSetFrameworkPreset = async (accountName, repoName) => {
    try {
      const result = await props.frameworkDetectorService({
        accountName,
        repositoryName: repoName
      })
      if (result) {
        preset.value = result.framework
        packageJsonData.value = result.packageJson
      }
    } catch (error) {
      //
    }
  }

  const getOptionNameByValue = ({ listOption, optionValue, key }) => {
    const selectedOption = listOption.find((integration) => integration[key] === optionValue)
    return selectedOption ? selectedOption.label : ''
  }

  const getPresetIconClass = (presetValue) => {
    return `ai ai-${presetValue}`
  }

  // Step Navigation Methods
  const updateRouteQuery = (step, id = null, applicationNameValue = null, formValues = null) => {
    // Preserve existing query params and add/overwrite step-related ones
    const query = { ...route.query, step }
    if (id) {
      query.executionId = id
    }
    if (applicationNameValue) {
      query.applicationName = applicationNameValue
    }
    // Persist form values in route query to preserve them during navigation
    if (formValues) {
      query.formApplicationName = formValues.applicationName
      query.formPreset = formValues.preset
      query.formRootDirectory = formValues.rootDirectory
      query.formInstallCommand = formValues.installCommand
      // Variables are stored as JSON string
      if (formValues.newVariables && formValues.newVariables.length > 0) {
        query.formVariables = JSON.stringify(formValues.newVariables)
      }
    }
  }

  const goToDeploying = () => {
    currentStep.value = 'deploying'
    deployStartTime.value = Date.now()

    nextTick(() => {
      step2Ref.value?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    })
  }

  const goToSuccess = () => {
    currentStep.value = 'success'

    nextTick(() => {
      step3Ref.value?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    })
  }

  const showErrorToast = (summary, error) => {
    // v2 services throw ErrorHandler instances that know how to render themselves
    // (one toast per nested message). Plain errors/strings fall back to a single toast.
    if (error && typeof error.showErrors === 'function') {
      error.showErrors(toast)
      return
    }
    toast.add({
      closable: true,
      severity: 'error',
      summary,
      detail: error?.message || error || 'An unexpected error occurred.'
    })
  }

  const handleFinish = async () => {
    // Skip if we're restoring state from route (results already populated)
    if (isRestoringState.value) {
      return
    }

    try {
      const response = await props.getResultsService(executionId.value)
      results.value = response.result
      // Update route query to success state with executionId and application name
      updateRouteQuery('success', executionId.value, deployedApplicationName.value)
      goToSuccess()
    } catch (error) {
      deployFailed.value = true
      showErrorToast('Deployment failed', error)
    } finally {
      deployStore.removeStartTime()
    }

    emit('finish')
  }

  const handleRetry = () => {
    currentStep.value = 'settings'
    deployFailed.value = false
    executionId.value = ''
    isDeploying.value = false
    emit('retry')
  }

  const handleManage = (data) => {
    emit('manage', data)
  }

  const handleSaveDomains = async (values) => {
    isSavingDomains.value = true
    try {
      const workloadId = results.value?.domain?.id
      if (!workloadId) {
        //
        return
      }

      await workloadService.patchWorkloadDomains(workloadId, values)

      //
    } catch (error) {
      //
    } finally {
      isSavingDomains.value = false
    }
  }

  const onDeploy = handleSubmit(async (formValues) => {
    isDeploying.value = true

    // Filter out empty variables (variables with no key/value)
    const validVariables = (formValues.newVariables || []).filter(
      (variable) =>
        variable.key && variable.key.trim() !== '' && variable.value && variable.value.trim() !== ''
    )

    if (validVariables.length > 0) {
      try {
        await Promise.all(validVariables.map((variable) => variablesService.create(variable)))
      } catch (error) {
        showErrorToast('Error creating variables', error)
        isDeploying.value = false
        return
      }
    }

    const inputSchema = [
      {
        field: 'platform_feature__vcs_integration__uuid',
        instantiation_data_path: '',
        value: selectedIntegration.value
      },
      {
        field: 'az_name',
        instantiation_data_path: 'envs.[0].value',
        value: formValues.applicationName
      },
      {
        field: 'git_url_external',
        instantiation_data_path: 'envs.[1].value',
        value: selectedRepository.value
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
    deployedApplicationName.value = formValues.applicationName

    let response
    try {
      response = await props.instantiateTemplateService(templateId.value, inputSchema)
    } catch (error) {
      showErrorToast('Deploy error', error)
      isDeploying.value = false
      return
    }

    // Set execution ID from response for DeployStatusCard
    if (response?.result?.uuid) {
      executionId.value = response.result.uuid
      // Update route query params to preserve state on reload, including form values
      updateRouteQuery('deploying', executionId.value, formValues.applicationName, formValues)
    }

    // Set app URL for success card
    appUrl.value = `https://${formValues.applicationName}`
    results.value = response

    // Switch to deployment view only after the template instantiation succeeded
    goToDeploying()

    emit('deploy', formValues)
  })

  const loadSolutionByVendor = async () => {
    try {
      loadingStore.startLoading()
      const solution = await props.loadSolutionService({
        vendor: route.params.vendor,
        solution: route.params.solution
      })
      templateId.value = solution.referenceId
    } catch (error) {
      //
    } finally {
      loadingStore.finishLoading()
    }
  }

  const restoreStateFromRoute = async () => {
    const {
      step,
      executionId: routeExecutionId,
      applicationName: routeApplicationName
    } = route.query

    if (step && routeExecutionId) {
      executionId.value = routeExecutionId
      isRestoringState.value = true

      // Form values are now restored in initializeFromQueryParams before this runs
      // This function only handles the step state restoration

      if (step === 'deploying') {
        currentStep.value = 'deploying'
        deployStartTime.value = Date.now()
        isDeploying.value = true
      } else if (step === 'success') {
        // For success state, we need to fetch the results
        try {
          loadingStore.startLoading()
          const response = await props.getResultsService(routeExecutionId)
          results.value = response.result
          // Use application name from query params if available, otherwise from results
          deployedApplicationName.value =
            routeApplicationName || response.result?.edgeApplication?.name || ''
          appUrl.value =
            response.result?.domain?.url ||
            (routeApplicationName ? `https://${routeApplicationName}` : '')
          currentStep.value = 'success'
        } catch (error) {
          // If we can't restore success state, fall back to deploying
          currentStep.value = 'deploying'
          deployStartTime.value = Date.now()
          isDeploying.value = true
          //
        } finally {
          loadingStore.finishLoading()
        }
      }
    }
  }
  let repositoryOwnerRef = ''
  if (currentStep.value === 'settings') {
    // Repository owner and name from query params (with fallback to props)
    repositoryOwnerRef = route.query.repositoryOwner || props.repositoryOwner
  }

  onMounted(async () => {
    await Promise.all([loadSolutionByVendor(), listIntegrations(), listPlatforms()])
    listenerOnMessage()
    presetsList.value = await vulcanService.listPresetsService()

    // Initialize from query params if available
    if (currentStep.value === 'settings') {
      await initializeFromQueryParams()
    }

    // Restore state from route query params after loading required data
    await restoreStateFromRoute()
  })

  onBeforeUnmount(() => {
    removeMessageListener()
  })
</script>

<template>
  <div class="flex flex-col gap-6 w-full px-4 sm:px-0 my-8">
    <div
      ref="step3Ref"
      class="self-center w-full max-w-[700px]"
      v-show="currentStep === 'success'"
    >
      <DeploySuccessCard
        :app-url="appUrl"
        :execution-id="executionId"
        :template-title="'Application Deployed'"
        :template-description="`Your application ${deployedApplicationName} has been successfully deployed.`"
        :github-url="route.query.repository"
        :results="results"
        :workload-id="results?.domain?.id"
        :is-saving="isSavingDomains"
        @on-save="handleSaveDomains"
      />
    </div>

    <div
      v-if="currentStep !== 'success'"
      class="self-center w-full max-w-[700px] my-8"
    >
      <CardBox
        title="Import from Git"
        :class="[
          'w-full',
          { '[&>footer]:hidden': currentStep !== 'settings' || loadingStore.isLoading }
        ]"
      >
        <template
          v-if="loadingStore.isLoading"
          #content
        >
          <div class="p-4 sm:p-6 flex flex-col gap-6">
            <div class="flex flex-col gap-4">
              <Skeleton class="h-4 w-full" />
              <Skeleton class="h-4 w-3/4" />
              <Skeleton class="h-4 w-5/6" />
            </div>
            <div class="flex flex-col gap-4">
              <Skeleton class="h-10 w-full" />
              <Skeleton class="h-10 w-2/3" />
            </div>
          </div>
        </template>
        <template
          v-else
          #content
        >
          <div class="p-4 sm:p-6 flex flex-col gap-6">
            <!-- Commented out: Repository source display section
        <div class="w-full px-4 sm:px-6 bg-surface-raised rounded-lg border surface-border">
          <div class="py-4 flex flex-col gap-3">
            <div class="flex flex-col gap-1.5">
              <span class="text-[10px] font-normal text-text-color-muted leading-3"
                >Importing from
              </span>
              <div class="flex items-center gap-1">
                <i class="pi pi-github w-3.5 h-3.5 text-text-color-muted text-[10px]"></i>
                <a
                  v-if="route.query.repository"
                  :href="route.query.repository"
                  target="_blank"
                  class="text-[10px] font-normal text-text-color-muted leading-3 hover:text-link cursor-pointer"
                >
                  {{ repositoryOwnerRef }}/{{ repositoryNameRef }}
                </a>
                <span
                  v-else
                  class="text-[10px] font-normal text-text-color-muted leading-3"
                >
                  {{ repositoryOwnerRef }}/{{ repositoryNameRef }}
                </span>
              </div>
            </div>
          </div>
        </div>
        -->
            <!-- GitHub Account and Repository Selection -->
            <div class="flex flex-col sm:max-w-lg gap-2">
              <LabelBlock
                for="githubAccount"
                label="Git Scope"
                isRequired
              />
              <Dropdown
                name="githubAccount"
                v-model="selectedIntegration"
                :options="integrationOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Select a scope"
                :class="{ 'p-invalid': githubAccountError }"
                :disabled="isDeploying"
                :loading="isGithubConnectLoading"
                @change="handleIntegrationChange"
                appendTo="self"
              >
                <template #value="slotProps">
                  <div
                    v-if="slotProps.value"
                    class="flex items-center gap-2"
                  >
                    <i class="pi pi-github"></i>
                    <span>
                      {{ integrationsList.find((i) => i.value === slotProps.value)?.label }}
                    </span>
                  </div>
                  <div v-else>
                    {{ slotProps.placeholder }}
                  </div>
                </template>
                <template #option="slotProps">
                  <div class="flex items-center gap-2">
                    <i class="pi pi-github"></i>
                    <span>{{ slotProps.option.label }}</span>
                  </div>
                </template>
                <template #footer>
                  <div class="p-dropdown-items-wrapper">
                    <ul class="p-dropdown-items">
                      <li
                        class="p-dropdown-item flex items-center cursor-pointer"
                        @click="connect('github')"
                      >
                        <i class="pi pi-plus-circle mr-2" />
                        <div>Add GitHub Account</div>
                      </li>
                    </ul>
                  </div>
                </template>
              </Dropdown>
              <small
                v-if="githubAccountError"
                class="p-error text-xs font-normal leading-tight"
              >
                {{ githubAccountError }}
              </small>
            </div>

            <div class="flex flex-col sm:max-w-lg gap-2">
              <LabelBlock
                for="repository"
                label="Repository"
                isRequired
              />
              <Dropdown
                name="repository"
                v-model="selectedRepository"
                :options="repositoriesListRaw"
                optionLabel="name"
                optionValue="url"
                placeholder="Select a repository"
                :class="{ 'p-invalid': repositoryError }"
                :disabled="isDeploying || !selectedIntegration"
                :loading="isLoadingRepositories"
                filter
                @change="handleRepositoryChange"
              >
                <template #value="slotProps">
                  <div
                    v-if="slotProps.value"
                    class="flex items-center gap-2"
                  >
                    <i class="pi pi-github"></i>
                    <span>
                      {{ repositoriesListRaw.find((repo) => repo.url === slotProps.value)?.name }}
                    </span>
                  </div>
                  <div v-else>
                    {{ slotProps.placeholder }}
                  </div>
                </template>
                <template #option="slotProps">
                  <div class="flex items-center gap-2">
                    <i class="pi pi-github"></i>
                    <span>{{ slotProps.option.name }}</span>
                  </div>
                </template>
              </Dropdown>
              <small
                v-if="repositoryError"
                class="p-error text-xs font-normal leading-tight"
              >
                {{ repositoryError }}
              </small>
            </div>

            <div class="flex flex-col gap-2">
              <FieldText
                label="Application Name"
                required
                name="applicationName"
                :placeholder="suggestedApplicationName"
                :value="applicationName"
                :disabled="isDeploying"
                description="Give a unique name to the Application. It’ll also be used for the bucket for storage and the function."
              />
            </div>

            <div class="flex flex-col sm:max-w-lg gap-2">
              <LabelBlock
                for="preset"
                label="Framework"
                isRequired
              />
              <Dropdown
                name="preset"
                v-model="preset"
                :options="presetsList"
                filter
                optionLabel="label"
                optionValue="value"
                autoFilterFocus
                placeholder="Select a framework"
                :class="{ 'p-invalid': presetError }"
                :disabled="isDeploying"
              >
                <template #value="slotProps">
                  <div
                    v-if="slotProps.value"
                    class="flex items-center"
                  >
                    <i
                      :class="getPresetIconClass(slotProps.value)"
                      class="w-3.5 h-3.5 mr-2"
                    ></i>
                    <div>
                      {{
                        getOptionNameByValue({
                          listOption: presetsList,
                          optionValue: slotProps.value,
                          key: 'value'
                        })
                      }}
                    </div>
                  </div>
                  <div v-else>
                    {{ slotProps.placeholder }}
                  </div>
                </template>
                <template #option="slotProps">
                  <div class="flex items-center">
                    <i
                      :class="getPresetIconClass(slotProps.option.value)"
                      class="w-3.5 h-3.5 mr-2"
                    ></i>
                    <div>{{ slotProps.option.label }}</div>
                  </div>
                </template>
              </Dropdown>
              <small
                v-if="presetError"
                class="p-error text-xs font-normal leading-tight"
              >
                {{ presetError }}
              </small>
            </div>

            <div class="flex flex-col gap-2">
              <FieldText
                label="Root Directory"
                required
                class=""
                name="rootDirectory"
                placeholder="./"
                :value="rootDirectory"
                :disabled="isDeploying"
              />
            </div>

            <Accordion
              :active-index="null"
              class="overflow-hidden rounded-md"
            >
              <AccordionTab
                :pt="{
                  header: { class: 'bg-[var(--surface-ground)] rounded-t-md' },
                  headerAction: {
                    class:
                      'bg-[var(--surface-ground)] rounded-t-md hover:opacity-100 focus:shadow-none'
                  },
                  content: { class: '!p-0 bg-[var(--card-content-bg))] rounded-b-md' }
                }"
              >
                <template #header>
                  <div class="flex items-center gap-2">
                    <span>Build Settings</span>
                  </div>
                </template>
                <div class="p-4 flex flex-col gap-4">
                  <div class="flex flex-col w-full gap-2">
                    <FieldInputTextPrivacy
                      label="Install Command"
                      required
                      name="installCommand"
                      description="This command is automatically set based on your project. Enable custom command to override it."
                      placeholder="npm install"
                      :value="installCommand"
                      :isPublic="isInstallCommandEditable"
                      @update:isPublic="isInstallCommandEditable = $event"
                      :showPrivacyIcon="false"
                      :disabled="isDeploying"
                    />
                  </div>
                </div>
              </AccordionTab>

              <AccordionTab
                :pt="{
                  header: { class: 'bg-[var(--surface-ground)] rounded-b-md' },
                  headerAction: {
                    class:
                      'bg-[var(--surface-ground)] rounded-b-md hover:opacity-100 focus:shadow-none'
                  },
                  content: { class: '!p-0 bg-surface-overlay rounded-b-md' }
                }"
              >
                <template #header>
                  <div class="flex items-center gap-2">
                    <span>Environment Variables</span>
                  </div>
                </template>
                <div class="p-4 flex flex-col gap-4">
                  <template v-if="newVariables?.length">
                    <div
                      v-for="(variable, index) in newVariables"
                      class="flex flex-col gap-2"
                      :key="index"
                    >
                      <div class="flex flex-col sm:flex-row gap-2 sm:gap-4">
                        <div class="flex flex-col sm:w-1/2 w-full gap-2">
                          <FieldText
                            :label="index === 0 ? 'Key' : ''"
                            required
                            autocapitalize="characters"
                            :name="`newVariables[${index}].key`"
                            :value="newVariables[index].key"
                            placeholder="VARIABLE_KEY_NAME"
                            :disabled="isDeploying"
                            @paste="handlePasteVariables($event, index)"
                          />
                          <small
                            v-if="index === newVariables.length - 1"
                            class="text-xs text-color-secondary font-normal leading-5"
                          >
                            Give a name or identifier for the variable. Accepts upper-case letters,
                            numbers, and underscore.
                          </small>
                        </div>
                        <div class="flex flex-col sm:w-1/2 w-full gap-2">
                          <FieldInputTextPrivacy
                            :label="index === 0 ? 'Value' : ''"
                            required
                            labelPublic=""
                            labelPrivate="Secret"
                            :name="`newVariables[${index}].value`"
                            :value="newVariables[index].value"
                            placeholder="VARIABLE_VALUE"
                            :isPublic="newVariables[index].isPublic"
                            :disabled="isDeploying"
                            @update:isPublic="newVariables[index].isPublic = $event"
                          />
                          <small
                            v-if="index === newVariables.length - 1"
                            class="text-xs text-color-secondary font-normal leading-5"
                          >
                            Enter the data associated with the variable key.
                          </small>
                        </div>
                        <div
                          class="flex"
                          :class="{ 'mt-[30px]': !index }"
                        >
                          <Button
                            class="h-8"
                            icon="pi pi-minus-circle"
                            outlined
                            type="button"
                            :disabled="isDeploying"
                            @click="removeVariable(index)"
                          />
                        </div>
                      </div>
                    </div>
                  </template>

                  <div class="flex flex-col sm:flex-row gap-4">
                    <Button
                      icon="pi pi-plus-circle"
                      outlined
                      :label="addVariableLabel"
                      :disabled="isDeploying"
                      @click="addVariable"
                    />
                  </div>
                </div>
              </AccordionTab>
            </Accordion>
          </div>
        </template>

        <template #footer>
          <Button
            label="Deploy"
            icon-pos="right"
            class="w-full"
            :loading="isDeploying"
            @click="onDeploy"
          />
        </template>
      </CardBox>
    </div>

    <div
      ref="step2Ref"
      class="self-center w-full max-w-[700px]"
      v-show="currentStep === 'deploying' || currentStep === 'success'"
    >
      <DeployStatusCard
        :execution-id="executionId"
        :get-logs-service="getScriptRunnerLogsService"
        :results="results"
        :deploy-failed="deployFailed"
        :application-name="applicationName"
        :deploy-start-time="deployStartTime"
        :deploy-started="currentStep === 'deploying' || currentStep === 'success'"
        @finish="handleFinish"
        @retry="handleRetry"
        @manage="handleManage"
      />
    </div>
  </div>
</template>
