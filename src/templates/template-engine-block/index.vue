<script setup>
  import { ref, defineOptions, watch, onMounted, computed, nextTick } from 'vue'
  import { useToast } from '@aziontech/webkit/use-toast'
  import FormLoading from '@templates/template-engine-block/form-loading'
  import EngineJsonForm from '@templates/template-engine-block/engine-jsonform'
  import EngineAzion from '@templates/template-engine-block/engine-azion'
  import { useRoute, useRouter } from 'vue-router'

  defineOptions({ name: 'templateEngineBlock' })

  const route = useRoute()
  const router = useRouter()

  const emit = defineEmits(['instantiate', 'cancel', 'submitClick', 'executionId', 'finish'])

  const props = defineProps({
    getTemplateService: {
      type: Function,
      required: true
    },
    instantiateTemplateService: {
      type: Function
    },
    templateId: {
      type: String,
      required: true
    },
    actionBarId: {
      type: String,
      default: '#action-bar'
    },
    freezeLoading: {
      type: Boolean,
      default: false
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
    // Service to fetch results after deployment finishes
    getResultsService: {
      type: Function,
      default: null
    }
  })

  const toast = useToast()
  const inputSchema = ref({})
  const isLoading = ref(true)
  const submitLoading = ref(false)
  const azionEngineRef = ref(null)
  const jsonFormEngineRef = ref(null)
  const hasSettings = ref(null)
  const localExecutionId = ref('')
  const results = ref(null)
  const localApplicationName = ref('')
  const localDeployStartTime = ref(null)
  const localDeployFailed = ref(false)
  const isRestoringState = ref(false)

  // Computed that prefers local executionId over prop
  const currentExecutionId = computed(() => {
    return localExecutionId.value || props.executionId
  })

  // Computed for application name
  const currentApplicationName = computed(() => {
    return localApplicationName.value || props.applicationName
  })

  // Computed for deploy start time
  const currentDeployStartTime = computed(() => {
    return localDeployStartTime.value || props.deployStartTime
  })

  // Computed for deploy failed state
  const currentDeployFailed = computed(() => {
    return localDeployFailed.value || props.deployFailed
  })

  /**
   * Computed for combined loading state
   * Combines local submitLoading with prop loadingDeploy
   */
  const isLoadingDeploy = computed(() => {
    return submitLoading.value || props.loadingDeploy
  })

  /**
   * Computed for combined disabled state
   * Disables when loading or when explicitly disabled
   */
  const isDisabledDeploy = computed(() => {
    return isLoadingDeploy.value || props.disabledDeploy
  })

  /**
   * Computed for app URL
   * Prefers prop appUrl, falls back to results.domain.url
   */
  const computedAppUrl = computed(() => {
    return props.appUrl || results.value?.domain?.url || ''
  })

  const isJsonForm = computed(() => {
    if (!inputSchema.value) return false
    const typeIsObject = inputSchema.value.type === 'object'
    const hasPropertiesProp = inputSchema.value.properties

    return typeIsObject && hasPropertiesProp
  })

  const loadTemplate = async (templateId) => {
    try {
      if (!props.templateId) return
      const templateData = await props.getTemplateService(templateId)
      // Merge template info fields from GitHub template into inputSchema
      // These are displayed in DeployRepositoryCard preview
      inputSchema.value = {
        ...(templateData.inputSchema ?? {}),
        templateTitle: templateData.templateTitle ?? '',
        templateDescription: templateData.templateDescription ?? '',
        templatePath: templateData.templatePath ?? '',
        templateUrl: templateData.templateUrl ?? '',
        imagePreview: templateData.imagePreview ?? ''
      }

      isLoading.value = false
      hasSettings.value = templateData.hasSettings
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: error
      })
    }
  }

  const handleSubmit = async () => {
    try {
      const activeEngine = isJsonForm.value ? jsonFormEngineRef.value : azionEngineRef.value

      if (!activeEngine) {
        toast.add({
          closable: true,
          severity: 'error',
          summary: 'Engine not initialized'
        })

        return
      }

      const isValid = await activeEngine.validateForm()
      if (!isValid) return

      submitLoading.value = true
      // emit('submitClick')

      const parsedInputSchema = activeEngine.getFormData()
      const instantiateParsedPayload = parsedInputSchema.map((field) => {
        return {
          field: field.name,
          instantiation_data_path: field.instantiation_data_path,
          value: field.input?.value ?? field.value ?? ''
        }
      })

      const response = await props.instantiateTemplateService(
        props.templateId,
        instantiateParsedPayload
      )
      submitLoading.value = props.freezeLoading
      localExecutionId.value = response.result.uuid
      localDeployStartTime.value = Date.now()
      emit('executionId', localExecutionId.value)
      // Update route query to preserve state on reload
      updateRouteQuery('deploying', localExecutionId.value)
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: error
      })
    } finally {
      if (!props.freezeLoading) {
        submitLoading.value = false
      }
    }
  }

  const handleCancel = () => {
    emit('cancel')
  }

  /**
   * Handles the finish event from child components
   * Fetches deployment results and emits finish event
   */
  const handleFinish = async () => {
    if (!props.getResultsService || !currentExecutionId.value) {
      emit('finish')
      return
    }

    try {
      const response = await props.getResultsService(currentExecutionId.value)
      results.value = response.result
      // Update route query to success step with domain info
      const domain = response.result?.domain?.cname || response.result?.domain?.url || ''
      updateRouteQuery('success', currentExecutionId.value, domain)
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: 'Failed to fetch deployment results',
        detail: error?.message || 'An unexpected error occurred'
      })
    }

    emit('finish')
  }

  watch(
    () => props.freezeLoading,
    () => {
      submitLoading.value = false
    }
  )

  /**
   * Update route query params to preserve deploy state on page reload
   * @param {string} step - Current step (repository, settings, deploying, success)
   * @param {string} id - Execution ID (optional)
   * @param {string} domain - Application domain (optional)
   */
  const updateRouteQuery = (step, id = null, domain = null) => {
    const query = { ...route.query, step }
    if (id) {
      query.executionId = id
    }
    if (domain) {
      query.domain = domain
    }
    router.replace({ query })
  }

  /**
   * Restore state from route query params on page reload
   * Called in onMounted to recover deploy state
   */
  const restoreStateFromRoute = async () => {
    const { step, executionId: routeExecutionId, domain } = route.query

    if (step && routeExecutionId) {
      localExecutionId.value = routeExecutionId
      isRestoringState.value = true

      if (step === 'deploying') {
        localDeployStartTime.value = Date.now()
        // Set step in engine - methods are exposed directly on engine component
        await nextTick()
        const activeEngine = isJsonForm.value ? jsonFormEngineRef.value : azionEngineRef.value
        if (activeEngine?.goToDeploying) {
          activeEngine.goToDeploying()
        }
      } else if (step === 'success') {
        // For success state, we need to fetch the results
        if (props.getResultsService) {
          try {
            const response = await props.getResultsService(routeExecutionId)
            results.value = response.result
            localApplicationName.value = domain || response.result?.domain?.cname || ''
            await nextTick()
            const activeEngine = isJsonForm.value ? jsonFormEngineRef.value : azionEngineRef.value
            if (activeEngine?.goToSuccess) {
              activeEngine.goToSuccess()
            }
          } catch (error) {
            // Fall back to deploying state
            localDeployStartTime.value = Date.now()
            await nextTick()
            const activeEngine = isJsonForm.value ? jsonFormEngineRef.value : azionEngineRef.value
            if (activeEngine?.goToDeploying) {
              activeEngine.goToDeploying()
            }
          }
        }
      }
    }
  }

  onMounted(async () => {
    if (!props.templateId) return
    await loadTemplate(props.templateId)
    // Restore state from route after template is loaded
    await restoreStateFromRoute()
  })

  // ============================================================================
  // Expose - Methods needed by parent components
  // ============================================================================
  defineExpose({
    handleSubmit,
    handleCancel,
    updateRouteQuery
  })
