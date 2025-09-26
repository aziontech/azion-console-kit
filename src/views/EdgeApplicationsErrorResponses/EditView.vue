<script setup>
  import EditFormBlock from '@/templates/edit-form-block'
  import FormFieldsErrorResponses from '@/views/EdgeApplicationsErrorResponses/FormFields/FormFieldsErrorResponses'
  import ActionBarBlockWithTeleport from '@templates/action-bar-block/action-bar-with-teleport'
  import * as yup from 'yup'
  import { inject } from 'vue'
  import { useRouter } from 'vue-router'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import { hasFlagBlockApiV4 } from '@/composables/user-flag'
  import { edgeAppErrorResponseService } from '@/services/v2/edge-app/edge-app-error-response-service'
  import customPagesGif from '@/assets/images/customPages.gif'

  /**@type {import('@/plugins/adapters/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const props = defineProps({
    edgeApplicationId: {
      type: String,
      required: true
    },
    listOriginsService: {
      type: Function,
      required: true
    }
  })

  const editService = async (payload) => {
    return await edgeAppErrorResponseService.editEdgeApplicationErrorResponseService(
      payload,
      props.edgeApplicationId
    )
  }

  const loadService = async (payload) => {
    return await edgeAppErrorResponseService.listEdgeApplicationsErrorResponseService({
      ...payload,
      edgeApplicationId: props.edgeApplicationId
    })
  }
  const handleTrackSuccessEdit = () => {
    tracker.product.productEdited({
      productName: 'Error Responses'
    })
    tracker.product
      .productEdited({
        productName: 'Edge Application',
        tab: 'errorResponses'
      })
      .track()
  }
  const handleTrackFailedToEdit = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToEdit({
        productName: 'Error Responses',
        errorMessage: message,
        fieldName: fieldName,
        errorType: 'api'
      })
      .track()
  }

  const validationSchema = yup.object({
    errorResponses: yup
      .array()
      .of(
        yup.object().shape({
          code: yup.string().required(),
          timeout: yup.number().required().label('Response TTL'),
          uri: yup.string().nullable(true),
          customStatusCode: yup.string().nullable(true)
        })
      )
      .default([]),
    originId: yup.string().when('errorResponses', {
      is: (errorResponses) => errorResponses.length && errorResponses.some((data) => data.uri),
      then: (schema) => schema.required().label('Origin'),
      otherwise: (schema) => schema.nullable()
    })
  })

  const router = useRouter()
  const gotToList = () => {
    router.push({ name: 'list-edge-applications' })
  }
</script>

<template>
  <div v-if="hasFlagBlockApiV4()">
    <EditFormBlock
      :editService="editService"
      :loadService="loadService"
      :schema="validationSchema"
      isTabs
      @on-edit-success="handleTrackSuccessEdit"
      @on-edit-fail="handleTrackFailedToEdit"
      disableRedirect
    >
      <template #form="{ errors }">
        <FormFieldsErrorResponses
          :edgeApplicationId="edgeApplicationId"
          :listOriginsService="props.listOriginsService"
          :errors="errors"
        />
      </template>
      <template #action-bar="{ onSubmit, loading }">
        <ActionBarBlockWithTeleport
          @onSubmit="onSubmit"
          @onCancel="gotToList"
          :loading="loading"
        />
      </template>
    </EditFormBlock>
  </div>
  <div
    v-else
    class="px-3 py-4 sm:px-8 sm:py-8 gap-4 flex flex-col xl:flex-row items-center xl:items-start justify-center lg:px-8 lg:py-16 max-w-screen-2xl-test mx-auto w-full"
  >
    <div class="flex-col gap-4 text-center items-center justify-center">
      <div class="text-xl font-medium">Error Responses is now Custom Pages!</div>
      <div class="text-sm text-color-secondary">
        All settings that were previously made in Error Responses will now be made in the new Custom
        Pages menu.
      </div>
      <img
        class="mt-8"
        :src="customPagesGif"
        alt="Error Responses to Custom Pages"
      />
    </div>
  </div>
</template>
