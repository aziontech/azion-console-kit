<template>
  <CreateDrawerBlock
    v-if="loadCreateFunctionDrawer"
    v-model:visible="showCreateFunctionDrawer"
    :createService="edgeApplicationFunctionService.createEdgeApplicationFunction"
    drawerId="create-function-instance-drawer"
    :schema="validationSchema"
    :initialValues="initialValues"
    :isOverlapped="isOverlapped"
    @onSuccess="handleSuccessCreate"
    @onError="handleFailedToCreate"
    title="Create Instance"
  >
    <template #formFields>
      <FormFieldsDrawerFunction @toggleDrawer="handleToggleDrawer" />
    </template>
  </CreateDrawerBlock>
  <EditDrawerBlock
    v-if="loadEditFunctionDrawer"
    :id="selectedFunctionToEdit"
    v-model:visible="showEditFunctionDrawer"
    :loadService="loadService"
    :isOverlapped="isOverlapped"
    :editService="editService"
    :schema="validationSchema"
    @onSuccess="handleSuccessEdit"
    @onError="handleFailedToEdit"
    title="Edit Instance"
  >
    <template #formFields>
      <FormFieldsDrawerFunction @toggleDrawer="handleToggleDrawer" />
    </template>
  </EditDrawerBlock>
</template>

<script setup>
  import { ref, inject } from 'vue'
  import * as yup from 'yup'
  import CreateDrawerBlock from '@templates/create-drawer-block'
  import FormFieldsDrawerFunction from '@/views/EdgeApplicationsFunctions/FormFields/FormFieldsEdgeApplicationsFunctions'
  import EditDrawerBlock from '@templates/edit-drawer-block'
  import { refDebounced } from '@vueuse/core'
  /**@type {import('@/plugins/adapters/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import { edgeApplicationFunctionService } from '@/services/v2'

  defineOptions({ name: 'drawer-origin' })

  const emit = defineEmits(['onSuccess'])

  const props = defineProps({
    edgeApplicationId: {
      type: String,
      required: true
    }
  })

  const showCreateFunctionDrawer = ref(false)
  const showEditFunctionDrawer = ref(false)
  const debouncedDrawerAnimate = 300
  const loadCreateFunctionDrawer = refDebounced(showCreateFunctionDrawer, debouncedDrawerAnimate)
  const loadEditFunctionDrawer = refDebounced(showEditFunctionDrawer, debouncedDrawerAnimate)
  const selectedFunctionToEdit = ref('')
  const isOverlapped = ref(false)

  const initialValues = ref({
    id: props.edgeApplicationId,
    name: undefined,
    edgeFunctionID: undefined,
    args: '{}'
  })

  const handleSuccessEdit = () => {
    handleTrackSuccessEdit()
    emit('onSuccess')
  }

  const handleSuccessCreate = () => {
    handleTrackCreation()
    emit('onSuccess')
    closeDrawerCreate()
  }

  const handleTrackSuccessEdit = () => {
    tracker.product.productEdited({
      productName: 'Function Instances'
    })
    tracker.product
      .productEdited({
        productName: 'Edge Application',
        tab: 'functions'
      })
      .track()
  }

  const handleTrackCreation = () => {
    tracker.product
      .productCreated({
        productName: 'Function Instances'
      })
      .track()
  }

  const handleFailedToCreate = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToCreate({
        productName: 'Function Instances',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }

  const handleToggleDrawer = (value) => {
    isOverlapped.value = value
  }

  const handleFailedToEdit = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToEdit({
        productName: 'Function Instances',
        errorMessage: message,
        fieldName: fieldName,
        errorType: 'api'
      })
      .track()

    closeDrawerEdit()
  }

  const validationSchema = yup.object({
    name: yup.string().required().label('Name'),
    edgeFunctionID: yup
      .number()
      .transform((value) => (Number.isNaN(value) ? null : value))
      .required()
      .label('Edge Function'),
    args: yup.string().test('validJson', 'Invalid JSON', (value) => {
      let isValidJson = true
      try {
        JSON.parse(value)
      } catch {
        isValidJson = false
      }
      return isValidJson
    })
  })

  const editService = async (payload) => {
    return await edgeApplicationFunctionService.editEdgeApplicationFunction({
      ...payload,
      edgeApplicationID: props.edgeApplicationId
    })
  }

  const loadService = async () => {
    const functions = await edgeApplicationFunctionService.loadEdgeApplicationFunction({
      edgeApplicationID: props.edgeApplicationId,
      functionID: selectedFunctionToEdit.value
    })
    return functions
  }

  const openDrawerCreate = () => {
    showCreateFunctionDrawer.value = true
  }

  const openDrawerEdit = (functionID) => {
    if (functionID) {
      showEditFunctionDrawer.value = true
      selectedFunctionToEdit.value = functionID.toString()
    }
  }

  const closeDrawerEdit = () => {
    showEditFunctionDrawer.value = false
  }

  const closeDrawerCreate = () => {
    showCreateFunctionDrawer.value = false
  }

  defineExpose({
    showCreateFunctionDrawer,
    openDrawerCreate,
    openDrawerEdit
  })
</script>
