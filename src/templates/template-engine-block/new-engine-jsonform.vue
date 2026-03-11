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
  import { computed, ref, watch, onMounted } from 'vue'
  // import { JsonForms } from '@jsonforms/vue'
  // import { vanillaRenderers } from '@jsonforms/vue-vanilla'
  // import Dropdown from 'primevue/dropdown'
  // import LabelBlock from '@/templates/label-block'
  // import FormHorizontal from '@templates/create-form-block/form-horizontal'
  import LayoutEngineBlock from './layout-engine-block.vue'

  // JSON Forms Custom Renderers
  // import InputTextControlRenderer from '@templates/form-fields-inputs/jsonform-custom-render/input-text/inputTextControlRenderer.vue'
  // import { InputTextControlTester } from '@templates/form-fields-inputs/jsonform-custom-render/input-text/inputTextControlTester'
  // import InputPasswordControlRenderer from '@templates/form-fields-inputs/jsonform-custom-render/input-password/inputPasswordControlRenderer.vue'
  // import { InputPasswordControlTester } from '@templates/form-fields-inputs/jsonform-custom-render/input-password/inputPasswordControlTester'
  // import InputNumberControlRenderer from '@templates/form-fields-inputs/jsonform-custom-render/input-number/inputNumberControlRenderer.vue'
  // import { InputNumberControlTester } from '@templates/form-fields-inputs/jsonform-custom-render/input-number/inputNumberControlTester'
  // import TextareaControlRenderer from '@templates/form-fields-inputs/jsonform-custom-render/textarea/textareaControlRenderer.vue'
  // import { TextareaControlTester } from '@templates/form-fields-inputs/jsonform-custom-render/textarea/textareaControlTester'
  // import DropdownControlRenderer from '@templates/form-fields-inputs/jsonform-custom-render/dropdown/dropdownControlRenderer.vue'
  // import { DropdownControlTester } from '@templates/form-fields-inputs/jsonform-custom-render/dropdown/dropdownControlTester'
  // import InputTextPrivacyControlRenderer from '@templates/form-fields-inputs/jsonform-custom-render/input-text-privacy/inputTextPrivacyControlRenderer.vue'
  // import { InputTextPrivacyControlTester } from '@templates/form-fields-inputs/jsonform-custom-render/input-text-privacy/inputTextPrivacyControlTester'

  // ============================================================================
  // Props - No additional props beyond what the base component provides
  // ============================================================================
  const props = defineProps({
    // Props are passed through to LayoutEngineBlock via v-bind
    // No exclusive props for this component
  })

  // ============================================================================
  // Emits - Currently no emits
  // ============================================================================
  // defineEmits([]) - Reserved for future use if emits are needed

  // ============================================================================
  // Template Refs
  // ============================================================================
  const layoutRef = ref(null)

  // ============================================================================
  // Local State - Specific to JSON Forms engine
  // ============================================================================
  const selectedIntegration = ref('')
  const vcsIntegrationError = ref('')
  const formData = ref({})
  const errors = ref([])

  // ============================================================================
  // JSON Forms Custom Renderers Configuration
  // ============================================================================
  // const customRenderers = [
  //   {
  //     tester: InputTextControlTester,
  //     renderer: InputTextControlRenderer
  //   },
  //   {
  //     tester: InputPasswordControlTester,
  //     renderer: InputPasswordControlRenderer
  //   },
  //   {
  //     tester: InputNumberControlTester,
  //     renderer: InputNumberControlRenderer
  //   },
  //   {
  //     tester: TextareaControlTester,
  //     renderer: TextareaControlRenderer
  //   },
  //   {
  //     tester: DropdownControlTester,
  //     renderer: DropdownControlRenderer
  //   },
  //   {
  //     tester: InputTextPrivacyControlTester,
  //     renderer: InputTextPrivacyControlRenderer
  //   }
  // ]

  // const renderers = markRaw([...vanillaRenderers, ...customRenderers])

  // ============================================================================
  // Local Computed - Specific to JSON Forms engine
  // ============================================================================

  /**
   * Check if the schema includes VCS integration fields
   * Different implementation from Azion engine
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
  // const formSchema = computed(() => {
  //   const schema = { ...props.schema }
  //   schema.properties = parsePropertiesSchema(schema.properties)
  //   return schema
  // })

  /**
   * Check if VCS integration field is required
   */
  const isVcsRequired = computed(() => {
    if (!hasIntegrations.value) return false
    const requiredFields = props.schema?.required || []
    return requiredFields.includes('platform_feature__vcs_integration__uuid')
  })

  // ============================================================================
  // Form Event Handlers - Specific to JSON Forms engine
  // ============================================================================

  /**
   * Handles JSON Forms change events
   * Updates formData and errors refs
   * @param {Object} event - The change event from JsonForms
   */
  // const onChangeAzionForm = (event) => {
  //   formData.value = event.data
  //   errors.value = event.errors
  // }

  // ============================================================================
  // Validation Functions - Required by parent components
  // ============================================================================

  /**
   * Validates the entire form including VCS integration
   * @returns {boolean} Whether the form is valid
   */
  const validateForm = () => {
    const jsonFormErrors = errors.value.filter(
      (error) => !error.params.missingProperty?.includes('platform_feature__vcs_integration__uuid')
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
      const vcsField = props.schema?.properties?.platform_feature__vcs_integration__uuid
      data.push(
        parseData({
          name: 'platform_feature__vcs_integration__uuid',
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
  // const parsePropertiesSchema = (properties) => {
  //   const data = {}
  //   const keys = Object.keys(properties)

  //   keys.forEach((key) => {
  //     if (key !== 'platform_feature__vcs_integration__uuid') {
  //       data[key] = properties[key]
  //     }
  //   })

  //   return data
  // }

  // ============================================================================
  // VCS Integration Handlers - Specific to JSON Forms engine
  // ============================================================================

  /**
   * Updates the selected integration value
   * @param {string} installationId - The selected installation ID
   */
  // const updateIntegrationValue = (installationId) => {
  //   selectedIntegration.value = installationId
  // }

  // ============================================================================
  // Lifecycle Hooks
  // ============================================================================
  onMounted(async () => {
    if (hasIntegrations.value) {
      await layoutRef.value?.loadIntegrationOnShowButton()
    }
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
    errors
  })
</script>

<template>
  {{ props }}

  <LayoutEngineBlock
    ref="layoutRef"
    v-bind="$attrs"
    :schema="props.schema"
    :is-drawer="props.isDrawer"
  >
    <h5>test</h5>
  </LayoutEngineBlock>
</template>
