<script setup>
  import CreateDrawerBlock from '@templates/create-drawer-block'
  import { refDebounced } from '@vueuse/core'
  import * as yup from 'yup'
  import FormFieldsCreateEdgeFunctions from '../FormFields/FormFieldsCreateEdgeFunctions'
  import { ref, inject, defineExpose, onMounted } from 'vue'
  import { useLoadingStore } from '@/stores/loading'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import HelloWorldSample from '@/helpers/edge-function-hello-world'
  import { useRouter } from 'vue-router'
  import { edgeFunctionService } from '@/services/v2/edge-function/edge-function-service'

  defineOptions({
    name: 'edge-functions-drawer'
  })
  const emit = defineEmits(['onSuccess', 'onEdgeApplicationCreated'])
  /**@type {import('@/plugins/adapters/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')
  const showCreateEdgeFunctionsDrawer = ref(false)
  const router = useRouter()
  const DEBOUNCE_TIME_IN_MS = 300
  const showCreateDrawer = refDebounced(showCreateEdgeFunctionsDrawer, DEBOUNCE_TIME_IN_MS)
  const ARGS_INITIAL_STATE = '{}'

  onMounted(() => {
    const store = useLoadingStore()
    store.startLoading()
    if (document.readyState == 'complete') {
      store.finishLoading()
    }
  })

  const validationSchema = yup.object({
    name: yup.string().required('Name is a required field'),
    code: yup.string().required('Code is a required field'),
    args: yup.string().test('validJson', 'Invalid JSON', (value) => {
      let isValidJson = true
      try {
        JSON.parse(value)
      } catch {
        isValidJson = false
      }
      return isValidJson
    }),
    executionEnvironment: yup.string().required().label('Initiator Type'),
    active: yup.boolean(),
    runtime: yup.string()
  })
  const updateObject = ref({})

  const executionEnvironment = router.currentRoute.value.path.startsWith('/edge-firewall')
    ? 'firewall'
    : 'application'

  const initialValues = {
    name: '',
    active: true,
    runtime: 'javascript',
    code: HelloWorldSample,
    args: ARGS_INITIAL_STATE,
    executionEnvironment: executionEnvironment
  }
  const handleTrackCreation = () => {
    tracker.product.productCreated({
      productName: 'Edge Functions',
      from: 'drawer',
      createdFrom: 'singleEntity'
    })
  }
  const handleTrackFailedCreation = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToCreate({
        productName: 'Edge Functions',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }
  const closeCreateDrawer = () => {
    showCreateEdgeFunctionsDrawer.value = false
  }
  const openCreateDrawer = () => {
    showCreateEdgeFunctionsDrawer.value = true
  }
  const handleCreateWithSuccess = (response) => {
    handleTrackCreation()
    handleToast(response)
    emit('onSuccess', response.functionId)
    closeCreateDrawer()
  }

  defineExpose({
    showCreateDrawer,
    openCreateDrawer
  })

  const handleToast = (response) => {
    const toast = {
      feedback: 'Your function has been created'
    }
    response.showToastWithActions(toast)
  }
</script>

<template>
  <CreateDrawerBlock
    v-if="showCreateDrawer"
    drawerId="create-edge-functions-drawer"
    v-model:visible="showCreateEdgeFunctionsDrawer"
    :createService="edgeFunctionService.createEdgeFunctionsService"
    :schema="validationSchema"
    :initialValues="initialValues"
    @onSuccess="handleCreateWithSuccess"
    @onResponseFail="handleTrackFailedCreation"
    title="Create Function"
    disableToast
  >
    <template #formFields>
      <FormFieldsCreateEdgeFunctions
        isDrawer
        v-model:preview-data="updateObject"
      />
    </template>
  </CreateDrawerBlock>
</template>
