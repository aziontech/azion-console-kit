<script setup>
  /**
   * new-engine-jsonform.vue
   *
   * Consumer component for JSON Forms-based form rendering.
   * Uses layout-engine-block.vue as the base layout component.
   *
   * This component will replace engine-jsonform.vue in a future refactoring step.
   *
   * Features:
   * - @jsonforms/vue integration for JSON Schema-based forms
   * - Custom PrimeVue renderers for input types
   * - VCS integration support via slots
   * - GitHub OAuth integration
   */
  import { computed, ref, markRaw, watch, onMounted, onBeforeUnmount, defineOptions } from 'vue'
  import { JsonForms } from '@jsonforms/vue'
  import { vanillaRenderers } from '@jsonforms/vue-vanilla'
  import Dropdown from 'primevue/dropdown'
  import LabelBlock from '@/templates/label-block'
  import OAuthGithub from './oauth-github.vue'
  import LayoutEngineBlock from './layout-engine-block.vue'

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

  // ============================================================================
  // Props
  // ============================================================================
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
    }
  })

  // ============================================================================
  // Emits
  // ============================================================================
  const emit = defineEmits(['next', 'deploy', 'finish', 'retry', 'manage', 'open-url', 'next-step'])

  // ============================================================================
  // Template Refs
  // ============================================================================
  const layoutRef = ref(null)
  const oauthGithubRef = ref(null)

  // ============================================================================
  // Local State - Specific to JSON Forms engine
  // ============================================================================
  const selectedIntegration = ref('')
  const vcsIntegrationError = ref('')
  const formData = ref({})
  const errors = ref([])
  const vcsIntegrationFieldName = ref('platform_feature__vcs_integration__uuid')

  // ============================================================================
  // JSON Forms Custom Renderers Configuration
  // ============================================================================
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

  // ============================================================================
  // Local Computed - Specific to JSON Forms engine
  // ============================================================================

  /**
   * Check if the schema includes VCS integration fields
   */
  const hasIntegrations = computed(() => {
    const githubIntegration = props.schema?.properties?.platform_feature__vcs_integration__uuid
    const hasGithubIntegration = githubIntegration && Object.keys(githubIntegration).length > 0
    return hasGithubIntegration
  })

  /**
   * Compute the form schema, removing VCS integration fields
   * (they are handled separately in the github-connection slot)
   */
  const formSchema = computed(() => {
    const schema = { ...props.schema }
    schema.properties = parsePropertiesSchema(schema.properties || {})
    return schema
  })

  /**
   * Check if VCS integration field is required
   */
  const isVcsRequired = computed(() => {
    if (!hasIntegrations.value) return false
    const requiredFields = props.schema?.required || []
    return requiredFields.includes(vcsIntegrationFieldName.value)
  })

  /**
   * Computes props to pass to LayoutEngineBlock
   */
  const layoutProps = computed(() => ({
    title: props.schema?.title || 'Start from Template',
    previewSrc: props.schema?.previewSrc || '',
    previewAlt: props.schema?.previewAlt || '',
    templateTitle: props.schema?.templateTitle || props.schema?.name || '',
    templateUrl: props.schema?.templateUrl || '',
    templateIcon: props.schema?.templateIcon || '',
    templateDescription: props.schema?.description || '',
    githubUrl: props.schema?.githubUrl || props.schema?.repository || '',
    schema: props.schema,
    isDrawer: props.isDrawer,
    // Flow control props
    hasSettings: props.hasSettings,
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
    deployStartTime: props.deployStartTime
  }))

  // ============================================================================
  // Form Event Handlers - Specific to JSON Forms engine
  // ============================================================================

  /**
   * Handles JSON Forms change events
   * Updates formData and errors refs
   * @param {Object} event - The change event from JsonForms
   */
  const onChangeAzionForm = (event) => {
    formData.value = event.data
    errors.value = event.errors
  }

  // ============================================================================
  // Validation Functions - Required by parent components
  // ============================================================================

  /**
   * Validates the entire form including VCS integration
   * @returns {boolean} Whether the form is valid
   */
  const validateForm = () => {
    const jsonFormErrors = errors.value.filter(
      (error) => !error.params.missingProperty?.includes(vcsIntegrationFieldName.value)
    )

    const hasJsonFormErrors = jsonFormErrors.length > 0
    const hasVcsError = isVcsRequired.value && !selectedIntegration.value

    vcsIntegrationError.value = hasVcsError ? 'Git Scope is required' : ''

    return !hasJsonFormErrors && !hasVcsError
  }

  // ============================================================================
  // Form Data Functions - Required by parent components
  // ============================================================================

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

  // ============================================================================
  // Schema Processing Functions - Specific to JSON Forms engine
  // ============================================================================

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

  // ============================================================================
  // VCS Integration Handlers - Specific to JSON Forms engine
  // ============================================================================

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

  // ============================================================================
  // Event Handlers
  // ============================================================================
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

  // ============================================================================
  // Lifecycle Hooks
  // ============================================================================
  onMounted(async () => {
    if (hasIntegrations.value) {
      await layoutRef.value?.loadIntegrationOnShowButton()
    }
  })

  onBeforeUnmount(() => {
    // Cleanup is handled by LayoutEngineBlock
  })

  // ============================================================================
  // Watchers
  // ============================================================================
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

  // Watch for integrations list changes to set default
  watch(
    () => layoutRef.value?.listOfIntegrations,
    (newList) => {
      if (newList?.value && newList.value.length > 0) {
        selectedIntegration.value = newList.value[0].value
      }
    },
    { deep: true }
  )

  // ============================================================================
  // Expose - Methods needed by parent components
  // ============================================================================
  defineExpose({
    validateForm,
    getFormData,
    formData,
    errors,
    layoutRef,
    // Expose goToDeploying from LayoutEngineBlock
    goToDeploying: () => layoutRef.value?.goToDeploying?.(),
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
      @open-url="handleOpenUrl"
      @next-step="handleNextStep"
    >
      <!-- GitHub Connection Slot -->
      <template #github-connection="slotProps">
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
            <Dropdown
              :id="vcsIntegrationFieldName"
              :name="vcsIntegrationFieldName"
              :loading="slotProps.isIntegrationsLoading"
              v-model="selectedIntegration"
              :options="slotProps.listOfIntegrations"
              optionLabel="label"
              optionValue="value"
              placeholder="Select a scope"
              @change="updateIntegrationValue(selectedIntegration)"
              class="w-full sm:max-w-xs"
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
          </div>
          <small
            v-if="vcsIntegrationError"
            class="p-error text-xs font-normal leading-tight"
          >
            {{ vcsIntegrationError }}
          </small>
          <small class="text-xs font-normal text-color-secondary">
            Select the scope for this template.
          </small>
        </div>
      </template>

      <!-- Inputs Slot - JSON Forms field rendering -->
      <template #inputs>
        <div class="sm:max-w-lg w-full">
          <JsonForms
            class="flex flex-col gap-8 max-md:gap-6"
            :data="formData"
            :schema="formSchema"
            :renderers="renderers"
            @change="onChangeAzionForm"
          />
        </div>
      </template>
    </LayoutEngineBlock>
  </div>
</template>
