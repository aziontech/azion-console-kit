<script setup>
  import { computed, ref, markRaw, watch, onMounted, defineOptions, provide } from 'vue'
  import { JsonForms } from '@jsonforms/vue'
  import { vanillaRenderers } from '@jsonforms/vue-vanilla'
  import Dropdown from '@aziontech/webkit/dropdown'
  import { useToast } from '@aziontech/webkit/use-toast'
  import LabelBlock from '@aziontech/webkit/label'
  import OAuthGithub from './oauth-github.vue'
  import LayoutEngineBlock from './layout-engine-block.vue'
  import { workloadService } from '@/services/v2/workload/workload-service'

  // JSON Forms Custom Renderers
  import InputTextControlRenderer from '@templates/form-fields-inputs/jsonform-custom-render/input-text/inputTextControlRenderer.vue'
  import { InputTextControlTester } from '@templates/form-fields-inputs/jsonform-custom-render/input-text/inputTextControlTester'
  import InputPasswordControlRenderer from '@templates/form-fields-inputs/jsonform-custom-render/input-password/inputPasswordControlRenderer.vue'
  import { InputPasswordControlTester } from '@templates/form-fields-inputs/jsonform-custom-render/input-password/inputPasswordControlTester'
  import InputNumberControlRenderer from '@templates/form-fields-inputs/jsonform-custom-render/input-number/inputNumberControlRenderer.vue'
  import { InputNumberControlTester } from '@templates/form-fields-inputs/jsonform-custom-render/input-number/inputNumberControlTester'
  import TextareaControlRenderer from '@templates/form-fields-inputs/jsonform-custom-render/textarea/textareaControlRenderer.vue'
  import { TextareaControlTester } from '@templates/form-fields-inputs/jsonform-custom-render/textarea/textareaControlTester'
  import DropdownControlRenderer from '@templates/form-fields-inputs/jsonform-custom-render/dropdown/dropdownControlRenderer.vue'
  import { DropdownControlTester } from '@templates/form-fields-inputs/jsonform-custom-render/dropdown/dropdownControlTester'
  import InputTextPrivacyControlRenderer from '@templates/form-fields-inputs/jsonform-custom-render/input-text-privacy/inputTextPrivacyControlRenderer.vue'
  import { InputTextPrivacyControlTester } from '@templates/form-fields-inputs/jsonform-custom-render/input-text-privacy/inputTextPrivacyControlTester'

  defineOptions({ name: 'engineJsonForm' })

  const props = defineProps({
    schema: {
      type: Object,
      required: true
    },
    isDrawer: {
      type: Boolean,
      default: false
    },
    hasSettings: {
      type: Boolean,
      default: true
    },
    loadingDeploy: {
      type: Boolean,
      default: false
    },
    disabledDeploy: {
      type: Boolean,
      default: false
    },
    // Deploy Status Card props
    executionId: {
      type: String,
      default: ''
    },
    deployFailed: {
      type: Boolean,
      default: false
    },
    applicationName: {
      type: String,
      default: ''
    },
    deployStartTime: {
      type: Number,
      default: null
    },
    appUrl: {
      type: String,
      default: ''
    },
    successNextSteps: {
      type: Array,
      default: () => []
    },
    // Results from deployment (needed for patch domains)
    results: {
      type: Object,
      default: null
    }
  })

  const emit = defineEmits([
    'next',
    'deploy',
    'finish',
    'retry',
    'manage',
    'open-url',
    'next-step',
    'save-domains'
  ])

  const toast = useToast()

  const layoutRef = ref(null)
  const oauthGithubRef = ref(null)

  const selectedIntegration = ref('')
  const vcsIntegrationError = ref('')
  const formData = ref({})
  const errors = ref([])
  const vcsIntegrationFieldName = ref('platform_feature__vcs_integration__uuid')
  // Store isPublic values for privacy fields (fieldName -> isPublic)
  const privacyFieldsState = ref({})

  // Provide a function for privacy renderers to register their isPublic state
  const updatePrivacyFieldState = (fieldName, isPublic) => {
    privacyFieldsState.value[fieldName] = isPublic
  }

  provide('updatePrivacyFieldState', updatePrivacyFieldState)

  const customRenderers = [
    {
      tester: InputTextControlTester,
      renderer: InputTextControlRenderer
    },
    {
      tester: InputPasswordControlTester,
      renderer: InputPasswordControlRenderer
    },
    {
      tester: InputNumberControlTester,
      renderer: InputNumberControlRenderer
    },
    {
      tester: TextareaControlTester,
      renderer: TextareaControlRenderer
    },
    {
      tester: DropdownControlTester,
      renderer: DropdownControlRenderer
    },
    {
      tester: InputTextPrivacyControlTester,
      renderer: InputTextPrivacyControlRenderer
    }
  ]

  const renderers = markRaw([...vanillaRenderers, ...customRenderers])

  const hasIntegrations = computed(() => {
    const githubIntegration = props.schema?.properties?.platform_feature__vcs_integration__uuid
    const hasGithubIntegration = githubIntegration && Object.keys(githubIntegration).length > 0
    return hasGithubIntegration
  })

  /**
   * Repository step form schema
   * Contains fields that are NOT marked as isSettingField: true
   * Uses horizontal grid layout (sm:grid-cols-2)
   */
  const repositoryFormSchema = computed(() => {
    // Return empty valid schema if props.schema is null/undefined
    if (!props.schema) {
      return { type: 'object', properties: {} }
    }

    const schema = { ...props.schema, type: 'object' }
    const allProperties = schema.properties || {}

    // Filter properties to only include fields WITHOUT isSettingField: true
    const filteredProperties = {}
    Object.keys(allProperties).forEach((fieldName) => {
      const field = allProperties[fieldName]
      const isSetting = field?.isSettingField === true || field?.isSettingField === 'true'
      if (!isSetting) {
        filteredProperties[fieldName] = field
      }
    })

    schema.properties = parsePropertiesSchema(filteredProperties)
    return schema
  })

  /**
   * Settings step form schema
   * Contains fields marked with isSettingField: true
   * Uses full-width layout (each input takes the entire line)
   */
  const settingsFormSchema = computed(() => {
    // Return empty valid schema if props.schema is null/undefined
    if (!props.schema) {
      return { type: 'object', properties: {} }
    }

    const schema = { ...props.schema, type: 'object' }
    const allProperties = schema.properties || {}

    // Filter properties to only include fields WITH isSettingField: true
    const filteredProperties = {}
    Object.keys(allProperties).forEach((fieldName) => {
      const field = allProperties[fieldName]
      const isSetting = field?.isSettingField === true || field?.isSettingField === 'true'
      if (isSetting) {
        filteredProperties[fieldName] = field
      }
    })

    schema.properties = parsePropertiesSchema(filteredProperties)
    return schema
  })

  /**
   * Computed property to check if repository form has any properties
   * Used to conditionally render JsonForms to prevent errors with empty schema
   */
  const hasRepositoryFormProperties = computed(() => {
    return Object.keys(repositoryFormSchema.value?.properties || {}).length > 0
  })

  /**
   * Computed property to check if settings form has any properties
   * Used to conditionally render JsonForms to prevent errors with empty schema
   */
  const hasSettingsFormProperties = computed(() => {
    return Object.keys(settingsFormSchema.value?.properties || {}).length > 0
  })

  /**
   * Computed property to check if form should be disabled
   * True when loading or explicitly disabled
   */
  const isFormDisabled = computed(() => {
    return props.loadingDeploy || props.disabledDeploy
  })

  /**
   * Repository form schema with readOnly applied when disabled
   */
  const repositoryFormSchemaDisabled = computed(() => {
    if (!isFormDisabled.value) return repositoryFormSchema.value

    const schema = JSON.parse(JSON.stringify(repositoryFormSchema.value))
    schema.readOnly = true
    if (schema.properties) {
      Object.keys(schema.properties).forEach((key) => {
        schema.properties[key].readOnly = true
      })
    }
    return schema
  })

  /**
   * Settings form schema with readOnly applied when disabled
   */
  const settingsFormSchemaDisabled = computed(() => {
    if (!isFormDisabled.value) return settingsFormSchema.value

    const schema = JSON.parse(JSON.stringify(settingsFormSchema.value))
    schema.readOnly = true
    if (schema.properties) {
      Object.keys(schema.properties).forEach((key) => {
        schema.properties[key].readOnly = true
      })
    }
    return schema
  })

  const isVcsRequired = computed(() => {
    if (!hasIntegrations.value) return false
    const requiredFields = props.schema?.required || []
    return requiredFields.includes(vcsIntegrationFieldName.value)
  })

  /**
   * Computed property for repository groups (group[0])
   * Returns the first group from the schema groups array
   * For JSON Forms, groups are not used the same way as Azion form
   */
  const repositoryGroups = computed(() => {
    const groups = props.schema?.groups || []
    return groups.length > 0 ? [groups[0]] : []
  })

  /**
   * Computed property for settings groups (group[1+])
   * Returns all groups except the first one
   * For JSON Forms, groups are not used the same way as Azion form
   */
  const settingsGroups = computed(() => {
    const groups = props.schema?.groups || []
    return groups.slice(1)
  })

  const layoutProps = computed(() => ({
    title: props.schema?.title || 'Start from Template',
    previewSrc: props.schema?.imagePreview || props.schema?.previewSrc || '',
    previewAlt: props.schema?.previewAlt || '',
    templateTitle: props.schema?.templateTitle || props.schema?.name || '',
    templateUrl: props.schema?.templateUrl || '',
    templateIcon: props.schema?.templateIcon || '',
    templateDescription: props.schema?.templateDescription || props.schema?.description || '',
    githubUrl:
      props.schema?.templatePath || props.schema?.githubUrl || props.schema?.repository || '',
    schema: props.schema,
    isDrawer: props.isDrawer,
    // Groups for each step
    repositoryGroups: repositoryGroups.value,
    settingsGroups: settingsGroups.value,
    // Flow control props
    // hasSettings is derived from fields with isSettingField: true
    // When true: shows "Next" button → go to settings step
    // When false: shows "Deploy" button → deploy directly
    hasSettings: hasSettingsFormProperties.value,
    loadingDeploy: props.loadingDeploy,
    disabledDeploy: props.disabledDeploy,
    // Validation prop
    onValidate: validateForm,
    // Deploy simulation props
    simulateDeploy: props.schema?.simulateDeploy ?? false,
    appUrl: props.appUrl || props.schema?.appUrl || '',
    successNextSteps: props.successNextSteps || props.schema?.successNextSteps || [],
    // Deploy Status Card props
    executionId: props.executionId,
    deployFailed: props.deployFailed,
    applicationName: props.applicationName,
    deployStartTime: props.deployStartTime,
    // Results for DeploySuccessCard
    results: props.results
  }))

  /**
   * Handles JSON Forms change events
   * Updates formData and errors refs
   * @param {Object} event - The change event from JsonForms
   */
  const onChangeAzionForm = (event) => {
    formData.value = event.data
    errors.value = event.errors
  }
  /**
   * Validates form fields based on current step
   * @param {string} step - Current step ('repository' or 'settings')
   * @returns {boolean} Whether the form is valid for the current step
   */
  const validateForm = (step = 'repository') => {
    // Get field names for the current step
    const stepProperties =
      step === 'repository'
        ? repositoryFormSchema.value?.properties || {}
        : settingsFormSchema.value?.properties || {}

    const stepFieldNames = Object.keys(stepProperties)

    // Filter errors to only include fields from the current step
    const stepErrors = errors.value.filter((error) => {
      const missingProperty = error.params?.missingProperty || error.instancePath?.replace('/', '')
      return (
        stepFieldNames.includes(missingProperty) ||
        stepFieldNames.some((name) => error.instancePath?.includes(name))
      )
    })

    // For repository step, also check VCS integration
    const hasVcsError = step === 'repository' && isVcsRequired.value && !selectedIntegration.value
    vcsIntegrationError.value = hasVcsError ? 'Git Scope is required' : ''

    const hasStepErrors = stepErrors.length > 0

    return !hasStepErrors && !hasVcsError
  }

  /**
   * Gets all form data as an array of field objects
   * @returns {Array} Array of field objects with name, value, and instantiation_data_path
   */
  const getFormData = () => {
    const data = []

    if (hasIntegrations.value) {
      const vcsField = props.schema?.properties?.[vcsIntegrationFieldName.value]
      data.push(
        parseData({
          name: vcsIntegrationFieldName.value,
          value: selectedIntegration.value,
          instantiationDataPath: vcsField?.instantiation_data_path || ''
        })
      )
    }

    const keys = Object.keys(formData.value)
    keys.forEach((key) => {
      const field = props.schema?.properties?.[key]

      data.push(
        parseData({
          name: key,
          value: formData.value[key],
          instantiationDataPath: field?.instantiation_data_path
        })
      )

      // For privacy fields, also include isPublic value
      if (field?.format === 'privacy') {
        const isPublicValue = privacyFieldsState.value[key] ?? true
        data.push(
          parseData({
            name: `github_is_private`,
            value: isPublicValue,
            instantiationDataPath: field?.is_public_data_path || ''
          })
        )
      }
    })

    return data
  }

  /**
   * Parses field data into standard format
   * @param {Object} field - The field to parse
   * @returns {Object} Parsed field object
   */
  const parseData = (field) => {
    return {
      name: field.name,
      value: field.value,
      instantiation_data_path: field.instantiationDataPath
    }
  }

  /**
   * Parses properties schema, removing VCS integration fields
   * @param {Object} properties - The schema properties
   * @returns {Object} Parsed properties without VCS fields
   */
  const parsePropertiesSchema = (properties) => {
    const data = {}
    const keys = Object.keys(properties)

    keys.forEach((key) => {
      if (key !== 'platform_feature__vcs_integration__uuid') {
        data[key] = properties[key]
      }
    })

    return data
  }

  /**
   * Updates the selected integration value
   * @param {string} installationId - The selected installation ID
   */
  const updateIntegrationValue = (installationId) => {
    selectedIntegration.value = installationId
  }

  /**
   * Triggers GitHub connection via OAuthGithub component
   */
  const triggerConnectWithGithub = () => {
    if (oauthGithubRef.value) {
      oauthGithubRef.value.connectWithGithub()
    }
  }

  /**
   * Sets callback URL via LayoutEngineBlock
   * @param {string} uri - The callback URI
   */
  const setCallbackUrl = (uri) => {
    layoutRef.value?.setCallbackUrl(uri)
  }
  /**
   * Handles the next button click
   */
  const handleNext = () => {
    emit('next')
  }

  const handleDeploy = () => {
    emit('deploy')
  }

  const handleFinish = () => {
    emit('finish')
  }

  const handleRetry = () => {
    emit('retry')
  }

  const handleManage = (data) => {
    emit('manage', data)
  }

  const handleOpenUrl = (url) => {
    emit('open-url', url)
  }

  const handleNextStep = (data) => {
    emit('next-step', data)
  }

  /**
   * Handles saving domain settings via patchWorkloadDomains
   * Called when user saves domain settings from DeploySuccessCard
   * @param {Object} values - The domain form values
   */
  const handleSaveDomains = async (values) => {
    try {
      const workloadId = props.results?.domain?.id
      if (!workloadId) {
        toast.add({
          closable: true,
          severity: 'error',
          summary: 'Error',
          detail: 'Workload ID not found'
        })
        return
      }

      await workloadService.patchWorkloadDomains(workloadId, values)

      toast.add({
        closable: true,
        severity: 'success',
        summary: 'Success',
        detail: 'Domain settings updated successfully'
      })
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to update domain settings'
      })
    }
  }

  onMounted(async () => {
    if (hasIntegrations.value) {
      await layoutRef.value?.loadIntegrationOnShowButton()
    }
  })

  watch(
    () => props.schema,
    async (newValue) => {
      const githubIntegration = newValue?.properties?.platform_feature__vcs_integration__uuid
      const hasGithubIntegration = githubIntegration && Object.keys(githubIntegration).length > 0

      if (hasGithubIntegration) {
        await layoutRef.value?.loadIntegrationOnShowButton()
      }
    },
    { deep: true }
  )

  watch(
    () => layoutRef.value?.listOfIntegrations,
    (newList) => {
      if (newList?.value && newList.value.length) {
        selectedIntegration.value = newList.value[0].value
      }
    },
    { deep: true }
  )

  defineExpose({
    validateForm,
    getFormData,
    formData,
    errors,
    layoutRef,
    // Expose goToDeploying from LayoutEngineBlock
    goToDeploying: () => layoutRef.value?.goToDeploying?.(),
    // Expose goToSuccess from LayoutEngineBlock
    goToSuccess: () => layoutRef.value?.goToSuccess?.(),
    // Expose currentStep from LayoutEngineBlock
    currentStep: computed(() => layoutRef.value?.currentStep)
  })
