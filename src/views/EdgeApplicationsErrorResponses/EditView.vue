<script setup>
  import EditFormBlock from '@/templates/edit-form-block'
  import FormFieldsErrorResponses from '@/views/EdgeApplicationsErrorResponses/FormFields/FormFieldsErrorResponses'
  import ActionBarBlockWithTeleport from '@templates/action-bar-block/action-bar-with-teleport'
  import * as yup from 'yup'
  import { inject } from 'vue'
  import { useRouter } from 'vue-router'

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
    },
    editErrorResponsesService: {
      type: Function,
      required: true
    },
    loadErrorResponsesService: {
      type: Function,
      required: true
    }
  })

  const editService = async (payload) => {
    return await props.editErrorResponsesService({
      ...payload,
      edgeApplicationId: props.edgeApplicationId
    })
  }

  const loadService = async (payload) => {
    return await props.loadErrorResponsesService({
      ...payload,
      edgeApplicationId: props.edgeApplicationId
    })
  }
  const handleTrackSuccessEdit = () => {
    tracker.product
      .productEdited({
        productName: 'Edge Application',
        tab: 'errorResponses'
      })
      .track()
  }

  const validationSchema = yup.object({
    originId: yup.string().required(),
    errorResponses: yup.array().of(
      yup.object().shape({
        code: yup.string().required(),
        timeout: yup.number().required(),
        uri: yup.string().nullable(true),
        customStatusCode: yup.string().nullable(true)
      })
    )
  })

  const router = useRouter()
  const gotToList = () => {
    router.push({ name: 'list-edge-applications' })
  }
</script>

<template>
  <EditFormBlock
    :editService="editService"
    :loadService="loadService"
    :schema="validationSchema"
    :isTabs="true"
    @on-edit-success="handleTrackSuccessEdit"
  >
    <template #form>
      <FormFieldsErrorResponses
        :edgeApplicationId="edgeApplicationId"
        :listOriginsService="props.listOriginsService"
      />
    </template>
    <template #action-bar="{ onSubmit, formValid, loading }">
      <ActionBarBlockWithTeleport
        @onSubmit="onSubmit"
        @onCancel="gotToList"
        :loading="loading"
        :submitDisabled="!formValid"
      />
    </template>
  </EditFormBlock>
</template>
