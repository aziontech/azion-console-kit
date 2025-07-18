<script setup>
  import * as yup from 'yup'
  import HelloWorldSample from '@/helpers/edge-function-hello-world'
  import FormFieldsCreateEdgeFunctions from './FormFields/FormFieldsCreateEdgeFunctions'
  import ContentBlock from '@/templates/content-block'
  import CreateFormBlock from '@/templates/create-form-block'
  import ActionBarBlockWithTeleport from '@templates/action-bar-block/action-bar-with-teleport'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import MobileCodePreview from './components/mobile-code-preview.vue'
  import { ref, onMounted, inject } from 'vue'
  import { useLoadingStore } from '@/stores/loading'
  import { useRoute } from 'vue-router'
  import { edgeFunctionService } from '@/services/v2'

  const route = useRoute()
  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const ARGS_INITIAL_STATE = '{}'

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
    defaultArgs: yup.string().test('validJson', 'Invalid JSON', (value) => {
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

  const initialValues = {
    name: '',
    active: true,
    language: 'javascript',
    code: HelloWorldSample,
    args: ARGS_INITIAL_STATE,
    initiatorType: 'edge_application'
  }

  const handleToast = (response) => {
    const toast = {
      feedback: 'Your edge function has been created',
      actions: {
        link: {
          label: 'View Edge Function',
          callback: () => response.redirectToUrl(`/edge-functions/edit/${response.id}`)
        }
      }
    }
    response.showToastWithActions(toast)
  }
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Create Edge Function">
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
          <FormFieldsCreateEdgeFunctions v-model:preview-data="updateObject" />
        </template>

        <template #action-bar="{ onSubmit, onCancel, loading }">
          <ActionBarBlockWithTeleport
            @onSubmit="onSubmit"
            @onCancel="onCancel"
            :loading="loading"
          />
        </template>
      </CreateFormBlock>
    </template>
  </ContentBlock>
</template>
