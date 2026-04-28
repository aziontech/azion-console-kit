<script setup>
  import { ref, computed, watch, defineOptions, onMounted } from 'vue'
  import { useForm } from 'vee-validate'
  import { useToast } from 'primevue/usetoast'
  import * as yup from 'yup'
  import InputText from 'primevue/inputtext'
  import Password from 'primevue/password'
  import FieldDropdown from '@aziontech/webkit/field-dropdown'
  import FieldInputTextPrivacy from '@/templates/form-fields-inputs/filedInputTextPrivacy.vue'
  import LabelBlock from '@aziontech/webkit/label'
  import OAuthGithub from './oauth-github.vue'
  import LayoutEngineBlock from './layout-engine-block.vue'
  import { workloadService } from '@/services/v2/workload/workload-service'

  defineOptions({ name: 'engineAzion' })

  const props = defineProps({
    schema: {
      type: Object,
      required: true
    },
    isDrawer: {
      type: Boolean,
      default: false
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

  const inputSchema = ref(props.schema)
  const formTools = ref({})
  const isFormReady = ref(false)
  const setIntegration = ref('')
  const isInitialized = ref(false)
  const isEdgeAppNamePublic = ref(false)

  /**
   * Computed property to determine if inputs should be disabled
   * True when loadingDeploy is true OR when currentStep is 'deployment' or 'success'
   */
  const isDeploying = computed(() => {
    const step = layoutRef.value?.currentStep
    return props.loadingDeploy || step === 'deployment' || step === 'success'
  })

  const REPOSITORY_FIELD_NAMES = ['platform_feature__vcs_integration__uuid', 'az_name']

  /**
   * Filters fields from a group based on field names
   * @param {Object} group - Group object containing fields
   * @param {Array<string>} fieldNames - Array of field names to filter
   * @returns {Object|null} Group with filtered fields or null if no fields remain
   */
  const filterGroupFields = (group, fieldNames) => {
    const filteredFields = (group.fields || []).filter((field) => fieldNames.includes(field.name))
    if (filteredFields.length === 0) return null
    return { ...group, fields: filteredFields }
  }

  /**
   * Computed property for repository groups
   * Returns groups containing only fields with name "platform_feature__vcs_integration__uuid" or "az_name"
   */
  const repositoryGroups = computed(() => {
    const groups = inputSchema.value.groups || []
    return groups.map((group) => filterGroupFields(group, REPOSITORY_FIELD_NAMES)).filter(Boolean)
  })

  /**
   * Computed property for settings groups
   * Returns groups containing only fields that are NOT "platform_feature__vcs_integration__uuid" or "az_name"
   */
  const settingsGroups = computed(() => {
    const groups = inputSchema.value.groups || []
    return groups
      .map((group) =>
        filterGroupFields(
          group,
          (group.fields || [])
            .map((field) => field.name)
            .filter((name) => !REPOSITORY_FIELD_NAMES.includes(name))
        )
      )
      .filter((group) => group && group.fields.length > 0)
  })

  /**
   * Builds grouped rows for rendering fields in a grid layout
   * Handles both single-field groups (paired side-by-side) and multi-field groups
   * @param {Array} groups - Array of groups to build rows from
   * @returns {Array} Array of row objects with type and groups
   */
  const buildGroupedRows = (groups) => {
    const rows = []
    const singleFieldGroups = []

    for (const group of groups) {
      const visibleFields = (group.fields || []).filter(
        (field) => !field.hidden && field.info !== 'Private Repository'
      )
      if (visibleFields.length === 1) {
        singleFieldGroups.push(group)
        if (singleFieldGroups.length === 2) {
          rows.push({ type: 'pair', groups: [...singleFieldGroups] })
          singleFieldGroups.length = 0
        }
      } else {
        // Flush any pending single-field group before inserting a multi-field
        if (singleFieldGroups.length) {
          rows.push({ type: 'single', groups: [singleFieldGroups.shift()] })
        }
        rows.push({ type: 'single', groups: [group] })
      }
    }

    // Flush remaining odd group
    if (singleFieldGroups.length) {
      rows.push({ type: 'single', groups: [singleFieldGroups.shift()] })
    }

    return rows
  }

  /**
   * Grouped rows for repository step (group[0])
   */
  const repositoryGroupedRows = computed(() => {
    return buildGroupedRows(repositoryGroups.value)
  })

  /**
   * Grouped rows for settings step (group[1+])
   */
  const settingsGroupedRows = computed(() => {
    return buildGroupedRows(settingsGroups.value)
  })

  /**
   * Computed property to determine if settings card should be shown
   * Returns true only if there are fields to display in settings
   */
  const hasSettingsFields = computed(() => {
    return settingsGroups.value.length > 0 && settingsGroupedRows.value.length > 0
  })

  /**
   * Computes props to pass to LayoutEngineBlock
   */
  const layoutProps = computed(() => ({
    title: inputSchema.value.title || 'Start from Template',
    previewSrc: inputSchema.value.imagePreview || inputSchema.value.previewSrc || '',
    previewAlt: inputSchema.value.previewAlt || '',
    templateTitle: inputSchema.value.templateTitle || inputSchema.value.name || '',
    templateUrl: inputSchema.value.templateUrl || '',
    templateIcon: inputSchema.value.templateIcon || '',
    templateDescription:
      inputSchema.value.templateDescription || inputSchema.value.description || '',
    githubUrl:
      inputSchema.value.templatePath ||
      inputSchema.value.githubUrl ||
      inputSchema.value.repository ||
      '',
    schema: props.schema,
    isDrawer: props.isDrawer,
    // Groups for each step
    repositoryGroups: repositoryGroups.value,
    settingsGroups: settingsGroups.value,
    // Flow control props - show settings only if there are fields to display
    hasSettings: hasSettingsFields.value,
    loadingDeploy: props.loadingDeploy,
    disabledDeploy: props.disabledDeploy,
    // Validation prop
    onValidate: validateForm,
    // Deploy simulation props
    simulateDeploy: inputSchema.value.simulateDeploy ?? false,
    appUrl: props.appUrl || inputSchema.value.appUrl || '',
    successNextSteps: props.successNextSteps || inputSchema.value.successNextSteps || [],
    // Deploy Status Card props
    executionId: props.executionId,
    deployFailed: props.deployFailed,
    applicationName: props.applicationName,
    deployStartTime: props.deployStartTime,
    // Results for DeploySuccessCard
    results: props.results
  }))

  /**
   * Extracts field names from groups
   * @param {Array} groups - Schema groups
   * @returns {Array} Array of field names
   */
  const extractFieldNames = (groups) => {
    return groups.flatMap((group) => group.fields.map((field) => field.name))
  }

  /**
   * Escapes template literals in error messages
   * @param {string} errorMessage - Error message to escape
   * @returns {string} Escaped message
   */
  const escapeErrorMessage = (errorMessage) => {
    return errorMessage.replaceAll('${', '#$')
  }

  /**
   * Unescapes template literals in error messages
   * @param {string} errorMessage - Error message to unescape
   * @returns {string} Unescaped message
   */
  const unescapeErrorMessage = (errorMessage) => {
    if (!errorMessage) return ''
    return errorMessage.replaceAll('#$', '${')
  }

  /**
   * Creates a yup schema string for a field
   * @param {Object} element - Field definition
   * @returns {yup.StringSchema} Yup schema for the field
   */
  const createSchemaString = (element) => {
    let schema = yup.string()

    if (element.hidden) return schema

    if (element.attrs?.required) {
      schema = schema.required(`${element.label} is required`)
    }

    if (element.attrs?.maxLength) {
      schema = schema.max(
        element.attrs.maxLength,
        `This field cannot exceed ${element.attrs.maxLength} characters`
      )
    }

    if (element.attrs?.minLength) {
      schema = schema.min(
        element.attrs.minLength,
        `This field must have at least ${element.attrs.minLength} characters`
      )
    }

    if (element.validators) {
      element.validators.forEach((validator) => {
        schema = schema.test(
          `valid-${element.name}`,
          escapeErrorMessage(validator.errorMessage),
          function (value) {
            const domainRegex = new RegExp(validator.regex)
            const shouldEscapeEmptyAndNotRequiredFields =
              value === undefined && !element.attrs?.required
            if (shouldEscapeEmptyAndNotRequiredFields) return true
            return domainRegex.test(value)
          }
        )
      })
    }

    if (element.value?.length > 0) {
      schema = schema.default(element.value)
    }

    return schema
  }

  /**
   * Creates the yup validation schema for the form
   * @returns {Promise<yup.ObjectSchema>} Yup object schema
   */
  const createSchemaObject = async () => {
    const templateSchema = {}

    inputSchema.value.fields?.forEach((field) => {
      templateSchema[field.name] = createSchemaString(field)
    })

    inputSchema.value.groups?.forEach((group) => {
      group.fields.forEach((field) => {
        templateSchema[field.name] = createSchemaString(field)
      })
    })

    return yup.object(templateSchema)
  }

  /**
   * Initializes the vee-validate form with the schema
   */
  const initializeForm = async () => {
    const schema = await createSchemaObject()
    const { errors, defineInputBinds, setFieldValue, validate, validateField } = useForm({
      validationSchema: schema
    })

    formTools.value = { errors, setFieldValue, validate, validateField }

    // Initialize fields with defineInputBinds (with validateOnInput: true for real-time validation)
    const registerFieldWithValueAndValidation = (field) => {
      if (field.value) {
        setFieldValue(field.name, field.value)
      }
      field.input = defineInputBinds(field.name, { validateOnInput: true })
    }

    // Helper function to find a field by name across schema
    const findFieldByName = (fieldName) => {
      let foundField = inputSchema.value.fields?.find((field) => field.name === fieldName)
      if (!foundField) {
        for (const group of inputSchema.value.groups || []) {
          foundField = group.fields?.find((field) => field.name === fieldName)
          if (foundField) break
        }
      }
      return foundField
    }

    // Initialize isEdgeAppNamePublic from az_repo field value
    const azRepoField = findFieldByName('az_repo')
    if (azRepoField?.value !== undefined) {
      isEdgeAppNamePublic.value = Boolean(azRepoField.value)
    }

    inputSchema.value.fields?.forEach((field) => {
      if (!field.hidden) {
        registerFieldWithValueAndValidation(field)
      }
    })

    inputSchema.value.groups?.forEach((group) => {
      group.fields.forEach((field) => {
        if (!field.hidden) {
          registerFieldWithValueAndValidation(field)
        }
      })
    })

    isFormReady.value = true
    isInitialized.value = true
  }

  /**
   * Validates fields for a specific step
   * @param {string} step - The current step ('repository' or 'settings')
   * @returns {Promise<boolean>} Whether the form is valid for the step
   */
  const validateForm = async (step = 'repository') => {
    if (!formTools.value.validateField) return false

    // Determine which field names to validate based on the current step
    let fieldNamesToValidate = []

    const allFields = (inputSchema.value.groups || []).flatMap((group) => group.fields || [])

    if (step === 'repository') {
      // Repository step: validate fields with specific names
      fieldNamesToValidate = allFields
        .filter((field) => REPOSITORY_FIELD_NAMES.includes(field.name) && !field.hidden)
        .map((field) => field.name)
      // Also include top-level fields (not in groups)
      const topLevelFields = (inputSchema.value.fields || [])
        .filter((field) => !field.hidden)
        .map((field) => field.name)
      fieldNamesToValidate = [...fieldNamesToValidate, ...topLevelFields]
    } else if (step === 'settings') {
      // Settings step: validate fields that are NOT repository fields
      fieldNamesToValidate = allFields
        .filter((field) => !REPOSITORY_FIELD_NAMES.includes(field.name) && !field.hidden)
        .map((field) => field.name)
    }

    // Validate only the relevant fields using validateField
    let isValid = true
    for (const fieldName of fieldNamesToValidate) {
      const result = await formTools.value.validateField(fieldName)
      if (!result.valid) {
        isValid = false
      }
    }

    return isValid
  }

  /**
   * Gets all form data as an array of field objects
   * @returns {Array} Array of field objects with name, value, and instantiation_data_path
   */
  const getFormData = () => {
    const data = []

    inputSchema.value.fields?.forEach((field) => {
      data.push({
        name: field.name,
        value: field.input?.value ?? field.value ?? '',
        instantiation_data_path: field.instantiation_data_path
      })
    })

    inputSchema.value.groups?.forEach((group) => {
      group.fields.forEach((field) => {
        data.push({
          name: field.name,
          value: field.input?.value ?? field.value ?? '',
          instantiation_data_path: field.instantiation_data_path
        })
      })
    })

    return data
  }

  /**
   * Checks if a field should be handled (not hidden and not VCS integration)
   * @param {string} fieldName - Name of the field
   * @returns {boolean} Whether the field should be rendered
   */
  const isHandleField = (fieldName) => {
    return fieldName !== 'platform_feature__vcs_integration__uuid'
  }

  /**
   * Removes hidden fields from an array
   * @param {Array} fields - Array of field definitions
   * @returns {Array} Filtered array without hidden fields
   */
  const removeHiddenFields = (fields) => {
    return (fields || []).filter((field) => !field.hidden && field.info !== 'Private Repository')
  }

  /**
   * Renders the invalid class based on error state
   * @param {string} error - Error message
   * @returns {string} CSS class
   */
  const renderInvalidClass = (error) => {
    return error ? 'p-invalid' : ''
  }

  /**
   * Handles the privacy toggle change - updates both isEdgeAppNamePublic and az_repo field
   * @param {boolean} isPublic - Whether the field is public
   */
  const handlePrivacyToggle = (isPublic) => {
    isEdgeAppNamePublic.value = isPublic
    if (formTools.value.setFieldValue) {
      formTools.value.setFieldValue('az_repo', isPublic)
    }
  }

  /**
   * Updates a field value
   * @param {string} fieldName - Name of the field
   * @param {*} value - New value
   */
  const updateValueOnChange = (fieldName, value) => {
    if (formTools.value.setFieldValue) {
      formTools.value.setFieldValue(fieldName, value)
    }
  }

  /**
   * Triggers GitHub connection via LayoutEngineBlock
   */
  const triggerConnectWithGithub = () => {
    layoutRef.value?.triggerConnectWithGithub()
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
        layoutRef.value?.handleSaveDomainsComplete?.()
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
    } finally {
      layoutRef.value?.handleSaveDomainsComplete?.()
    }
  }

  /**
   * Initializes the component when schema is available
   */
  const initializeComponent = async () => {
    if (!props.schema || isInitialized.value) return

    inputSchema.value = props.schema
    const groupsToCheck = props.schema.groups || []
    const fieldNames = extractFieldNames(groupsToCheck)

    // Check if VCS integration is needed and load integrations
    if (fieldNames.includes('platform_feature__vcs_integration__uuid')) {
      await layoutRef.value?.loadIntegrationOnShowButton()
    }

    await initializeForm()
  }

  // Watch for schema changes (not immediate - onMounted handles initial load)
  watch(
    () => props.schema,
    async (newValue) => {
      if (!newValue) return
      if (isInitialized.value) return

      inputSchema.value = newValue
      const groupsToCheck = newValue.groups || []
      const fieldNames = extractFieldNames(groupsToCheck)

      // Check if VCS integration is needed and load integrations
      if (fieldNames.includes('platform_feature__vcs_integration__uuid')) {
        await layoutRef.value?.loadIntegrationOnShowButton()
      }

      await initializeForm()
    }
  )

  onMounted(() => {
    initializeComponent()
  })

  watch(
    () => layoutRef.value?.listOfIntegrations,
    (newList) => {
      if (newList?.value && newList.value.length) {
        setIntegration.value = newList.value[0].value
      }
    },
    { deep: true }
  )

  defineExpose({
    validateForm,
    getFormData,
    formTools,
    inputSchema,
    layoutRef,
    // Expose goToDeployment from LayoutEngineBlock
    goToDeployment: () => layoutRef.value?.goToDeployment?.(),
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
      <!-- GitHub Connection Slot -->
      <template #github-connection="slotProps">
        <template v-if="isFormReady">
          <!-- Top-level VCS Integration Field -->
          <template v-if="inputSchema.fields">
            <template
              v-for="field in removeHiddenFields(inputSchema.fields)"
              :key="field.name"
            >
              <div
                v-if="field.name === 'platform_feature__vcs_integration__uuid'"
                class="flex flex-col gap-2"
              >
                <OAuthGithub
                  v-show="!slotProps.hasIntegrationsList"
                  ref="oauthGithubRef"
                  @onCallbackUrl="setCallbackUrl"
                  :loading="slotProps.isIntegrationsLoading"
                />
                <div
                  v-if="slotProps.hasIntegrationsList"
                  class="flex flex-col gap-2"
                >
                  <FieldDropdown
                    :options="slotProps.listOfIntegrations"
                    :name="field.name"
                    :required="field.attrs?.required"
                    :label="field.label"
                    :value="setIntegration"
                    placeholder="Select a scope"
                    class="h-8"
                    :description="field.description"
                    :inputClass="renderInvalidClass(formTools.errors[field.name])"
                    :disabled="isDeploying"
                    optionLabel="label"
                    optionValue="value"
                    @onChange="(installationId) => updateValueOnChange(field.name, installationId)"
                  >
                    <template #footer>
                      <div class="p-dropdown-items-wrapper">
                        <ul class="p-dropdown-items">
                          <li
                            class="p-dropdown-item flex items-center"
                            @click="triggerConnectWithGithub"
                          >
                            <i class="pi pi-plus-circle mr-2" />
                            <div>Add GitHub Account</div>
                          </li>
                        </ul>
                      </div>
                    </template>
                  </FieldDropdown>
                </div>
              </div>
            </template>
          </template>
        </template>
      </template>

      <!-- Inputs Slot - Azion-specific field rendering -->
      <template #inputs="slotProps">
        <template v-if="isFormReady">
          <!-- Top-level Fields -->
          <div
            v-if="inputSchema.fields"
            class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 w-full"
          >
            <template
              v-for="field in removeHiddenFields(inputSchema.fields)"
              :key="field.name"
            >
              <!-- Skip VCS integration field - handled in github-connection slot -->
              <FieldInputTextPrivacy
                v-if="isHandleField(field.name) && field.info === 'Edge Application Name'"
                :name="field.name"
                :label="field.label"
                :value="field.value"
                :isPublic="isEdgeAppNamePublic"
                @update:isPublic="handlePrivacyToggle"
                @input="(val) => updateValueOnChange(field.name, val)"
                :description="field.description"
                :data-testid="`field-${field.name}`"
                :required="field.attrs?.required"
                :disabled="isDeploying"
                :aditionalError="
                  formTools.errors[field.name]
                    ? unescapeErrorMessage(formTools.errors[field.name])
                    : ''
                "
              />
              <div
                v-else-if="isHandleField(field.name)"
                class="flex flex-col gap-2"
              >
                <LabelBlock
                  :for="field.name"
                  :label="field.label"
                  :isRequired="field.attrs?.required"
                />
                <Password
                  v-if="field.type === 'password'"
                  autocomplete="off"
                  toggleMask
                  v-bind="field.input"
                  v-model="field.input.value"
                  :id="field.name"
                  class="w-full"
                  :class="renderInvalidClass(formTools.errors[field.name])"
                  :feedback="false"
                  :disabled="isDeploying"
                  :pt="{ input: { name: field.name } }"
                />
                <InputText
                  v-else
                  autocomplete="off"
                  :id="field.name"
                  type="text"
                  v-bind="field.input"
                  :name="field.name"
                  :disabled="isDeploying"
                  :class="renderInvalidClass(formTools.errors[field.name])"
                />
                <small class="text-xs font-normal text-color-secondary">{{
                  field.description
                }}</small>
                <small
                  v-if="formTools.errors[field.name]"
                  class="p-error text-xs font-normal leading-tight"
                >
                  {{ unescapeErrorMessage(formTools.errors[field.name]) }}
                </small>
              </div>
            </template>
          </div>

          <!-- Grouped Fields for Repository Step (group[0]) -->
          <div
            v-if="repositoryGroups.length > 0"
            class="flex flex-col gap-8 w-full"
          >
            <template
              v-for="row in repositoryGroupedRows"
              :key="row.groups[0].name"
            >
              <!-- Pair: 2 single-field groups side by side -->
              <div
                v-if="row.type === 'pair'"
                class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4"
              >
                <template
                  v-for="group in row.groups"
                  :key="group.name"
                >
                  <div class="flex flex-col gap-2">
                    <template
                      v-for="field in removeHiddenFields(group.fields)"
                      :key="field.name"
                    >
                      <!-- VCS integration field in group -->
                      <div
                        v-if="field.name === 'platform_feature__vcs_integration__uuid'"
                        class="flex flex-col gap-2"
                      >
                        <OAuthGithub
                          v-show="!slotProps.hasIntegrationsList"
                          ref="oauthGithubRef"
                          @onCallbackUrl="setCallbackUrl"
                          :loading="slotProps.isIntegrationsLoading"
                        />
                        <div
                          v-if="slotProps.hasIntegrationsList"
                          class="flex flex-col gap-2"
                        >
                          <FieldDropdown
                            :options="slotProps.listOfIntegrations"
                            :name="field.name"
                            :required="field.attrs?.required"
                            :label="field.label"
                            :value="setIntegration"
                            placeholder="Select a scope"
                            class="h-8"
                            :description="field.description"
                            :inputClass="renderInvalidClass(formTools.errors[field.name])"
                            :disabled="isDeploying"
                            optionLabel="label"
                            optionValue="value"
                            enableWorkaroundLabelToDisabledOptions
                            @onChange="
                              (installationId) => updateValueOnChange(field.name, installationId)
                            "
                          >
                            <template #value="slotProps">
                              <div class="flex flex-col justify-center h-full">
                                <div class="flex items-center gap-2">
                                  <i class="pi pi-github" />
                                  <div>{{ slotProps.value?.label }}</div>
                                </div>
                              </div>
                            </template>
                            <template #footer>
                              <div class="p-dropdown-items-wrapper">
                                <ul class="p-dropdown-items">
                                  <li
                                    class="p-dropdown-item flex items-center"
                                    @click="triggerConnectWithGithub"
                                  >
                                    <i class="pi pi-plus-circle mr-2" />
                                    <div>Add GitHub Account</div>
                                  </li>
                                </ul>
                              </div>
                            </template>
                          </FieldDropdown>
                        </div>
                      </div>

                      <!-- Regular field in group -->
                      <FieldInputTextPrivacy
                        v-if="field.info === 'Edge Application Name'"
                        :name="field.name"
                        :label="field.label"
                        :value="field.value"
                        :isPublic="isEdgeAppNamePublic"
                        @update:isPublic="handlePrivacyToggle"
                        @input="(val) => updateValueOnChange(field.name, val)"
                        :description="field.description"
                        :data-testid="`field-${field.name}`"
                        :required="field.attrs?.required"
                        :disabled="isDeploying"
                        :aditionalError="
                          formTools.errors[field.name]
                            ? unescapeErrorMessage(formTools.errors[field.name])
                            : ''
                        "
                      />
                      <div
                        v-else-if="isHandleField(field.name)"
                        class="flex flex-col gap-2"
                      >
                        <LabelBlock
                          :for="field.name"
                          :label="field.label"
                          :isRequired="field.attrs?.required"
                        />
                        <Password
                          v-if="field.type === 'password'"
                          autocomplete="off"
                          toggleMask
                          v-bind="field.input"
                          v-model="field.input.value"
                          :id="field.name"
                          class="w-full"
                          :class="renderInvalidClass(formTools.errors[field.name])"
                          :feedback="false"
                          :disabled="isDeploying"
                          :pt="{ input: { name: field.name } }"
                        />
                        <InputText
                          v-else
                          autocomplete="off"
                          :id="field.name"
                          type="text"
                          v-bind="field.input"
                          :disabled="isDeploying"
                          :class="renderInvalidClass(formTools.errors[field.name])"
                          :name="field.name"
                        />
                        <small class="text-xs font-normal text-color-secondary">{{
                          field.description
                        }}</small>
                        <small
                          v-if="formTools.errors[field.name]"
                          class="p-error text-xs font-normal leading-tight"
                        >
                          {{ unescapeErrorMessage(formTools.errors[field.name]) }}
                        </small>
                      </div>
                    </template>
                  </div>
                </template>
              </div>

              <!-- Single: 1 group in full width -->
              <div
                v-else
                class="flex flex-col gap-4"
              >
                <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <template
                    v-for="field in removeHiddenFields(row.groups[0].fields)"
                    :key="field.name"
                  >
                    <!-- VCS integration field in single group -->
                    <div
                      v-if="field.name === 'platform_feature__vcs_integration__uuid'"
                      class="flex flex-col gap-2"
                    >
                      <OAuthGithub
                        v-show="!slotProps.hasIntegrationsList"
                        ref="oauthGithubRef"
                        @onCallbackUrl="setCallbackUrl"
                        :loading="slotProps.isIntegrationsLoading"
                      />
                      <div
                        v-if="slotProps.hasIntegrationsList"
                        class="flex flex-col gap-2"
                      >
                        <FieldDropdown
                          :options="slotProps.listOfIntegrations"
                          :name="field.name"
                          :required="field.attrs?.required"
                          :label="field.label"
                          :value="setIntegration"
                          placeholder="Select a scope"
                          :description="field.description"
                          :inputClass="renderInvalidClass(formTools.errors[field.name])"
                          :disabled="isDeploying"
                          optionLabel="label"
                          optionValue="value"
                          enableWorkaroundLabelToDisabledOptions
                          @onChange="
                            (installationId) => updateValueOnChange(field.name, installationId)
                          "
                        >
                          <template #value="slotProps">
                            <div class="flex flex-col justify-center h-full">
                              <div class="flex items-center gap-2">
                                <i class="pi pi-github" />
                                <div>{{ slotProps.value?.label }}</div>
                              </div>
                            </div>
                          </template>
                          <template #footer>
                            <div class="p-dropdown-items-wrapper">
                              <ul class="p-dropdown-items">
                                <li
                                  class="p-dropdown-item flex items-center"
                                  @click="triggerConnectWithGithub"
                                >
                                  <i class="pi pi-plus-circle mr-2" />
                                  <div>Add GitHub Account</div>
                                </li>
                              </ul>
                            </div>
                          </template>
                        </FieldDropdown>
                      </div>
                    </div>

                    <!-- Regular field in single group -->
                    <FieldInputTextPrivacy
                      v-if="field.info === 'Edge Application Name'"
                      :name="field.name"
                      :label="field.label"
                      :value="field.value"
                      :isPublic="isEdgeAppNamePublic"
                      @update:isPublic="handlePrivacyToggle"
                      @input="(val) => updateValueOnChange(field.name, val)"
                      :description="field.description"
                      :data-testid="`field-${field.name}`"
                      :required="field.attrs?.required"
                      :disabled="isDeploying"
                      :aditionalError="
                        formTools.errors[field.name]
                          ? unescapeErrorMessage(formTools.errors[field.name])
                          : ''
                      "
                    />
                    <div
                      v-else-if="isHandleField(field.name)"
                      class="flex flex-col gap-2"
                    >
                      <LabelBlock
                        :for="field.name"
                        :label="field.label"
                        :isRequired="field.attrs?.required"
                      />
                      <Password
                        v-if="field.type === 'password'"
                        autocomplete="off"
                        toggleMask
                        v-bind="field.input"
                        v-model="field.input.value"
                        :id="field.name"
                        class="w-full"
                        :class="renderInvalidClass(formTools.errors[field.name])"
                        :feedback="false"
                        :disabled="isDeploying"
                        :pt="{ input: { name: field.name } }"
                      />
                      <InputText
                        v-else
                        autocomplete="off"
                        :id="field.name"
                        type="text"
                        v-bind="field.input"
                        :disabled="isDeploying"
                        :class="renderInvalidClass(formTools.errors[field.name])"
                        :name="field.name"
                      />
                      <small class="text-xs font-normal text-color-secondary">{{
                        field.description
                      }}</small>
                      <small
                        v-if="formTools.errors[field.name]"
                        class="p-error text-xs font-normal leading-tight"
                      >
                        {{ unescapeErrorMessage(formTools.errors[field.name]) }}
                      </small>
                    </div>
                  </template>
                </div>
              </div>
            </template>
          </div>
        </template>
      </template>

      <!-- Settings Inputs Slot - Groups[1+] for TemplateSettingsCard -->
      <template #settings-inputs>
        <template v-if="isFormReady && settingsGroupedRows.length > 0">
          <!-- Grouped Fields for Settings Step (group[1+]) -->
          <div class="flex flex-col gap-8 w-full">
            <template
              v-for="row in settingsGroupedRows"
              :key="row.groups[0].name"
            >
              <!-- Pair: 2 single-field groups side by side -->
              <div
                v-if="row.type === 'pair'"
                class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4"
              >
                <template
                  v-for="group in row.groups"
                  :key="group.name"
                >
                  <div class="flex flex-col gap-2">
                    <template
                      v-for="field in removeHiddenFields(group.fields)"
                      :key="field.name"
                    >
                      <!-- Regular field in group -->
                      <FieldInputTextPrivacy
                        v-if="field.info === 'Edge Application Name'"
                        :name="field.name"
                        :label="field.label"
                        :value="field.value"
                        :isPublic="isEdgeAppNamePublic"
                        @update:isPublic="handlePrivacyToggle"
                        @input="(val) => updateValueOnChange(field.name, val)"
                        :description="field.description"
                        :data-testid="`field-${field.name}`"
                        :required="field.attrs?.required"
                        :disabled="isDeploying"
                        :aditionalError="
                          formTools.errors[field.name]
                            ? unescapeErrorMessage(formTools.errors[field.name])
                            : ''
                        "
                      />
                      <div
                        v-else-if="isHandleField(field.name)"
                        class="flex flex-col gap-2"
                      >
                        <LabelBlock
                          :for="field.name"
                          :label="field.label"
                          :isRequired="field.attrs?.required"
                        />
                        <Password
                          v-if="field.type === 'password'"
                          autocomplete="off"
                          toggleMask
                          v-bind="field.input"
                          v-model="field.input.value"
                          :id="field.name"
                          class="w-full"
                          :class="renderInvalidClass(formTools.errors[field.name])"
                          :feedback="false"
                          :disabled="isDeploying"
                          :pt="{ input: { name: field.name } }"
                        />
                        <InputText
                          v-else
                          autocomplete="off"
                          :id="field.name"
                          type="text"
                          v-bind="field.input"
                          :disabled="isDeploying"
                          :class="renderInvalidClass(formTools.errors[field.name])"
                          :name="field.name"
                        />
                        <small class="text-xs font-normal text-color-secondary">{{
                          field.description
                        }}</small>
                        <small
                          v-if="formTools.errors[field.name]"
                          class="p-error text-xs font-normal leading-tight"
                        >
                          {{ unescapeErrorMessage(formTools.errors[field.name]) }}
                        </small>
                      </div>
                    </template>
                  </div>
                </template>
              </div>

              <!-- Single: 1 group in full width -->
              <div
                v-else
                class="flex flex-col gap-4"
              >
                <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <template
                    v-for="field in removeHiddenFields(row.groups[0].fields)"
                    :key="field.name"
                  >
                    <!-- Regular field in single group -->
                    <FieldInputTextPrivacy
                      v-if="field.info === 'Edge Application Name'"
                      :name="field.name"
                      :label="field.label"
                      :value="field.value"
                      :isPublic="isEdgeAppNamePublic"
                      @update:isPublic="handlePrivacyToggle"
                      @input="(val) => updateValueOnChange(field.name, val)"
                      :description="field.description"
                      :data-testid="`field-${field.name}`"
                      :required="field.attrs?.required"
                      :disabled="isDeploying"
                      :aditionalError="
                        formTools.errors[field.name]
                          ? unescapeErrorMessage(formTools.errors[field.name])
                          : ''
                      "
                    />
                    <div
                      v-else-if="isHandleField(field.name)"
                      class="flex flex-col gap-2"
                    >
                      <LabelBlock
                        :for="field.name"
                        :label="field.label"
                        :isRequired="field.attrs?.required"
                      />
                      <Password
                        v-if="field.type === 'password'"
                        autocomplete="off"
                        toggleMask
                        v-bind="field.input"
                        v-model="field.input.value"
                        :id="field.name"
                        class="w-full"
                        :class="renderInvalidClass(formTools.errors[field.name])"
                        :feedback="false"
                        :disabled="isDeploying"
                        :pt="{ input: { name: field.name } }"
                      />
                      <InputText
                        v-else
                        autocomplete="off"
                        :id="field.name"
                        type="text"
                        v-bind="field.input"
                        :disabled="isDeploying"
                        :class="renderInvalidClass(formTools.errors[field.name])"
                        :name="field.name"
                      />
                      <small class="text-xs font-normal text-color-secondary">{{
                        field.description
                      }}</small>
                      <small
                        v-if="formTools.errors[field.name]"
                        class="p-error text-xs font-normal leading-tight"
                      >
                        {{ unescapeErrorMessage(formTools.errors[field.name]) }}
                      </small>
                    </div>
                  </template>
                </div>
              </div>
            </template>
          </div>
        </template>
      </template>
    </LayoutEngineBlock>
  </div>
</template>
