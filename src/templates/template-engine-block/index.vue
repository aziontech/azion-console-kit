<script setup>
  import { ref, defineOptions, watch, onMounted, computed } from 'vue'
  import { useToast } from 'primevue/usetoast'
  // import ActionBarTemplate from '@templates/action-bar-block'
  import FormLoading from '@templates/template-engine-block/form-loading'
  // New refactored components (using centralized layout)
  import NewEngineJsonForm from '@templates/template-engine-block/new-engine-jsonform'
  import NewEngineAzion from '@templates/template-engine-block/new-engine-azion'
  // Legacy components - kept for reference, will be removed in future refactoring
  // import EngineJsonForm from '@templates/template-engine-block/engine-jsonform'
  // import EngineAzion from '@templates/template-engine-block/engine-azion'

  defineOptions({ name: 'templateEngineBlock' })

  const emit = defineEmits(['instantiate', 'cancel', 'submitClick', 'executionId'])

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

  // Computed that prefers local executionId over prop
  const currentExecutionId = computed(() => {
    return localExecutionId.value || props.executionId
  })

  onMounted(async () => {
    if (!props.templateId) return
    await loadTemplate(props.templateId)
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
      inputSchema.value = templateData.inputSchema ?? {}
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
      emit('executionId', localExecutionId.value)
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

  watch(
    () => props.freezeLoading,
    () => {
      submitLoading.value = false
    }
  )

  // ============================================================================
  // Expose - Methods needed by parent components
  // ============================================================================
  defineExpose({
    handleSubmit,
    handleCancel
  })
</script>

<template>
  <FormLoading v-if="isLoading" />
  <div v-else>
    <div v-if="isJsonForm">
      <NewEngineJsonForm
        ref="jsonFormEngineRef"
        :schema="inputSchema"
        :has-settings="hasSettings"
        :is-drawer="props.isDrawer"
        :loading-deploy="props.loadingDeploy"
        :disabled-deploy="props.disabledDeploy"
        :execution-id="currentExecutionId"
        :deploy-failed="props.deployFailed"
        :application-name="props.applicationName"
        :deploy-start-time="props.deployStartTime"
        :app-url="props.appUrl"
        :success-next-steps="props.successNextSteps"
        @deploy="handleSubmit"
      />
    </div>
    <div v-else>
      <NewEngineAzion
        ref="azionEngineRef"
        :schema="inputSchema"
        :has-settings="hasSettings"
        :is-drawer="props.isDrawer"
        :loading-deploy="props.loadingDeploy"
        :disabled-deploy="props.disabledDeploy"
        :execution-id="currentExecutionId"
        :deploy-failed="props.deployFailed"
        :application-name="props.applicationName"
        :deploy-start-time="props.deployStartTime"
        :app-url="props.appUrl"
        :success-next-steps="props.successNextSteps"
        @deploy="handleSubmit"
      />
    </div>
  </div>
</template>