</script>

<template>
  <FormLoading v-if="isLoading" />
  <div v-else>
    <div v-if="isJsonForm">
      <EngineJsonForm
        ref="jsonFormEngineRef"
        :schema="inputSchema"
        :has-settings="hasSettings"
        :is-drawer="props.isDrawer"
        :loading-deploy="isLoadingDeploy"
        :disabled-deploy="isDisabledDeploy"
        :execution-id="currentExecutionId"
        :deploy-failed="currentDeployFailed"
        :application-name="currentApplicationName"
        :deploy-start-time="currentDeployStartTime"
        :app-url="computedAppUrl"
        :success-next-steps="props.successNextSteps"
        :results="results"
        @deploy="handleSubmit"
        @finish="handleFinish"
      />
    </div>
    <div v-else>
      <EngineAzion
        ref="azionEngineRef"
        :schema="inputSchema"
        :has-settings="hasSettings"
        :is-drawer="props.isDrawer"
        :loading-deploy="isLoadingDeploy"
        :disabled-deploy="isDisabledDeploy"
        :execution-id="currentExecutionId"
        :deploy-failed="currentDeployFailed"
        :application-name="currentApplicationName"
        :deploy-start-time="currentDeployStartTime"
        :app-url="computedAppUrl"
        :success-next-steps="props.successNextSteps"
        :results="results"
        @deploy="handleSubmit"
        @finish="handleFinish"
      />
    </div>
  </div>
</template>