</script>

<template>
  <div class="flex justify-center">
    <LayoutEngineBlock
      ref="layoutRef"
      v-bind="layoutProps"
      @next="handleNext"
      @deploy="handleDeploy"
      @finish="handleFinish"
      @retry="handleRetry"
      @manage="handleManage"
      @save-domains="handleSaveDomains"
      @open-url="handleOpenUrl"
      @next-step="handleNextStep"
    >
      <!-- GitHub Connection Slot - Keep for OAuth callback but hidden -->
      <template #github-connection="slotProps">
        <OAuthGithub
          v-if="hasIntegrations && !slotProps.hasIntegrationsList"
          v-show="false"
          ref="oauthGithubRef"
          @onCallbackUrl="setCallbackUrl"
          :loading="slotProps.isIntegrationsLoading"
        />
      </template>

      <!-- Repository Step - Inputs Slot with horizontal layout including Git Scope -->
      <template #inputs="slotProps">
        <div class="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Git Scope Field - first grid item, inline with Application Name -->
          <div
            v-if="hasIntegrations"
            class="flex flex-col gap-2"
          >
            <LabelBlock
              v-if="isVcsRequired"
              label="Git Scope"
              :for="vcsIntegrationFieldName"
              :isRequired="isVcsRequired"
            />
            <Dropdown
              :id="vcsIntegrationFieldName"
              :name="vcsIntegrationFieldName"
              :loading="slotProps.isIntegrationsLoading"
              :disabled="isFormDisabled"
              v-model="selectedIntegration"
              :options="slotProps.listOfIntegrations"
              optionLabel="label"
              optionValue="value"
              placeholder="Select a scope"
              @change="updateIntegrationValue(selectedIntegration)"
              class="w-full"
              appendTo="self"
            >
              <template #footer>
                <div class="p-dropdown-items-wrapper">
                  <ul class="p-dropdown-items">
                    <li
                      class="p-dropdown-item flex items-center cursor-pointer"
                      @click="triggerConnectWithGithub"
                    >
                      <i class="pi pi-plus-circle mr-2" />
                      <div>Add GitHub Account</div>
                    </li>
                  </ul>
                </div>
              </template>
            </Dropdown>
            <small
              v-if="vcsIntegrationError"
              class="p-error text-xs font-normal leading-tight"
            >
              {{ vcsIntegrationError }}
            </small>
          </div>

          <!-- JSON Forms fields - display: contents allows children to participate in parent grid -->
          <JsonForms
            v-if="hasRepositoryFormProperties"
            style="display: contents"
            :data="formData"
            :schema="repositoryFormSchemaDisabled"
            :renderers="renderers"
            @change="onChangeAzionForm"
          />
        </div>
      </template>

      <!-- Settings Step - Settings Inputs Slot with 2-column grid layout -->
      <template #settings-inputs>
        <div class="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
          <JsonForms
            v-if="hasSettingsFormProperties"
            style="display: contents"
            :data="formData"
            :schema="settingsFormSchemaDisabled"
            :renderers="renderers"
            @change="onChangeAzionForm"
          />
        </div>
      </template>
    </LayoutEngineBlock>
  </div>
</template>
