<script setup>
  import { ref, inject, onMounted } from 'vue'
  import * as yup from 'yup'
  import { useToast } from 'primevue/usetoast'

  import CreateDrawerBlock from '@templates/create-drawer-block'
  import FormFieldsDrawerRulesEngine from '@/views/EdgeApplicationsRulesEngine/FormFields/FormFieldsEdgeApplicationsRulesEngine'
  import EditDrawerBlock from '@templates/edit-drawer-block'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import { refDebounced } from '@vueuse/core'
  defineOptions({ name: 'drawer-rules-engine' })
  /**@type {import('@/plugins/adapters/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const emit = defineEmits(['onSuccess'])

  const props = defineProps({
    edgeApplicationId: {
      type: String,
      required: true
    },
    createRulesEngineService: {
      type: Function,
      required: true
    },
    editRulesEngineService: {
      type: Function,
      required: true
    },
    loadRulesEngineService: {
      type: Function,
      required: true
    },
    documentationService: {
      type: Function,
      required: true
    },
    isApplicationAcceleratorEnabled: {
      type: Boolean
    },
    isDeliveryProtocolHttps: {
      type: Boolean
    },
    listEdgeApplicationFunctionsService: {
      type: Function,
      required: true
    },
    listCacheSettingsService: {
      required: true,
      type: Function
    },
    listOriginsService: {
      required: true,
      type: Function
    },
    hideApplicationAcceleratorInDescription: {
      type: Boolean
    },
    isImageOptimizationEnabled: {
      type: Boolean
    },
    isEdgeFunctionEnabled: {
      type: Boolean
    },
    clipboardWrite: {
      type: Function,
      required: true
    },
    isLoadBalancerEnabled: {
      type: Boolean,
      required: true
    }
  })

  const toast = useToast()
  const isOverlapped = ref(false)

  const showCreateRulesEngineDrawer = ref(false)
  const showEditRulesEngineDrawer = ref(false)
  const debouncedDrawerAnimate = 300
  const loadCreateRulesEngineDrawer = refDebounced(
    showCreateRulesEngineDrawer,
    debouncedDrawerAnimate
  )
  const loadEditRulesEngineDrawer = refDebounced(showEditRulesEngineDrawer, debouncedDrawerAnimate)
  const selectedRulesEngineToEdit = ref({})
  const functionsInstanceOptions = ref([])
  const cacheSettingsOptions = ref([])
  const originsOptions = ref([])

  const initialValues = ref({
    id: props.edgeApplicationId,
    name: '',
    description: '',
    phase: 'request',
    criteria: [
      [
        {
          variable: '${uri}',
          operator: 'is_equal',
          conditional: 'if',
          input_value: ''
        }
      ]
    ],
    behaviors: [
      {
        name: 'deliver'
      }
    ],
    isActive: true
  })

  const isLoadingRequests = ref(true)

  const validationSchema = yup.object({
    name: yup.string().required().label('Name'),
    description: yup
      .string()
      .max(1000, 'Description should not exceed 1000 characters')
      .label('Description'),
    active: yup.bool(),
    criteria: yup.array().of(
      yup
        .array()
        .of(
          yup.object().shape({
            variable: yup.string().required().label('variable'),
            operator: yup.string().required().label('operator'),
            conditional: yup.string().required().label('conditional'),
            input_value: yup.string().when('operator', {
              is: (operator) => operator !== 'exists' && operator !== 'does_not_exist',
              then: (schema) => schema.required().label('criteria argument'),
              otherwise: (schema) => schema.notRequired()
            })
          })
        )
        .required()
    ),
    behaviors: yup.array().of(
      yup.object().shape({
        name: yup.string().required().label('behavior')
      })
    )
  })

  const handleToggleDrawer = (value) => {
    isOverlapped.value = value
  }

  const createService = async (payload) => {
    return await props.createRulesEngineService({
      ...payload,
      edgeApplicationId: props.edgeApplicationId
    })
  }

  const editService = async (payload) => {
    return await props.editRulesEngineService({
      payload,
      id: props.edgeApplicationId
    })
  }

  const loadingOrigins = ref(false)
  const loadingFunctionsInstance = ref(false)

  const listFunctionsInstanceOptions = async () => {
    if (!props.isEdgeFunctionEnabled) return

    try {
      loadingFunctionsInstance.value = true
      functionsInstanceOptions.value = await props.listEdgeApplicationFunctionsService(
        props.edgeApplicationId
      )
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: error
      })
    } finally {
      loadingFunctionsInstance.value = false
    }
  }

  const listCacheSettingsOptions = async () => {
    isLoadingRequests.value = true
    try {
      cacheSettingsOptions.value = await props.listCacheSettingsService({
        id: props.edgeApplicationId
      })
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: error
      })
    } finally {
      isLoadingRequests.value = false
    }
  }

  const listOriginsOptions = async () => {
    try {
      loadingOrigins.value = true
      originsOptions.value = await props.listOriginsService({ id: props.edgeApplicationId })
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: error
      })
    } finally {
      loadingOrigins.value = false
    }
  }

  const loadService = async () => {
    return await props.loadRulesEngineService({
      ...selectedRulesEngineToEdit.value,
      edgeApplicationId: props.edgeApplicationId
    })
  }

  const initialPhase = ref('request')
  const openDrawerCreate = (selectedPhase = 'request') => {
    initialValues.value.phase = selectedPhase
    initialPhase.value = selectedPhase
    showCreateRulesEngineDrawer.value = true
  }

  const openDrawerEdit = (rule) => {
    if (rule.id) {
      selectedRulesEngineToEdit.value = rule
      showEditRulesEngineDrawer.value = true
      initialPhase.value = rule.phase.content.toLocaleLowerCase()
    }
  }

  const handleTrackCreation = () => {
    tracker.product
      .productCreated({
        productName: 'Rule',
        product: 'edgeApplication'
      })
      .track()
  }

  const handleFailedToCreate = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToCreate({
        productName: 'Rule',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message,
        product: 'edgeApplication'
      })
      .track()
  }

  const handleFailedToEdit = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToEdit({
        productName: 'Rule',
        errorMessage: message,
        fieldName: fieldName,
        errorType: 'api',
        product: 'edgeApplication'
      })
      .track()

    closeDrawerEdit()
  }

  const closeDrawerEdit = () => {
    showEditRulesEngineDrawer.value = false
  }
  const closeDrawerCreate = () => {
    showCreateRulesEngineDrawer.value = false
  }

  const handleCreateRulesEngine = () => {
    emit('onSuccess')
    handleTrackCreation()
    closeDrawerCreate()
  }

  const handleTrackSuccessEdit = () => {
    tracker.product.productEdited({
      productName: 'Rule',
      product: 'edgeApplication'
    })
    tracker.product
      .productEdited({
        productName: 'Edge Application',
        tab: 'rulesEngine'
      })
      .track()
  }
  const handleEditRulesEngine = () => {
    emit('onSuccess')
    handleTrackSuccessEdit()
    closeDrawerEdit()
  }

  const handleRefreshCacheSettings = async () => {
    await listCacheSettingsOptions()
  }

  const handleRefreshOrigins = async () => {
    await listOriginsOptions()
  }

  const handleRefreshFunctions = async () => {
    await listFunctionsInstanceOptions()
  }

  defineExpose({
    openDrawerCreate,
    openDrawerEdit,
    closeDrawerEdit
  })

  onMounted(async () => {
    await Promise.all([
      listFunctionsInstanceOptions(),
      listCacheSettingsOptions(),
      listOriginsOptions()
    ])
  })
</script>

<template>
  <CreateDrawerBlock
    v-if="loadCreateRulesEngineDrawer"
    :isOverlapped="isOverlapped"
    v-model:visible="showCreateRulesEngineDrawer"
    :createService="createService"
    :schema="validationSchema"
    :initialValues="initialValues"
    @onSuccess="handleCreateRulesEngine"
    @onError="handleFailedToCreate"
    :showBarGoBack="true"
    title="Create Rule"
    data-testid="rules-engine-create-drawer"
  >
    <template #formFields="{ errors }">
      <FormFieldsDrawerRulesEngine
        :isLoadingRequests="isLoadingRequests"
        :loadingOrigins="loadingOrigins"
        :loadingFunctionsInstance="loadingFunctionsInstance"
        :initialPhase="initialPhase"
        :edgeApplicationId="props.edgeApplicationId"
        :isApplicationAcceleratorEnabled="props.isApplicationAcceleratorEnabled"
        :isDeliveryProtocolHttps="props.isDeliveryProtocolHttps"
        :functionsInstanceOptions="functionsInstanceOptions"
        :originsOptions="originsOptions"
        :clipboardWrite="clipboardWrite"
        :isLoadBalancerEnabled="isLoadBalancerEnabled"
        :cacheSettingsOptions="cacheSettingsOptions"
        @toggleDrawer="handleToggleDrawer"
        @refreshCacheSettings="handleRefreshCacheSettings"
        @refreshOrigins="handleRefreshOrigins"
        @refreshFunctions="handleRefreshFunctions"
        :hideApplicationAcceleratorInDescription="props.hideApplicationAcceleratorInDescription"
        :isImageOptimizationEnabled="props.isImageOptimizationEnabled"
        :isEdgeFunctionEnabled="props.isEdgeFunctionEnabled"
        data-testid="rules-engine-create-drawer-form-fields"
        :errors="errors"
      />
    </template>
  </CreateDrawerBlock>
  <EditDrawerBlock
    v-if="loadEditRulesEngineDrawer"
    :isOverlapped="isOverlapped"
    :id="selectedRulesEngineToEdit.id.toString()"
    v-model:visible="showEditRulesEngineDrawer"
    :loadService="loadService"
    :editService="editService"
    :schema="validationSchema"
    @onSuccess="handleEditRulesEngine"
    :showBarGoBack="true"
    @onError="handleFailedToEdit"
    title="Edit Rule"
    data-testid="rules-engine-edit-drawer"
  >
    <template #formFields="{ errors }">
      <FormFieldsDrawerRulesEngine
        :selectedRulesEngineToEdit="selectedRulesEngineToEdit"
        :edgeApplicationId="props.edgeApplicationId"
        :isLoadingRequests="isLoadingRequests"
        :loadingOrigins="loadingOrigins"
        :loadingFunctionsInstance="loadingFunctionsInstance"
        @toggleDrawer="handleToggleDrawer"
        :clipboardWrite="clipboardWrite"
        :isLoadBalancerEnabled="isLoadBalancerEnabled"
        :isApplicationAcceleratorEnabled="props.isApplicationAcceleratorEnabled"
        :isDeliveryProtocolHttps="props.isDeliveryProtocolHttps"
        :functionsInstanceOptions="functionsInstanceOptions"
        :originsOptions="originsOptions"
        :cacheSettingsOptions="cacheSettingsOptions"
        :isImageOptimizationEnabled="props.isImageOptimizationEnabled"
        :hideApplicationAcceleratorInDescription="props.hideApplicationAcceleratorInDescription"
        :isEdgeFunctionEnabled="props.isEdgeFunctionEnabled"
        :initialPhase="initialPhase"
        data-testid="rules-engine-edit-drawer-form-fields"
        :errors="errors"
      />
    </template>
  </EditDrawerBlock>
</template>
