<script setup>
  /**
   * new-engine-azion.vue
   *
   * Consumer component for Azion-specific form rendering.
   * Uses layout-engine-block.vue as the base layout component.
   *
   * This component handles:
   * - vee-validate/yup schema-based validation
   * - Dynamic field rendering based on Azion schema format
   * - VCS integration via LayoutEngineBlock slots
   *
   * Schema format (Azion):
   * - fields: Array of top-level field definitions
   * - groups: Array of field groups, each containing fields
   */
  import { ref, computed, watch, onBeforeUnmount, defineOptions } from 'vue'
  import { useForm } from 'vee-validate'
  import * as yup from 'yup'
  import InputText from 'primevue/inputtext'
  import Password from 'primevue/password'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown.vue'
  import LabelBlock from '@/templates/label-block'
  import OAuthGithub from './oauth-github.vue'
  import LayoutEngineBlock from './layout-engine-block.vue'

  defineOptions({ name: 'engineAzion' })

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

  // ============================================================================
  // State - Azion-specific form state
  // ============================================================================
  const inputSchema = ref(props.schema)
  const formTools = ref({})
  const isFormReady = ref(false)
  const setIntegration = ref('')
  const isInitialized = ref(false)

  // ============================================================================
  // Computed - Schema processing
  // ============================================================================
  /**
   * Groups fields into rows for layout.
   * Single-field groups are paired side-by-side when possible.
   */
  const groupedRows = computed(() => {
    const rows = []
    const singleFieldGroups = []

    for (const group of inputSchema.value.groups || []) {
      const visibleFields = (group.fields || []).filter((field) => !field.hidden)
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
  })

  /**
   * Computes props to pass to LayoutEngineBlock
   */
  const layoutProps = computed(() => ({
    title: inputSchema.value.title || 'Start from Template',
    previewSrc: inputSchema.value.previewSrc || '',
    previewAlt: inputSchema.value.previewAlt || '',
    templateTitle: inputSchema.value.templateTitle || inputSchema.value.name || '',
    templateUrl: inputSchema.value.templateUrl || '',
    templateIcon: inputSchema.value.templateIcon || '',
    templateDescription: inputSchema.value.description || '',
    githubUrl: inputSchema.value.githubUrl || inputSchema.value.repository || '',
    schema: props.schema,
    isDrawer: props.isDrawer
  }))

  // ============================================================================
  // Schema Creation Functions - Azion-specific
  // ============================================================================
  /**
   * Extracts field names from groups
   * @param {Array} groups - Schema groups
   * @returns {Array} Array of field names
   */
  const extractFieldNames = (groups) => {
    return groups.flatMap((group) => group.fields.map((field) => field.name))
  }

  /**
   * Creates a yup schema string for a field
   * @param {Object} field - Field definition
   * @returns {yup.StringSchema} Yup schema for the field
   */
  const createSchemaString = (field) => {
    if (field.attrs?.required) {
      return yup.string().required(field.label + ' is required')
    }
    return yup.string().nullable().notRequired()
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
    const { errors, defineField, handleSubmit, setFieldValue } = useForm({
      validationSchema: schema
    })

    formTools.value = {
      errors: errors,
      defineField: defineField,
      handleSubmit: handleSubmit,
      setFieldValue: setFieldValue
    }

    // Initialize fields with defineField
    inputSchema.value.fields?.forEach((field) => {
      if (!field.hidden) {
        field.input = defineField(field.name)
      }
    })

    inputSchema.value.groups?.forEach((group) => {
      group.fields.forEach((field) => {
        if (!field.hidden) {
          field.input = defineField(field.name)
        }
      })
    })

    isFormReady.value = true
    isInitialized.value = true
  }

  // ============================================================================
  // Form Validation Functions
  // ============================================================================
  /**
   * Validates the entire form
   * @returns {Promise<boolean>} Whether the form is valid
   */
  const validateForm = async () => {
    if (!formTools.value.handleSubmit) return false

    let isValid = false
    await formTools.value.handleSubmit(() => {
      isValid = true
    })()
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

  // ============================================================================
  // Field Rendering Helpers
  // ============================================================================
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
    return (fields || []).filter((field) => !field.hidden)
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
   * Unescapes HTML entities from error messages
   * @param {string} message - Error message
   * @returns {string} Unescaped message
   */
  const unescapeErrorMessage = (message) => {
    if (!message) return ''
    return message.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  }

  // ============================================================================
  // Value Change Handlers
  // ============================================================================
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

  // ============================================================================
  // VCS Integration Helpers - Use LayoutEngineBlock methods
  // ============================================================================
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

  // ============================================================================
  // Event Handlers
  // ============================================================================
  /**
   * Handles the next button click
   */
  const handleNext = () => {
    emit('next')
  }

  // ============================================================================
  // Watchers
  // ============================================================================
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
    },
    { immediate: true }
  )

  // Watch for integrations list changes to set default
  watch(
    () => layoutRef.value?.listOfIntegrations,
    (newList) => {
      if (newList?.value && newList.value.length > 0) {
        setIntegration.value = newList.value[0].value
      }
    },
    { deep: true }
  )

  // ============================================================================
  // Lifecycle Cleanup
  // ============================================================================
  onBeforeUnmount(() => {
    // Cleanup is handled by LayoutEngineBlock
  })

  // ============================================================================
  // Expose - Methods needed by parent components
  // ============================================================================
  defineExpose({
    validateForm,
    getFormData,
    formTools,
    inputSchema,
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
                    :description="field.description"
                    :inputClass="renderInvalidClass(formTools.errors[field.name])"
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
              <div
                v-if="isHandleField(field.name)"
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
                  :pt="{ input: { name: field.name } }"
                />
                <InputText
                  v-else
                  autocomplete="off"
                  :id="field.name"
                  type="text"
                  v-bind="field.input"
                  :name="field.name"
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

          <!-- Grouped Fields -->
          <div
            v-if="inputSchema.groups"
            class="flex flex-col gap-8 w-full"
          >
            <template
              v-for="row in groupedRows"
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
                            :description="field.description"
                            :inputClass="renderInvalidClass(formTools.errors[field.name])"
                            optionLabel="label"
                            optionValue="value"
                            @onChange="
                              (installationId) => updateValueOnChange(field.name, installationId)
                            "
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

                      <!-- Regular field in group -->
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
                          :pt="{ input: { name: field.name } }"
                        />
                        <InputText
                          v-else
                          autocomplete="off"
                          :id="field.name"
                          type="text"
                          v-bind="field.input"
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
                          optionLabel="label"
                          optionValue="value"
                          @onChange="
                            (installationId) => updateValueOnChange(field.name, installationId)
                          "
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

                    <!-- Regular field in single group -->
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
                        :pt="{ input: { name: field.name } }"
                      />
                      <InputText
                        v-else
                        autocomplete="off"
                        :id="field.name"
                        type="text"
                        v-bind="field.input"
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
