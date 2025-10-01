<script setup>
  import { ref, onMounted, inject } from 'vue'
  import { useRoute } from 'vue-router'
  import * as yup from 'yup'
  import ContentBlock from '@/templates/content-block'
  import CreateFormBlock from '@/templates/create-form-block'
  import ActionBarBlockWithTeleport from '@templates/action-bar-block/action-bar-with-teleport'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import FormFieldsCreateEdgeFunctions from './FormFields/FormFieldsCreateEdgeFunctions'
  import MobileCodePreview from './components/mobile-code-preview.vue'
  import HelloWorldSample from '@/helpers/edge-function-hello-world'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import { useLoadingStore } from '@/stores/loading'

  import { edgeFunctionService } from '@/services/v2/edge-function/edge-function-service'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')
  const route = useRoute()
  const ARGS_INITIAL_STATE = '{}'
  const isLoading = ref(false)
  const additionalErrors = ref([])

  const handleTrackCreation = (response) => {
    tracker.product.productCreated({
      productName: 'Edge Functions',
      from: route.query.origin,
      createdFrom: 'singleEntity'
    })
    handleToast(response)
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

  const validationSchema = yup.object({
    name: yup.string().required('Name is a required field'),
    code: yup.string().required('Code is a required field'),
    azionForm: yup.object(),
    defaultArgs: yup.string().test('validJson', 'Invalid JSON', (value) => {
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

  const initialValues = {
    name: '',
    active: true,
    runtime: 'javascript',
    code: HelloWorldSample,
    args: ARGS_INITIAL_STATE,
    azionForm: {},
    executionEnvironment: 'application'
  }

  const handleToast = (response) => {
    const toast = {
      feedback: 'Your function has been created',
      actions: {
        link: {
          label: 'View Function',
          callback: () => response.redirectToUrl(`/functions/edit/${response.functionId}`)
        }
      }
    }
    response.showToastWithActions(toast)
  }

  const hasAdditionalErrors = () => {
    return additionalErrors.value.length
  }

  const handleAdditionalErrors = (errors) => {
    additionalErrors.value = errors
  }

  const formSubmit = async (onSubmit) => {
    isLoading.value = true

    if (hasAdditionalErrors()) {
      isLoading.value = false
      return
    }

    await onSubmit()
    isLoading.value = false
  }

  onMounted(() => {
    const store = useLoadingStore()
    store.startLoading()
    if (document.readyState == 'complete') {
      store.finishLoading()
    }
  })
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Create Function">
        <MobileCodePreview :updateObject="updateObject" />
      </PageHeadingBlock>
    </template>
    <template #content>
      <CreateFormBlock
        :createService="edgeFunctionService.createEdgeFunctionsService"
        :schema="validationSchema"
        @on-response="handleTrackCreation"
        @on-response-fail="handleTrackFailedCreation"
        :initialValues="initialValues"
        disableToast
      >
        <template #form>
          <FormFieldsCreateEdgeFunctions
            v-model:preview-data="updateObject"
            @additionalErrors="handleAdditionalErrors"
          />
        </template>

        <template #action-bar="{ onSubmit, onCancel, loading }">
          <ActionBarBlockWithTeleport
            @onSubmit="formSubmit(onSubmit)"
            @onCancel="onCancel"
            :loading="isLoading || loading"
          />
        </template>
      </CreateFormBlock>
    </template>
  </ContentBlock>
</template>
