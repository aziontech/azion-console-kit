<script setup>
  import { ref, defineOptions, watch, onMounted, computed } from 'vue'
  import { useToast } from 'primevue/usetoast'
  import ActionBarTemplate from '@templates/action-bar-block'
  import FormLoading from './form-loading'
  import EngineJsonForm from './engine-jsonform'
  import EngineAzion from './engine-azion'

  defineOptions({ name: 'templateEngineBlock' })

  const emit = defineEmits(['instantiate', 'cancel', 'submitClick'])

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
    }
  })

  const toast = useToast()
  const inputSchema = ref({})
  const isLoading = ref(true)
  const submitLoading = ref(false)
  const azionEngineRef = ref(null)
  const jsonFormEngineRef = ref(null)

  onMounted(async () => {
    await loadTemplate(props.templateId)
  })

  const isJsonForm = computed(() => {
    const typeIsObject = inputSchema.value.type === 'object'
    const hasPropertiesProp = inputSchema.value.properties

    return typeIsObject && hasPropertiesProp
  })

  const loadTemplate = async () => {
    try {
      const templateData = await props.getTemplateService(props.templateId)
      inputSchema.value = templateData.inputSchema
      isLoading.value = false
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
      if (!isValid) {
        return
      }

      submitLoading.value = true
      emit('submitClick')

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

      emit('instantiate', response)
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
</script>

<template>
  <FormLoading v-if="isLoading" />
  <div v-else>
    <div v-if="isJsonForm">
      <EngineJsonForm
        ref="jsonFormEngineRef"
        :schema="inputSchema"
      />
    </div>
    <div v-else>
      <EngineAzion
        ref="azionEngineRef"
        :schema="inputSchema"
        :isDrawer="isDrawer"
      />
    </div>
    <Teleport :to="actionBarId">
      <ActionBarTemplate
        v-if="!isLoading"
        primaryActionLabel="Deploy"
        :loading="submitLoading"
        @onSubmit="handleSubmit"
        @onCancel="handleCancel"
      />
    </Teleport>
  </div>
</template>
