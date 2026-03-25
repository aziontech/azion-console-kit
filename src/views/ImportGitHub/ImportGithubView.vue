<script setup>
  import { ref, computed, onMounted, nextTick, onBeforeUnmount } from 'vue'
  import { useForm, useField } from 'vee-validate'
  import { useRoute } from 'vue-router'
  import { useToast } from 'primevue/usetoast'
  import * as yup from 'yup'
  import BaseDeployCard from '@/templates/deploy-template/BaseDeployCard.vue'
  import DeployStatusCard from '@/templates/deploy-template/DeployStatusCard.vue'
  import DeploySuccessCard from '@/templates/deploy-template/DeploySuccessCard.vue'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import FieldInputTextPrivacy from '@/templates/form-fields-inputs/filedInputTextPrivacy.vue'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown'
  import LabelBlock from '@/templates/label-block'
  import Accordion from 'primevue/accordion'
  import AccordionTab from 'primevue/accordiontab'
  import Button from 'primevue/button'
  import Dropdown from 'primevue/dropdown'
  import { useLoadingStore } from '@/stores/loading'
  import { useDeploy } from '@/stores/deploy'
  import { variablesService } from '@/services/v2/variables'
  import { vcsService } from '@/services/v2/vcs/vcs-service'
  import { getScriptRunnerLogsService } from '@/services/script-runner-service'
  import OAuthGithub from '@/templates/template-engine-block/oauth-github.vue'

  const props = defineProps({
    repositoryOwner: {
      type: String,
      required: true
    },
    repositoryName: {
      type: String,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    },
    listVulcanPresetsService: {
      type: Function,
      required: true
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
  const toast = useToast()
  const route = useRoute()

  // Step Navigation State
  const currentStep = ref('repository')
  const step2Ref = ref(null)
  const step3Ref = ref(null)

  // Deploy State
  const executionId = ref('')
  const deployFailed = ref(false)
  const deployStartTime = ref(null)
  const appUrl = ref('')
  const applicationName = ref('')
  const results = ref(null)
  const isDeploying = ref(false)

  // OAuth and integration state
  const callbackUrl = ref('')
  const oauthGithubRef = ref(null)
  const isGithubConnectLoading = ref(false)
  const integrationsList = ref([])
  const repositoriesList = ref([])
  const loadingRepositories = ref(false)
  const presetsList = ref([])
  const templateId = ref(null)
  const isInstallCommandEditable = ref(false)

  // Validation schema
  const validationSchema = yup.object({
    domain: yup
      .string()
      .required()
      .matches(
        /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.azion\.app$/,
        'Domain must end with .azion.app (e.g., mydomain.azion.app)'
      )
      .label('Domain'),
    preset: yup.string().required().label('Framework'),
    rootDirectory: yup
      .string()
      .required()
      .matches(/^\//, 'Root Directory must start with a slash (/)')
      .matches(/^(?!.*\.\.).*$/, 'Root Directory cannot contain (..)')
      .matches(/^\S*$/, 'Root Directory cannot contain spaces')
      .label('Root Directory'),
    installCommand: yup.string().required().label('Install Command'),
    gitScope: yup.string().required().label('Git Scope'),
    repository: yup.string().required().label('Repository'),
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

  // Computed domain suggestion
  const suggestedDomain = computed(() => {
    if (!props.repositoryName) return ''
    return `${props.repositoryName.toLowerCase().replace(/[^a-z0-9-]/g, '-')}.azion.app`
  })

  const addVariableLabel = computed(() => {
    if (!newVariables.value || newVariables.value.length === 0) {
      return 'Add Variable'
    }
    return 'Add Another'
  })

  // Initial form values
  const initialValues = {
    domain: suggestedDomain.value,
    preset: '',
    rootDirectory: '/',
    installCommand: 'npm install',
    newVariables: [
      {
        key: '',
        value: '',
        isPublic: false
      }
    ],
    gitScope: '',
    repository: ''
  }

  // Setup form with vee-validate
  const { handleSubmit } = useForm({
    validationSchema,
    initialValues
  })

  // UseField for individual fields
  const { value: domain } = useField('domain')
  const { value: preset } = useField('preset')
  const { value: rootDirectory } = useField('rootDirectory')
  const { value: installCommand } = useField('installCommand')
  const { value: gitScope } = useField('gitScope')
  const { value: repository } = useField('repository')
  const { value: newVariables } = useField('newVariables')

  // Computed for integration check
  const hasIntegrations = computed(() => {
    return integrationsList?.value?.length > 0
  })

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

      // Replace the current variable at index with the first parsed one
      // and add the rest as new variables
      if (!parsedVariables.length) {
        newVariables.value[index] = parsedVariables[0]

        // Add remaining variables
        for (let idx = 1; idx < parsedVariables.length; idx++) {
          newVariables.value.push(parsedVariables[idx])
        }
      }
    }
    // If it's a single line without newline, let the default paste behavior happen
  }

  const removeVariable = (index) => {
    newVariables.value.splice(index, 1)
  }

  const setCallbackUrl = (uri) => {
    callbackUrl.value = uri
  }

  const saveIntegration = async (integration) => {
    try {
      isGithubConnectLoading.value = true
      await vcsService.postCallbackUrl(callbackUrl.value, integration.data)
      await loadListIntegrations()
    } catch (error) {
      error.showWithOptions(toast, (error) => ({
        summary: `GitHub integration failed: ${error.detail}`,
        severity: 'error'
      }))
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

  const loadListIntegrations = async () => {
    try {
      isGithubConnectLoading.value = true
      const data = await vcsService.listIntegrations()
      integrationsList.value = data
    } catch (error) {
      error.showWithOptions(toast, { summary: 'Listing failed' })
    } finally {
      isGithubConnectLoading.value = false
    }
  }

  const setListRepositories = async () => {
    repositoriesList.value = []
    loadingRepositories.value = true

    try {
      const data = await vcsService.listRepositories(gitScope.value)
      repositoriesList.value = data
    } catch (error) {
      error.showWithOptions(toast, { summary: 'Loading failed' })
    } finally {
      loadingRepositories.value = false
    }
  }

  const detectAndSetFrameworkPreset = async (accountName, repoName) => {
    try {
      const framework = await props.frameworkDetectorService({
        accountName,
        repositoryName: repoName
      })
      preset.value = framework
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: 'Setting failed',
        detail: error
      })
    }
  }

  const setRepositoryValue = (repositoryUrl) => {
    repository.value = repositoryUrl
  }

  const getOptionNameByValue = ({ listOption, optionValue, key }) => {
    const selectedOption = listOption.find((integration) => integration[key] === optionValue)
    return selectedOption ? selectedOption.label : ''
  }

  const triggerConnectWithGithub = () => {
    if (oauthGithubRef.value) {
      oauthGithubRef.value.connectWithGithub()
    }
  }

  const getPresetIconClass = (presetValue) => {
    return `ai ai-${presetValue}`
  }

  // Step Navigation Methods
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

  const failMessage =
    'There was an issue during the deployment. Check the Deploy Log for more details.'
  const successMessage =
    'The Application is being propagated through the edge nodes. This process will take a few minutes.'

  const handleFinish = async () => {
    try {
      const response = await props.getResultsService(executionId.value)
      results.value = response.result
      toast.add({
        closable: true,
        severity: 'success',
        summary: 'Successfully created!',
        detail: successMessage
      })
      goToSuccess()
    } catch (error) {
      deployFailed.value = true
      toast.add({
        closable: true,
        severity: 'error',
        summary: 'Creation failed',
        detail: failMessage
      })
    } finally {
      deployStore.removeStartTime()
    }

    emit('finish')
  }

  const handleRetry = () => {
    currentStep.value = 'repository'
    deployFailed.value = false
    executionId.value = ''
    emit('retry')
  }

  const handleManage = (data) => {
    emit('manage', data)
  }

  const onDeploy = handleSubmit(
    async (formValues) => {
      try {
        isDeploying.value = true
        goToDeploying()

        // Filter out empty variables (variables with no key/value)
        const validVariables = (formValues.newVariables || []).filter(
          (variable) =>
            variable.key &&
            variable.key.trim() !== '' &&
            variable.value &&
            variable.value.trim() !== ''
        )

        if (validVariables.length > 0) {
          await Promise.all(validVariables.map((variable) => variablesService.create(variable)))
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
            value: formValues.domain
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

        deployStore.addApplicationName(formValues.domain)
        applicationName.value = formValues.domain

        const response = await props.instantiateTemplateService(templateId.value, inputSchema)

        // Set execution ID from response for DeployStatusCard
        if (response?.result?.uuid) {
          executionId.value = response.result.uuid
        }

        // Set app URL for success card
        appUrl.value = `https://${formValues.domain}`
        results.value = response

        emit('deploy', formValues)
      } catch (error) {
        deployFailed.value = true
        toast.add({
          closable: true,
          severity: 'error',
          summary: 'Deploy failed',
          detail: error.message || 'Failed to deploy'
        })
      } finally {
        isDeploying.value = false
      }
    },
    ({ errors }) => {
      // Handle validation errors - show first error to user
      const firstError = Object.values(errors)[0]
      if (firstError) {
        toast.add({
          closable: true,
          severity: 'error',
          summary: 'Validation Error',
          detail: firstError
        })
      }
    }
  )

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
    await Promise.all([loadSolutionByVendor(), loadListIntegrations()])
    listenerOnMessage()
    presetsList.value = await props.listVulcanPresetsService()
  })

  onBeforeUnmount(() => {
    removeMessageListener()
  })
</script>

<template>
  <div class="flex flex-col gap-6 min-w-[672px]">
    <!-- Success Card -->
    <div
      ref="step3Ref"
      class="self-center"
      v-show="currentStep === 'success'"
    >
      <DeploySuccessCard
        :app-url="appUrl"
        :template-title="'Application Deployed'"
        :template-description="`Your application ${applicationName} has been successfully deployed.`"
        :github-url="repository"
        :results="results"
      />
    </div>

    <!-- Main Deploy Card -->
    <BaseDeployCard
      v-if="currentStep !== 'success'"
      title="Import from Git"
      class="self-center my-8"
      :loading="loadingStore.isLoading"
      :hide-footer="currentStep === 'deploying'"
    >
      <template
        #header-meta
        v-if="gitScope"
      >
        <div class="w-full px-6 bg-[var(--surface-50)] rounded-lg border surface-border">
          <div class="py-4 flex flex-col gap-3">
            <div class="flex flex-col gap-1.5">
              <span class="text-[10px] font-normal text-text-color-muted leading-3"
                >Importing from</span
              >
              <div class="flex items-center gap-1">
                <i class="pi pi-github w-3.5 h-3.5 text-text-color-muted text-[10px]"></i>
                <span class="text-[10px] font-normal text-text-color-muted leading-3">
                  {{ repositoryOwner }}/{{ repositoryName }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #content>
        <template v-if="currentStep === 'repository'">
          <div
            v-if="!hasIntegrations"
            class="flex flex-col gap-4"
          >
            <OAuthGithub
              ref="oauthGithubRef"
              @onCallbackUrl="(uri) => setCallbackUrl(uri)"
              :loading="isGithubConnectLoading"
            />
          </div>

          <template v-else>
            <div class="flex flex-col sm:flex-row gap-4">
              <div class="flex flex-col sm:w-1/2 gap-2">
                <LabelBlock
                  for="gitScope"
                  label="Git Scope"
                  isRequired
                />
                <Dropdown
                  name="gitScope"
                  v-model="gitScope"
                  :options="integrationsList"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select a scope"
                  class="w-full"
                  @change="setListRepositories"
                >
                  <template #value="slotProps">
                    <div
                      v-if="slotProps.value"
                      class="flex items-center"
                    >
                      <i class="pi pi-github mr-2"></i>
                      <div>
                        {{
                          getOptionNameByValue({
                            listOption: integrationsList,
                            optionValue: slotProps.value,
                            key: 'value'
                          })
                        }}
                      </div>
                    </div>
                    <div
                      class="flex items-center"
                      v-else
                    >
                      <i class="pi pi-github mr-2"></i>
                      {{ slotProps.placeholder }}
                    </div>
                  </template>
                  <template #option="slotProps">
                    <div class="flex items-center">
                      <i class="pi pi-github mr-2"></i>
                      <div>{{ slotProps.option.label }}</div>
                    </div>
                  </template>
                  <template #footer>
                    <div class="p-dropdown-items-wrapper">
                      <ul class="p-dropdown-items">
                        <li
                          class="p-dropdown-item flex items-center"
                          @click="triggerConnectWithGithub"
                        >
                          <i class="pi pi-plus-circle mr-2"></i>
                          <div>Add GitHub Account</div>
                        </li>
                      </ul>
                    </div>
                  </template>
                </Dropdown>
              </div>
              <div class="flex flex-col sm:w-1/2 gap-2">
                <FieldDropdown
                  filter
                  required
                  name="repository"
                  label="Repository"
                  optionLabel="name"
                  optionValue="url"
                  placeholder="Select a repository"
                  :options="repositoriesList"
                  :disabled="!gitScope"
                  :value="repository"
                  :loading="loadingRepositories"
                  @onSelectOption="
                    (option) => {
                      setRepositoryValue(option.url)
                      const accountName = getOptionNameByValue({
                        listOption: integrationsList,
                        optionValue: gitScope,
                        key: 'value'
                      })
                      detectAndSetFrameworkPreset(accountName, option.name)
                    }
                  "
                />
              </div>
            </div>

            <div class="flex flex-col w-full gap-2">
              <FieldText
                label="Domain"
                required
                name="domain"
                :placeholder="suggestedDomain"
                :value="domain"
                description="This domain can be changed later and replaced with a custom domain."
              />
            </div>

            <div class="flex flex-col w-full gap-2">
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
                class="w-full"
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
            </div>

            <div class="flex flex-col w-full gap-2">
              <FieldText
                label="Root Directory"
                required
                name="rootDirectory"
                placeholder="./"
                :value="rootDirectory"
              />
            </div>

            <Accordion :active-index="null">
              <AccordionTab
                :pt="{
                  header: { class: 'bg-surface-overlay' },
                  headerAction: {
                    class: 'bg-surface-overlay hover:bg-surface-100 focus:shadow-none'
                  },
                  content: { class: '!p-0 bg-surface-overlay' }
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
                      placeholder="npm install"
                      :value="installCommand"
                      :isPublic="isInstallCommandEditable"
                      @update:isPublic="isInstallCommandEditable = $event"
                      :showPrivacyIcon="false"
                    />
                  </div>
                </div>
              </AccordionTab>

              <AccordionTab
                :pt="{
                  header: { class: 'bg-surface-overlay' },
                  headerAction: {
                    class: 'bg-surface-overlay hover:bg-surface-100 focus:shadow-none'
                  },
                  content: { class: '!p-0 bg-surface-overlay' }
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
                      <div class="flex gap-4 items-top">
                        <div class="flex flex-col sm:w-1/2 w-full gap-2">
                          <FieldText
                            :label="index === 0 ? 'Key' : ''"
                            required
                            autocapitalize="characters"
                            :name="`newVariables[${index}].key`"
                            :value="newVariables[index].key"
                            placeholder="VARIABLE_KEY_NAME"
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
                            @update:isPublic="newVariables[index].isPublic = $event"
                          />
                          <small
                            v-if="index === newVariables.length - 1"
                            class="text-xs text-color-secondary font-normal leading-5"
                          >
                            Enter the data associated with the variable key.
                          </small>
                        </div>
                        <Button
                          :class="[
                            'h-8 max-sm:w-full position-absolute right-0',
                            index === 0 ? 'top-[30px]' : 'top-0.5'
                          ]"
                          icon="pi pi-minus-circle"
                          outlined
                          type="button"
                          @click="removeVariable(index)"
                        />
                      </div>
                    </div>
                  </template>

                  <div class="flex flex-col sm:flex-row gap-4">
                    <Button
                      icon="pi pi-plus-circle"
                      outlined
                      :label="addVariableLabel"
                      @click="addVariable"
                    />
                  </div>
                </div>
              </AccordionTab>
            </Accordion>
          </template>
        </template>
      </template>

      <template
        v-if="currentStep === 'repository'"
        #footer
      >
        <Button
          label="Deploy"
          icon-pos="right"
          class="w-full"
          :loading="isDeploying"
          @click="onDeploy"
        />
      </template>
    </BaseDeployCard>

    <!-- Deploy Status Card -->
    <div
      ref="step2Ref"
      class="self-center"
      v-show="currentStep === 'deploying' || currentStep === 'success'"
    >
      <DeployStatusCard
        :execution-id="executionId"
        :get-logs-service="getScriptRunnerLogsService"
        :results="results"
        :deploy-failed="deployFailed"
        :application-name="applicationName"
        :deploy-start-time="deployStartTime"
        :deploy-started="currentStep === 'deploying'"
        @finish="handleFinish"
        @retry="handleRetry"
        @manage="handleManage"
      />
    </div>
  </div>
</template>
