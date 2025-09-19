<template>
  <CreateDrawerBlock
    v-if="loadCreateFunctionDrawer"
    v-model:visible="showCreateFunctionDrawer"
    :createService="edgeFirewallFunctionService.createEdgeFirewallService"
    :schema="validationSchema"
    :initialValues="initialValues"
    :isOverlapped="isOverlapped"
    @onSuccess="handleCreateFunction"
    @onError="handleFailedToCreate"
    :showBarGoBack="true"
    title="Create Instance"
  >
    <template #formFields>
      <FormFieldsDrawerFunction
        @toggleDrawer="handleToggleDrawer"
        @additionalErrors="handleAdditionalErrors"
        :listEdgeFunctionsService="edgeFunctionService.listEdgeFunctionsDropdown"
        :loadEdgeFunctionService="edgeFunctionService.loadEdgeFunction"
      />
    </template>
    <template #actionBar="{ onSubmit, onCancel, loading }">
      <ActionBarBlock
        @onSubmit="formSubmit(onSubmit)"
        @onCancel="onCancel"
        :loading="isLoading || loading"
      />
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
    :showBarGoBack="true"
    @onError="handleFailedToEdit"
    title="Edit Instance"
  >
    <template #formFields>
      <FormFieldsDrawerFunction
        @toggleDrawer="handleToggleDrawer"
        @additionalErrors="handleAdditionalErrors"
        :listEdgeFunctionsService="edgeFunctionService.listEdgeFunctionsDropdown"
        :loadEdgeFunctionService="edgeFunctionService.loadEdgeFunction"
      />
    </template>
    <template #action-bar="{ onSubmit, onCancel, loading }">
      <ActionBarBlock
        @onSubmit="formSubmit(onSubmit)"
        @onCancel="onCancel"
        :loading="isLoading || loading"
      />
    </template>
  </EditDrawerBlock>
</template>

<script setup>
  import { ref, inject } from 'vue'
  import { refDebounced } from '@vueuse/core'
  import * as yup from 'yup'

  import CreateDrawerBlock from '@templates/create-drawer-block'
  import EditDrawerBlock from '@templates/edit-drawer-block'
  import FormFieldsDrawerFunction from '@/views/EdgeFirewallFunctions/FormFields/FormFieldsEdgeApplicationsFunctions'
  import ActionBarBlock from '@/templates/action-bar-block'

  /**@type {import('@/plugins/adapters/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import { edgeFirewallFunctionService, edgeFunctionService } from '@/services/v2'

  defineOptions({ name: 'drawer-origin' })

  const emit = defineEmits(['onSuccess'])

  const props = defineProps({
    edgeFirewallID: {
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
  const isLoading = ref(false)
  const additionalErrors = ref([])

  const initialValues = ref({
    id: props.edgeFirewallID,
    name: undefined,
    edgeFunctionID: undefined,
    args: '{}',
    azionForm: '{}'
  })

  const validationSchema = yup.object({
    name: yup.string().required().label('Name'),
    edgeFunctionID: yup
      .number()
      .transform((value) => (Number.isNaN(value) ? null : value))
      .required()
      .label('Function'),
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

  const formSubmit = async (onSubmit) => {
    isLoading.value = true

    if (hasAdditionalErrors()) {
      isLoading.value = false
      return
    }

    await onSubmit()
    isLoading.value = false
  }

  const handleAdditionalErrors = (errors) => {
    additionalErrors.value = errors
  }

  const hasAdditionalErrors = () => {
    return additionalErrors.value.length
  }

  const handleCreateFunction = (response) => {
    closeDrawerCreate()
    handleTrackSuccessCreate()
    emit('onSuccess', response.id)
  }

  const handleSuccessEdit = (response) => {
    showEditFunctionDrawer.value = false
    emit('onSuccess', response.id)
    handleTrackSuccessEdit()
  }

  const handleTrackSuccessCreate = () => {
    tracker.product
      .productCreated({
        productName: 'Firewall Functions',
        tab: 'functions'
      })
      .track()
  }

  const handleTrackSuccessEdit = () => {
    tracker.product
      .productEdited({
        productName: 'Firewall',
        tab: 'functions'
      })
      .track()
  }

  const handleFailedToCreate = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToCreate({
        productName: 'Firewall Functions',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }

  const handleFailedToEdit = (error) => {
    handleFailedEditEdgeFirewallFunctions(error)
    closeDrawerEdit()
  }

  const handleToggleDrawer = (value) => {
    isOverlapped.value = value
  }

  const editService = async (payload) => {
    return await edgeFirewallFunctionService.editEdgeFirewallFunctionService({
      ...payload,
      edgeFirewallID: props.edgeFirewallID
    })
  }

  const loadService = async () => {
    return await edgeFirewallFunctionService.loadFunctionsService(
      props.edgeFirewallID,
      selectedFunctionToEdit.value
    )
  }

  const openDrawerCreate = () => {
    showCreateFunctionDrawer.value = true
  }

  const closeDrawerCreate = () => {
    showCreateFunctionDrawer.value = false
  }

  const openDrawerEdit = (functionID) => {
    if (functionID) {
      showEditFunctionDrawer.value = true
      selectedFunctionToEdit.value = functionID.toString()
    }
  }

  const handleFailedEditEdgeFirewallFunctions = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToEdit({
        productName: 'Firewall',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }

  const closeDrawerEdit = () => {
    showEditFunctionDrawer.value = false
  }

  defineExpose({
    showCreateFunctionDrawer,
    openDrawerCreate,
    openDrawerEdit
  })
</script>
