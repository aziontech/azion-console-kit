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
  import { createEdgeFunctionsService } from '@/services/edge-functions-services/v4'
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
    initiatorType: yup.string().required().label('Initiator Type'),
    active: yup.boolean(),
    language: yup.string()
  })
  const updateObject = ref({})

  const initiatorType = router.currentRoute.value.path.startsWith('/edge-firewall')
    ? 'edge_firewall'
    : 'edge_application'

  const initialValues = {
    name: '',
    active: true,
    language: 'javascript',
    code: HelloWorldSample,
    args: ARGS_INITIAL_STATE,
    initiatorType: initiatorType
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
  const handleCreateWithSuccess = (id) => {
    handleTrackCreation()
    emit('onSuccess', id)
    closeCreateDrawer()
  }
  defineExpose({
    showCreateDrawer,
    openCreateDrawer
  })
</script>

<template>
  <CreateDrawerBlock
    v-if="showCreateDrawer"
    drawerId="create-edge-functions-drawer"
    v-model:visible="showCreateEdgeFunctionsDrawer"
    :createService="createEdgeFunctionsService"
    :schema="validationSchema"
    :initialValues="initialValues"
    @onSuccess="handleCreateWithSuccess"
    @onResponseFail="handleTrackFailedCreation"
    title="Create Edge Function"
  >
    <template #formFields>
      <FormFieldsCreateEdgeFunctions
        isDrawer
        v-model:preview-data="updateObject"
      />
    </template>
  </CreateDrawerBlock>
</template>
