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
    deployError: {
      type: String,
      default: ''
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
  // Track if validation has been attempted - used to show errors on untouched fields
  const validationAttempted = ref(false)

  // Provide a function for privacy renderers to register their isPublic state
  const updatePrivacyFieldState = (fieldName, isPublic) => {
    privacyFieldsState.value[fieldName] = isPublic
  }

  provide('updatePrivacyFieldState', updatePrivacyFieldState)
  // Provide validationAttempted state for all renderers to show errors when validation is attempted
  provide('validationAttempted', validationAttempted)

  /**
   * Check if a field is required and empty for the current step
   * Used by renderers to show "required" error message
   * @param {string} fieldName - The field name to check
   * @returns {boolean} True if field is required and empty
   */
  const isFieldRequiredAndEmpty = (fieldName) => {
    const stepProperties = settingsFormSchema.value?.properties || {}
    const isSettingsField = Object.keys(stepProperties).includes(fieldName)

    if (!isSettingsField) {
      // Check repository fields
      const repoProperties = repositoryFormSchema.value?.properties || {}
      if (!Object.keys(repoProperties).includes(fieldName)) return false
    }

    const schema = isSettingsField ? settingsFormSchema.value : repositoryFormSchema.value
    const requiredFields = schema?.required || []

    if (!requiredFields.includes(fieldName)) return false

    const value = formData.value[fieldName]
    return value === undefined || value === null || value === ''
  }

  provide('isFieldRequiredAndEmpty', isFieldRequiredAndEmpty)

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

  /**
   * JSON Forms configuration
   * ValidateAndShow mode ensures validation errors are computed and available
   * even for fields that haven't been touched yet
   */
  const jsonFormConfig = {
    validationMode: 'ValidateAndShow'
  }

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
    const requiredFields = []

    Object.keys(allProperties).forEach((fieldName) => {
      const field = allProperties[fieldName]
      const isSetting = field?.isSettingField === true || field?.isSettingField === 'true'
      if (!isSetting) {
        filteredProperties[fieldName] = field
        // Check if field has required attribute (from attrs.required or required property)
        if (field?.required === true || field?.attrs?.required === true) {
          requiredFields.push(fieldName)
        }
      }
    })

    schema.properties = parsePropertiesSchema(filteredProperties)

    // Build required array: combine existing required array with fields marked as required
    const filteredPropertyNames = Object.keys(schema.properties)
    let finalRequired = []

    // Start with existing required array if present
    if (schema.required && Array.isArray(schema.required)) {
      finalRequired = schema.required.filter((fieldName) =>
        filteredPropertyNames.includes(fieldName)
      )
    }

    // Add fields marked with required property
    requiredFields.forEach((fieldName) => {
      if (!finalRequired.includes(fieldName)) {
        finalRequired.push(fieldName)
      }
    })

    // Set required array if we have any required fields
    if (finalRequired.length > 0) {
      schema.required = finalRequired
    }

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
    const requiredFields = []

    Object.keys(allProperties).forEach((fieldName) => {
      const field = allProperties[fieldName]
      const isSetting = field?.isSettingField === true || field?.isSettingField === 'true'
      if (isSetting) {
        filteredProperties[fieldName] = field
        // Check if field has required attribute (from attrs.required or required property)
        if (field?.required === true || field?.attrs?.required === true) {
          requiredFields.push(fieldName)
        }
      }
    })

    schema.properties = parsePropertiesSchema(filteredProperties)

    // Build required array: combine existing required array with fields marked as required
    const filteredPropertyNames = Object.keys(schema.properties)
    let finalRequired = []

    // Start with existing required array if present
    if (schema.required && Array.isArray(schema.required)) {
      finalRequired = schema.required.filter((fieldName) =>
        filteredPropertyNames.includes(fieldName)
      )
    }

    // Add fields marked with required property
    requiredFields.forEach((fieldName) => {
      if (!finalRequired.includes(fieldName)) {
        finalRequired.push(fieldName)
      }
    })

    // Set required array if we have any required fields
    if (finalRequired.length > 0) {
      schema.required = finalRequired
    }

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
   * Track current step from LayoutEngineBlock
   * Used to prevent rendering settings JsonForms until user reaches that step
   */
  const currentFormStep = ref('repository')

  /**
   * Computed property to check if settings form should be rendered
   * Only render settings JsonForms when user is on settings step or beyond
   * This prevents validation errors from settings fields appearing in repository step
   */
  const shouldRenderSettingsForm = computed(() => {
    return (
      currentFormStep.value === 'settings' ||
      currentFormStep.value === 'deployment' ||
      currentFormStep.value === 'success'
    )
  })

  /**
   * Computed property to check if form should be disabled
   * True when loading or explicitly disabled or waiting for template info
   */
  const isRepositoryDisabled = computed(() => {
    const isWaiting = layoutRef.value?.isWaitingTemplateInfo
    return props.loadingDeploy || props.disabledDeploy || isWaiting
  })

  /**
   * Computed property to check if settings inputs should be disabled
   * True when loading or explicitly disabled (NOT when waiting for template info)
   */
  const isSettingsDisabled = computed(() => {
    return props.loadingDeploy || props.disabledDeploy
  })

  /**
   * Repository form schema with readOnly applied when disabled
   */
  const repositoryFormSchemaDisabled = computed(() => {
    if (!isRepositoryDisabled.value) return repositoryFormSchema.value

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
    if (!isSettingsDisabled.value) return settingsFormSchema.value

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
    // Check if VCS field is in required array
    if (requiredFields.includes(vcsIntegrationFieldName.value)) {
      return true
    }
    // Also check if VCS field has required property
    const vcsField = props.schema?.properties?.[vcsIntegrationFieldName.value]
    return vcsField?.required === true || vcsField?.attrs?.required === true
  })

  const vcsFieldDescription = computed(() => {
    if (!hasIntegrations.value) return ''
    const vcsField = props.schema?.properties?.[vcsIntegrationFieldName.value]
    return vcsField?.description || ''
  })

  /**
   * Check if there are validation errors for any of the given fields
   */
  const hasErrorsForFields = (fieldNames) => {
    return errors.value.some((error) => {
      const missingProperty = error.params?.missingProperty
      const pathField = error.instancePath?.replace(/^\//, '')
      return (
        fieldNames.includes(missingProperty) ||
        fieldNames.includes(pathField) ||
        fieldNames.some((name) => error.instancePath?.includes(name))
      )
    })
  }

  /**
   * Whether the repository step is valid (required filled, no errors, VCS selected when required)
   * Used to enable/disable the Next/Deploy button on the repository step
   */
  const isRepositoryStepValid = computed(() => {
    const stepFieldNames = Object.keys(repositoryFormSchema.value?.properties || {})
    const requiredFields = repositoryFormSchema.value?.required || []

    const hasMissingRequired = requiredFields.some((fieldName) => {
      const value = formData.value[fieldName]
      return value === undefined || value === null || value === ''
    })
    if (hasMissingRequired) return false

    if (hasErrorsForFields(stepFieldNames)) return false

    if (hasIntegrations.value && isVcsRequired.value) {
      const hasList = layoutRef.value?.hasIntegrationsList
      if (!hasList || !selectedIntegration.value) return false
    }

    return true
  })

  /**
   * Whether the settings step is valid (required filled, no errors)
   * Used to enable/disable the Deploy button on the settings card
   */
  const isSettingsStepValid = computed(() => {
    const stepFieldNames = Object.keys(settingsFormSchema.value?.properties || {})
    const requiredFields = settingsFormSchema.value?.required || []

    const hasMissingRequired = requiredFields.some((fieldName) => {
      const value = formData.value[fieldName]
      return value === undefined || value === null || value === ''
    })
    if (hasMissingRequired) return false

    return !hasErrorsForFields(stepFieldNames)
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
    title: 'Start from Template',
    previewSrc: props.schema?.imagePreview || props.schema?.previewSrc || '',
    previewAlt: props.schema?.previewAlt || '',
    templateTitle: props.schema?.title,
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
    disabled: props.disabledDeploy || !isRepositoryStepValid.value,
    disabledDeploy:
      props.disabledDeploy ||
      (hasSettingsFormProperties.value ? !isSettingsStepValid.value : !isRepositoryStepValid.value),
    // Validation prop
    onValidate: validateForm,
    // Deploy simulation props
    simulateDeploy: props.schema?.simulateDeploy ?? false,
    appUrl: props.appUrl || props.schema?.appUrl || '',
    successNextSteps: props.successNextSteps || props.schema?.successNextSteps || [],
    // Deploy Status Card props
    executionId: props.executionId,
    deployFailed: props.deployFailed,
    deployError: props.deployError,
    applicationName: props.applicationName,
    deployStartTime: props.deployStartTime,
    // Results for DeploySuccessCard
    results: props.results,
    // Only show card when schema is loaded
    loaded: !!props.schema && Object.keys(props.schema?.properties || {}).length > 0
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
    // Mark validation as attempted so renderers show errors on untouched fields
    validationAttempted.value = true

    // Get field names for the current step
    const stepProperties =
      step === 'repository'
        ? repositoryFormSchema.value?.properties || {}
        : settingsFormSchema.value?.properties || {}

    const stepFieldNames = Object.keys(stepProperties)

    // Check if there are required fields missing for the current step
    const requiredFields =
      step === 'repository'
        ? repositoryFormSchema.value?.required || []
        : settingsFormSchema.value?.required || []

    // Build a list of missing required fields for this step
    const missingRequiredFields = requiredFields.filter((fieldName) => {
      const value = formData.value[fieldName]
      return value === undefined || value === null || value === ''
    })

    // Filter errors to only include fields from the current step
    const stepErrors = errors.value.filter((error) => {
      // For required errors, the field name is in params.missingProperty
      const missingProperty = error.params?.missingProperty
      // For other validation errors, extract field name from instancePath (e.g., "/az_name" -> "az_name")
      const pathField = error.instancePath?.replace(/^\//, '')

      const matches =
        stepFieldNames.includes(missingProperty) ||
        stepFieldNames.includes(pathField) ||
        stepFieldNames.some((name) => error.instancePath?.includes(name))

      return matches
    })

    // For repository step, also check VCS integration
    if (step === 'repository' && hasIntegrations.value && isVcsRequired.value) {
      const hasIntegrationsList = layoutRef.value?.hasIntegrationsList
      if (!hasIntegrationsList) {
        // No GitHub account connected
        vcsIntegrationError.value = 'Connect with GitHub is required'
      } else if (!selectedIntegration.value) {
        // Has connected accounts but none selected
        vcsIntegrationError.value = 'Git Scope is required'
      } else {
        vcsIntegrationError.value = ''
      }
    }

    const hasStepErrors = stepErrors.length > 0
    const hasMissingRequired = missingRequiredFields.length > 0
    const hasVcsError = vcsIntegrationError.value !== ''

    return !hasStepErrors && !hasMissingRequired && !hasVcsError
  }

  /**
   * Gets all form data as an array of field objects
   * @returns {Array} Array of field objects with field, value, and instantiation_data_path
   */
  const getFormData = () => {
    const data = []
    let vcsRepoIsPublic = null

    if (hasIntegrations.value) {
      const vcsField = props.schema?.properties?.[vcsIntegrationFieldName.value]
      data.push(
        parseData({
          field: vcsIntegrationFieldName.value,
          value: selectedIntegration.value,
          instantiationDataPath: vcsField?.instantiation_data_path || ''
        })
      )
    }

    const keys = Object.keys(formData.value)
    keys.forEach((key) => {
      const fieldDef = props.schema?.properties?.[key]

      data.push(
        parseData({
          field: key,
          value: formData.value[key],
          instantiationDataPath: fieldDef?.instantiation_data_path
        })
      )

      // For privacy fields, capture vcs_repo_is_public to add first
      if (fieldDef?.format === 'privacy') {
        const isPublicValue = privacyFieldsState.value[key] ?? true
        vcsRepoIsPublic = parseData({
          field: 'vcs_repo_is_public',
          value: isPublicValue,
          instantiationDataPath: fieldDef?.is_public_data_path || 'envs.[0].value'
        })
      }
    })

    // Add vcs_repo_is_public at the beginning if it exists
    if (vcsRepoIsPublic) {
      data.unshift(vcsRepoIsPublic)
    }

    return data
  }

  /**
   * Parses field data into standard format
   * @param {Object} fieldData - The field data to parse
   * @returns {Object} Parsed field object
   */
  const parseData = (fieldData) => {
    return {
      field: fieldData.field,
      value: fieldData.value,
      instantiation_data_path: fieldData.instantiationDataPath
    }
  }

  /**
   * Parses properties schema, removing VCS integration fields and converting
   * custom validation rules to proper JSON Schema format
   * @param {Object} properties - The schema properties
   * @returns {Object} Parsed properties with JSON Schema validation
   */
  const parsePropertiesSchema = (properties) => {
    const data = {}
    const keys = Object.keys(properties)

    keys.forEach((key) => {
      if (key !== 'platform_feature__vcs_integration__uuid') {
        const field = { ...properties[key] }

        // Convert validators array to JSON Schema pattern
        // The first validator's regex becomes the pattern
        if (field.validators && field.validators.length > 0) {
          const validator = field.validators[0]
          if (validator.regex) {
            // Convert regex to JSON Schema pattern format
            // Strip outer parentheses if present: (^...$) -> ^...$
            let pattern = validator.regex
            if (pattern.startsWith('(') && pattern.endsWith(')$')) {
              pattern = pattern.slice(1, -1)
            }
            field.pattern = pattern
          }
          // Keep the error message for custom renderer to display
          // The renderer checks for 'error' property, so we use that
          if (validator.errorMessage) {
            field.error = validator.errorMessage
          }
        }

        // Ensure minLength is set if validators specify it (extract from regex or explicit)
        // maxLength is already valid JSON Schema

        data[key] = field
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
        // Clear VCS error when an integration is selected
        vcsIntegrationError.value = ''
      }
    },
    { deep: true }
  )

  // Watch currentStep from LayoutEngineBlock to track which form is active
  // Fallback to 'repository' if not available
  // Reset validationAttempted when changing steps to prevent showing errors on new step
  watch(
    () => layoutRef.value?.currentStep,
    (newStep, oldStep) => {
      currentFormStep.value = newStep || 'repository'
      // Reset validation state when navigating to a different step
      if (newStep !== oldStep) {
        validationAttempted.value = false
      }
    },
    { immediate: true }
  )

  // Watch for selectedIntegration changes to clear error when user selects an integration
  watch(selectedIntegration, (newValue) => {
    if (newValue) {
      vcsIntegrationError.value = ''
    }
  })

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
    currentStep: computed(() => layoutRef.value?.currentStep),
    // Expose handleDeployError from LayoutEngineBlock
    handleDeployError: (error) => layoutRef.value?.handleDeployError?.(error)
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
      <!-- GitHub Connection Slot - Always render OAuthGithub for ref access, hidden via v-show -->
      <template #github-connection="slotProps">
        <OAuthGithub
          v-if="hasIntegrations"
          v-show="false"
          ref="oauthGithubRef"
          @onCallbackUrl="setCallbackUrl"
          :loading="slotProps.isIntegrationsLoading"
        />
      </template>

      <!-- Repository Step - Inputs Slot with horizontal layout including Git Scope -->
      <template #inputs="slotProps">
        <div class="w-full flex gap-2 flex-wrap sm:flex-nowrap">
          <!-- Git Scope Field - first grid item, inline with Application Name -->
          <div
            v-if="hasIntegrations"
            class="flex flex-col gap-2 w-full sm:w-1/2"
          >
            <LabelBlock
              label="Git Scope"
              :for="vcsIntegrationFieldName"
              :isRequired="isVcsRequired"
            />
            <Dropdown
              :id="vcsIntegrationFieldName"
              :name="vcsIntegrationFieldName"
              :loading="slotProps.isIntegrationsLoading"
              :disabled="isRepositoryDisabled"
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
              v-if="vcsFieldDescription"
              class="text-xs text-color-secondary font-normal leading-5"
            >
              {{ vcsFieldDescription }}
            </small>
            <small
              v-if="vcsIntegrationError"
              class="p-error text-xs font-normal leading-tight"
            >
              {{ vcsIntegrationError }}
            </small>
          </div>

          <!-- JSON Forms fields - display: contents allows children to participate in parent grid -->
          <div class="w-full sm:w-1/2">
            <JsonForms
              v-if="hasRepositoryFormProperties"
              style="display: contents"
              :data="formData"
              :schema="repositoryFormSchemaDisabled"
              :renderers="renderers"
              :config="jsonFormConfig"
              @change="onChangeAzionForm"
            />
          </div>
        </div>
      </template>

      <!-- Settings Step - Settings Inputs Slot with 2-column layout -->
      <template #settings-inputs>
        <div class="settings-jsonform-grid flex flex-wrap w-full gap-2">
          <JsonForms
            v-if="hasSettingsFormProperties && shouldRenderSettingsForm"
            style="display: contents"
            :data="formData"
            :schema="settingsFormSchemaDisabled"
            :renderers="renderers"
            :config="jsonFormConfig"
            @change="onChangeAzionForm"
          />
        </div>
      </template>
    </LayoutEngineBlock>
  </div>
</template>

<style scoped>
  /*
   * JsonForms vue-vanilla wraps fields in a VerticalLayout (.vertical-layout / .vertical-layout-item)
   * which stacks them as blocks. To get a 2-per-row 50%-each layout in the settings step we
   * promote the layout root to `display: contents` so each item becomes a direct flex child of
   * the outer container, then size each item at half the row minus half the gap (gap-2 = 0.5rem).
   */
  .settings-jsonform-grid :deep(.vertical-layout) {
    display: contents;
  }
  .settings-jsonform-grid :deep(.vertical-layout-item) {
    width: 100%;
    min-width: 0;
  }
  @media (min-width: 640px) {
    .settings-jsonform-grid :deep(.vertical-layout-item) {
      width: calc(50% - 0.25rem);
    }
  }
</style>
